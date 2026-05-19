import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, MoreThan } from "typeorm";
import { randomBytes } from "crypto";
import { UserRepository } from "src/database/repository";
import { User, ActivityStatus } from "src/database/entity/user.entity";
import { UserBlockHistory } from "src/database/entity/user-block-history.entity";
import {
  LoginHistory,
  LoginStatus,
} from "src/database/entity/login-history.entity";
import { comparePassword } from "src/database/utils";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { EmailService } from "./email.service";
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
  PasswordResetResponseDto,
} from "src/dto";

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Request a password reset — sends a reset email to the user's registered address.
   * @param dto - Request data containing login_id or email, plus ip_address
   * @returns Password reset response with a message
   * @throws BadRequestException if neither login_id nor email is provided
   * @throws NotFoundException if no matching active user is found
   */
  async requestPasswordReset(
    dto: RequestPasswordResetDto,
  ): Promise<PasswordResetResponseDto> {
    if (!dto.login_id && !dto.email) {
      throw new BadRequestException(
        "ログインID またはメールアドレスを指定してください。",
      );
    }

    // Look up user by login_id (user_id) first, then by email
    let user: User | null = null;
    if (dto.login_id) {
      user = await this.userRepository.findOne({
        user_id: dto.login_id,
        delete_flag: false,
      });
    }
    if (!user && dto.email) {
      user = await this.userRepository.findOne({
        email: dto.email,
        delete_flag: false,
      });
    }

    if (!user) {
      throw new NotFoundException("ユーザーが見つかりません。");
    }

    // Generate a single-use token valid for 24 hours
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Atomically persist the token and log the request so a partial failure
    // leaves no inconsistent DB state (token without history, or vice-versa).
    await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const loginHistoryRepo = manager.getRepository(LoginHistory);

      await userRepo.update(
        { id: user.id },
        {
          password_reset_token: token,
          password_reset_token_expires_at: expiresAt,
        },
      );

      await loginHistoryRepo.insert({
        user_id: user.id,
        ip_address: dto.ip_address,
        login_status: LoginStatus.PASSWORD_RESET_REQUEST,
      });
    });

    // Send the email only after the transaction has committed.
    // On email failure, clear the token so the user can request again cleanly.
    try {
      await this.emailService.sendPasswordResetEmail(user.email, token);
    } catch (emailError) {
      this.logger.error(
        `Failed to send password reset email to ${user.email}`,
        emailError,
      );
      await this.userRepository.update(
        { id: user.id },
        {
          password_reset_token: null,
          password_reset_token_expires_at: null,
        },
      );
      throw emailError;
    }

    this.logger.log(`Password reset requested for user ${user.user_id}`);

    return new PasswordResetResponseDto(
      "パスワードリセットのメールを送信しました。",
    );
  }

  /**
   * Confirm a password reset — validates the token and applies the new password.
   * @param dto - Reset data containing token, new_password, and ip_address
   * @returns Password reset response with a message
   * @throws BadRequestException if the token is invalid/expired or the password is reused
   */
  async confirmPasswordReset(
    dto: ResetPasswordDto,
  ): Promise<PasswordResetResponseDto> {
    const errors = await validate(plainToInstance(ResetPasswordDto, dto));
    if (errors.length > 0) {
      this.logger.warn(
        `Password reset validation failed: ${JSON.stringify(errors)}`,
      );
      throw new BadRequestException("パスワードリセットに失敗しました。");
    }

    let completedUserId: string | undefined;

    // All validation and updates run inside a single transaction.
    // The user row is locked (SELECT … FOR UPDATE) as soon as it is fetched,
    // preventing two concurrent requests from both consuming the same token.
    await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const loginHistoryRepo = manager.getRepository(LoginHistory);
      const userBlockHistoryRepo = manager.getRepository(UserBlockHistory);

      // Lock the row to prevent concurrent reset with the same token
      const user = await userRepo.findOne({
        where: { password_reset_token: dto.token },
        lock: { mode: "pessimistic_write" },
      });

      if (!user || user.delete_flag) {
        throw new BadRequestException("パスワードリセットに失敗しました。");
      }

      // Validate token expiry
      if (
        !user.password_reset_token_expires_at ||
        new Date() > user.password_reset_token_expires_at
      ) {
        throw new BadRequestException("パスワードリセットに失敗しました。");
      }

      // Reject if new password matches the current password
      const sameAsCurrent = await comparePassword(
        dto.new_password,
        user.password,
      );
      if (sameAsCurrent) {
        throw new BadRequestException(
          "新しいパスワードは現在のパスワードと同じです。別のパスワードを設定してください。",
        );
      }

      // Reject if new password matches any previous password
      if (user.previous_passwords && user.previous_passwords.length > 0) {
        for (const prev of user.previous_passwords) {
          const sameAsPrevious = await comparePassword(dto.new_password, prev);
          if (sameAsPrevious) {
            throw new BadRequestException(
              "新しいパスワードは以前使用したパスワードと同じです。別のパスワードを設定してください。",
            );
          }
        }
      }

      // Move current hashed password into previous_passwords
      user.previous_passwords = [
        ...(user.previous_passwords || []),
        user.password,
      ];

      // Set new password (hashed automatically by @BeforeUpdate hook on save)
      user.password = dto.new_password;
      user.login_failure_count = 0;
      user.password_reset_token = null;
      user.password_reset_token_expires_at = null;

      // Unblock the user if they are currently blocked
      if (user.activity_status !== ActivityStatus.NORMAL) {
        user.activity_status = ActivityStatus.NORMAL;

        // Backdate by 1 minute so the release date is clearly in the past,
        // avoiding any same-millisecond race when the block status is checked.
        const releaseDate = new Date();
        releaseDate.setMinutes(releaseDate.getMinutes() - 1);

        // Mark the most recent indefinite block as released
        const indefiniteBlock = await userBlockHistoryRepo.findOne({
          where: { user_id: user.id, block_release_date: null },
          order: { createdAt: "DESC" },
        });

        if (indefiniteBlock) {
          indefiniteBlock.block_release_date = releaseDate;
          await userBlockHistoryRepo.save(indefiniteBlock);
        } else {
          // Use a targeted DB query for blocks with a future release date
          // (avoids loading all history rows and filtering in memory)
          const futureBlock = await userBlockHistoryRepo.findOne({
            where: {
              user_id: user.id,
              block_release_date: MoreThan(new Date()),
            },
            order: { createdAt: "DESC" },
          });
          if (futureBlock) {
            futureBlock.block_release_date = releaseDate;
            await userBlockHistoryRepo.save(futureBlock);
          }
        }
      }

      await userRepo.save(user);

      // Record the completion in login history
      await loginHistoryRepo.insert({
        user_id: user.id,
        ip_address: dto.ip_address,
        login_status: LoginStatus.PASSWORD_RESET_COMPLETE,
      });

      completedUserId = user.user_id;
    });

    this.logger.log(`Password reset completed for user ${completedUserId}`);

    return new PasswordResetResponseDto("パスワードが正常に変更されました。");
  }
}
