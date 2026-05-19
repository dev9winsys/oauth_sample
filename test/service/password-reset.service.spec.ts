import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { getDataSourceToken } from "@nestjs/typeorm";
import { PasswordResetService } from "src/service/password-reset.service";
import { UserRepository } from "src/database/repository/user.repository";
import { EmailService } from "src/service/email.service";
import { User, ActivityStatus } from "src/database/entity/user.entity";
import {
  LoginHistory,
  LoginStatus,
} from "src/database/entity/login-history.entity";
import { UserBlockHistory } from "src/database/entity/user-block-history.entity";
import { RequestPasswordResetDto, ResetPasswordDto } from "src/dto";
import * as passwordUtil from "src/database/utils";

jest.mock("src/database/utils", () => ({
  ...jest.requireActual("src/database/utils"),
  comparePassword: jest.fn(),
}));

describe("PasswordResetService", () => {
  let service: PasswordResetService;
  let userRepository: jest.Mocked<UserRepository>;
  let emailService: jest.Mocked<EmailService>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      getRepository: jest.fn().mockReturnValue({ target: User }),
    };

    const mockEmailService = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    const mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<PasswordResetService>(PasswordResetService);
    userRepository = module.get(UserRepository);
    emailService = module.get(EmailService);
    dataSource = module.get(getDataSourceToken());
  });

  // ---------------------------------------------------------------------------
  // requestPasswordReset
  // ---------------------------------------------------------------------------
  describe("requestPasswordReset", () => {
    const baseDto: RequestPasswordResetDto = {
      login_id: "550e8400-e29b-41d4-a716-446655440000",
      ip_address: "192.168.1.1",
    };

    const mockUser: Partial<User> = {
      id: 1,
      user_id: "550e8400-e29b-41d4-a716-446655440000",
      email: "user@example.com",
      delete_flag: false,
    };

    // Per-suite mocks for the transaction internals
    let reqUserRepoMock: { update: jest.Mock };
    let reqLoginHistoryRepoMock: { insert: jest.Mock };

    beforeEach(() => {
      reqUserRepoMock = {
        update: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      reqLoginHistoryRepoMock = { insert: jest.fn().mockResolvedValue({}) };

      dataSource.transaction.mockImplementation(
        async (cb: (manager: any) => Promise<void>) =>
          cb({
            getRepository: (entity: any) => {
              if (entity === User) return reqUserRepoMock;
              if (entity === LoginHistory) return reqLoginHistoryRepoMock;
              return {};
            },
          }),
      );

      userRepository.findOne.mockResolvedValue(mockUser as User);
    });

    it("should request password reset by login_id successfully", async () => {
      const result = await service.requestPasswordReset(baseDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        user_id: baseDto.login_id,
        delete_flag: false,
      });
      expect(reqUserRepoMock.update).toHaveBeenCalledWith(
        { id: mockUser.id },
        expect.objectContaining({
          password_reset_token: expect.any(String),
          password_reset_token_expires_at: expect.any(Date),
        }),
      );
      expect(reqLoginHistoryRepoMock.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        ip_address: baseDto.ip_address,
        login_status: LoginStatus.PASSWORD_RESET_REQUEST,
      });
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email,
        expect.any(String),
      );
      expect(result.message).toContain("パスワードリセット");
    });

    it("should request password reset by email successfully", async () => {
      const dto: RequestPasswordResetDto = {
        email: "user@example.com",
        ip_address: "192.168.1.1",
      };
      userRepository.findOne.mockResolvedValue(mockUser as User);

      const result = await service.requestPasswordReset(dto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        email: dto.email,
        delete_flag: false,
      });
      expect(result.message).toBeDefined();
    });

    it("should try login_id first, then fall back to email", async () => {
      const dto: RequestPasswordResetDto = {
        login_id: "550e8400-e29b-41d4-a716-446655440000",
        email: "user@example.com",
        ip_address: "192.168.1.1",
      };

      // First call (by login_id) returns null; second call (by email) returns user
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser as User);

      await service.requestPasswordReset(dto);

      expect(userRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it("should throw BadRequestException when neither login_id nor email provided", async () => {
      const dto: RequestPasswordResetDto = {
        ip_address: "192.168.1.1",
      };

      await expect(service.requestPasswordReset(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw NotFoundException when user not found", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.requestPasswordReset(baseDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should generate a unique hex token with each call", async () => {
      await service.requestPasswordReset(baseDto);
      await service.requestPasswordReset(baseDto);

      const firstToken = (reqUserRepoMock.update.mock.calls[0][1] as any)
        .password_reset_token;
      const secondToken = (reqUserRepoMock.update.mock.calls[1][1] as any)
        .password_reset_token;

      expect(firstToken).toMatch(/^[0-9a-f]+$/);
      expect(secondToken).toMatch(/^[0-9a-f]+$/);
      expect(firstToken).not.toBe(secondToken);
    });

    it("should set token expiry to 24 hours from now", async () => {
      const before = new Date();

      await service.requestPasswordReset(baseDto);

      const expiresAt = (reqUserRepoMock.update.mock.calls[0][1] as any)
        .password_reset_token_expires_at as Date;
      const after = new Date();

      const expectedMin = new Date(before);
      expectedMin.setHours(expectedMin.getHours() + 24);
      const expectedMax = new Date(after);
      expectedMax.setHours(expectedMax.getHours() + 24);

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(
        expectedMin.getTime() - 1000,
      );
      expect(expiresAt.getTime()).toBeLessThanOrEqual(
        expectedMax.getTime() + 1000,
      );
    });

    it("should clear the token and rethrow when email sending fails", async () => {
      const emailError = new Error("SMTP connection failed");
      emailService.sendPasswordResetEmail.mockRejectedValue(emailError);

      await expect(service.requestPasswordReset(baseDto)).rejects.toThrow(
        emailError,
      );

      // Token must be cleared from the DB after the email failure
      expect(userRepository.update).toHaveBeenCalledWith(
        { id: mockUser.id },
        { password_reset_token: null, password_reset_token_expires_at: null },
      );
    });
  });

  // ---------------------------------------------------------------------------
  // confirmPasswordReset
  // ---------------------------------------------------------------------------
  describe("confirmPasswordReset", () => {
    const mockToken = "valid-reset-token-abc123";

    const makeMockUser = (overrides?: Partial<User>): User =>
      ({
        id: 1,
        user_id: "550e8400-e29b-41d4-a716-446655440000",
        email: "user@example.com",
        password: "$2b$10$hashedCurrentPassword",
        previous_passwords: [],
        activity_status: ActivityStatus.NORMAL,
        delete_flag: false,
        password_reset_token: mockToken,
        password_reset_token_expires_at: new Date(Date.now() + 3600000),
        ...overrides,
      }) as User;

    const baseDto: ResetPasswordDto = {
      token: mockToken,
      new_password: "NewPassword123!",
      ip_address: "192.168.1.1",
    };

    // Per-suite manager mocks — reset before each test
    let userRepoMock: {
      findOne: jest.Mock;
      save: jest.Mock;
    };
    let blockHistoryRepoMock: {
      findOne: jest.Mock;
      save: jest.Mock;
    };
    let loginHistoryRepoMock: {
      insert: jest.Mock;
    };

    beforeEach(() => {
      (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(false);

      userRepoMock = {
        findOne: jest.fn().mockResolvedValue(makeMockUser()),
        save: jest.fn().mockResolvedValue({}),
      };
      blockHistoryRepoMock = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockResolvedValue({}),
      };
      loginHistoryRepoMock = {
        insert: jest.fn().mockResolvedValue({}),
      };

      dataSource.transaction.mockImplementation(
        async (cb: (manager: any) => Promise<void>) =>
          cb({
            getRepository: (entity: any) => {
              if (entity === User) return userRepoMock;
              if (entity === UserBlockHistory) return blockHistoryRepoMock;
              if (entity === LoginHistory) return loginHistoryRepoMock;
              return {};
            },
          }),
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should reset password successfully", async () => {
      const result = await service.confirmPasswordReset(baseDto);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.message).toContain("パスワードが正常に変更されました");
    });

    it("should throw BadRequestException when token not found", async () => {
      userRepoMock.findOne.mockResolvedValue(null);

      await expect(service.confirmPasswordReset(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when token is expired", async () => {
      userRepoMock.findOne.mockResolvedValue(
        makeMockUser({
          password_reset_token_expires_at: new Date(Date.now() - 1000),
        }),
      );

      await expect(service.confirmPasswordReset(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when new password matches current password", async () => {
      jest.spyOn(passwordUtil, "comparePassword").mockResolvedValueOnce(true);

      await expect(service.confirmPasswordReset(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when new password matches a previous password", async () => {
      userRepoMock.findOne.mockResolvedValue(
        makeMockUser({ previous_passwords: ["$2b$10$hashedOldPassword"] }),
      );

      // current password doesn't match, but previous password does
      jest
        .spyOn(passwordUtil, "comparePassword")
        .mockResolvedValueOnce(false) // current
        .mockResolvedValueOnce(true); // previous

      await expect(service.confirmPasswordReset(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should record PASSWORD_RESET_COMPLETE in login history", async () => {
      await service.confirmPasswordReset(baseDto);

      const { id } = makeMockUser();
      expect(loginHistoryRepoMock.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: id,
          ip_address: baseDto.ip_address,
          login_status: LoginStatus.PASSWORD_RESET_COMPLETE,
        }),
      );
    });

    it("should unblock a blocked user on successful password reset", async () => {
      userRepoMock.findOne.mockResolvedValue(
        makeMockUser({ activity_status: ActivityStatus.PERMANENT_BLOCK }),
      );
      blockHistoryRepoMock.findOne.mockResolvedValue({
        id: 1,
        user_id: 1,
        block_release_date: null,
      });

      await service.confirmPasswordReset(baseDto);

      expect(blockHistoryRepoMock.save).toHaveBeenCalled();
    });

    it("should clear the reset token after successful reset", async () => {
      await service.confirmPasswordReset(baseDto);

      // userRepo.save receives the mutated user; token fields must be null
      const savedUser: User = userRepoMock.save.mock.calls[0][0];
      expect(savedUser.password_reset_token).toBeNull();
      expect(savedUser.password_reset_token_expires_at).toBeNull();
    });

    it("should reset login_failure_count to 0", async () => {
      await service.confirmPasswordReset(baseDto);

      const savedUser: User = userRepoMock.save.mock.calls[0][0];
      expect(savedUser.login_failure_count).toBe(0);
    });

    it("should lock the user row inside the transaction", async () => {
      await service.confirmPasswordReset(baseDto);

      expect(userRepoMock.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          lock: { mode: "pessimistic_write" },
        }),
      );
    });
  });
});
