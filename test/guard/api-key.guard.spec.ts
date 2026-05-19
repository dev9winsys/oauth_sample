import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiKeyGuard } from "src/guard/api-key.guard";

describe("ApiKeyGuard", () => {
  let guard: ApiKeyGuard;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    configService = module.get(ConfigService);
  });

  const createMockExecutionContext = (
    apiKey?: string,
    method: string = "GET",
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            "x-api-key": apiKey,
          },
          method: method,
        }),
      }),
    } as ExecutionContext;
  };

  describe("canActivate", () => {
    it("should allow access when no API key is configured", () => {
      configService.get.mockReturnValue(undefined);
      const context = createMockExecutionContext();

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      // Should check API_KEY_READ first, then API_KEY as fallback
      expect(configService.get).toHaveBeenCalledWith("API_KEY_READ");
      expect(configService.get).toHaveBeenCalledWith("API_KEY");
    });

    it("should allow access when API key is valid for GET (Read)", () => {
      const validApiKey = "test-api-key-read";
      configService.get.mockImplementation((key: string) => {
        if (key === "API_KEY_READ") return validApiKey;
        return undefined;
      });
      const context = createMockExecutionContext(validApiKey, "GET");

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith("API_KEY_READ");
    });

    it("should fallback to generic API_KEY when CRUD-specific key not configured", () => {
      const validApiKey = "test-api-key-generic";
      configService.get.mockImplementation((key: string) => {
        if (key === "API_KEY") return validApiKey;
        return undefined;
      });
      const context = createMockExecutionContext(validApiKey, "POST");

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith("API_KEY_CREATE");
      expect(configService.get).toHaveBeenCalledWith("API_KEY");
    });

    it("should allow access when API key is valid for POST (Create)", () => {
      const validApiKey = "test-api-key-create";
      configService.get.mockImplementation((key: string) => {
        if (key === "API_KEY_CREATE") return validApiKey;
        return undefined;
      });
      const context = createMockExecutionContext(validApiKey, "POST");

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith("API_KEY_CREATE");
    });

    it("should allow access when API key is valid for PUT (Update)", () => {
      const validApiKey = "test-api-key-update";
      configService.get.mockImplementation((key: string) => {
        if (key === "API_KEY_UPDATE") return validApiKey;
        return undefined;
      });
      const context = createMockExecutionContext(validApiKey, "PUT");

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith("API_KEY_UPDATE");
    });

    it("should allow access when API key is valid for DELETE", () => {
      const validApiKey = "test-api-key-delete";
      configService.get.mockImplementation((key: string) => {
        if (key === "API_KEY_DELETE") return validApiKey;
        return undefined;
      });
      const context = createMockExecutionContext(validApiKey, "DELETE");

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith("API_KEY_DELETE");
    });

    it("should throw UnauthorizedException when API key is missing", () => {
      configService.get.mockImplementation((key: string) => {
        if (key === "API_KEY_CREATE") return "test-api-key";
        return undefined;
      });
      const context = createMockExecutionContext(undefined, "POST");

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow("Invalid API key");
    });

    it("should throw UnauthorizedException when API key is invalid for POST", () => {
      configService.get.mockImplementation((key: string) => {
        if (key === "API_KEY_CREATE") return "valid-api-key-create";
        return undefined;
      });
      const context = createMockExecutionContext("invalid-api-key", "POST");

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow("Invalid API key");
    });

    it("should throw UnauthorizedException when API key is empty string", () => {
      configService.get.mockImplementation((key: string) => {
        if (key === "API_KEY_READ") return "test-api-key";
        return undefined;
      });
      const context = createMockExecutionContext("", "GET");

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow("Invalid API key");
    });

    it("should handle array API key header and use first value", () => {
      const validApiKey = "test-api-key-read";
      configService.get.mockImplementation((key: string) => {
        if (key === "API_KEY_READ") return validApiKey;
        return undefined;
      });

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              "x-api-key": [validApiKey, "other-value"],
            },
            method: "GET",
          }),
        }),
      } as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith("API_KEY_READ");
    });

    it("should use PATCH method for UPDATE API key", () => {
      const validApiKey = "test-api-key-update";
      configService.get.mockImplementation((key: string) => {
        if (key === "API_KEY_UPDATE") return validApiKey;
        return undefined;
      });
      const context = createMockExecutionContext(validApiKey, "PATCH");

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith("API_KEY_UPDATE");
    });

    it("should use generic API_KEY for non-CRUD methods like OPTIONS", () => {
      const validApiKey = "test-api-key-generic";
      configService.get.mockImplementation((key: string) => {
        if (key === "API_KEY") return validApiKey;
        return undefined;
      });
      const context = createMockExecutionContext(validApiKey, "OPTIONS");

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith("API_KEY");
    });
  });
});
