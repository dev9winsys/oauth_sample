import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnsToUser1769952000000 implements MigrationInterface {
  name = "AddColumnsToUser1769952000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add login failure count column
    await queryRunner.query(
      `ALTER TABLE "auth"."users" ADD "login_failure_count" integer NOT NULL DEFAULT 0`,
    );

    // Add previous passwords column (stored as JSON text)
    await queryRunner.query(
      `ALTER TABLE "auth"."users" ADD "previous_passwords" text`,
    );

    // Add pending email column (stores unverified new email during email change)
    await queryRunner.query(
      `ALTER TABLE "auth"."users" ADD "pending_email" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth"."users" DROP COLUMN "pending_email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth"."users" DROP COLUMN "previous_passwords"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth"."users" DROP COLUMN "login_failure_count"`,
    );
  }
}
