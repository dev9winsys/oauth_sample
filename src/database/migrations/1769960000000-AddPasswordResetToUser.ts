import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetToUser1769960000000 implements MigrationInterface {
  name = "AddPasswordResetToUser1769960000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add password reset token columns to users table
    await queryRunner.query(
      `ALTER TABLE "auth"."users" ADD "password_reset_token" character varying`,
    );

    await queryRunner.query(
      `ALTER TABLE "auth"."users" ADD "password_reset_token_expires_at" TIMESTAMP`,
    );

    // Extend the login_status enum with password reset values
    await queryRunner.query(
      `ALTER TYPE "auth"."login_history_login_status_enum" ADD VALUE 'password_reset_request'`,
    );

    await queryRunner.query(
      `ALTER TYPE "auth"."login_history_login_status_enum" ADD VALUE 'password_reset_complete'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove password reset token columns from users table
    await queryRunner.query(
      `ALTER TABLE "auth"."users" DROP COLUMN "password_reset_token_expires_at"`,
    );

    await queryRunner.query(
      `ALTER TABLE "auth"."users" DROP COLUMN "password_reset_token"`,
    );

    // Recreate the login_status enum without the password reset values.
    // (PostgreSQL does not support DROP VALUE on enums, so we replace the type.)

    // Step 1: Cast the column to varchar so it can hold any string value
    await queryRunner.query(
      `ALTER TABLE "auth"."login_history" ALTER COLUMN "login_status" TYPE character varying`,
    );

    // Step 2: Convert any rows that carry the new values to 'failure' so the
    // subsequent cast back to the old enum does not raise a data error.
    await queryRunner.query(
      `UPDATE "auth"."login_history" SET "login_status" = 'failure'
       WHERE "login_status" IN ('password_reset_request', 'password_reset_complete')`,
    );

    // Step 3: Drop the extended enum type
    await queryRunner.query(
      `DROP TYPE "auth"."login_history_login_status_enum"`,
    );

    // Step 4: Recreate the original enum with only the two original values
    await queryRunner.query(
      `CREATE TYPE "auth"."login_history_login_status_enum" AS ENUM('success', 'failure')`,
    );

    // Step 5: Cast the column back to the restored enum type
    await queryRunner.query(
      `ALTER TABLE "auth"."login_history" ALTER COLUMN "login_status" TYPE "auth"."login_history_login_status_enum" USING "login_status"::"auth"."login_history_login_status_enum"`,
    );
  }
}
