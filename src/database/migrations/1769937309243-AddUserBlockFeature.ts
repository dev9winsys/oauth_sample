import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserBlockFeature1769937309243 implements MigrationInterface {
  name = "AddUserBlockFeature1769937309243";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types for block_type and activity_status
    await queryRunner.query(
      `CREATE TYPE "auth"."user_block_history_block_type_enum" AS ENUM('warning', 'temporary_suspension', 'permanent_block')`,
    );
    await queryRunner.query(
      `CREATE TYPE "auth"."users_activity_status_enum" AS ENUM('normal', 'warning', 'temporary_suspension', 'permanent_block')`,
    );

    // Create user_block_history table
    await queryRunner.query(
      `CREATE TABLE "auth"."user_block_history" (
        "id" SERIAL NOT NULL, 
        "user_id" integer NOT NULL, 
        "block_type" "auth"."user_block_history_block_type_enum" NOT NULL, 
        "block_release_date" TIMESTAMP, 
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
        CONSTRAINT "PK_user_block_history_id" PRIMARY KEY ("id")
      )`,
    );

    // Add foreign key constraint for user_id
    await queryRunner.query(
      `ALTER TABLE "auth"."user_block_history" ADD CONSTRAINT "FK_user_block_history_user_id" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Add activity_status column to users table with default value
    await queryRunner.query(
      `ALTER TABLE "auth"."users" ADD "activity_status" "auth"."users_activity_status_enum" NOT NULL DEFAULT 'normal'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove activity_status column from users table
    await queryRunner.query(
      `ALTER TABLE "auth"."users" DROP COLUMN "activity_status"`,
    );

    // Remove foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "auth"."user_block_history" DROP CONSTRAINT "FK_user_block_history_user_id"`,
    );

    // Drop user_block_history table
    await queryRunner.query(`DROP TABLE "auth"."user_block_history"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "auth"."users_activity_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "auth"."user_block_history_block_type_enum"`,
    );
  }
}
