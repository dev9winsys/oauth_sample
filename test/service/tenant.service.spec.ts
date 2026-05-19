import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { getDataSourceToken } from "@nestjs/typeorm";
import { TenantService } from "src/service/tenant.service";
import { TenantRepository } from "src/database/repository/tenant.repository";
import {
  CreateTenantDto,
  UpdateTenantDto,
} from "src/controller/dto/tenant.dto";
import { Tenant } from "src/database/entity/tenant.entity";

describe("TenantService", () => {
  let service: TenantService;
  let tenantRepository: TenantRepository;
  let dataSource: any;

  beforeEach(async () => {
    const mockTenantRepository = {
      insert: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      repository: {
        update: jest.fn(),
      },
    };

    const mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: TenantRepository,
          useValue: mockTenantRepository,
        },
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    tenantRepository = module.get<TenantRepository>(TenantRepository);
    dataSource = module.get(getDataSourceToken());
  });

  describe("createTenant", () => {
    it("should create a new tenant", async () => {
      const createTenantDto: CreateTenantDto = {
        name: "Test Tenant",
        tenant_start_at: new Date("2024-01-01"),
        tenant_end_at: new Date("2024-12-31"),
      };

      const createdTenant = {
        id: 1,
        tenant_id: "123e4567-e89b-12d3-a456-426614174001",
        ...createTenantDto,
        delete_flag: false,
        auto_user_approval: false,
        data_retention_days: 365,
        image_url: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Tenant;

      jest.spyOn(tenantRepository, "insert").mockResolvedValue(createdTenant);

      const result = await service.createTenant(createTenantDto);

      expect(tenantRepository.insert).toHaveBeenCalledWith(createTenantDto);
      expect(result).toEqual({
        id: createdTenant.id,
        tenant_id: createdTenant.tenant_id,
        name: createdTenant.name,
        tenant_start_at: createdTenant.tenant_start_at,
        tenant_end_at: createdTenant.tenant_end_at,
        delete_flag: createdTenant.delete_flag,
        auto_user_approval: createdTenant.auto_user_approval,
        data_retention_days: createdTenant.data_retention_days,
        image_url: createdTenant.image_url,
        createdAt: createdTenant.createdAt,
        updatedAt: createdTenant.updatedAt,
      });
    });

    it("should create a tenant with custom configuration fields", async () => {
      const createTenantDto: CreateTenantDto = {
        name: "Test Tenant",
        tenant_start_at: new Date("2024-01-01"),
        tenant_end_at: new Date("2024-12-31"),
        auto_user_approval: false,
        data_retention_days: 90,
        image_url: "https://example.com/logo.png",
      };

      const createdTenant = {
        id: 1,
        tenant_id: "123e4567-e89b-12d3-a456-426614174001",
        ...createTenantDto,
        delete_flag: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Tenant;

      jest.spyOn(tenantRepository, "insert").mockResolvedValue(createdTenant);

      const result = await service.createTenant(createTenantDto);

      expect(tenantRepository.insert).toHaveBeenCalledWith(createTenantDto);
      expect(result.auto_user_approval).toBe(false);
      expect(result.data_retention_days).toBe(90);
      expect(result.image_url).toBe("https://example.com/logo.png");
    });
  });

  describe("updateTenant", () => {
    it("should update an existing tenant", async () => {
      const tenantId = "123e4567-e89b-12d3-a456-426614174001";
      const updateTenantDto: UpdateTenantDto = {
        name: "Updated Tenant",
      };

      const updatedTenant = {
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
      } as unknown as Tenant;

      jest.spyOn(tenantRepository, "update").mockResolvedValue(updatedTenant);

      const result = await service.updateTenant(tenantId, updateTenantDto);

      expect(tenantRepository.update).toHaveBeenCalledWith(
        { tenant_id: tenantId },
        updateTenantDto,
      );
      expect(result).toEqual({
        id: updatedTenant.id,
        tenant_id: updatedTenant.tenant_id,
        name: updatedTenant.name,
        tenant_start_at: updatedTenant.tenant_start_at,
        tenant_end_at: updatedTenant.tenant_end_at,
        delete_flag: updatedTenant.delete_flag,
        auto_user_approval: updatedTenant.auto_user_approval,
        data_retention_days: updatedTenant.data_retention_days,
        image_url: updatedTenant.image_url,
        createdAt: updatedTenant.createdAt,
        updatedAt: updatedTenant.updatedAt,
      });
    });

    it("should throw NotFoundException when tenant is not found", async () => {
      const tenantId = "123e4567-e89b-12d3-a456-426614174001";
      const updateTenantDto: UpdateTenantDto = {
        name: "Updated Tenant",
      };

      jest.spyOn(tenantRepository, "update").mockResolvedValue(null);

      await expect(
        service.updateTenant(tenantId, updateTenantDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateTenant(tenantId, updateTenantDto),
      ).rejects.toThrow(`Tenant with ID ${tenantId} not found`);
    });
  });

  describe("deleteTenant", () => {
    it("should soft delete a tenant and its associated users using a transaction", async () => {
      const tenantId = "123e4567-e89b-12d3-a456-426614174001";

      const tenant = {
        id: 1,
        tenant_id: tenantId,
        name: "Test Tenant",
        tenant_start_at: new Date("2024-01-01"),
        tenant_end_at: new Date("2024-12-31"),
        delete_flag: false,
        auto_user_approval: false,
        data_retention_days: 365,
        image_url: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Tenant;

      const mockManager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(tenant),
          save: jest.fn().mockResolvedValue({ ...tenant, delete_flag: true }),
        }),
        createQueryBuilder: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 2 }),
        }),
      };

      jest
        .spyOn(dataSource, "transaction")
        .mockImplementation((callback: any) => {
          return callback(mockManager);
        });

      const result = await service.deleteTenant(tenantId);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(mockManager.getRepository).toHaveBeenCalledWith(Tenant);
      expect(result).toEqual({
        id: tenant.id,
        tenant_id: tenant.tenant_id,
        name: tenant.name,
        tenant_start_at: tenant.tenant_start_at,
        tenant_end_at: tenant.tenant_end_at,
        delete_flag: true,
        auto_user_approval: tenant.auto_user_approval,
        data_retention_days: tenant.data_retention_days,
        image_url: tenant.image_url,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      });
    });

    it("should throw NotFoundException when tenant is not found", async () => {
      const tenantId = "123e4567-e89b-12d3-a456-426614174001";

      const mockManager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
        }),
      };

      jest
        .spyOn(dataSource, "transaction")
        .mockImplementation((callback: any) => {
          return callback(mockManager);
        });

      await expect(service.deleteTenant(tenantId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteTenant(tenantId)).rejects.toThrow(
        `Tenant with ID ${tenantId} not found`,
      );
    });
  });
});
