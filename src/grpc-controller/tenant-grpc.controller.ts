import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { TenantService } from "src/service";
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantResponseDto,
} from "src/controller/dto/tenant.dto";
import { validateDto, validateAndParseDate } from "./validation.helper";

interface CreateTenantRequest {
  name: string;
  tenant_start_at: string;
  tenant_end_at: string;
  auto_user_approval?: boolean;
  data_retention_days?: number;
  image_url?: string;
}

interface UpdateTenantRequest {
  id: string;
  name?: string;
  tenant_start_at?: string;
  tenant_end_at?: string;
  auto_user_approval?: boolean;
  data_retention_days?: number;
  image_url?: string;
}

interface DeleteTenantRequest {
  id: string;
}

@Controller()
export class TenantGrpcController {
  constructor(private readonly tenantService: TenantService) {}

  @GrpcMethod("TenantService", "CreateTenant")
  async createTenant(data: CreateTenantRequest): Promise<TenantResponseDto> {
    const createTenantDto = new CreateTenantDto();
    createTenantDto.name = data.name;
    // Validate date strings are valid, but keep them as strings for DTO validation
    validateAndParseDate(data.tenant_start_at, "tenant_start_at");
    validateAndParseDate(data.tenant_end_at, "tenant_end_at");
    createTenantDto.tenant_start_at = data.tenant_start_at as any;
    createTenantDto.tenant_end_at = data.tenant_end_at as any;
    if (data.auto_user_approval !== undefined) {
      createTenantDto.auto_user_approval = data.auto_user_approval;
    }
    if (data.data_retention_days !== undefined) {
      createTenantDto.data_retention_days = data.data_retention_days;
    }
    if (data.image_url) {
      createTenantDto.image_url = data.image_url;
    }

    await validateDto(createTenantDto);
    return this.tenantService.createTenant(createTenantDto);
  }

  @GrpcMethod("TenantService", "UpdateTenant")
  async updateTenant(data: UpdateTenantRequest): Promise<TenantResponseDto> {
    const updateTenantDto = new UpdateTenantDto();
    if (data.name) updateTenantDto.name = data.name;
    if (data.tenant_start_at) {
      // Validate date string is valid, but keep it as string for DTO validation
      validateAndParseDate(data.tenant_start_at, "tenant_start_at");
      updateTenantDto.tenant_start_at = data.tenant_start_at as any;
    }
    if (data.tenant_end_at) {
      // Validate date string is valid, but keep it as string for DTO validation
      validateAndParseDate(data.tenant_end_at, "tenant_end_at");
      updateTenantDto.tenant_end_at = data.tenant_end_at as any;
    }
    if (data.auto_user_approval !== undefined)
      updateTenantDto.auto_user_approval = data.auto_user_approval;
    if (data.data_retention_days !== undefined)
      updateTenantDto.data_retention_days = data.data_retention_days;
    if (data.image_url) updateTenantDto.image_url = data.image_url;

    await validateDto(updateTenantDto);
    return this.tenantService.updateTenant(data.id, updateTenantDto);
  }

  @GrpcMethod("TenantService", "DeleteTenant")
  async deleteTenant(data: DeleteTenantRequest): Promise<TenantResponseDto> {
    return this.tenantService.deleteTenant(data.id);
  }
}
