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
import { UserBlockService } from "src/service";
import { BlockUserDto, UnblockUserDto, UserResponseDto } from "src/dto";
import { ApiKeyGuard } from "src/guard";

@ApiTags("user-block")
@ApiSecurity("X-API-Key")
@Controller("user-block")
@UseGuards(ApiKeyGuard)
export class UserBlockController {
  constructor(private readonly userBlockService: UserBlockService) {}

  /**
   * Block a user
   * @param blockUserDto - Block user data
   * @returns Updated user with block applied
   */
  @Post("block")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "ユーザーをブロック",
    description:
      "ユーザーをブロックします。ブロック種類と解除日を指定できます。",
  })
  @ApiResponse({
    status: 200,
    description: "ユーザーが正常にブロックされました",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: "不正なリクエストデータ" })
  @ApiResponse({ status: 401, description: "API Key認証エラー" })
  @ApiResponse({ status: 404, description: "ユーザーが見つかりません" })
  async blockUser(
    @Body() blockUserDto: BlockUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userBlockService.blockUser(blockUserDto);
    return UserResponseDto.fromEntity(user);
  }

  /**
   * Unblock a user immediately
   * @param unblockUserDto - Unblock user data
   * @returns Updated user with block removed
   */
  @Post("unblock")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "ユーザーのブロックを即座に解除",
    description: "現在ブロックされているユーザーのブロックを即座に解除します。",
  })
  @ApiResponse({
    status: 200,
    description: "ユーザーのブロックが正常に解除されました",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: "不正なリクエストデータ" })
  @ApiResponse({ status: 401, description: "API Key認証エラー" })
  @ApiResponse({ status: 404, description: "ユーザーが見つかりません" })
  async unblockUser(
    @Body() unblockUserDto: UnblockUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userBlockService.unblockUser(unblockUserDto);
    return UserResponseDto.fromEntity(user);
  }
}
