import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from "@nestjs/swagger";
import { AppService } from "src/service";
import { ApiKeyGuard } from "src/guard";

@ApiTags("app")
@ApiSecurity("X-API-Key")
@Controller()
@UseGuards(ApiKeyGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: "ヘルスチェック",
    description: "APIの稼働状況を確認します。",
  })
  @ApiResponse({
    status: 200,
    description: "APIが正常に稼働しています",
    schema: {
      type: "string",
      example: "Hello World!",
    },
  })
  @ApiResponse({ status: 401, description: "API Key認証エラー" })
  getHello(): string {
    return this.appService.getHello();
  }
}
