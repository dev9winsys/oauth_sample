import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { PasswordResetController } from "src/controller/password-reset.controller";
import { PasswordResetService } from "src/service/password-reset.service";
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
  PasswordResetResponseDto,
} from "src/dto";
import { ApiKeyGuard } from "src/guard";

describe("PasswordResetController", () => {
  let controller: PasswordResetController;
  let passwordResetService: jest.Mocked<PasswordResetService>;

  beforeEach(async () => {
    const mockPasswordResetService = {
      requestPasswordReset: jest.fn(),
      confirmPasswordReset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PasswordResetController],
      providers: [
        {
          provide: PasswordResetService,
          useValue: mockPasswordResetService,
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PasswordResetController>(PasswordResetController);
    passwordResetService = module.get(PasswordResetService);
  });

  // ---------------------------------------------------------------------------
  // POST /request
  // ---------------------------------------------------------------------------
  describe("requestPasswordReset", () => {
    it("should call service and return response", async () => {
      const dto: RequestPasswordResetDto = {
        login_id: "550e8400-e29b-41d4-a716-446655440000",
        ip_address: "192.168.1.1",
      };
      const response = new PasswordResetResponseDto(
        "パスワードリセットのメールを送信しました。",
      );
      passwordResetService.requestPasswordReset.mockResolvedValue(response);

      const result = await controller.requestPasswordReset(dto);

      expect(passwordResetService.requestPasswordReset).toHaveBeenCalledWith(
        dto,
      );
      expect(result).toEqual(response);
    });

    it("should call service with email-only dto", async () => {
      const dto: RequestPasswordResetDto = {
        email: "user@example.com",
        ip_address: "10.0.0.1",
      };
      const response = new PasswordResetResponseDto(
        "パスワードリセットのメールを送信しました。",
      );
      passwordResetService.requestPasswordReset.mockResolvedValue(response);

      const result = await controller.requestPasswordReset(dto);

      expect(passwordResetService.requestPasswordReset).toHaveBeenCalledWith(
        dto,
      );
      expect(result).toEqual(response);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /confirm (JSON API)
  // ---------------------------------------------------------------------------
  describe("confirmPasswordReset", () => {
    it("should call service and return response", async () => {
      const dto: ResetPasswordDto = {
        token: "valid-reset-token-abc123",
        new_password: "NewPassword123!",
        ip_address: "192.168.1.1",
      };
      const response = new PasswordResetResponseDto(
        "パスワードが正常に変更されました。",
      );
      passwordResetService.confirmPasswordReset.mockResolvedValue(response);

      const result = await controller.confirmPasswordReset(dto);

      expect(passwordResetService.confirmPasswordReset).toHaveBeenCalledWith(
        dto,
      );
      expect(result).toEqual(response);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /resetPassword  (browser form page)
  // ---------------------------------------------------------------------------
  describe("getPasswordResetForm", () => {
    it("should return HTML containing the form when a token is provided", () => {
      const html = controller.getPasswordResetForm("abc123token");

      expect(html).toContain("<form");
      expect(html).toContain("abc123token");
      expect(html).toContain('name="new_password"');
      expect(html).toContain('name="confirm_password"');
    });

    it("should escape HTML special characters in the token", () => {
      const html = controller.getPasswordResetForm(
        '<script>alert("xss")</script>',
      );

      // The injected token must be escaped in the hidden input value
      expect(html).not.toContain('value="<script>');
      expect(html).toContain("&lt;script&gt;");
    });

    it("should return an error page when the token is missing", () => {
      const html = controller.getPasswordResetForm("");

      expect(html).not.toContain("<form");
      expect(html).toContain("無効");
    });

    it("should return an error page when token is only whitespace", () => {
      const html = controller.getPasswordResetForm("   ");

      expect(html).not.toContain("<form");
      expect(html).toContain("無効");
    });
  });

  // ---------------------------------------------------------------------------
  // POST /resetPassword  (browser form submission)
  // ---------------------------------------------------------------------------
  describe("submitPasswordResetForm", () => {
    const makeRequest = (remoteAddress = "127.0.0.1") =>
      ({
        headers: {},
        socket: { remoteAddress },
      }) as any;

    it("should return success HTML when the service succeeds", async () => {
      passwordResetService.confirmPasswordReset.mockResolvedValue(
        new PasswordResetResponseDto("パスワードが正常に変更されました。"),
      );

      const html = await controller.submitPasswordResetForm(
        "validToken",
        "NewPassword1!",
        makeRequest(),
      );

      expect(passwordResetService.confirmPasswordReset).toHaveBeenCalledWith({
        token: "validToken",
        new_password: "NewPassword1!",
        ip_address: "127.0.0.1",
      });
      expect(html).toContain("パスワード変更完了");
    });

    it("should return error HTML when the service throws", async () => {
      passwordResetService.confirmPasswordReset.mockRejectedValue(
        new BadRequestException("パスワードリセットに失敗しました。"),
      );

      const html = await controller.submitPasswordResetForm(
        "badToken",
        "NewPassword1!",
        makeRequest(),
      );

      expect(html).toContain("エラー");
    });

    it("should prefer X-Forwarded-For over socket remoteAddress", async () => {
      passwordResetService.confirmPasswordReset.mockResolvedValue(
        new PasswordResetResponseDto("OK"),
      );

      const req = {
        headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
        socket: { remoteAddress: "10.0.0.2" },
      } as any;

      await controller.submitPasswordResetForm("token", "Password1!", req);

      expect(passwordResetService.confirmPasswordReset).toHaveBeenCalledWith(
        expect.objectContaining({ ip_address: "203.0.113.1" }),
      );
    });

    it("should fall back to 0.0.0.0 when no IP is available", async () => {
      passwordResetService.confirmPasswordReset.mockResolvedValue(
        new PasswordResetResponseDto("OK"),
      );

      const req = { headers: {}, socket: {} } as any;

      await controller.submitPasswordResetForm("token", "Password1!", req);

      expect(passwordResetService.confirmPasswordReset).toHaveBeenCalledWith(
        expect.objectContaining({ ip_address: "0.0.0.0" }),
      );
    });
  });
});
