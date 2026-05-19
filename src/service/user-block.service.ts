import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import {
  UserRepository,
  UserBlockHistoryRepository,
} from "src/database/repository";
import { User, ActivityStatus, BlockType } from "src/database/entity";
import { BlockUserDto, UnblockUserDto } from "src/dto";

@Injectable()
export class UserBlockService {
  private readonly logger = new Logger(UserBlockService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly userBlockHistoryRepository: UserBlockHistoryRepository,
  ) {}

  /**
   * Block a user
   * @param blockUserDto - Block user data
   * @returns Updated user with block history
   * @throws NotFoundException if user not found
   */
  async blockUser(blockUserDto: BlockUserDto): Promise<User> {
    const { user_id, block_type, block_release_date, reason } = blockUserDto;

    // Find user by UUID
    const user = await this.userRepository.findOne({ user_id });

    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    // Map block type to activity status
    const activityStatusMap: Record<BlockType, ActivityStatus> = {
      [BlockType.WARNING]: ActivityStatus.WARNING,
      [BlockType.TEMPORARY_SUSPENSION]: ActivityStatus.TEMPORARY_SUSPENSION,
      [BlockType.PERMANENT_BLOCK]: ActivityStatus.PERMANENT_BLOCK,
    };

    const activityStatus = activityStatusMap[block_type];

    // Use transaction to ensure atomicity
    const updatedUser = await this.dataSource.transaction(async (manager) => {
      const userBlockHistoryRepo = manager.getRepository(
        this.userBlockHistoryRepository.getRepository().target,
      );
      const userRepo = manager.getRepository(
        this.userRepository.getRepository().target,
      );

      // Check for existing active blocks and mark them as released
      const existingActiveBlocks = await userBlockHistoryRepo.find({
        where: { user_id: user.id },
        order: { createdAt: "DESC" },
      });

      const activeBlocks = existingActiveBlocks.filter(
        (block) =>
          !block.block_release_date ||
          new Date(block.block_release_date) > new Date(),
      );

      // Mark all existing active blocks as released (bulk update)
      if (activeBlocks.length > 0) {
        const releaseDate = new Date();
        releaseDate.setSeconds(releaseDate.getSeconds() - 1);

        activeBlocks.forEach((activeBlock) => {
          activeBlock.block_release_date = releaseDate;
        });

        await userBlockHistoryRepo.save(activeBlocks);
      }

      // Create new block history entry
      const blockHistory = userBlockHistoryRepo.create({
        user_id: user.id,
        block_type,
        reason: reason || null,
        block_release_date: block_release_date
          ? new Date(block_release_date)
          : null,
      });
      await userBlockHistoryRepo.save(blockHistory);

      // Update user activity status
      user.activity_status = activityStatus;
      return await userRepo.save(user);
    });

    this.logger.log(`User ${user_id} blocked with type ${block_type}`);

    return updatedUser;
  }

  /**
   * Create a release date for immediate unblock (current time - 1 minute)
   * @returns Date object set to 1 minute ago
   */
  private createImmediateReleaseDate(): Date {
    const releaseDate = new Date();
    releaseDate.setMinutes(releaseDate.getMinutes() - 1);
    return releaseDate;
  }

  /**
   * Unblock a user immediately
   * @param unblockUserDto - Unblock user data
   * @returns Updated user
   * @throws NotFoundException if user not found
   * @throws BadRequestException if user is not currently blocked
   */
  async unblockUser(unblockUserDto: UnblockUserDto): Promise<User> {
    const { user_id } = unblockUserDto;

    // Find user by UUID
    const user = await this.userRepository.findOne({ user_id });

    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    // Check if user is currently blocked
    if (user.activity_status === ActivityStatus.NORMAL) {
      throw new BadRequestException(`User ${user_id} is not currently blocked`);
    }

    // Use transaction to ensure atomicity
    const updatedUser = await this.dataSource.transaction(async (manager) => {
      const userBlockHistoryRepo = manager.getRepository(
        this.userBlockHistoryRepository.getRepository().target,
      );
      const userRepo = manager.getRepository(
        this.userRepository.getRepository().target,
      );

      // Find the most recent active block (block_release_date is null or in the future)
      const blockHistory = await userBlockHistoryRepo.findOne({
        where: {
          user_id: user.id,
          block_release_date: null,
        },
        order: { createdAt: "DESC" },
      });

      if (!blockHistory) {
        // Check for future release dates
        const futureBlocks = await userBlockHistoryRepo.find({
          where: { user_id: user.id },
          order: { createdAt: "DESC" },
        });

        const activeBlock = futureBlocks.find(
          (block) =>
            block.block_release_date &&
            new Date(block.block_release_date) > new Date(),
        );

        if (activeBlock) {
          activeBlock.block_release_date = this.createImmediateReleaseDate();
          await userBlockHistoryRepo.save(activeBlock);
        } else {
          throw new BadRequestException(
            `No active block found for user ${user_id}`,
          );
        }
      } else {
        blockHistory.block_release_date = this.createImmediateReleaseDate();
        await userBlockHistoryRepo.save(blockHistory);
      }

      // Update user activity status to normal
      user.activity_status = ActivityStatus.NORMAL;
      return await userRepo.save(user);
    });

    this.logger.log(`User ${user_id} unblocked immediately`);

    return updatedUser;
  }
}
