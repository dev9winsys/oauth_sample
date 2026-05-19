import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { ServiceService } from "src/service";
import { CreateServiceDto, UpdateServiceDto } from "src/controller/dto";
import { Service } from "src/database/entity";
import { validateDto, validateAndParseDate } from "./validation.helper";

interface CreateServiceRequest {
  user_id: string;
  service_name: string;
  home_url: string;
  service_start_at: string;
  service_end_at?: string;
}

interface UpdateServiceRequest {
  id: string;
  service_name?: string;
  home_url?: string;
  service_start_at?: string;
}

interface SoftDeleteServiceRequest {
  id: string;
}

@Controller()
export class ServiceGrpcController {
  constructor(private readonly serviceService: ServiceService) {}

  @GrpcMethod("ServiceService", "CreateService")
  async createService(data: CreateServiceRequest): Promise<Service> {
    const createServiceDto = new CreateServiceDto();
    createServiceDto.user_id = data.user_id;
    createServiceDto.service_name = data.service_name;
    createServiceDto.home_url = data.home_url;
    createServiceDto.service_start_at = validateAndParseDate(
      data.service_start_at,
      "service_start_at",
    );
    if (data.service_end_at) {
      createServiceDto.service_end_at = validateAndParseDate(
        data.service_end_at,
        "service_end_at",
      );
    }

    await validateDto(createServiceDto);
    return this.serviceService.create(createServiceDto);
  }

  @GrpcMethod("ServiceService", "UpdateService")
  async updateService(data: UpdateServiceRequest): Promise<Service> {
    const updateServiceDto = new UpdateServiceDto();
    if (data.service_name) updateServiceDto.service_name = data.service_name;
    if (data.home_url) updateServiceDto.home_url = data.home_url;
    if (data.service_start_at)
      updateServiceDto.service_start_at = validateAndParseDate(
        data.service_start_at,
        "service_start_at",
      );

    await validateDto(updateServiceDto);
    return this.serviceService.update(data.id, updateServiceDto);
  }

  @GrpcMethod("ServiceService", "SoftDeleteService")
  async softDeleteService(data: SoftDeleteServiceRequest): Promise<object> {
    await this.serviceService.softDelete(data.id);
    return {};
  }
}
