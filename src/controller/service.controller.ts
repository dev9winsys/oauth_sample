import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
} from "@nestjs/swagger";
import { ServiceService } from "src/service";
import { CreateServiceDto, UpdateServiceDto } from "./dto";
import { Service } from "src/database/entity";
import { ApiKeyGuard } from "src/guard";

@ApiTags("services")
@ApiSecurity("X-API-Key")
@Controller("services")
@UseGuards(ApiKeyGuard)
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "新規サービスを作成",
    description: "システムで利用可能な新しいサービスを作成します。",
  })
  @ApiResponse({
    status: 201,
    description: "サービスが正常に作成されました",
    type: Service,
  })
  @ApiResponse({ status: 400, description: "不正なリクエストデータ" })
  @ApiResponse({ status: 401, description: "API Key認証エラー" })
  async create(@Body() createServiceDto: CreateServiceDto): Promise<Service> {
    return this.serviceService.create(createServiceDto);
  }

  @Put(":id")
  @ApiOperation({
    summary: "サービス情報を更新",
    description: "指定されたサービスIDのサービス情報を更新します。",
  })
  @ApiParam({ name: "id", description: "サービスID (UUID)", type: "string" })
  @ApiResponse({
    status: 200,
    description: "サービス情報が正常に更新されました",
    type: Service,
  })
  @ApiResponse({ status: 400, description: "不正なリクエストデータ" })
  @ApiResponse({ status: 401, description: "API Key認証エラー" })
  @ApiResponse({ status: 404, description: "サービスが見つかりません" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    return this.serviceService.update(id, updateServiceDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "サービスを論理削除",
    description: "指定されたサービスを論理削除（ソフトデリート）します。",
  })
  @ApiParam({ name: "id", description: "サービスID (UUID)", type: "string" })
  @ApiResponse({ status: 204, description: "サービスが正常に削除されました" })
  @ApiResponse({ status: 401, description: "API Key認証エラー" })
  @ApiResponse({ status: 404, description: "サービスが見つかりません" })
  async softDelete(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.serviceService.softDelete(id);
  }
}
