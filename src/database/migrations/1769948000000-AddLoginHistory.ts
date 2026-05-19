import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLoginHistory1769948000000 implements MigrationInterface {
  name = "AddLoginHistory1769948000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "auth"."login_history_login_status_enum" AS ENUM('success', 'failure')`,
    );

    await queryRunner.query(
      `CREATE TABLE "auth"."login_history" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "ip_address" character varying(45) NOT NULL,
        "login_status" "auth"."login_history_login_status_enum" NOT NULL,
        "login_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_login_history_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "auth"."login_history" ADD CONSTRAINT "FK_login_history_user_id" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_login_history_user_id_login_at" ON "auth"."login_history" ("user_id", "login_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "auth"."IDX_login_history_user_id_login_at"`,
    );

    await queryRunner.query(
      `ALTER TABLE "auth"."login_history" DROP CONSTRAINT "FK_login_history_user_id"`,
    );

    await queryRunner.query(`DROP TABLE "auth"."login_history"`);

    await queryRunner.query(
      `DROP TYPE "auth"."login_history_login_status_enum"`,
    );
  }
}
