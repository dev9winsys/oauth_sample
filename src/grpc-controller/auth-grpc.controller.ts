import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { AuthService } from "src/service";
import {
  IssueTokenDto,
  RefreshTokenDto,
  TokenResponseDto,
  RecordLoginFailureDto,
  LoginFailureResponseDto,
} from "src/dto";
import { validateDto } from "./validation.helper";

interface IssueTokenRequest {
  user_id: string;
  services?: Array<{
    service_id: string;
    service_name: string;
    permissions: string[];
  }>;
  ip_address: string;
}

interface RefreshTokenRequest {
  token: string;
}

interface RecordLoginFailureRequest {
  user_id: string;
  ip_address: string;
}

@Controller()
export class AuthGrpcController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod("AuthService", "IssueToken")
  async issueToken(data: IssueTokenRequest): Promise<TokenResponseDto> {
    const issueTokenDto = new IssueTokenDto();
    issueTokenDto.user_id = data.user_id;
    if (data.services) {
      issueTokenDto.services = data.services.map((s) => ({
        service_id: s.service_id,
        service_name: s.service_name,
        permissions: s.permissions,
      }));
    }
    issueTokenDto.ip_address = data.ip_address;

    await validateDto(issueTokenDto);
    return this.authService.issueToken(issueTokenDto);
  }

  @GrpcMethod("AuthService", "RefreshToken")
  async refreshToken(data: RefreshTokenRequest): Promise<TokenResponseDto> {
    const refreshTokenDto = new RefreshTokenDto();
    refreshTokenDto.token = data.token;

    await validateDto(refreshTokenDto);
    return this.authService.refreshToken(refreshTokenDto);
  }

  @GrpcMethod("AuthService", "RecordLoginFailure")
  async recordLoginFailure(
    data: RecordLoginFailureRequest,
  ): Promise<LoginFailureResponseDto> {
    const recordLoginFailureDto = new RecordLoginFailureDto();
    recordLoginFailureDto.user_id = data.user_id;
    recordLoginFailureDto.ip_address = data.ip_address;

    await validateDto(recordLoginFailureDto);
    return this.authService.recordLoginFailure(recordLoginFailureDto);
  }
}
