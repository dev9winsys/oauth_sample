import { Test, TestingModule } from "@nestjs/testing";
import { UserBlockGrpcController } from "src/grpc-controller/user-block-grpc.controller";
import { UserBlockService } from "src/service";
import { UserResponseDto } from "src/dto";
import { User } from "src/database/entity";
import { BlockType } from "src/database/entity/user-block-history.entity";
import { RpcException } from "@nestjs/microservices";

describe("UserBlockGrpcController", () => {
  let controller: UserBlockGrpcController;
  let userBlockService: jest.Mocked<UserBlockService>;

  beforeEach(async () => {
    const mockUserBlockService = {
      blockUser: jest.fn(),
      unblockUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserBlockGrpcController],
      providers: [
        {
          provide: UserBlockService,
          useValue: mockUserBlockService,
        },
      ],
    }).compile();

    controller = module.get<UserBlockGrpcController>(UserBlockGrpcController);
    userBlockService = module.get(UserBlockService);
  });

  describe("blockUser", () => {
    it("should block a user", async () => {
      const request = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        block_type: BlockType.WARNING,
        reason: "Test reason",
      };

      const mockUser = {
        id: 1,
        user_id: "123e4567-e89b-12d3-a456-426614174000",
      } as User;

      userBlockService.blockUser.mockResolvedValue(mockUser);

      const result = await controller.blockUser(request);

      expect(userBlockService.blockUser).toHaveBeenCalled();
      expect(result).toBeInstanceOf(UserResponseDto);
    });

    it("should validate block_type enum", async () => {
      const request = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        block_type: "invalid_type",
        reason: "Test reason",
      };

      await expect(controller.blockUser(request)).rejects.toThrow(RpcException);
    });

    it("should validate block_release_date if provided", async () => {
      const request = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        block_type: BlockType.TEMPORARY_SUSPENSION,
        block_release_date: "2020-01-01T00:00:00.000Z", // Past date
      };

      await expect(controller.blockUser(request)).rejects.toThrow(RpcException);
    });
  });

  describe("unblockUser", () => {
    it("should unblock a user", async () => {
      const request = {
        user_id: "123e4567-e89b-12d3-a456-426614174000",
      };

      const mockUser = {
        id: 1,
        user_id: "123e4567-e89b-12d3-a456-426614174000",
      } as User;

      userBlockService.unblockUser.mockResolvedValue(mockUser);

      const result = await controller.unblockUser(request);

      expect(userBlockService.unblockUser).toHaveBeenCalled();
      expect(result).toBeInstanceOf(UserResponseDto);
    });
  });
});
