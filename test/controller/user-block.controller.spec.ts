import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { UserBlockController } from "src/controller/user-block.controller";
import { UserBlockService } from "src/service/user-block.service";
import { User, ActivityStatus, BlockType } from "src/database/entity";
import { BlockUserDto, UnblockUserDto, UserResponseDto } from "src/dto";
import { ApiKeyGuard } from "src/guard";

describe("UserBlockController", () => {
  let controller: UserBlockController;
  let userBlockService: jest.Mocked<UserBlockService>;

  beforeEach(async () => {
    const mockUserBlockService = {
      blockUser: jest.fn(),
      unblockUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserBlockController],
      providers: [
        {
          provide: UserBlockService,
          useValue: mockUserBlockService,
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserBlockController>(UserBlockController);
    userBlockService = module.get(UserBlockService);
  });

  describe("blockUser", () => {
    it("should block a user successfully", async () => {
      const blockDto: BlockUserDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        block_type: BlockType.WARNING,
        reason: "Inappropriate content",
      };

      const blockedUser = {
        id: 1,
        user_id: blockDto.user_id,
        name: "Test User",
        email: "test@example.com",
        activity_status: ActivityStatus.WARNING,
        delete_flag: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      userBlockService.blockUser.mockResolvedValue(blockedUser);

      const result = await controller.blockUser(blockDto);

      expect(userBlockService.blockUser).toHaveBeenCalledWith(blockDto);
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.user_id).toBe(blockDto.user_id);
      expect(result.activity_status).toBe(ActivityStatus.WARNING);
    });

    it("should block a user with release date", async () => {
      const blockDto: BlockUserDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        block_type: BlockType.TEMPORARY_SUSPENSION,
        reason: "Temporary suspension",
        block_release_date: "2027-12-31T23:59:59.000Z",
      };

      const blockedUser = {
        id: 1,
        user_id: blockDto.user_id,
        name: "Test User",
        email: "test@example.com",
        activity_status: ActivityStatus.TEMPORARY_SUSPENSION,
        delete_flag: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      userBlockService.blockUser.mockResolvedValue(blockedUser);

      const result = await controller.blockUser(blockDto);

      expect(userBlockService.blockUser).toHaveBeenCalledWith(blockDto);
      expect(result.activity_status).toBe(ActivityStatus.TEMPORARY_SUSPENSION);
    });

    it("should throw NotFoundException when user not found", async () => {
      const blockDto: BlockUserDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        block_type: BlockType.WARNING,
      };

      userBlockService.blockUser.mockRejectedValue(
        new NotFoundException(`User with ID ${blockDto.user_id} not found`),
      );

      await expect(controller.blockUser(blockDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(userBlockService.blockUser).toHaveBeenCalledWith(blockDto);
    });
  });

  describe("unblockUser", () => {
    it("should unblock a user successfully", async () => {
      const unblockDto: UnblockUserDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      const unblockedUser = {
        id: 1,
        user_id: unblockDto.user_id,
        name: "Test User",
        email: "test@example.com",
        activity_status: ActivityStatus.NORMAL,
        delete_flag: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      userBlockService.unblockUser.mockResolvedValue(unblockedUser);

      const result = await controller.unblockUser(unblockDto);

      expect(userBlockService.unblockUser).toHaveBeenCalledWith(unblockDto);
      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.user_id).toBe(unblockDto.user_id);
      expect(result.activity_status).toBe(ActivityStatus.NORMAL);
    });

    it("should throw NotFoundException when user not found", async () => {
      const unblockDto: UnblockUserDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      userBlockService.unblockUser.mockRejectedValue(
        new NotFoundException(`User with ID ${unblockDto.user_id} not found`),
      );

      await expect(controller.unblockUser(unblockDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(userBlockService.unblockUser).toHaveBeenCalledWith(unblockDto);
    });

    it("should throw BadRequestException when user is not blocked", async () => {
      const unblockDto: UnblockUserDto = {
        user_id: "123e4567-e89b-12d3-a456-426614174001",
      };

      userBlockService.unblockUser.mockRejectedValue(
        new BadRequestException(
          `User ${unblockDto.user_id} is not currently blocked`,
        ),
      );

      await expect(controller.unblockUser(unblockDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userBlockService.unblockUser).toHaveBeenCalledWith(unblockDto);
    });
  });
});
