import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { ServiceService } from "src/service/service.service";
import { ServiceRepository, UserRepository } from "src/database/repository";
import { Service, User } from "src/database/entity";

describe("ServiceService", () => {
  let serviceService: ServiceService;

  const mockServiceRepository = {
    insert: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceService,
        {
          provide: ServiceRepository,
          useValue: mockServiceRepository,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    serviceService = module.get<ServiceService>(ServiceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new service with provided service_end_at", async () => {
      const createServiceDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        service_name: "Test Service",
        service_start_at: new Date("2024-01-01"),
        service_end_at: new Date("2024-12-31"),
        home_url: "https://example.com",
      };

      const mockUser = {
        id: 1,
        user_id: "123e4567-e89b-12d3-a456-426614174000",
      } as User;

      const expectedService = {
        id: 1,
        service_id: "123e4567-e89b-12d3-a456-426614174001",
        user_id: 1, // Should use the internal serial ID
        service_name: createServiceDto.service_name,
        service_start_at: createServiceDto.service_start_at,
        service_end_at: createServiceDto.service_end_at,
        home_url: createServiceDto.home_url,
      } as unknown as Service;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockServiceRepository.insert.mockResolvedValue(expectedService);

      const result = await serviceService.create(createServiceDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        user_id: createServiceDto.user_id,
      });
      expect(mockServiceRepository.insert).toHaveBeenCalledWith({
        user_id: 1,
        service_name: createServiceDto.service_name,
        home_url: createServiceDto.home_url,
        service_start_at: createServiceDto.service_start_at,
        service_end_at: createServiceDto.service_end_at,
      });
      expect(result).toEqual(expectedService);
    });

    it("should create a new service with default service_end_at when not provided", async () => {
      const createServiceDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        service_name: "Test Service",
        service_start_at: new Date("2024-01-01"),
        home_url: "https://example.com",
      };

      const mockUser = {
        id: 1,
        user_id: "123e4567-e89b-12d3-a456-426614174000",
      } as User;

      const expectedService = {
        id: 1,
        service_id: "123e4567-e89b-12d3-a456-426614174001",
        user_id: 1,
        service_name: createServiceDto.service_name,
        home_url: createServiceDto.home_url,
        service_start_at: createServiceDto.service_start_at,
        service_end_at: new Date("9999-12-31"),
      } as unknown as Service;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockServiceRepository.insert.mockResolvedValue(expectedService);

      const result = await serviceService.create(createServiceDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        user_id: createServiceDto.user_id,
      });
      expect(mockServiceRepository.insert).toHaveBeenCalledWith({
        user_id: 1,
        service_name: createServiceDto.service_name,
        home_url: createServiceDto.home_url,
        service_start_at: createServiceDto.service_start_at,
        service_end_at: new Date("9999-12-31"),
      });
      expect(result).toEqual(expectedService);
    });
  });

  describe("update", () => {
    it("should update an existing service", async () => {
      const serviceId = "123e4567-e89b-12d3-a456-426614174001";
      const updateServiceDto = {
        service_name: "Updated Service",
        home_url: "https://updated.example.com",
      };

      const updatedService = {
        id: 1,
        service_id: serviceId,
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        service_name: "Updated Service",
        service_start_at: new Date("2024-01-01"),
        service_end_at: new Date("2024-12-31"),
        home_url: "https://updated.example.com",
      } as unknown as Service;

      mockServiceRepository.update.mockResolvedValue(updatedService);

      const result = await serviceService.update(serviceId, updateServiceDto);

      expect(mockServiceRepository.update).toHaveBeenCalledWith(
        { service_id: serviceId },
        updateServiceDto,
      );
      expect(result).toEqual(updatedService);
    });

    it("should throw NotFoundException when service not found", async () => {
      const serviceId = "123e4567-e89b-12d3-a456-426614174001";
      const updateServiceDto = {
        service_name: "Updated Service",
      };

      mockServiceRepository.update.mockResolvedValue(null);

      await expect(
        serviceService.update(serviceId, updateServiceDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        serviceService.update(serviceId, updateServiceDto),
      ).rejects.toThrow(`Service with ID ${serviceId} not found`);
    });
  });

  describe("softDelete", () => {
    it("should soft delete a service by updating service_end_at", async () => {
      const serviceId = "123e4567-e89b-12d3-a456-426614174001";
      const futureDate = new Date("2099-12-31");

      const existingService = {
        id: 1,
        service_id: serviceId,
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        service_name: "Test Service",
        service_start_at: new Date("2024-01-01"),
        service_end_at: futureDate,
        home_url: "https://example.com",
      } as unknown as Service;

      mockServiceRepository.findOne.mockResolvedValue(existingService);
      mockServiceRepository.update.mockResolvedValue(existingService);

      await serviceService.softDelete(serviceId);

      expect(mockServiceRepository.findOne).toHaveBeenCalledWith({
        service_id: serviceId,
      });
      expect(mockServiceRepository.update).toHaveBeenCalledWith(
        { service_id: serviceId },
        expect.objectContaining({
          service_end_at: expect.any(Date),
        }),
      );
    });

    it("should throw NotFoundException when service not found for deletion", async () => {
      const serviceId = "123e4567-e89b-12d3-a456-426614174001";

      mockServiceRepository.findOne.mockResolvedValue(null);

      await expect(serviceService.softDelete(serviceId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(serviceService.softDelete(serviceId)).rejects.toThrow(
        `Service with ID ${serviceId} not found`,
      );
    });

    it("should throw BadRequestException when service is already deleted", async () => {
      const serviceId = "123e4567-e89b-12d3-a456-426614174001";
      const pastDate = new Date("2024-01-01");

      const existingService = {
        id: 1,
        service_id: serviceId,
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        service_name: "Test Service",
        service_start_at: new Date("2023-01-01"),
        service_end_at: pastDate,
        home_url: "https://example.com",
      } as unknown as Service;

      mockServiceRepository.findOne.mockResolvedValue(existingService);

      await expect(serviceService.softDelete(serviceId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(serviceService.softDelete(serviceId)).rejects.toThrow(
        `Service with ID ${serviceId} is already deleted`,
      );
    });
  });
});
