import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { UserRepository } from "src/database/repository";
import { UpdateUserDto, CreateUserDto } from "src/dto";
import { User } from "src/database/entity";
import { normalizeEmail } from "src/database/utils";
import { EmailVerificationService } from "./email-verification.service";
import { EmailService } from "./email.service";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Create a new user
   * @param createUserDto - User data to create
   * @returns Created user
   * @throws ConflictException if user with same email (or its normalized form) already exists
   */
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // Check for duplicate email including "+" alias variants
    const normalizedEmail = normalizeEmail(createUserDto.email);
    const existingUser =
      await this.userRepository.findByNormalizedEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException(
        `User with email ${createUserDto.email} already exists`,
      );
    }

    try {
      // Generate verification token
      const { token, expiresAt } =
        this.emailVerificationService.createVerificationTokenData();

      // Create user with verification token
      const user = await this.userRepository.insert({
        ...createUserDto,
        email_verification_token: token,
        verification_token_expires_at: expiresAt,
      });

      // Send verification email
      try {
        await this.emailService.sendVerificationEmail(user.email, token);
      } catch (emailError) {
        // Log error but don't fail user creation if email sending fails
        this.logger.error("Failed to send verification email", emailError);
      }

      return user;
    } catch (error) {
      // Handle unique constraint violation for email
      if ((error as any)?.code === "23505") {
        throw new ConflictException(
          `User with email ${createUserDto.email} already exists`,
        );
      }
      throw error;
    }
  }

  /**
   * Update user information
   * @param id - User ID
   * @param updateUserDto - User data to update
   * @returns Updated user
   * @throws NotFoundException if user not found
   * @throws ConflictException if email already exists
   */
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Normalize email: trim whitespace and remove field if empty after trimming
    let normalizedDto = updateUserDto;
    if (typeof updateUserDto.email === "string") {
      const trimmedEmail = updateUserDto.email.trim();
      if (trimmedEmail === "") {
        // Remove email field if it's empty after trimming
        const rest = { ...updateUserDto };
        delete rest.email;
        normalizedDto = rest;
      } else {
        normalizedDto = { ...updateUserDto, email: trimmedEmail };
      }
    }

    // Check if email is being updated with a non-empty value
    if (normalizedDto.email) {
      // Fetch current user to compare email
      const currentUser = await this.userRepository.findOne({ user_id: id });

      if (!currentUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const currentEmailNormalized = normalizeEmail(currentUser.email ?? "");
      const newEmailNormalized = normalizeEmail(normalizedDto.email);

      // If email is being changed (comparing normalized forms), reset verification status and generate new token
      if (currentEmailNormalized !== newEmailNormalized) {
        // Check for duplicate email including "+" alias variants, excluding the current user
        const normalizedNewEmail = normalizeEmail(normalizedDto.email);
        const existingUser = await this.userRepository.findByNormalizedEmail(
          normalizedNewEmail,
          id,
        );
        if (existingUser) {
          throw new ConflictException(
            `User with email ${normalizedDto.email} already exists`,
          );
        }

        try {
          const { token, expiresAt } =
            this.emailVerificationService.createVerificationTokenData();

          const updatedUser = await this.userRepository.update(
            { user_id: id },
            {
              ...normalizedDto,
              email_verified: false,
              email_verification_token: token,
              verification_token_expires_at: expiresAt,
            },
          );

          if (!updatedUser) {
            throw new NotFoundException(`User with ID ${id} not found`);
          }

          // Send verification email to the new email address
          try {
            await this.emailService.sendVerificationEmail(
              normalizedDto.email,
              token,
            );
          } catch (emailError) {
            // Log error but don't fail user update if email sending fails
            this.logger.error("Failed to send verification email", emailError);
          }

          return updatedUser;
        } catch (error) {
          // Handle unique constraint violation for email
          if ((error as any)?.code === "23505") {
            throw new ConflictException(
              `User with email ${normalizedDto.email} already exists`,
            );
          }
          throw error;
        }
      }
    }

    // If email is not being changed, proceed with normal update
    const updatedUser = await this.userRepository.update(
      { user_id: id },
      normalizedDto,
    );

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  /**
   * Soft delete user
   * @param id - User ID
   * @returns Soft deleted user
   * @throws NotFoundException if user not found
   */
  async softDeleteUser(id: string): Promise<User> {
    const deletedUser = await this.userRepository.softDelete({
      user_id: id,
    });

    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return deletedUser;
  }
}
