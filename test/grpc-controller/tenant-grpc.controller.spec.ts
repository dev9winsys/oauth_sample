import { Test, TestingModule } from "@nestjs/testing";
import { TenantGrpcController } from "src/grpc-controller/tenant-grpc.controller";
import { TenantService } from "src/service";
import { TenantResponseDto } from "src/controller/dto/tenant.dto";
import { RpcException } from "@nestjs/microservices";

describe("TenantGrpcController", () => {
  let controller: TenantGrpcController;
  let tenantService: jest.Mocked<TenantService>;

  beforeEach(async () => {
    const mockTenantService = {
      createTenant: jest.fn(),
      updateTenant: jest.fn(),
      deleteTenant: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantGrpcController],
      providers: [
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    controller = module.get<TenantGrpcController>(TenantGrpcController);
    tenantService = module.get(TenantService);
  });

  describe("createTenant", () => {
    it("should create a new tenant", async () => {
      const request = {
        name: "Test Tenant",
        tenant_start_at: "2024-01-01T00:00:00.000Z",
        tenant_end_at: "2025-12-31T23:59:59.999Z",
        auto_user_approval: true,
        data_retention_days: 90,
      };

      const mockTenant = {
        id: 1,
        tenant_id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Test Tenant",
      } as TenantResponseDto;

      tenantService.createTenant.mockResolvedValue(mockTenant);

      const result = await controller.createTenant(request);

      expect(tenantService.createTenant).toHaveBeenCalled();
      expect(result).toEqual(mockTenant);
    });

    it("should validate date format", async () => {
      const request = {
        name: "Test Tenant",
        tenant_start_at: "invalid-date",
        tenant_end_at: "2025-12-31T23:59:59.999Z",
      };

      await expect(controller.createTenant(request)).rejects.toThrow(
        RpcException,
      );
    });

    it("should validate end date is after start date", async () => {
      const request = {
        name: "Test Tenant",
        tenant_start_at: "2025-12-31T23:59:59.999Z",
        tenant_end_at: "2024-01-01T00:00:00.000Z",
      };

      await expect(controller.createTenant(request)).rejects.toThrow(
        RpcException,
      );
    });
  });

  describe("updateTenant", () => {
    it("should update a tenant", async () => {
      const request = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Updated Tenant",
      };

      const mockTenant = {
        id: 1,
        tenant_id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Updated Tenant",
      } as TenantResponseDto;

      tenantService.updateTenant.mockResolvedValue(mockTenant);

      const result = await controller.updateTenant(request);

      expect(tenantService.updateTenant).toHaveBeenCalled();
      expect(result).toEqual(mockTenant);
    });
  });

  describe("deleteTenant", () => {
    it("should delete a tenant", async () => {
      const request = {
        id: "123e4567-e89b-12d3-a456-426614174000",
      };

      const mockTenant = {
        id: 1,
        tenant_id: "123e4567-e89b-12d3-a456-426614174000",
        delete_flag: true,
      } as TenantResponseDto;

      tenantService.deleteTenant.mockResolvedValue(mockTenant);

      const result = await controller.deleteTenant(request);

      expect(tenantService.deleteTenant).toHaveBeenCalledWith(request.id);
      expect(result).toEqual(mockTenant);
    });
  });
});
