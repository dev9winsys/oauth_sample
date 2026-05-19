import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Service } from "src/database/entity/service.entity";
import { ServiceRepository } from "src/database/repository/service.repository";

describe("ServiceRepository", () => {
  let serviceRepository: ServiceRepository;
  let mockRepository: Partial<Repository<Service>>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      merge: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceRepository,
        {
          provide: getRepositoryToken(Service),
          useValue: mockRepository,
        },
      ],
    }).compile();

    serviceRepository = module.get<ServiceRepository>(ServiceRepository);
  });

  describe("insert", () => {
    it("should insert a single service", async () => {
      const serviceData = {
        user_id: 1, // Changed from UUID string to serial ID number
        service_name: "Test Service",
        service_start_at: new Date(),
        service_end_at: new Date(),
      };
      const createdService = {
        ...serviceData,
        id: 1,
        service_id: "123e4567-e89b-12d3-a456-426614174001",
      } as unknown as Service;

      mockRepository.create = jest.fn().mockReturnValue(createdService);
      mockRepository.save = jest.fn().mockResolvedValue(createdService);

      const result = await serviceRepository.insert(serviceData);

      expect(mockRepository.create).toHaveBeenCalledWith(serviceData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdService);
      expect(result).toEqual(createdService);
    });
  });

  describe("update", () => {
    it("should update an existing service", async () => {
      const serviceId = "123e4567-e89b-12d3-a456-426614174001";
      const existingService = {
        id: 1,
        service_id: serviceId,
        service_name: "Old Service",
      } as unknown as Service;
      const updateData = { service_name: "New Service" };
      const updatedService = { ...existingService, ...updateData } as Service;

      mockRepository.findOne = jest.fn().mockResolvedValue(existingService);
      mockRepository.merge = jest.fn().mockReturnValue(updatedService);
      mockRepository.save = jest.fn().mockResolvedValue(updatedService);

      const result = await serviceRepository.update(
        { service_id: serviceId as any },
        updateData,
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { service_id: serviceId },
      });
      expect(mockRepository.merge).toHaveBeenCalledWith(
        existingService,
        updateData,
      );
      expect(mockRepository.save).toHaveBeenCalledWith(updatedService);
      expect(result).toEqual(updatedService);
    });
  });

  describe("delete", () => {
    it("should delete an existing service", async () => {
      const serviceId = "123e4567-e89b-12d3-a456-426614174001";
      mockRepository.delete = jest.fn().mockResolvedValue({ affected: 1 });

      const result = await serviceRepository.delete({
        service_id: serviceId as any,
      });

      expect(mockRepository.delete).toHaveBeenCalledWith({
        service_id: serviceId,
      });
      expect(result).toBe(true);
    });
  });

  describe("multiInsert", () => {
    it("should insert multiple services", async () => {
      const servicesData = [
        {
          user_id: 1, // Changed from UUID string to serial ID number
          service_name: "Service 1",
          service_start_at: new Date(),
          service_end_at: new Date(),
        },
        {
          user_id: 1, // Changed from UUID string to serial ID number
          service_name: "Service 2",
          service_start_at: new Date(),
          service_end_at: new Date(),
        },
      ];
      const createdServices = [
        {
          ...servicesData[0],
          id: 1,
          service_id: "123e4567-e89b-12d3-a456-426614174001",
        },
        {
          ...servicesData[1],
          id: 2,
          service_id: "123e4567-e89b-12d3-a456-426614174002",
        },
      ] as unknown as Service[];

      mockRepository.create = jest.fn().mockReturnValue(createdServices);
      mockRepository.save = jest.fn().mockResolvedValue(createdServices);

      const result = await serviceRepository.multiInsert(servicesData);

      expect(mockRepository.create).toHaveBeenCalledWith(servicesData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdServices);
      expect(result).toEqual(createdServices);
    });
  });
});
