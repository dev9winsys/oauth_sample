import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "src/service/email.service";

describe("EmailService", () => {
  let service: EmailService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          SMTP_HOST: "smtp.test.com",
          SMTP_PORT: "587",
          SMTP_SECURE: "false",
          SMTP_USER: "test@test.com",
          SMTP_PASSWORD: "password",
          EMAIL_FROM: "noreply@test.com",
          SERVICE_NAME: "TestService",
          SERVICE_URL: "http://localhost:4000",
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("sendVerificationEmail", () => {
    it("should construct correct verification URL", async () => {
      const email = "test@example.com";
      const token = "test-token-123";

      // Mock the transporter's sendMail method
      const sendMailSpy = jest
        .spyOn(service["transporter"], "sendMail")
        .mockResolvedValue({} as any);

      await service.sendVerificationEmail(email, token);

      expect(sendMailSpy).toHaveBeenCalled();
      const mailOptions = sendMailSpy.mock.calls[0][0];
      expect(mailOptions.to).toBe(email);
      expect(mailOptions.subject).toBe("【仮登録のお知らせ】");
      expect(mailOptions.text).toContain(
        "http://localhost:4000/users/verify-email?token=test-token-123",
      );
      expect(mailOptions.html).toContain(
        "http://localhost:4000/users/verify-email?token=test-token-123",
      );
    });

    it("should include service name in email content", async () => {
      const email = "test@example.com";
      const token = "test-token-123";

      const sendMailSpy = jest
        .spyOn(service["transporter"], "sendMail")
        .mockResolvedValue({} as any);

      await service.sendVerificationEmail(email, token);

      const mailOptions = sendMailSpy.mock.calls[0][0];
      expect(mailOptions.text).toContain("TestService仮登録を行いました。");
      expect(mailOptions.html).toContain("TestService仮登録を行いました。");
    });

    it("should include 24-hour expiration notice", async () => {
      const email = "test@example.com";
      const token = "test-token-123";

      const sendMailSpy = jest
        .spyOn(service["transporter"], "sendMail")
        .mockResolvedValue({} as any);

      await service.sendVerificationEmail(email, token);

      const mailOptions = sendMailSpy.mock.calls[0][0];
      expect(mailOptions.text).toContain("24時間");
      expect(mailOptions.html).toContain("24時間");
    });

    it("should include no-reply notice", async () => {
      const email = "test@example.com";
      const token = "test-token-123";

      const sendMailSpy = jest
        .spyOn(service["transporter"], "sendMail")
        .mockResolvedValue({} as any);

      await service.sendVerificationEmail(email, token);

      const mailOptions = sendMailSpy.mock.calls[0][0];
      expect(mailOptions.text).toContain("（このメールには返信できません。）");
      expect(mailOptions.html).toContain("（このメールには返信できません。）");
    });

    it("should throw error when email sending fails", async () => {
      const email = "test@example.com";
      const token = "test-token-123";
      const error = new Error("SMTP connection failed");

      jest.spyOn(service["transporter"], "sendMail").mockRejectedValue(error);

      await expect(service.sendVerificationEmail(email, token)).rejects.toThrow(
        error,
      );
    });

    it("should throw BadRequestException when email is empty", async () => {
      await expect(service.sendVerificationEmail("", "token")).rejects.toThrow(
        "Email address is required",
      );
    });

    it("should throw BadRequestException when token is empty", async () => {
      await expect(
        service.sendVerificationEmail("test@example.com", ""),
      ).rejects.toThrow("Verification token is required");
    });

    it("should URL encode the token", async () => {
      const email = "test@example.com";
      const token = "token+with/special=chars";

      const sendMailSpy = jest
        .spyOn(service["transporter"], "sendMail")
        .mockResolvedValue({} as any);

      await service.sendVerificationEmail(email, token);

      const mailOptions = sendMailSpy.mock.calls[0][0];
      expect(mailOptions.text).toContain("token%2Bwith%2Fspecial%3Dchars");
      expect(mailOptions.html).toContain("token%2Bwith%2Fspecial%3Dchars");
    });

    it("should HTML escape service name and URL in HTML template", async () => {
      const mockConfigWithSpecialChars = {
        get: jest.fn((key: string) => {
          const config = {
            SMTP_HOST: "smtp.test.com",
            SMTP_PORT: "587",
            SMTP_SECURE: "false",
            SMTP_USER: "test@test.com",
            SMTP_PASSWORD: "password",
            EMAIL_FROM: "noreply@test.com",
            SERVICE_NAME: 'Test<script>alert("xss")</script>Service',
            SERVICE_URL: "http://localhost:4000",
          };
          return config[key];
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: mockConfigWithSpecialChars,
          },
        ],
      }).compile();

      const testService = module.get<EmailService>(EmailService);
      const sendMailSpy = jest
        .spyOn(testService["transporter"], "sendMail")
        .mockResolvedValue({} as any);

      await testService.sendVerificationEmail("test@example.com", "token");

      const mailOptions = sendMailSpy.mock.calls[0][0];
      expect(mailOptions.html).toContain(
        "Test&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;Service",
      );
      expect(mailOptions.html).not.toContain("<script>");
    });
  });
});
