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
import { TenantService } from "src/service/tenant.service";
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantResponseDto,
} from "./dto/tenant.dto";
import { ApiKeyGuard } from "src/guard";

@ApiTags("tenant")
@ApiSecurity("X-API-Key")
@Controller("tenant")
@UseGuards(ApiKeyGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  /**
   * Register a new tenant
   * @param createTenantDto - Tenant creation data
   * @returns Created tenant
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "新規テナントを登録",
    description:
      "新しいテナントを登録します。テナントは組織やグループを表します。",
  })
  @ApiResponse({
    status: 201,
    description: "テナントが正常に作成されました",
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 400, description: "不正なリクエストデータ" })
  @ApiResponse({ status: 401, description: "API Key認証エラー" })
  async createTenant(
    @Body() createTenantDto: CreateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantService.createTenant(createTenantDto);
  }

  /**
   * Update an existing tenant
   * @param id - Tenant ID
   * @param updateTenantDto - Tenant update data
   * @returns Updated tenant
   */
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "テナント情報を更新",
    description: "指定されたテナントIDのテナント情報を更新します。",
  })
  @ApiParam({ name: "id", description: "テナントID (UUID)", type: "string" })
  @ApiResponse({
    status: 200,
    description: "テナント情報が正常に更新されました",
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 400, description: "不正なリクエストデータ" })
  @ApiResponse({ status: 401, description: "API Key認証エラー" })
  @ApiResponse({ status: 404, description: "テナントが見つかりません" })
  async updateTenant(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantService.updateTenant(id, updateTenantDto);
  }

  /**
   * Delete a tenant (soft delete) and soft delete all associated users
   * @param id - Tenant ID
   * @returns Deleted tenant
   */
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "テナントを論理削除",
    description:
      "指定されたテナントとそれに関連する全てのユーザーを論理削除します。",
  })
  @ApiParam({ name: "id", description: "テナントID (UUID)", type: "string" })
  @ApiResponse({
    status: 200,
    description: "テナントが正常に削除されました",
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 401, description: "API Key認証エラー" })
  @ApiResponse({ status: 404, description: "テナントが見つかりません" })
  async deleteTenant(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<TenantResponseDto> {
    return this.tenantService.deleteTenant(id);
  }
}
