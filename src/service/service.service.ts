import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { ServiceRepository, UserRepository } from "src/database/repository";
import { Service } from "src/database/entity";
import { CreateServiceDto, UpdateServiceDto } from "src/controller/dto";

// Default service end date - far future date
const DEFAULT_SERVICE_END_DATE = "9999-12-31";

@Injectable()
export class ServiceService {
  constructor(
    private readonly serviceRepository: ServiceRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    // Look up user by user_id (UUID) to get internal id
    const user = await this.userRepository.findOne({
      user_id: createServiceDto.user_id,
    });
    if (!user) {
      throw new NotFoundException(
        `User with ID ${createServiceDto.user_id} not found`,
      );
    }

    // Set default service_end_at to 9999-12-31 if not provided
    const serviceData = {
      user_id: user.id, // Use internal id
      service_name: createServiceDto.service_name,
      home_url: createServiceDto.home_url,
      service_start_at: createServiceDto.service_start_at,
      service_end_at:
        createServiceDto.service_end_at || new Date(DEFAULT_SERVICE_END_DATE),
    };
    return this.serviceRepository.insert(serviceData);
  }

  async update(
    serviceId: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    const service = await this.serviceRepository.update(
      { service_id: serviceId as any },
      updateServiceDto,
    );

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    return service;
  }

  async softDelete(serviceId: string): Promise<void> {
    // First, find the service to check if it exists and is not already deleted
    const existingService = await this.serviceRepository.findOne({
      service_id: serviceId as any,
    });

    if (!existingService) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    // Check if the service is already soft deleted
    if (
      existingService.service_end_at &&
      existingService.service_end_at <= new Date()
    ) {
      throw new BadRequestException(
        `Service with ID ${serviceId} is already deleted`,
      );
    }

    const service = await this.serviceRepository.update(
      { service_id: serviceId as any },
      { service_end_at: new Date() },
    );

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }
  }
}
