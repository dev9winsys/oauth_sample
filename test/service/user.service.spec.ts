import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException } from "@nestjs/common";
import { UserService } from "src/service/user.service";
import { UserRepository } from "src/database/repository/user.repository";
import { EmailVerificationService } from "src/service/email-verification.service";
import { EmailService } from "src/service/email.service";
import { User } from "src/database/entity/user.entity";
import { UpdateUserDto } from "src/dto/update-user.dto";
import { CreateUserDto } from "src/dto/create-user.dto";

describe("UserService", () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  let emailVerificationService: jest.Mocked<EmailVerificationService>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const mockUserRepository = {
      insert: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findOne: jest.fn(),
      findByNormalizedEmail: jest.fn(),
    };

    const mockEmailVerificationService = {
      createVerificationTokenData: jest.fn(),
    };

    const mockEmailService = {
      sendVerificationEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: EmailVerificationService,
          useValue: mockEmailVerificationService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(UserRepository);
    emailVerificationService = module.get(EmailVerificationService);
    emailService = module.get(EmailService);
  });

  describe("createUser", () => {
    it("should create a user successfully", async () => {
      const createDto: CreateUserDto = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };
      const tokenData = {
        token: "some-token",
        expiresAt: new Date(),
      };
      const createdUser = {
        id: "123e4567-e89b-12d3-a456-426614174001",
        ...createDto,
        email_verification_token: tokenData.token,
        verification_token_expires_at: tokenData.expiresAt,
      } as unknown as User;

      userRepository.findByNormalizedEmail.mockResolvedValue(null);
      emailVerificationService.createVerificationTokenData.mockReturnValue(
        tokenData,
      );
      userRepository.insert.mockResolvedValue(createdUser);
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.createUser(createDto);

      expect(userRepository.findByNormalizedEmail).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(
        emailVerificationService.createVerificationTokenData,
      ).toHaveBeenCalled();
      expect(userRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          email_verification_token: expect.any(String),
          verification_token_expires_at: expect.any(Date),
        }),
      );
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        createDto.email,
        tokenData.token,
      );
      expect(result).toEqual(createdUser);
    });

    it("should throw ConflictException when normalized email already exists (pre-check)", async () => {
      const createDto: CreateUserDto = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const existingUser = {
        id: "existing-id",
        email: "test@example.com",
      } as unknown as User;

      userRepository.findByNormalizedEmail.mockResolvedValue(existingUser);

      const promise = service.createUser(createDto);
      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toThrow(
        `User with email ${createDto.email} already exists`,
      );
      expect(userRepository.insert).not.toHaveBeenCalled();
    });

    it("should throw ConflictException when plus-alias email conflicts with existing base email", async () => {
      const createDto: CreateUserDto = {
        name: "Test User",
        email: "test+alias@example.com",
        password: "password123",
      };

      const existingUser = {
        id: "existing-id",
        email: "test@example.com",
      } as unknown as User;

      userRepository.findByNormalizedEmail.mockResolvedValue(existingUser);

      const promise = service.createUser(createDto);
      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toThrow(
        `User with email ${createDto.email} already exists`,
      );
      expect(userRepository.findByNormalizedEmail).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(userRepository.insert).not.toHaveBeenCalled();
    });

    it("should throw ConflictException when duplicate email exists (DB constraint fallback)", async () => {
      const createDto: CreateUserDto = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const tokenData = {
        token: "some-token",
        expiresAt: new Date(),
      };
      const duplicateError = { code: "23505" };

      userRepository.findByNormalizedEmail.mockResolvedValue(null);
      emailVerificationService.createVerificationTokenData.mockReturnValue(
        tokenData,
      );
      userRepository.insert.mockRejectedValue(duplicateError);

      const promise = service.createUser(createDto);
      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toThrow(
        `User with email ${createDto.email} already exists`,
      );
    });

    it("should propagate other database errors", async () => {
      const createDto: CreateUserDto = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const tokenData = {
        token: "some-token",
        expiresAt: new Date(),
      };
      const genericError = new Error("Database connection failed");

      userRepository.findByNormalizedEmail.mockResolvedValue(null);
      emailVerificationService.createVerificationTokenData.mockReturnValue(
        tokenData,
      );
      userRepository.insert.mockRejectedValue(genericError);

      await expect(service.createUser(createDto)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("updateUser", () => {
    it("should update user successfully", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const updateDto: UpdateUserDto = {
        name: "Updated Name",
        email: "updated@example.com",
      };
      const currentUser = {
        id: userId,
        email: "updated@example.com", // Same email, no change
        name: "Old Name",
      } as unknown as User;
      const updatedUser = {
        id: userId,
        ...updateDto,
      } as unknown as User;

      userRepository.findOne.mockResolvedValue(currentUser);
      userRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(userId, updateDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ user_id: userId });
      expect(
        emailVerificationService.createVerificationTokenData,
      ).not.toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith(
        { user_id: userId },
        updateDto,
      );
      expect(result).toEqual(updatedUser);
    });

    it("should update user without email change", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const updateDto: UpdateUserDto = {
        name: "Updated Name",
      };
      const updatedUser = {
        id: userId,
        ...updateDto,
      } as unknown as User;

      userRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(userId, updateDto);

      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith(
        { user_id: userId },
        updateDto,
      );
      expect(result).toEqual(updatedUser);
    });

    it("should reset email verification when email is changed", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const updateDto: UpdateUserDto = {
        name: "Updated Name",
        email: "newemail@example.com",
      };
      const currentUser = {
        id: userId,
        email: "oldemail@example.com",
        name: "Old Name",
        email_verified: true,
      } as unknown as User;
      const tokenData = {
        token: "new-verification-token",
        expiresAt: new Date(),
      };
      const updatedUser = {
        id: userId,
        ...updateDto,
        email_verified: false,
        email_verification_token: tokenData.token,
        verification_token_expires_at: tokenData.expiresAt,
      } as unknown as User;

      userRepository.findOne.mockResolvedValue(currentUser);
      userRepository.findByNormalizedEmail.mockResolvedValue(null);
      emailVerificationService.createVerificationTokenData.mockReturnValue(
        tokenData,
      );
      userRepository.update.mockResolvedValue(updatedUser);
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.updateUser(userId, updateDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ user_id: userId });
      expect(userRepository.findByNormalizedEmail).toHaveBeenCalledWith(
        "newemail@example.com",
        userId,
      );
      expect(
        emailVerificationService.createVerificationTokenData,
      ).toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith(
        { user_id: userId },
        {
          ...updateDto,
          email_verified: false,
          email_verification_token: tokenData.token,
          verification_token_expires_at: tokenData.expiresAt,
        },
      );
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        updateDto.email,
        tokenData.token,
      );
      expect(result).toEqual(updatedUser);
      expect(result.email_verified).toBe(false);
      expect(result.email_verification_token).toBe(tokenData.token);
    });

    it("should throw NotFoundException when user not found during email change", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const updateDto: UpdateUserDto = {
        email: "newemail@example.com",
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.updateUser(userId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateUser(userId, updateDto)).rejects.toThrow(
        `User with ID ${userId} not found`,
      );
    });

    it("should throw ConflictException when normalized email already exists (pre-check during update)", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const updateDto: UpdateUserDto = {
        email: "duplicate@example.com",
      };
      const currentUser = {
        user_id: userId,
        email: "oldemail@example.com",
      } as unknown as User;
      const conflictingUser = {
        user_id: "other-user-id",
        email: "duplicate@example.com",
      } as unknown as User;

      userRepository.findOne.mockResolvedValue(currentUser);
      userRepository.findByNormalizedEmail.mockResolvedValue(conflictingUser);

      const promise = service.updateUser(userId, updateDto);
      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toThrow(
        `User with email ${updateDto.email} already exists`,
      );
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it("should throw ConflictException when plus-alias email conflicts with existing email during update", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const updateDto: UpdateUserDto = {
        email: "other+alias@example.com",
      };
      const currentUser = {
        user_id: userId,
        email: "oldemail@example.com",
      } as unknown as User;
      const conflictingUser = {
        user_id: "other-user-id",
        email: "other@example.com",
      } as unknown as User;

      userRepository.findOne.mockResolvedValue(currentUser);
      userRepository.findByNormalizedEmail.mockResolvedValue(conflictingUser);

      const promise = service.updateUser(userId, updateDto);
      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toThrow(
        `User with email ${updateDto.email} already exists`,
      );
      expect(userRepository.findByNormalizedEmail).toHaveBeenCalledWith(
        "other@example.com",
        userId,
      );
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it("should throw ConflictException when email already exists in tenant (DB constraint fallback)", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const updateDto: UpdateUserDto = {
        email: "duplicate@example.com",
      };
      const currentUser = {
        id: userId,
        email: "oldemail@example.com",
      } as unknown as User;
      const tokenData = {
        token: "new-verification-token",
        expiresAt: new Date(),
      };
      const duplicateError = { code: "23505" };

      userRepository.findOne.mockResolvedValue(currentUser);
      userRepository.findByNormalizedEmail.mockResolvedValue(null);
      emailVerificationService.createVerificationTokenData.mockReturnValue(
        tokenData,
      );
      userRepository.update.mockRejectedValue(duplicateError);

      const promise = service.updateUser(userId, updateDto);
      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toThrow(
        `User with email ${updateDto.email} already exists`,
      );
    });

    it("should propagate non-conflict database errors during email change", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const updateDto: UpdateUserDto = {
        email: "newemail@example.com",
      };
      const currentUser = {
        id: userId,
        email: "oldemail@example.com",
      } as unknown as User;
      const tokenData = {
        token: "new-verification-token",
        expiresAt: new Date(),
      };
      const genericError = new Error("Database connection failed");

      userRepository.findOne.mockResolvedValue(currentUser);
      userRepository.findByNormalizedEmail.mockResolvedValue(null);
      emailVerificationService.createVerificationTokenData.mockReturnValue(
        tokenData,
      );
      userRepository.update.mockRejectedValue(genericError);

      await expect(service.updateUser(userId, updateDto)).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("should handle empty string email by removing it from update", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const updateDto: UpdateUserDto = {
        name: "Updated Name",
        email: "",
      };
      const updatedUser = {
        id: userId,
        name: "Updated Name",
      } as unknown as User;

      userRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(userId, updateDto);

      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(
        emailVerificationService.createVerificationTokenData,
      ).not.toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith(
        { user_id: userId },
        { name: "Updated Name" }, // email should be removed from DTO
      );
      expect(result).toEqual(updatedUser);
    });

    it("should handle whitespace-only email by removing it from update", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const updateDto: UpdateUserDto = {
        name: "Updated Name",
        email: "   ",
      };
      const updatedUser = {
        id: userId,
        name: "Updated Name",
      } as unknown as User;

      userRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(userId, updateDto);

      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(
        emailVerificationService.createVerificationTokenData,
      ).not.toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith(
        { user_id: userId },
        { name: "Updated Name" }, // email should be removed from DTO
      );
      expect(result).toEqual(updatedUser);
    });

    it("should not reset verification when email case changes only", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const updateDto: UpdateUserDto = {
        email: "User@Example.COM",
      };
      const currentUser = {
        id: userId,
        email: "user@example.com",
      } as unknown as User;
      const updatedUser = {
        id: userId,
        email: "User@Example.COM",
      } as unknown as User;

      userRepository.findOne.mockResolvedValue(currentUser);
      userRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(userId, updateDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ user_id: userId });
      expect(
        emailVerificationService.createVerificationTokenData,
      ).not.toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith(
        { user_id: userId },
        { email: "User@Example.COM" },
      );
      expect(result).toEqual(updatedUser);
    });

    it("should trim whitespace from email before processing", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const updateDto: UpdateUserDto = {
        email: "  newemail@example.com  ",
      };
      const currentUser = {
        id: userId,
        email: "oldemail@example.com",
      } as unknown as User;
      const tokenData = {
        token: "new-verification-token",
        expiresAt: new Date(),
      };
      const updatedUser = {
        id: userId,
        email: "newemail@example.com",
        email_verified: false,
      } as unknown as User;

      userRepository.findOne.mockResolvedValue(currentUser);
      userRepository.findByNormalizedEmail.mockResolvedValue(null);
      emailVerificationService.createVerificationTokenData.mockReturnValue(
        tokenData,
      );
      userRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(userId, updateDto);

      expect(userRepository.update).toHaveBeenCalledWith(
        { user_id: userId },
        expect.objectContaining({
          email: "newemail@example.com", // trimmed
          email_verified: false,
        }),
      );
      expect(result).toEqual(updatedUser);
    });

    it("should throw NotFoundException when user not found", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const updateDto: UpdateUserDto = {
        name: "Updated Name",
      };

      userRepository.update.mockResolvedValue(null);

      await expect(service.updateUser(userId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateUser(userId, updateDto)).rejects.toThrow(
        `User with ID ${userId} not found`,
      );
    });
  });

  describe("softDeleteUser", () => {
    it("should soft delete user successfully", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const deletedUser = {
        id: userId,
        delete_flag: true,
      } as unknown as User;

      userRepository.softDelete.mockResolvedValue(deletedUser);

      const result = await service.softDeleteUser(userId);

      expect(userRepository.softDelete).toHaveBeenCalledWith({
        user_id: userId,
      });
      expect(result).toEqual(deletedUser);
      expect(result.delete_flag).toBe(true);
    });

    it("should throw NotFoundException when user not found", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";

      userRepository.softDelete.mockResolvedValue(null);

      await expect(service.softDeleteUser(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.softDeleteUser(userId)).rejects.toThrow(
        `User with ID ${userId} not found`,
      );
    });
  });
});
