import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { UserRepository } from "src/database/repository";
import { User } from "src/database/entity";
import { randomBytes } from "crypto";

@Injectable()
export class EmailVerificationService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Generate a verification token with expiration date
   * @returns Object containing token and expiration date
   */
  createVerificationTokenData(): { token: string; expiresAt: Date } {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    return { token, expiresAt };
  }

  /**
   * Generate a verification token for email verification
   * @param userId - User ID to generate verification token for
   * @returns Verification token string for email verification
   */
  async generateVerificationToken(userId: string): Promise<string> {
    if (!userId || userId.trim() === "") {
      throw new BadRequestException("Invalid user ID");
    }

    const user = await this.userRepository.findOne({ user_id: userId });

    if (!user) {
      throw new NotFoundException("Unable to generate verification token");
    }

    if (user.email_verified) {
      throw new BadRequestException("Email is already verified");
    }

    const { token, expiresAt } = this.createVerificationTokenData();

    // Update user with verification token
    await this.userRepository.update(
      { id: user.id },
      {
        email_verification_token: token,
        verification_token_expires_at: expiresAt,
      },
    );

    return token;
  }

  /**
   * Verify email using the verification token
   * @param token - Email verification token
   * @returns Updated user with verified email
   * @throws BadRequestException if verification fails
   */
  async verifyEmail(token: string): Promise<User> {
    if (!token || token.trim() === "") {
      throw new BadRequestException("Email verification failed");
    }

    const user = await this.userRepository.findOne({
      email_verification_token: token,
    } as any);

    if (!user) {
      throw new BadRequestException("Email verification failed");
    }

    if (user.email_verified) {
      throw new BadRequestException("Email verification failed");
    }

    // Check if token is expired
    if (
      user.verification_token_expires_at &&
      new Date() > user.verification_token_expires_at
    ) {
      throw new BadRequestException("Email verification failed");
    }

    // Mark email as verified and clear the token
    const updatedUser = await this.userRepository.update(
      { id: user.id },
      {
        email_verified: true,
        email_verification_token: null,
        verification_token_expires_at: null,
      },
    );

    if (!updatedUser) {
      throw new BadRequestException("Email verification failed");
    }

    return updatedUser;
  }
}
