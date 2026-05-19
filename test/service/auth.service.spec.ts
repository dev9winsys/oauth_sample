import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { getDataSourceToken } from "@nestjs/typeorm";
import { AuthService } from "src/service/auth.service";
import { UserRepository } from "src/database/repository/user.repository";
import { LoginHistoryRepository } from "src/database/repository/login-history.repository";
import { IssueTokenDto, RefreshTokenDto, RecordLoginFailureDto } from "src/dto";
import { User, ActivityStatus } from "src/database/entity/user.entity";
import { LoginStatus } from "src/database/entity/login-history.entity";

describe("AuthService", () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let userRepository: jest.Mocked<UserRepository>;
  let loginHistoryRepository: jest.Mocked<LoginHistoryRepository>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          JWT_SECRET: "test-secret",
          JWT_EXPIRES_IN: "1h",
        };
        return config[key];
      }),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      getRepository: jest.fn().mockReturnValue({ target: User }),
    };

    const mockLoginHistoryRepository = {
      insert: jest.fn().mockResolvedValue({}),
    };

    const mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: LoginHistoryRepository,
          useValue: mockLoginHistoryRepository,
        },
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    userRepository = module.get(UserRepository);
    loginHistoryRepository = module.get(LoginHistoryRepository);
    dataSource = module.get(getDataSourceToken());
  });

  describe("issueToken", () => {
    it("should issue a token successfully", async () => {
      const issueTokenDto: IssueTokenDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        services: [
          {
            service_id: "service1",
            service_name: "Service 1",
            permissions: ["read", "write"],
          },
        ],
        ip_address: "192.168.1.1",
      };

      const mockUser = {
        id: 1,
        user_id: issueTokenDto.user_id,
        name: "Test User",
        email: "test@example.com",
      } as User;

      const mockToken = "mock-jwt-token";

      userRepository.findOne.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue(mockToken);

      const result = await service.issueToken(issueTokenDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        user_id: issueTokenDto.user_id,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: issueTokenDto.user_id,
        services: issueTokenDto.services,
      });
      expect(loginHistoryRepository.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        ip_address: issueTokenDto.ip_address,
        login_status: LoginStatus.SUCCESS,
      });
      expect(userRepository.update).toHaveBeenCalledWith(
        { user_id: issueTokenDto.user_id },
        { login_failure_count: 0 },
      );
      expect(result.access_token).toBe(mockToken);
      expect(result.token_type).toBe("Bearer");
      expect(result.expires_in).toBe(3600); // 1h = 3600 seconds
    });

    it("should always record login_status as SUCCESS when issuing a token", async () => {
      const issueTokenDto: IssueTokenDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        ip_address: "10.0.0.1",
      };

      const mockUser = {
        id: 1,
        user_id: issueTokenDto.user_id,
        name: "Test User",
        email: "test@example.com",
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue("mock-jwt-token");

      await service.issueToken(issueTokenDto);

      expect(loginHistoryRepository.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        ip_address: issueTokenDto.ip_address,
        login_status: LoginStatus.SUCCESS,
      });
    });

    it("should reset login_failure_count to 0 on successful login", async () => {
      const issueTokenDto: IssueTokenDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        ip_address: "10.0.0.1",
      };

      const mockUser = {
        id: 1,
        user_id: issueTokenDto.user_id,
        name: "Test User",
        email: "test@example.com",
        login_failure_count: 3,
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue("mock-jwt-token");

      await service.issueToken(issueTokenDto);

      expect(userRepository.update).toHaveBeenCalledWith(
        { user_id: issueTokenDto.user_id },
        { login_failure_count: 0 },
      );
    });

    it("should throw NotFoundException when user does not exist", async () => {
      const issueTokenDto: IssueTokenDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        ip_address: "10.0.0.1",
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.issueToken(issueTokenDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("refreshToken", () => {
    it("should refresh a token successfully", async () => {
      const refreshTokenDto: RefreshTokenDto = {
        token: "existing-token",
      };

      const decodedToken = {
        sub: "123e4567-e89b-12d3-a456-426614174000",
        services: [],
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const mockUser = {
        id: 1,
        user_id: decodedToken.sub,
        name: "Test User",
        email: "test@example.com",
      } as User;

      const newToken = "new-jwt-token";

      jwtService.verify.mockReturnValue(decodedToken);
      userRepository.findOne.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue(newToken);

      const result = await service.refreshToken(refreshTokenDto);

      expect(jwtService.verify).toHaveBeenCalledWith(refreshTokenDto.token, {
        secret: "test-secret",
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        user_id: decodedToken.sub,
      });
      expect(result.access_token).toBe(newToken);
      expect(result.token_type).toBe("Bearer");
    });

    it("should throw UnauthorizedException when user no longer exists", async () => {
      const refreshTokenDto: RefreshTokenDto = {
        token: "valid-token",
      };

      const decodedToken = {
        sub: "123e4567-e89b-12d3-a456-426614174000",
        services: [],
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      jwtService.verify.mockReturnValue(decodedToken);
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException when token is invalid", async () => {
      const refreshTokenDto: RefreshTokenDto = {
        token: "invalid-token",
      };

      jwtService.verify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("parseExpiresIn", () => {
    it("should parse seconds correctly", () => {
      const result = (service as any).parseExpiresIn("60s");
      expect(result).toBe(60);
    });

    it("should parse minutes correctly", () => {
      const result = (service as any).parseExpiresIn("30m");
      expect(result).toBe(1800);
    });

    it("should parse hours correctly", () => {
      const result = (service as any).parseExpiresIn("2h");
      expect(result).toBe(7200);
    });

    it("should parse days correctly", () => {
      const result = (service as any).parseExpiresIn("1d");
      expect(result).toBe(86400);
    });

    it("should return default value for invalid format", () => {
      const result = (service as any).parseExpiresIn("invalid");
      expect(result).toBe(3600); // Default 1 hour
    });
  });

  describe("recordLoginFailure", () => {
    it("should increment failure count and return warning message", async () => {
      const recordLoginFailureDto: RecordLoginFailureDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        ip_address: "192.168.1.1",
      };

      const mockUser = {
        id: 1,
        user_id: recordLoginFailureDto.user_id,
        name: "Test User",
        email: "test@example.com",
        login_failure_count: 1,
        activity_status: ActivityStatus.NORMAL,
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.recordLoginFailure(recordLoginFailureDto);

      expect(loginHistoryRepository.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        ip_address: recordLoginFailureDto.ip_address,
        login_status: LoginStatus.FAILURE,
      });
      expect(userRepository.update).toHaveBeenCalledWith(
        { user_id: recordLoginFailureDto.user_id },
        { login_failure_count: 2 },
      );
      expect(result.failure_count).toBe(2);
      expect(result.blocked).toBe(false);
      expect(result.message).toContain(
        "5回失敗するとアカウントがブロックされます",
      );
    });

    it("should block user on 5th failure", async () => {
      const recordLoginFailureDto: RecordLoginFailureDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        ip_address: "192.168.1.1",
      };

      const mockUser = {
        id: 1,
        user_id: recordLoginFailureDto.user_id,
        name: "Test User",
        email: "test@example.com",
        login_failure_count: 4,
        activity_status: ActivityStatus.NORMAL,
      } as User;

      const mockManager = {
        getRepository: jest.fn().mockReturnValue({
          save: jest.fn().mockResolvedValue({}),
          create: jest.fn().mockReturnValue({}),
          insert: jest.fn().mockResolvedValue({}),
        }),
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      dataSource.transaction.mockImplementation(
        async (cb: (manager: any) => Promise<void>) => cb(mockManager),
      );

      const result = await service.recordLoginFailure(recordLoginFailureDto);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.failure_count).toBe(5);
      expect(result.blocked).toBe(true);
      expect(result.message).toContain("ブロックされました");
      expect(result.message).toContain("パスワードをリセット");
    });

    it("should throw NotFoundException when user does not exist", async () => {
      const recordLoginFailureDto: RecordLoginFailureDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        ip_address: "10.0.0.1",
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.recordLoginFailure(recordLoginFailureDto),
      ).rejects.toThrow(NotFoundException);
    });

    it("should return already-blocked message without incrementing count", async () => {
      const recordLoginFailureDto: RecordLoginFailureDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        ip_address: "10.0.0.1",
      };

      const mockUser = {
        id: 1,
        user_id: recordLoginFailureDto.user_id,
        name: "Test User",
        email: "test@example.com",
        login_failure_count: 5,
        activity_status: ActivityStatus.PERMANENT_BLOCK,
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.recordLoginFailure(recordLoginFailureDto);

      expect(result.failure_count).toBe(5);
      expect(result.blocked).toBe(true);
      expect(result.message).toContain("既にブロックされています");
      expect(result.message).toContain("パスワードをリセット");
      expect(loginHistoryRepository.insert).not.toHaveBeenCalled();
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it("should return warning message and failure_count of 1 on first failure", async () => {
      const recordLoginFailureDto: RecordLoginFailureDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        ip_address: "10.0.0.1",
      };

      const mockUser = {
        id: 1,
        user_id: recordLoginFailureDto.user_id,
        name: "Test User",
        email: "test@example.com",
        login_failure_count: 0,
        activity_status: ActivityStatus.NORMAL,
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.recordLoginFailure(recordLoginFailureDto);

      expect(result.failure_count).toBe(1);
      expect(result.blocked).toBe(false);
      expect(result.message).toContain(
        "5回失敗するとアカウントがブロックされます",
      );
    });

    it("should record login history with FAILURE status", async () => {
      const recordLoginFailureDto: RecordLoginFailureDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        ip_address: "10.0.0.1",
      };

      const mockUser = {
        id: 1,
        user_id: recordLoginFailureDto.user_id,
        name: "Test User",
        email: "test@example.com",
        login_failure_count: 0,
        activity_status: ActivityStatus.NORMAL,
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);

      await service.recordLoginFailure(recordLoginFailureDto);

      expect(loginHistoryRepository.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        ip_address: recordLoginFailureDto.ip_address,
        login_status: LoginStatus.FAILURE,
      });
    });
  });
});
