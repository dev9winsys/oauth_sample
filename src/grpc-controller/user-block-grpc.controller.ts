import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { UserBlockService } from "src/service";
import { BlockUserDto, UnblockUserDto, UserResponseDto } from "src/dto";
import { BlockType } from "src/database/entity/user-block-history.entity";
import { RpcException } from "@nestjs/microservices";
import { validateDto } from "./validation.helper";

interface BlockUserRequest {
  user_id: string;
  block_type: string;
  reason?: string;
  block_release_date?: string;
}

interface UnblockUserRequest {
  user_id: string;
}

@Controller()
export class UserBlockGrpcController {
  constructor(private readonly userBlockService: UserBlockService) {}

  @GrpcMethod("UserBlockService", "BlockUser")
  async blockUser(data: BlockUserRequest): Promise<UserResponseDto> {
    // Validate block_type enum
    if (!Object.values(BlockType).includes(data.block_type as BlockType)) {
      throw new RpcException({
        code: 3, // INVALID_ARGUMENT
        message: `Invalid block_type: ${data.block_type}. Must be one of: ${Object.values(BlockType).join(", ")}`,
      });
    }

    const blockUserDto = new BlockUserDto();
    blockUserDto.user_id = data.user_id;
    blockUserDto.block_type = data.block_type as BlockType;
    if (data.reason) {
      blockUserDto.reason = data.reason;
    }
    if (data.block_release_date) {
      blockUserDto.block_release_date = data.block_release_date;
    }

    await validateDto(blockUserDto);
    const user = await this.userBlockService.blockUser(blockUserDto);
    return UserResponseDto.fromEntity(user);
  }

  @GrpcMethod("UserBlockService", "UnblockUser")
  async unblockUser(data: UnblockUserRequest): Promise<UserResponseDto> {
    const unblockUserDto = new UnblockUserDto();
    unblockUserDto.user_id = data.user_id;

    await validateDto(unblockUserDto);
    const user = await this.userBlockService.unblockUser(unblockUserDto);
    return UserResponseDto.fromEntity(user);
  }
}
