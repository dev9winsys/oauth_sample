import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from "@nestjs/swagger";
import { AuthService } from "src/service";
import {
  IssueTokenDto,
  RefreshTokenDto,
  TokenResponseDto,
  RecordLoginFailureDto,
  LoginFailureResponseDto,
} from "src/dto";
import { ApiKeyGuard } from "src/guard";

@ApiTags("auth")
@ApiSecurity("X-API-Key")
@Controller("auth")
@UseGuards(ApiKeyGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Issue a new JWT token
   * @param issueTokenDto - Token issuance data with user_id, services, and ip_address
   * @returns JWT token response
   */
  @Post("token")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "JWTトークンを発行",
    description:
      "ユーザーID、テナントID、サービス情報、権限を基にJWTトークンを新規発行します。",
  })
  @ApiResponse({
    status: 201,
    description: "トークンが正常に発行されました",
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 400, description: "不正なリクエストデータ" })
  @ApiResponse({ status: 401, description: "API Key認証エラー" })
  async issueToken(
    @Body() issueTokenDto: IssueTokenDto,
  ): Promise<TokenResponseDto> {
    return this.authService.issueToken(issueTokenDto);
  }

  /**
   * Refresh an existing JWT token
   * @param refreshTokenDto - Current token to refresh
   * @returns New JWT token response
   */
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "JWTトークンをリフレッシュ",
    description: "既存のJWTトークンを検証し、新しいトークンを発行します。",
  })
  @ApiResponse({
    status: 200,
    description: "トークンが正常にリフレッシュされました",
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 400, description: "不正なリクエストデータ" })
  @ApiResponse({ status: 401, description: "トークンが無効または期限切れです" })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponseDto> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * Record a login failure
   * @param recordLoginFailureDto - Login failure data with user_id and ip_address
   * @returns Login failure response with failure count and message
   */
  @Post("login-failure")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "ログイン失敗を記録",
    description:
      "ログイン失敗を記録し、失敗回数を更新します。5回失敗するとアカウントがブロックされます。",
  })
  @ApiResponse({
    status: 200,
    description: "ログイン失敗が記録されました",
    type: LoginFailureResponseDto,
  })
  @ApiResponse({ status: 400, description: "不正なリクエストデータ" })
  @ApiResponse({ status: 401, description: "API Key認証エラー" })
  @ApiResponse({ status: 404, description: "ユーザーが見つかりません" })
  async recordLoginFailure(
    @Body() recordLoginFailureDto: RecordLoginFailureDto,
  ): Promise<LoginFailureResponseDto> {
    return this.authService.recordLoginFailure(recordLoginFailureDto);
  }
}
