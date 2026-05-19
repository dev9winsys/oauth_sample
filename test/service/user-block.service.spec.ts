import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { getDataSourceToken } from "@nestjs/typeorm";
import { UserBlockService } from "src/service/user-block.service";
import {
  UserRepository,
  UserBlockHistoryRepository,
} from "src/database/repository";
import {
  User,
  UserBlockHistory,
  ActivityStatus,
  BlockType,
} from "src/database/entity";
import { BlockUserDto, UnblockUserDto } from "src/dto";

describe("UserBlockService", () => {
  let service: UserBlockService;
  let userRepository: jest.Mocked<UserRepository>;
  let mockDataSource: any;

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
      getRepository: jest.fn().mockReturnValue({
        target: User,
      }),
    };

    const mockUserBlockHistoryRepository = {
      insert: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      getRepository: jest.fn().mockReturnValue({
        target: UserBlockHistory,
      }),
    };

    // Mock DataSource with transaction support
    mockDataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => {
        const mockManager = {
          getRepository: jest.fn().mockImplementation((target) => {
            if (target === User) {
              return {
                findOne: jest.fn().mockResolvedValue({
                  id: 1,
                  user_id: "123e4567-e89b-12d3-a456-426614174001",
                  activity_status: ActivityStatus.NORMAL,
                }),
                save: jest
                  .fn()
                  .mockImplementation((entity) => Promise.resolve(entity)),
              };
            } else if (target === UserBlockHistory) {
              return {
                create: jest.fn().mockImplementation((data) => data),
                save: jest
                  .fn()
                  .mockImplementation((entity) => Promise.resolve(entity)),
                findOne: jest.fn(),
                find: jest.fn().mockResolvedValue([]),
              };
            }
          }),
        };
        return cb(mockManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserBlockService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: UserBlockHistoryRepository,
          useValue: mockUserBlockHistoryRepository,
        },
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<UserBlockService>(UserBlockService);
    userRepository = module.get(UserRepository);
  });

  describe("blockUser", () => {
    it("should block a user with warning", async () => {
      const blockDto: BlockUserDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        block_type: BlockType.WARNING,
        block_release_date: "2030-12-31T23:59:59.000Z",
      };

      const user = {
        id: 1,
        user_id: blockDto.user_id,
        name: "Test User",
        activity_status: ActivityStatus.NORMAL,
      } as User;

      userRepository.findOne.mockResolvedValue(user);

      const result = await service.blockUser(blockDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        user_id: blockDto.user_id,
      });
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(result.activity_status).toBe(ActivityStatus.WARNING);
    });

    it("should block a user with temporary suspension", async () => {
      const blockDto: BlockUserDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        block_type: BlockType.TEMPORARY_SUSPENSION,
      };

      const user = {
        id: 1,
        user_id: blockDto.user_id,
        name: "Test User",
        activity_status: ActivityStatus.NORMAL,
      } as User;

      userRepository.findOne.mockResolvedValue(user);

      const result = await service.blockUser(blockDto);

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(result.activity_status).toBe(ActivityStatus.TEMPORARY_SUSPENSION);
    });

    it("should block a user with permanent block", async () => {
      const blockDto: BlockUserDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        block_type: BlockType.PERMANENT_BLOCK,
      };

      const user = {
        id: 1,
        user_id: blockDto.user_id,
        name: "Test User",
        activity_status: ActivityStatus.NORMAL,
      } as User;

      userRepository.findOne.mockResolvedValue(user);

      const result = await service.blockUser(blockDto);

      expect(result.activity_status).toBe(ActivityStatus.PERMANENT_BLOCK);
    });

    it("should block a user with reason", async () => {
      const blockDto: BlockUserDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        block_type: BlockType.WARNING,
        reason: "不適切な投稿のため",
      };

      const user = {
        id: 1,
        user_id: blockDto.user_id,
        name: "Test User",
        activity_status: ActivityStatus.NORMAL,
      } as User;

      userRepository.findOne.mockResolvedValue(user);

      const result = await service.blockUser(blockDto);

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(result.activity_status).toBe(ActivityStatus.WARNING);
    });

    it("should throw NotFoundException when user not found", async () => {
      const blockDto: BlockUserDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        block_type: BlockType.WARNING,
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.blockUser(blockDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.blockUser(blockDto)).rejects.toThrow(
        `User with ID ${blockDto.user_id} not found`,
      );
    });
  });

  describe("unblockUser", () => {
    it("should unblock a user successfully", async () => {
      const unblockDto: UnblockUserDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      const user = {
        id: 1,
        user_id: unblockDto.user_id,
        name: "Test User",
        activity_status: ActivityStatus.WARNING,
      } as User;

      userRepository.findOne.mockResolvedValue(user);

      // Update the transaction mock to handle unblock scenario
      mockDataSource.transaction.mockImplementation(async (cb) => {
        const mockManager = {
          getRepository: jest.fn().mockImplementation((target) => {
            if (target === User) {
              return {
                findOne: jest.fn().mockResolvedValue({
                  ...user,
                  activity_status: ActivityStatus.NORMAL,
                }),
                save: jest
                  .fn()
                  .mockImplementation((entity) => Promise.resolve(entity)),
              };
            } else if (target === UserBlockHistory) {
              return {
                findOne: jest.fn().mockResolvedValue({
                  id: 1,
                  user_id: user.id,
                  block_type: BlockType.WARNING,
                  block_release_date: null,
                }),
                find: jest.fn().mockResolvedValue([]),
                save: jest
                  .fn()
                  .mockImplementation((entity) => Promise.resolve(entity)),
              };
            }
          }),
        };
        return cb(mockManager);
      });

      const result = await service.unblockUser(unblockDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        user_id: unblockDto.user_id,
      });
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(result.activity_status).toBe(ActivityStatus.NORMAL);
    });

    it("should throw NotFoundException when user not found", async () => {
      const unblockDto: UnblockUserDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.unblockUser(unblockDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.unblockUser(unblockDto)).rejects.toThrow(
        `User with ID ${unblockDto.user_id} not found`,
      );
    });

    it("should throw BadRequestException when user is not blocked", async () => {
      const unblockDto: UnblockUserDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      const user = {
        id: 1,
        user_id: unblockDto.user_id,
        name: "Test User",
        activity_status: ActivityStatus.NORMAL,
      } as User;

      userRepository.findOne.mockResolvedValue(user);

      await expect(service.unblockUser(unblockDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.unblockUser(unblockDto)).rejects.toThrow(
        `User ${unblockDto.user_id} is not currently blocked`,
      );
    });

    it("should handle future release date blocks", async () => {
      const unblockDto: UnblockUserDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      const user = {
        id: 1,
        user_id: unblockDto.user_id,
        name: "Test User",
        activity_status: ActivityStatus.TEMPORARY_SUSPENSION,
      } as User;

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days in the future

      userRepository.findOne.mockResolvedValue(user);

      // Update transaction mock for future block scenario
      mockDataSource.transaction.mockImplementation(async (cb) => {
        const mockManager = {
          getRepository: jest.fn().mockImplementation((target) => {
            if (target === User) {
              return {
                findOne: jest.fn().mockResolvedValue({
                  ...user,
                  activity_status: ActivityStatus.NORMAL,
                }),
                save: jest
                  .fn()
                  .mockImplementation((entity) => Promise.resolve(entity)),
              };
            } else if (target === UserBlockHistory) {
              return {
                findOne: jest.fn().mockResolvedValue(null),
                find: jest.fn().mockResolvedValue([
                  {
                    id: 1,
                    user_id: user.id,
                    block_type: BlockType.TEMPORARY_SUSPENSION,
                    block_release_date: futureDate,
                  },
                ]),
                save: jest
                  .fn()
                  .mockImplementation((entity) => Promise.resolve(entity)),
              };
            }
          }),
        };
        return cb(mockManager);
      });

      const result = await service.unblockUser(unblockDto);

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(result.activity_status).toBe(ActivityStatus.NORMAL);
    });

    it("should throw BadRequestException when no active block found", async () => {
      const unblockDto: UnblockUserDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      const user = {
        id: 1,
        user_id: unblockDto.user_id,
        name: "Test User",
        activity_status: ActivityStatus.WARNING,
      } as User;

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7); // 7 days in the past

      userRepository.findOne.mockResolvedValue(user);

      mockDataSource.transaction.mockImplementation(async (cb) => {
        const mockManager = {
          getRepository: jest.fn().mockImplementation((target) => {
            if (target === UserBlockHistory) {
              return {
                findOne: jest.fn().mockResolvedValue(null),
                find: jest.fn().mockResolvedValue([
                  {
                    id: 1,
                    user_id: user.id,
                    block_type: BlockType.WARNING,
                    block_release_date: pastDate,
                  },
                ]),
              };
            }
          }),
        };
        return cb(mockManager);
      });

      await expect(service.unblockUser(unblockDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.unblockUser(unblockDto)).rejects.toThrow(
        `No active block found for user ${unblockDto.user_id}`,
      );
    });
  });
});
