import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tenant } from "src/database/entity/tenant.entity";
import { TenantRepository } from "src/database/repository/tenant.repository";

describe("TenantRepository", () => {
  let tenantRepository: TenantRepository;
  let mockRepository: Partial<Repository<Tenant>>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      merge: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantRepository,
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockRepository,
        },
      ],
    }).compile();

    tenantRepository = module.get<TenantRepository>(TenantRepository);
  });

  describe("insert", () => {
    it("should insert a single tenant", async () => {
      const tenantData = {
        name: "Test Tenant",
        tenant_start_at: new Date(),
        tenant_end_at: new Date(),
      };
      const createdTenant = {
        ...tenantData,
        id: 1,
        tenant_id: "123e4567-e89b-12d3-a456-426614174001",
      } as unknown as Tenant;

      mockRepository.create = jest.fn().mockReturnValue(createdTenant);
      mockRepository.save = jest.fn().mockResolvedValue(createdTenant);

      const result = await tenantRepository.insert(tenantData);

      expect(mockRepository.create).toHaveBeenCalledWith(tenantData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdTenant);
      expect(result).toEqual(createdTenant);
    });
  });

  describe("softDelete", () => {
    it("should soft delete a tenant by setting delete_flag to true", async () => {
      const tenantId = "123e4567-e89b-12d3-a456-426614174001";
      const existingTenant = {
        id: 1,
        tenant_id: tenantId,
        name: "Test Tenant",
        delete_flag: false,
      } as unknown as Tenant;
      const softDeletedTenant = {
        ...existingTenant,
        delete_flag: true,
      } as Tenant;

      mockRepository.findOne = jest.fn().mockResolvedValue(existingTenant);
      mockRepository.merge = jest.fn().mockReturnValue(softDeletedTenant);
      mockRepository.save = jest.fn().mockResolvedValue(softDeletedTenant);

      const result = await tenantRepository.softDelete({
        tenant_id: tenantId as any,
      });

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { tenant_id: tenantId },
      });
      expect(mockRepository.merge).toHaveBeenCalledWith(existingTenant, {
        delete_flag: true,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(softDeletedTenant);
      expect(result).toEqual(softDeletedTenant);
      expect(result?.delete_flag).toBe(true);
    });
  });

  describe("multiInsert", () => {
    it("should insert multiple tenants", async () => {
      const tenantsData = [
        {
          name: "Tenant 1",
          tenant_start_at: new Date(),
          tenant_end_at: new Date(),
        },
        {
          name: "Tenant 2",
          tenant_start_at: new Date(),
          tenant_end_at: new Date(),
        },
      ];
      const createdTenants = [
        {
          ...tenantsData[0],
          id: 1,
          tenant_id: "123e4567-e89b-12d3-a456-426614174001",
        },
        {
          ...tenantsData[1],
          id: 2,
          tenant_id: "123e4567-e89b-12d3-a456-426614174002",
        },
      ] as unknown as Tenant[];

      mockRepository.create = jest.fn().mockReturnValue(createdTenants);
      mockRepository.save = jest.fn().mockResolvedValue(createdTenants);

      const result = await tenantRepository.multiInsert(tenantsData);

      expect(mockRepository.create).toHaveBeenCalledWith(tenantsData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdTenants);
      expect(result).toEqual(createdTenants);
    });
  });

  describe("bulkUpdate", () => {
    it("should bulk update entities matching criteria", async () => {
      const criteria = { delete_flag: false };
      const updateData = { delete_flag: true };
      const updateResult = { affected: 5, raw: [], generatedMaps: [] };

      mockRepository.update = jest.fn().mockResolvedValue(updateResult);

      const result = await tenantRepository.bulkUpdate(
        criteria as any,
        updateData,
      );

      expect(mockRepository.update).toHaveBeenCalledWith(criteria, updateData);
      expect(result).toEqual(updateResult);
    });
  });

  describe("getRepository", () => {
    it("should return the underlying TypeORM repository", () => {
      const result = tenantRepository.getRepository();

      expect(result).toBe(mockRepository);
    });
  });
});
