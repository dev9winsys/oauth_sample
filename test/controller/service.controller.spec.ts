import { Test, TestingModule } from "@nestjs/testing";
import { ServiceController } from "src/controller/service.controller";
import { ServiceService } from "src/service";
import { ApiKeyGuard } from "src/guard";

describe("ServiceController", () => {
  let serviceController: ServiceController;

  const mockServiceService = {
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceController],
      providers: [
        {
          provide: ServiceService,
          useValue: mockServiceService,
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    serviceController = module.get<ServiceController>(ServiceController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new service", async () => {
      const createServiceDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        service_name: "Test Service",
        service_start_at: new Date("2024-01-01"),
        service_end_at: new Date("2024-12-31"),
        home_url: "https://example.com",
      };

      const expectedService = {
        id: 1,
        service_id: "123e4567-e89b-12d3-a456-426614174001",
        ...createServiceDto,
      } as any;

      mockServiceService.create.mockResolvedValue(expectedService);

      const result = await serviceController.create(createServiceDto);

      expect(mockServiceService.create).toHaveBeenCalledWith(createServiceDto);
      expect(result).toEqual(expectedService);
    });
  });

  describe("update", () => {
    it("should update an existing service", async () => {
      const serviceId = "123e4567-e89b-12d3-a456-426614174001";
      const updateServiceDto = {
        service_name: "Updated Service",
      };

      const updatedService = {
        id: 1,
        service_id: serviceId,
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        service_name: "Updated Service",
        service_start_at: new Date("2024-01-01"),
        service_end_at: new Date("2024-12-31"),
        home_url: "https://example.com",
      } as any;

      mockServiceService.update.mockResolvedValue(updatedService);

      const result = await serviceController.update(
        serviceId,
        updateServiceDto,
      );

      expect(mockServiceService.update).toHaveBeenCalledWith(
        serviceId,
        updateServiceDto,
      );
      expect(result).toEqual(updatedService);
    });
  });

  describe("softDelete", () => {
    it("should soft delete a service", async () => {
      const serviceId = "123e4567-e89b-12d3-a456-426614174001";

      mockServiceService.softDelete.mockResolvedValue(undefined);

      await serviceController.softDelete(serviceId);

      expect(mockServiceService.softDelete).toHaveBeenCalledWith(serviceId);
    });
  });
});
