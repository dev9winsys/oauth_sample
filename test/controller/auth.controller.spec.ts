import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "src/controller/auth.controller";
import { AuthService } from "src/service/auth.service";
import {
  IssueTokenDto,
  RefreshTokenDto,
  TokenResponseDto,
  RecordLoginFailureDto,
  LoginFailureResponseDto,
} from "src/dto";
import { ApiKeyGuard } from "src/guard";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      issueToken: jest.fn(),
      refreshToken: jest.fn(),
      recordLoginFailure: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe("issueToken", () => {
    it("should issue a new token", async () => {
      const issueTokenDto: IssueTokenDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        services: [],
        ip_address: "192.168.1.1",
      };

      const tokenResponse = new TokenResponseDto("mock-token", 3600);
      authService.issueToken.mockResolvedValue(tokenResponse);

      const result = await controller.issueToken(issueTokenDto);

      expect(authService.issueToken).toHaveBeenCalledWith(issueTokenDto);
      expect(result).toEqual(tokenResponse);
    });
  });

  describe("refreshToken", () => {
    it("should refresh an existing token", async () => {
      const refreshTokenDto: RefreshTokenDto = {
        token: "existing-token",
      };

      const tokenResponse = new TokenResponseDto("new-token", 3600);
      authService.refreshToken.mockResolvedValue(tokenResponse);

      const result = await controller.refreshToken(refreshTokenDto);

      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
      expect(result).toEqual(tokenResponse);
    });
  });

  describe("recordLoginFailure", () => {
    it("should record a login failure", async () => {
      const recordLoginFailureDto: RecordLoginFailureDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        ip_address: "192.168.1.1",
      };

      const failureResponse = new LoginFailureResponseDto(
        1,
        "ログインに失敗しました。5回失敗するとアカウントがブロックされます。",
        false,
      );
      authService.recordLoginFailure.mockResolvedValue(failureResponse);

      const result = await controller.recordLoginFailure(recordLoginFailureDto);

      expect(authService.recordLoginFailure).toHaveBeenCalledWith(
        recordLoginFailureDto,
      );
      expect(result).toEqual(failureResponse);
    });
  });
});
