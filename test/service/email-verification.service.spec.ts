import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { EmailVerificationService } from "src/service/email-verification.service";
import { UserRepository } from "src/database/repository/user.repository";
import { User } from "src/database/entity/user.entity";

describe("EmailVerificationService", () => {
  let service: EmailVerificationService;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
      findOneWithRelations: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<EmailVerificationService>(EmailVerificationService);
    userRepository = module.get(UserRepository);
  });

  describe("createVerificationTokenData", () => {
    it("should generate a token and expiration date", () => {
      const result = service.createVerificationTokenData();

      expect(result.token).toBeDefined();
      expect(result.token).toMatch(/^[0-9a-f]+$/); // hex string
      expect(result.token.length).toBeGreaterThanOrEqual(32);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it("should set expiration to 24 hours from now", () => {
      const beforeCall = new Date();
      const result = service.createVerificationTokenData();
      const afterCall = new Date();

      const expectedMin = new Date(beforeCall);
      expectedMin.setHours(expectedMin.getHours() + 24);
      const expectedMax = new Date(afterCall);
      expectedMax.setHours(expectedMax.getHours() + 24);

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(
        expectedMin.getTime() - 1000,
      );
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(
        expectedMax.getTime() + 1000,
      );
    });

    it("should generate unique tokens on each call", () => {
      const result1 = service.createVerificationTokenData();
      const result2 = service.createVerificationTokenData();

      expect(result1.token).not.toEqual(result2.token);
    });
  });

  describe("generateVerificationToken", () => {
    it("should generate a verification token for unverified user", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const user = {
        id: 1,
        user_id: userId,
        email_verified: false,
      } as unknown as User;

      userRepository.findOne.mockResolvedValue(user);
      userRepository.update.mockResolvedValue({
        ...user,
        email_verification_token: "token",
      } as unknown as User);

      const token = await service.generateVerificationToken(userId);

      expect(userRepository.findOne).toHaveBeenCalledWith({ user_id: userId });
      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThanOrEqual(32);
      expect(userRepository.update).toHaveBeenCalledWith(
        { id: user.id },
        expect.objectContaining({
          email_verification_token: token,
          verification_token_expires_at: expect.any(Date),
        }),
      );
    });

    it("should throw BadRequestException when userId is empty", async () => {
      await expect(service.generateVerificationToken("")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when userId is whitespace", async () => {
      await expect(service.generateVerificationToken("   ")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw NotFoundException when user not found", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.generateVerificationToken(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException when email is already verified", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const user = {
        id: userId,
        email_verified: true,
      } as unknown as User;

      userRepository.findOne.mockResolvedValue(user);

      await expect(service.generateVerificationToken(userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("verifyEmail", () => {
    it("should verify email with valid token", async () => {
      const token = "valid-token-123";
      const user = {
        id: 1,
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        email_verified: false,
        email_verification_token: token,
        verification_token_expires_at: new Date(Date.now() + 3600000), // 1 hour from now
      } as unknown as User;

      const updatedUser = {
        ...user,
        email_verified: true,
        email_verification_token: null,
        verification_token_expires_at: null,
      } as unknown as User;

      userRepository.findOne.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(updatedUser);

      const result = await service.verifyEmail(token);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        email_verification_token: token,
      } as any);
      expect(userRepository.update).toHaveBeenCalledWith(
        { id: user.id },
        {
          email_verified: true,
          email_verification_token: null,
          verification_token_expires_at: null,
        },
      );
      expect(result).toEqual(updatedUser);
      expect(result.email_verified).toBe(true);
    });

    it("should throw BadRequestException when token is empty", async () => {
      await expect(service.verifyEmail("")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when token is whitespace", async () => {
      await expect(service.verifyEmail("   ")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when user with token not found", async () => {
      const token = "invalid-token";

      userRepository.findOneWithRelations.mockResolvedValue(null);

      await expect(service.verifyEmail(token)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when email is already verified", async () => {
      const token = "valid-token-123";
      const user = {
        id: "123e4567-e89b-12d3-a456-426614174001",
        email_verified: true,
        email_verification_token: token,
      } as unknown as User;

      userRepository.findOneWithRelations.mockResolvedValue(user);

      await expect(service.verifyEmail(token)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when token is expired", async () => {
      const token = "expired-token";
      const user = {
        id: "123e4567-e89b-12d3-a456-426614174001",
        email_verified: false,
        email_verification_token: token,
        verification_token_expires_at: new Date(Date.now() - 3600000), // 1 hour ago
      } as unknown as User;

      userRepository.findOneWithRelations.mockResolvedValue(user);

      await expect(service.verifyEmail(token)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when update fails", async () => {
      const token = "valid-token-123";
      const user = {
        id: "123e4567-e89b-12d3-a456-426614174001",
        email_verified: false,
        email_verification_token: token,
        verification_token_expires_at: new Date(Date.now() + 3600000),
        tenant: {
          auto_user_approval: true,
        },
      } as unknown as User;

      userRepository.findOneWithRelations.mockResolvedValue(user);
      userRepository.update.mockResolvedValue(null);

      await expect(service.verifyEmail(token)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
