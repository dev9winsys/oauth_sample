import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKeyHeader = request.headers["x-api-key"];
    const apiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
    const method = request.method;

    // Determine which API key to check based on HTTP method (CRUD)
    let configuredApiKey: string | undefined;

    switch (method) {
      case "POST":
        // Create - fallback to generic API_KEY if not configured
        configuredApiKey =
          this.configService.get<string>("API_KEY_CREATE") ||
          this.configService.get<string>("API_KEY");
        break;
      case "GET":
        // Read - fallback to generic API_KEY if not configured
        configuredApiKey =
          this.configService.get<string>("API_KEY_READ") ||
          this.configService.get<string>("API_KEY");
        break;
      case "PUT":
      case "PATCH":
        // Update - fallback to generic API_KEY if not configured
        configuredApiKey =
          this.configService.get<string>("API_KEY_UPDATE") ||
          this.configService.get<string>("API_KEY");
        break;
      case "DELETE":
        // Delete - fallback to generic API_KEY if not configured
        configuredApiKey =
          this.configService.get<string>("API_KEY_DELETE") ||
          this.configService.get<string>("API_KEY");
        break;
      default:
        // For other methods (OPTIONS, HEAD, etc.), use generic API_KEY
        configuredApiKey = this.configService.get<string>("API_KEY");
    }

    if (!configuredApiKey) {
      // If no API key is configured at all, allow access (backward compatibility)
      return true;
    }

    if (!apiKey || apiKey !== configuredApiKey) {
      throw new UnauthorizedException("Invalid API key");
    }

    return true;
  }
}
