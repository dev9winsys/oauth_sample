import {
  Controller,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  BadRequestException,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiSecurity,
} from "@nestjs/swagger";
import { UserService } from "src/service";
import { EmailVerificationService } from "src/service";
import { UpdateUserDto, CreateUserDto, UserResponseDto } from "src/dto";
import { ApiKeyGuard } from "src/guard";

@ApiTags("users")
@ApiSecurity("X-API-Key")
@Controller("users")
@UseGuards(ApiKeyGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  /**
   * Create a new user
   * @param createUserDto - User data to create
   * @returns Created user without sensitive fields
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "新規ユーザーを作成",
    description:
      "テナントに紐づく新しいユーザーを作成します。メール検証トークンが送信されます。",
  })
  @ApiResponse({
    status: 201,
    description: "ユーザーが正常に作成されました",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: "不正なリクエストデータ" })
  @ApiResponse({ status: 401, description: "API Key認証エラー" })
  @ApiResponse({
    status: 409,
    description: "メールアドレスが既に使用されています",
  })
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.createUser(createUserDto);
    return UserResponseDto.fromEntity(user);
  }

  /**
   * Update user information
   * @param id - User ID
   * @param updateUserDto - User data to update
   * @returns Updated user without sensitive fields
   */
  @Put(":id")
  @ApiOperation({
    summary: "ユーザー情報を更新",
    description: "指定されたユーザーIDのユーザー情報を更新します。",
  })
  @ApiParam({ name: "id", description: "ユーザーID (UUID)", type: "string" })
  @ApiResponse({
    status: 200,
    description: "ユーザー情報が正常に更新されました",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: "不正なリクエストデータ" })
  @ApiResponse({ status: 401, description: "API Key認証エラー" })
  @ApiResponse({ status: 404, description: "ユーザーが見つかりません" })
  async updateUser(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.updateUser(id, updateUserDto);
    return UserResponseDto.fromEntity(user);
  }

  /**
   * Soft delete user
   * @param id - User ID
   * @returns Soft deleted user without sensitive fields
   */
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "ユーザーを論理削除",
    description: "指定されたユーザーを論理削除（ソフトデリート）します。",
  })
  @ApiParam({ name: "id", description: "ユーザーID (UUID)", type: "string" })
  @ApiResponse({
    status: 200,
    description: "ユーザーが正常に削除されました",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: "API Key認証エラー" })
  @ApiResponse({ status: 404, description: "ユーザーが見つかりません" })
  async softDeleteUser(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    const user = await this.userService.softDeleteUser(id);
    return UserResponseDto.fromEntity(user);
  }

  /**
   * Verify email using verification token
   * @param token - Email verification token
   * @returns User with verified email
   */
  @Get("verify-email")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "メールアドレスを検証",
    description: "検証トークンを使用してユーザーのメールアドレスを検証します。",
  })
  @ApiQuery({
    name: "token",
    description: "メール検証トークン",
    type: "string",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "メールアドレスが正常に検証されました",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: "検証トークンが必要です" })
  @ApiResponse({ status: 401, description: "API Key認証エラー" })
  @ApiResponse({
    status: 404,
    description: "無効なトークンまたはユーザーが見つかりません",
  })
  async verifyEmail(@Query("token") token: string): Promise<UserResponseDto> {
    if (!token || token.trim() === "") {
      throw new BadRequestException("Verification token is required");
    }
    const user = await this.emailVerificationService.verifyEmail(token);
    return UserResponseDto.fromEntity(user);
  }
}
