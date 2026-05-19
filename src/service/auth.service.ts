import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import {
  UserRepository,
  LoginHistoryRepository,
} from "src/database/repository";
import {
  IssueTokenDto,
  RefreshTokenDto,
  TokenResponseDto,
  RecordLoginFailureDto,
  LoginFailureResponseDto,
} from "src/dto";
import { LoginStatus } from "src/database/entity/login-history.entity";
import { ActivityStatus } from "src/database/entity/user.entity";
import { BlockType } from "src/database/entity/user-block-history.entity";
import { User } from "src/database/entity/user.entity";
import { UserBlockHistory } from "src/database/entity/user-block-history.entity";
import { LoginHistory } from "src/database/entity/login-history.entity";

const MAX_LOGIN_FAILURES = 5;

interface JwtPayload {
  sub: string; // user_id
  services?: Array<{
    service_id: string;
    service_name: string;
    permissions: string[];
  }>;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly loginHistoryRepository: LoginHistoryRepository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    this.jwtSecret = this.configService.get<string>("JWT_SECRET") || "secret";
    this.jwtExpiresIn =
      this.configService.get<string>("JWT_EXPIRES_IN") || "1h";
  }

  /**
   * Issue a new JWT token
   * @param issueTokenDto - Token issuance data
   * @returns Token response with access token
   */
  async issueToken(issueTokenDto: IssueTokenDto): Promise<TokenResponseDto> {
    // Verify user exists by user_id (UUID)
    const user = await this.userRepository.findOne({
      user_id: issueTokenDto.user_id,
    });
    if (!user) {
      throw new NotFoundException(
        `User with ID ${issueTokenDto.user_id} not found`,
      );
    }

    const payload: JwtPayload = {
      sub: issueTokenDto.user_id,
      services: issueTokenDto.services,
    };

    const token = this.jwtService.sign(payload);

    // Save login history — status is always SUCCESS when a token is issued
    await this.loginHistoryRepository.insert({
      user_id: user.id,
      ip_address: issueTokenDto.ip_address,
      login_status: LoginStatus.SUCCESS,
    });

    // Reset login failure count on successful login
    await this.userRepository.update(
      { user_id: issueTokenDto.user_id },
      { login_failure_count: 0 },
    );

    // Parse expires_in to seconds
    const expiresInSeconds = this.parseExpiresIn(this.jwtExpiresIn);

    return new TokenResponseDto(token, expiresInSeconds);
  }

  /**
   * Refresh an existing JWT token
   * @param refreshTokenDto - Token to refresh
   * @returns New token response
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponseDto> {
    try {
      // Verify and decode the token
      const decoded = this.jwtService.verify<JwtPayload>(
        refreshTokenDto.token,
        {
          secret: this.jwtSecret,
        },
      );

      // Verify user still exists
      const user = await this.userRepository.findOne({
        user_id: decoded.sub,
      });
      if (!user) {
        throw new UnauthorizedException("User no longer exists");
      }

      // Create a new token with the same payload but new expiration
      const payload: JwtPayload = {
        sub: decoded.sub,
        services: decoded.services,
      };

      const newToken = this.jwtService.sign(payload);

      const expiresInSeconds = this.parseExpiresIn(this.jwtExpiresIn);

      return new TokenResponseDto(newToken, expiresInSeconds);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  /**
   * Record a login failure and update the user's failure count
   * @param recordLoginFailureDto - Login failure data
   * @returns Login failure response with count and message
   */
  async recordLoginFailure(
    recordLoginFailureDto: RecordLoginFailureDto,
  ): Promise<LoginFailureResponseDto> {
    const user = await this.userRepository.findOne({
      user_id: recordLoginFailureDto.user_id,
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${recordLoginFailureDto.user_id} not found`,
      );
    }

    if (
      user.activity_status === ActivityStatus.PERMANENT_BLOCK ||
      user.login_failure_count >= MAX_LOGIN_FAILURES
    ) {
      return new LoginFailureResponseDto(
        user.login_failure_count,
        `アカウントは既にブロックされています。ブロック解消はパスワードをリセットしてください。`,
        true,
      );
    }

    const newFailureCount = user.login_failure_count + 1;

    if (newFailureCount >= MAX_LOGIN_FAILURES) {
      // Permanently block the user in a transaction (includes login history for atomicity)
      await this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const blockHistoryRepo = manager.getRepository(UserBlockHistory);
        const loginHistoryRepo = manager.getRepository(LoginHistory);

        // Record login failure history inside transaction
        await loginHistoryRepo.insert({
          user_id: user.id,
          ip_address: recordLoginFailureDto.ip_address,
          login_status: LoginStatus.FAILURE,
        });

        // Update user failure count and permanently block
        user.login_failure_count = newFailureCount;
        user.activity_status = ActivityStatus.PERMANENT_BLOCK;
        await userRepo.save(user);

        // Create block history entry
        const blockHistory = blockHistoryRepo.create({
          user_id: user.id,
          block_type: BlockType.PERMANENT_BLOCK,
          reason: `ログイン失敗回数が${MAX_LOGIN_FAILURES}回に達したため、アカウントをブロックしました。`,
          block_release_date: null,
        });
        await blockHistoryRepo.save(blockHistory);
      });

      return new LoginFailureResponseDto(
        newFailureCount,
        `ログインに${MAX_LOGIN_FAILURES}回失敗しました。アカウントがブロックされました。ブロック解消はパスワードをリセットしてください。`,
        true,
      );
    } else {
      // Record login history for non-blocking failure
      await this.loginHistoryRepository.insert({
        user_id: user.id,
        ip_address: recordLoginFailureDto.ip_address,
        login_status: LoginStatus.FAILURE,
      });

      // Update failure count only
      await this.userRepository.update(
        { user_id: recordLoginFailureDto.user_id },
        { login_failure_count: newFailureCount },
      );

      const message = `ログインに失敗しました。${MAX_LOGIN_FAILURES}回失敗するとアカウントがブロックされます。`;
      return new LoginFailureResponseDto(newFailureCount, message, false);
    }
  }

  /**
   * Parse expires_in string to seconds
   * @param expiresIn - Time string like "1h", "30m", "60s"
   * @returns Time in seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600; // Default to 1 hour
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value;
      case "m":
        return value * 60;
      case "h":
        return value * 3600;
      case "d":
        return value * 86400;
      default:
        return 3600;
    }
  }
}
