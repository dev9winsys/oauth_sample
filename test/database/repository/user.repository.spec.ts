import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "src/database/entity/user.entity";
import { UserRepository } from "src/database/repository/user.repository";

describe("UserRepository", () => {
  let userRepository: UserRepository;
  let mockRepository: Partial<Repository<User>>;

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
        UserRepository,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
  });

  describe("insert", () => {
    it("should insert a single user", async () => {
      const userData = {
        tenant_id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };
      const createdUser = {
        ...userData,
        id: "123e4567-e89b-12d3-a456-426614174001",
      } as unknown as User;

      mockRepository.create = jest.fn().mockReturnValue(createdUser);
      mockRepository.save = jest.fn().mockResolvedValue(createdUser);

      const result = await userRepository.insert(userData);

      expect(mockRepository.create).toHaveBeenCalledWith(userData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(createdUser);
    });
  });

  describe("update", () => {
    it("should update an existing user", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const existingUser = {
        id: userId,
        name: "Old Name",
        email: "old@example.com",
      } as unknown as User;
      const updateData = { name: "New Name" };
      const updatedUser = { ...existingUser, ...updateData } as User;

      mockRepository.findOne = jest.fn().mockResolvedValue(existingUser);
      mockRepository.merge = jest.fn().mockReturnValue(updatedUser);
      mockRepository.save = jest.fn().mockResolvedValue(updatedUser);

      const result = await userRepository.update(
        { id: userId as any },
        updateData,
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockRepository.merge).toHaveBeenCalledWith(
        existingUser,
        updateData,
      );
      expect(mockRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });

    it("should return null if user not found", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      mockRepository.findOne = jest.fn().mockResolvedValue(null);

      const result = await userRepository.update(
        { id: userId as any },
        { name: "New Name" },
      );

      expect(result).toBeNull();
      expect(mockRepository.merge).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete an existing user", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      mockRepository.delete = jest.fn().mockResolvedValue({ affected: 1 });

      const result = await userRepository.delete({ id: userId as any });

      expect(mockRepository.delete).toHaveBeenCalledWith({ id: userId });
      expect(result).toBe(true);
    });

    it("should return false if user not found", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      mockRepository.delete = jest.fn().mockResolvedValue({ affected: 0 });

      const result = await userRepository.delete({ id: userId as any });

      expect(result).toBe(false);
    });
  });

  describe("multiInsert", () => {
    it("should insert multiple users", async () => {
      const usersData = [
        {
          tenant_id: "123e4567-e89b-12d3-a456-426614174000",
          name: "User 1",
          email: "user1@example.com",
          password: "password123",
        },
        {
          tenant_id: "123e4567-e89b-12d3-a456-426614174000",
          name: "User 2",
          email: "user2@example.com",
          password: "password456",
        },
      ];
      const createdUsers = [
        { ...usersData[0], id: "123e4567-e89b-12d3-a456-426614174001" },
        { ...usersData[1], id: "123e4567-e89b-12d3-a456-426614174002" },
      ] as unknown as User[];

      mockRepository.create = jest.fn().mockReturnValue(createdUsers);
      mockRepository.save = jest.fn().mockResolvedValue(createdUsers);

      const result = await userRepository.multiInsert(usersData);

      expect(mockRepository.create).toHaveBeenCalledWith(usersData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdUsers);
      expect(result).toEqual(createdUsers);
    });
  });

  describe("softDelete", () => {
    it("should soft delete a user by setting delete_flag to true", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      const existingUser = {
        id: userId,
        name: "Test User",
        email: "test@example.com",
        delete_flag: false,
      } as unknown as User;
      const softDeletedUser = { ...existingUser, delete_flag: true } as User;

      mockRepository.findOne = jest.fn().mockResolvedValue(existingUser);
      mockRepository.merge = jest.fn().mockReturnValue(softDeletedUser);
      mockRepository.save = jest.fn().mockResolvedValue(softDeletedUser);

      const result = await userRepository.softDelete({ id: userId as any });

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockRepository.merge).toHaveBeenCalledWith(existingUser, {
        delete_flag: true,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(softDeletedUser);
      expect(result).toEqual(softDeletedUser);
      expect(result?.delete_flag).toBe(true);
    });

    it("should return null if user not found", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174001";
      mockRepository.findOne = jest.fn().mockResolvedValue(null);

      const result = await userRepository.softDelete({ id: userId as any });

      expect(result).toBeNull();
      expect(mockRepository.merge).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
