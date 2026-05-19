import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Permission } from "src/database/entity/permission.entity";
import { PermissionRepository } from "src/database/repository/permission.repository";

describe("PermissionRepository", () => {
  let permissionRepository: PermissionRepository;
  let mockRepository: Partial<Repository<Permission>>;

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
        PermissionRepository,
        {
          provide: getRepositoryToken(Permission),
          useValue: mockRepository,
        },
      ],
    }).compile();

    permissionRepository =
      module.get<PermissionRepository>(PermissionRepository);
  });

  describe("insert", () => {
    it("should insert a single permission", async () => {
      const permissionData = {
        user_id: "123e4567-e89b-12d3-a456-426614174000" as any,
        service_id: "123e4567-e89b-12d3-a456-426614174001" as any,
        permission_type: "READ",
        permission_start_at: new Date(),
        permission_end_at: new Date(),
      };
      const createdPermission = { ...permissionData } as unknown as Permission;

      mockRepository.create = jest.fn().mockReturnValue(createdPermission);
      mockRepository.save = jest.fn().mockResolvedValue(createdPermission);

      const result = await permissionRepository.insert(permissionData);

      expect(mockRepository.create).toHaveBeenCalledWith(permissionData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdPermission);
      expect(result).toEqual(createdPermission);
    });
  });

  describe("update", () => {
    it("should update an existing permission", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const serviceId = "123e4567-e89b-12d3-a456-426614174001";
      const existingPermission = {
        user_id: userId,
        service_id: serviceId,
        permission_type: "READ",
      } as unknown as Permission;
      const updateData = { permission_type: "WRITE" };
      const updatedPermission = {
        ...existingPermission,
        ...updateData,
      } as Permission;

      mockRepository.findOne = jest.fn().mockResolvedValue(existingPermission);
      mockRepository.merge = jest.fn().mockReturnValue(updatedPermission);
      mockRepository.save = jest.fn().mockResolvedValue(updatedPermission);

      const result = await permissionRepository.update(
        { user_id: userId as any, service_id: serviceId as any },
        updateData,
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: userId, service_id: serviceId },
      });
      expect(mockRepository.merge).toHaveBeenCalledWith(
        existingPermission,
        updateData,
      );
      expect(mockRepository.save).toHaveBeenCalledWith(updatedPermission);
      expect(result).toEqual(updatedPermission);
    });
  });

  describe("delete", () => {
    it("should delete an existing permission", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const serviceId = "123e4567-e89b-12d3-a456-426614174001";
      mockRepository.delete = jest.fn().mockResolvedValue({ affected: 1 });

      const result = await permissionRepository.delete({
        user_id: userId as any,
        service_id: serviceId as any,
      });

      expect(mockRepository.delete).toHaveBeenCalledWith({
        user_id: userId,
        service_id: serviceId,
      });
      expect(result).toBe(true);
    });
  });

  describe("multiInsert", () => {
    it("should insert multiple permissions", async () => {
      const permissionsData = [
        {
          user_id: "123e4567-e89b-12d3-a456-426614174000" as any,
          service_id: "123e4567-e89b-12d3-a456-426614174001" as any,
          permission_type: "READ",
          permission_start_at: new Date(),
          permission_end_at: new Date(),
        },
        {
          user_id: "123e4567-e89b-12d3-a456-426614174002" as any,
          service_id: "123e4567-e89b-12d3-a456-426614174003" as any,
          permission_type: "WRITE",
          permission_start_at: new Date(),
          permission_end_at: new Date(),
        },
      ];
      const createdPermissions = [
        { ...permissionsData[0] },
        { ...permissionsData[1] },
      ] as unknown as Permission[];

      mockRepository.create = jest.fn().mockReturnValue(createdPermissions);
      mockRepository.save = jest.fn().mockResolvedValue(createdPermissions);

      const result = await permissionRepository.multiInsert(permissionsData);

      expect(mockRepository.create).toHaveBeenCalledWith(permissionsData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdPermissions);
      expect(result).toEqual(createdPermissions);
    });
  });
});
