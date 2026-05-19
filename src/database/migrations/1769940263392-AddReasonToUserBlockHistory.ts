import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReasonToUserBlockHistory1769940263392
  implements MigrationInterface
{
  name = "AddReasonToUserBlockHistory1769940263392";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add reason column to user_block_history table
    await queryRunner.query(
      `ALTER TABLE "auth"."user_block_history" ADD "reason" character varying(1000)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove reason column from user_block_history table
    await queryRunner.query(
      `ALTER TABLE "auth"."user_block_history" DROP COLUMN "reason"`,
    );
  }
}
