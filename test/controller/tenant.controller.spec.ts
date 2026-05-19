import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { TenantController } from "src/controller/tenant.controller";
import { TenantService } from "src/service/tenant.service";
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantResponseDto,
} from "src/controller/dto/tenant.dto";
import { ApiKeyGuard } from "src/guard";

describe("TenantController", () => {
  let controller: TenantController;
  let service: TenantService;

  beforeEach(async () => {
    const mockTenantService = {
      createTenant: jest.fn(),
      updateTenant: jest.fn(),
      deleteTenant: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TenantController>(TenantController);
    service = module.get<TenantService>(TenantService);
  });

  describe("createTenant", () => {
    it("should create a new tenant", async () => {
      const createTenantDto: CreateTenantDto = {
        name: "Test Tenant",
        tenant_start_at: new Date("2024-01-01"),
        tenant_end_at: new Date("2024-12-31"),
      };

      const expectedResponse: TenantResponseDto = {
        id: 1,
        tenant_id: "123e4567-e89b-12d3-a456-426614174001",
        name: "Test Tenant",
        tenant_start_at: new Date("2024-01-01"),
        tenant_end_at: new Date("2024-12-31"),
        delete_flag: false,
        auto_user_approval: false,
        data_retention_days: 365,
        image_url: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, "createTenant").mockResolvedValue(expectedResponse);

      const result = await controller.createTenant(createTenantDto);

      expect(service.createTenant).toHaveBeenCalledWith(createTenantDto);
      expect(result).toEqual(expectedResponse);
    });

    it("should propagate errors from service", async () => {
      const createTenantDto: CreateTenantDto = {
        name: "Test Tenant",
        tenant_start_at: new Date("2024-01-01"),
        tenant_end_at: new Date("2024-12-31"),
      };

      jest
        .spyOn(service, "createTenant")
        .mockRejectedValue(new Error("Database error"));

      await expect(controller.createTenant(createTenantDto)).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("updateTenant", () => {
    it("should update an existing tenant", async () => {
      const tenantId = "123e4567-e89b-12d3-a456-426614174001";
      const updateTenantDto: UpdateTenantDto = {
        name: "Updated Tenant",
      };

      const expectedResponse: TenantResponseDto = {
        id: 1,
        tenant_id: tenantId,
        name: "Updated Tenant",
        tenant_start_at: new Date("2024-01-01"),
        tenant_end_at: new Date("2024-12-31"),
        delete_flag: false,
        auto_user_approval: false,
        data_retention_days: 365,
        image_url: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, "updateTenant").mockResolvedValue(expectedResponse);

      const result = await controller.updateTenant(tenantId, updateTenantDto);

      expect(service.updateTenant).toHaveBeenCalledWith(
        tenantId,
        updateTenantDto,
      );
      expect(result).toEqual(expectedResponse);
    });

    it("should propagate NotFoundException when tenant is not found", async () => {
      const tenantId = "123e4567-e89b-12d3-a456-426614174001";
      const updateTenantDto: UpdateTenantDto = {
        name: "Updated Tenant",
      };

      jest
        .spyOn(service, "updateTenant")
        .mockRejectedValue(
          new NotFoundException(`Tenant with ID ${tenantId} not found`),
        );

      await expect(
        controller.updateTenant(tenantId, updateTenantDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.updateTenant(tenantId, updateTenantDto),
      ).rejects.toThrow(`Tenant with ID ${tenantId} not found`);
    });
  });

  describe("deleteTenant", () => {
    it("should delete a tenant and its associated users", async () => {
      const tenantId = "123e4567-e89b-12d3-a456-426614174001";

      const expectedResponse: TenantResponseDto = {
        id: 1,
        tenant_id: tenantId,
        name: "Test Tenant",
        tenant_start_at: new Date("2024-01-01"),
        tenant_end_at: new Date("2024-12-31"),
        delete_flag: true,
        auto_user_approval: false,
        data_retention_days: 365,
        image_url: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, "deleteTenant").mockResolvedValue(expectedResponse);

      const result = await controller.deleteTenant(tenantId);

      expect(service.deleteTenant).toHaveBeenCalledWith(tenantId);
      expect(result).toEqual(expectedResponse);
    });

    it("should propagate NotFoundException when tenant is not found", async () => {
      const tenantId = "123e4567-e89b-12d3-a456-426614174001";

      jest
        .spyOn(service, "deleteTenant")
        .mockRejectedValue(
          new NotFoundException(`Tenant with ID ${tenantId} not found`),
        );

      await expect(controller.deleteTenant(tenantId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.deleteTenant(tenantId)).rejects.toThrow(
        `Tenant with ID ${tenantId} not found`,
      );
    });
  });
});
