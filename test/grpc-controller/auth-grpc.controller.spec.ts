import { Test, TestingModule } from "@nestjs/testing";
import { AuthGrpcController } from "src/grpc-controller/auth-grpc.controller";
import { AuthService } from "src/service/auth.service";
import { TokenResponseDto, LoginFailureResponseDto } from "src/dto";
import { RpcException } from "@nestjs/microservices";

describe("AuthGrpcController", () => {
  let controller: AuthGrpcController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      issueToken: jest.fn(),
      refreshToken: jest.fn(),
      recordLoginFailure: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthGrpcController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthGrpcController>(AuthGrpcController);
    authService = module.get(AuthService);
  });

  describe("issueToken", () => {
    it("should issue a new token", async () => {
      const request = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        services: [],
        ip_address: "192.168.1.1",
      };

      const tokenResponse = new TokenResponseDto("mock-token", 3600);
      authService.issueToken.mockResolvedValue(tokenResponse);

      const result = await controller.issueToken(request);

      expect(authService.issueToken).toHaveBeenCalled();
      expect(result).toEqual(tokenResponse);
    });

    it("should validate user_id format", async () => {
      const request = {
        user_id: "invalid-uuid",
        services: [],
        ip_address: "192.168.1.1",
      };

      await expect(controller.issueToken(request)).rejects.toThrow(
        RpcException,
      );
    });
  });

  describe("refreshToken", () => {
    it("should refresh a token", async () => {
      const request = {
        token: "existing-token",
      };

      const tokenResponse = new TokenResponseDto("new-token", 3600);
      authService.refreshToken.mockResolvedValue(tokenResponse);

      const result = await controller.refreshToken(request);

      expect(authService.refreshToken).toHaveBeenCalled();
      expect(result).toEqual(tokenResponse);
    });
  });

  describe("recordLoginFailure", () => {
    it("should record a login failure", async () => {
      const request = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        ip_address: "192.168.1.1",
      };

      const failureResponse = new LoginFailureResponseDto(
        1,
        "ログインに失敗しました。5回失敗するとアカウントがブロックされます。",
        false,
      );
      authService.recordLoginFailure.mockResolvedValue(failureResponse);

      const result = await controller.recordLoginFailure(request);

      expect(authService.recordLoginFailure).toHaveBeenCalled();
      expect(result).toEqual(failureResponse);
    });

    it("should validate user_id format", async () => {
      const request = {
        user_id: "invalid-uuid",
        ip_address: "192.168.1.1",
      };

      await expect(controller.recordLoginFailure(request)).rejects.toThrow(
        RpcException,
      );
    });
  });
});
