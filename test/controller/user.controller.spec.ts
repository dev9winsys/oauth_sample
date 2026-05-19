import { Test, TestingModule } from "@nestjs/testing";
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { UserController } from "src/controller/user.controller";
import { UserService } from "src/service/user.service";
import { EmailVerificationService } from "src/service/email-verification.service";
import { User } from "src/database/entity/user.entity";
import { UpdateUserDto } from "src/dto/update-user.dto";
import { CreateUserDto } from "src/dto/create-user.dto";
import { UserResponseDto } from "src/dto/user-response.dto";
import { ApiKeyGuard } from "src/guard";

describe("UserController", () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;
  let emailVerificationService: jest.Mocked<EmailVerificationService>;

  beforeEach(async () => {
    const mockUserService = {
      createUser: jest.fn(),
      updateUser: jest.fn(),
      softDeleteUser: jest.fn(),
    };

    const mockEmailVerificationService = {
      verifyEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: EmailVerificationService,
          useValue: mockEmailVerificationService,
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
    emailVerificationService = module.get(EmailVerificationService);
  });

  describe("createUser", () => {
    it("should create a user successfully and return response DTO", async () => {
      const createDto: CreateUserDto = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };
      const createdUser = {
        id: 1,
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        name: createDto.name,
        email: createDto.email,
        password: "hashed_password",
        email_verified: false,
        delete_flag: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as User;

      userService.createUser.mockResolvedValue(createdUser);

      const result = await controller.createUser(createDto);

      expect(userService.createUser).toHaveBeenCalledWith(createDto);
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.id).toEqual(createdUser.id);
      expect(result.user_id).toEqual(createdUser.user_id);
      expect(result.email).toEqual(createdUser.email);
      expect(result).not.toHaveProperty("password");
      expect(result).not.toHaveProperty("email_verification_token");
    });

    it("should throw ConflictException when user already exists", async () => {
      const createDto: CreateUserDto = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      userService.createUser.mockRejectedValue(
        new ConflictException(
          `User with email ${createDto.email} already exists`,
        ),
      );

      await expect(controller.createUser(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("updateUser", () => {
    it("should update user successfully and return response DTO", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const updateDto: UpdateUserDto = {
        name: "Updated Name",
        email: "updated@example.com",
      };
      const updatedUser = {
        id: 1,
        user_id: userId,
        name: updateDto.name,
        email: updateDto.email,
        password: "hashed_password",
        email_verified: false,
        delete_flag: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as User;

      userService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(userId, updateDto);

      expect(userService.updateUser).toHaveBeenCalledWith(userId, updateDto);
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.id).toEqual(updatedUser.id);
      expect(result.user_id).toEqual(updatedUser.user_id);
      expect(result.name).toEqual(updateDto.name);
      expect(result).not.toHaveProperty("password");
      expect(result).not.toHaveProperty("email_verification_token");
    });

    it("should throw NotFoundException when user not found", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const updateDto: UpdateUserDto = {
        name: "Updated Name",
      };

      userService.updateUser.mockRejectedValue(
        new NotFoundException(`User with ID ${userId} not found`),
      );

      await expect(controller.updateUser(userId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("softDeleteUser", () => {
    it("should soft delete user successfully and return response DTO", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const deletedUser = {
        id: 1,
        user_id: userId,
        name: "Test User",
        email: "test@example.com",
        password: "hashed_password",
        email_verified: false,
        delete_flag: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as User;

      userService.softDeleteUser.mockResolvedValue(deletedUser);

      const result = await controller.softDeleteUser(userId);

      expect(userService.softDeleteUser).toHaveBeenCalledWith(userId);
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.id).toEqual(deletedUser.id);
      expect(result.user_id).toEqual(deletedUser.user_id);
      expect(result.delete_flag).toBe(true);
      expect(result).not.toHaveProperty("password");
      expect(result).not.toHaveProperty("email_verification_token");
    });

    it("should throw NotFoundException when user not found", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";

      userService.softDeleteUser.mockRejectedValue(
        new NotFoundException(`User with ID ${userId} not found`),
      );

      await expect(controller.softDeleteUser(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("verifyEmail", () => {
    it("should verify email successfully and return response DTO", async () => {
      const token = "valid-token-123";
      const verifiedUser = {
        id: 1,
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        name: "Test User",
        email: "test@example.com",
        password: "hashed_password",
        email_verified: true,
        delete_flag: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as User;

      emailVerificationService.verifyEmail.mockResolvedValue(verifiedUser);

      const result = await controller.verifyEmail(token);

      expect(emailVerificationService.verifyEmail).toHaveBeenCalledWith(token);
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.id).toEqual(verifiedUser.id);
      expect(result.user_id).toEqual(verifiedUser.user_id);
      expect(result.email_verified).toBe(true);
      expect(result).not.toHaveProperty("password");
      expect(result).not.toHaveProperty("email_verification_token");
    });

    it("should throw BadRequestException when token is empty", async () => {
      await expect(controller.verifyEmail("")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when token is whitespace", async () => {
      await expect(controller.verifyEmail("   ")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when token is invalid", async () => {
      const token = "invalid-token";

      emailVerificationService.verifyEmail.mockRejectedValue(
        new BadRequestException("Invalid verification token"),
      );

      await expect(controller.verifyEmail(token)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
