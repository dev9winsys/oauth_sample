import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexToUserBlockHistory1769943058700
  implements MigrationInterface
{
  name = "AddIndexToUserBlockHistory1769943058700";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add composite index on user_id and createdAt for better query performance
    await queryRunner.query(
      `CREATE INDEX "IDX_user_block_history_user_id_createdAt" ON "auth"."user_block_history" ("user_id", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the composite index
    await queryRunner.query(
      `DROP INDEX "auth"."IDX_user_block_history_user_id_createdAt"`,
    );
  }
}
