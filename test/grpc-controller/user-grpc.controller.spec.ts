import { Test, TestingModule } from "@nestjs/testing";
import { UserGrpcController } from "src/grpc-controller/user-grpc.controller";
import { UserService, EmailVerificationService } from "src/service";
import { UserResponseDto } from "src/dto";
import { User } from "src/database/entity";
import { RpcException } from "@nestjs/microservices";

describe("UserGrpcController", () => {
  let controller: UserGrpcController;
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
      controllers: [UserGrpcController],
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
    }).compile();

    controller = module.get<UserGrpcController>(UserGrpcController);
    userService = module.get(UserService);
    emailVerificationService = module.get(EmailVerificationService);
  });

  describe("createUser", () => {
    it("should create a new user", async () => {
      const request = {
        email: "test@example.com",
        password: "SecurePass123!",
        name: "Test User",
      };

      const mockUser = { id: 1, email: "test@example.com" } as User;
      userService.createUser.mockResolvedValue(mockUser);

      const result = await controller.createUser(request);

      expect(userService.createUser).toHaveBeenCalled();
      expect(result).toBeInstanceOf(UserResponseDto);
    });

    it("should validate email format", async () => {
      const request = {
        email: "invalid-email",
        password: "SecurePass123!",
        name: "Test User",
      };

      await expect(controller.createUser(request)).rejects.toThrow(
        RpcException,
      );
    });

    it("should validate password length", async () => {
      const request = {
        email: "test@example.com",
        password: "short",
        name: "Test User",
      };

      await expect(controller.createUser(request)).rejects.toThrow(
        RpcException,
      );
    });
  });

  describe("updateUser", () => {
    it("should update a user", async () => {
      const request = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "updated@example.com",
        name: "Updated User",
      };

      const mockUser = { id: 1, email: "updated@example.com" } as User;
      userService.updateUser.mockResolvedValue(mockUser);

      const result = await controller.updateUser(request);

      expect(userService.updateUser).toHaveBeenCalled();
      expect(result).toBeInstanceOf(UserResponseDto);
    });
  });

  describe("verifyEmail", () => {
    it("should verify user email", async () => {
      const request = {
        token: "verification-token",
      };

      const mockUser = {
        id: 1,
        email: "test@example.com",
        email_verified: true,
      } as User;
      emailVerificationService.verifyEmail.mockResolvedValue(mockUser);

      const result = await controller.verifyEmail(request);

      expect(emailVerificationService.verifyEmail).toHaveBeenCalledWith(
        "verification-token",
      );
      expect(result).toBeInstanceOf(UserResponseDto);
    });
  });
});
