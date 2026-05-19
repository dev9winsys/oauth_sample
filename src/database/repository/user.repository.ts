import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { User } from "../entity/user.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
  ) {
    super(repository);
  }

  /**
   * Find an active user whose email or pending_email normalizes to the given base email.
   * Normalization strips the "+" alias (e.g., aaa+1@aaa.com → aaa@aaa.com).
   * Used to prevent duplicate registrations via "+" addressing.
   *
   * @param normalizedEmail - Base email address (already normalized, lowercase)
   * @param excludeUserId - Optional user_id to exclude from the search (for update checks)
   * @returns Matching user or null
   */
  async findByNormalizedEmail(
    normalizedEmail: string,
    excludeUserId?: string,
  ): Promise<User | null> {
    const plusAliasPattern = "\\+[^@]*";

    const qb = this.getRepository()
      .createQueryBuilder("user")
      .where(
        new Brackets((qb2) => {
          qb2
            .where(
              "LOWER(REGEXP_REPLACE(user.email, :pattern, '')) = :normalizedEmail",
              { pattern: plusAliasPattern, normalizedEmail },
            )
            .orWhere(
              "user.pending_email IS NOT NULL AND LOWER(REGEXP_REPLACE(user.pending_email, :pattern, '')) = :normalizedEmail",
              { pattern: plusAliasPattern, normalizedEmail },
            );
        }),
      )
      .andWhere("user.delete_flag = :deleteFlag", { deleteFlag: false });

    if (excludeUserId) {
      qb.andWhere("user.user_id != :excludeUserId", { excludeUserId });
    }

    return qb.getOne();
  }
}
