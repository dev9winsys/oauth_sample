import { Test, TestingModule } from "@nestjs/testing";
import { ServiceGrpcController } from "src/grpc-controller/service-grpc.controller";
import { ServiceService } from "src/service";
import { Service } from "src/database/entity";
import { RpcException } from "@nestjs/microservices";

describe("ServiceGrpcController", () => {
  let controller: ServiceGrpcController;
  let serviceService: jest.Mocked<ServiceService>;

  beforeEach(async () => {
    const mockServiceService = {
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceGrpcController],
      providers: [
        {
          provide: ServiceService,
          useValue: mockServiceService,
        },
      ],
    }).compile();

    controller = module.get<ServiceGrpcController>(ServiceGrpcController);
    serviceService = module.get(ServiceService);
  });

  describe("createService", () => {
    it("should create a new service", async () => {
      const request = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        service_name: "Test Service",
        home_url: "https://example.com",
        service_start_at: "2024-01-01T00:00:00.000Z",
      };

      const mockService = {
        id: 1,
        service_id: "service-uuid",
        service_name: "Test Service",
      } as Service;

      serviceService.create.mockResolvedValue(mockService);

      const result = await controller.createService(request);

      expect(serviceService.create).toHaveBeenCalled();
      expect(result).toEqual(mockService);
    });

    it("should validate date format", async () => {
      const request = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        service_name: "Test Service",
        home_url: "https://example.com",
        service_start_at: "invalid-date",
      };

      await expect(controller.createService(request)).rejects.toThrow(
        RpcException,
      );
    });

    it("should validate URL format", async () => {
      const request = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        service_name: "Test Service",
        home_url: "not-a-url",
        service_start_at: "2024-01-01T00:00:00.000Z",
      };

      await expect(controller.createService(request)).rejects.toThrow(
        RpcException,
      );
    });
  });

  describe("updateService", () => {
    it("should update a service", async () => {
      const request = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        service_name: "Updated Service",
      };

      const mockService = {
        id: 1,
        service_name: "Updated Service",
      } as Service;

      serviceService.update.mockResolvedValue(mockService);

      const result = await controller.updateService(request);

      expect(serviceService.update).toHaveBeenCalled();
      expect(result).toEqual(mockService);
    });
  });

  describe("softDeleteService", () => {
    it("should soft delete a service", async () => {
      const request = {
        id: "123e4567-e89b-12d3-a456-426614174000",
      };

      serviceService.softDelete.mockResolvedValue(undefined);

      const result = await controller.softDeleteService(request);

      expect(serviceService.softDelete).toHaveBeenCalledWith(request.id);
      expect(result).toEqual({});
    });
  });
});
