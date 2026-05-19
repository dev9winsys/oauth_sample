import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1769924135393 implements MigrationInterface {
  name = "InitialSchema1769924135393";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "auth"`);
    await queryRunner.query(
      `CREATE TABLE "auth"."permission" ("user_id" integer NOT NULL, "service_id" integer NOT NULL, "permission_type" character varying NOT NULL, "permission_start_at" TIMESTAMP NOT NULL, "permission_end_at" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2df0e087d57ca12c813c2204501" PRIMARY KEY ("user_id", "service_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2df0e087d57ca12c813c220450" ON "auth"."permission" ("service_id", "user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "auth"."service" ("id" SERIAL NOT NULL, "service_id" uuid NOT NULL, "user_id" integer NOT NULL, "service_name" character varying(50) NOT NULL, "home_url" character varying NOT NULL, "service_start_at" TIMESTAMP NOT NULL, "service_end_at" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_85a21558c006647cd76fdce044b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_48c5a0e13da2b2948fb7f3a0c4" ON "auth"."service" ("service_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_09b24ab5ff6801cbf66756126a" ON "auth"."service" ("service_id", "user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "auth"."tenant" ("id" SERIAL NOT NULL, "tenant_id" uuid NOT NULL, "name" character varying(50) NOT NULL, "tenant_start_at" TIMESTAMP NOT NULL, "tenant_end_at" TIMESTAMP NOT NULL, "delete_flag" boolean NOT NULL DEFAULT false, "auto_user_approval" boolean NOT NULL DEFAULT false, "data_retention_days" integer NOT NULL DEFAULT 365, "image_url" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_da8c6efd67bb301e810e56ac139" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4e7cb4e84f82aa7842a0bafc67" ON "auth"."tenant" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "auth"."users" ("id" SERIAL NOT NULL, "user_id" uuid NOT NULL, "name" character varying(50) NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "email_verified" boolean NOT NULL DEFAULT false, "email_verification_token" character varying, "verification_token_expires_at" TIMESTAMP, "delete_flag" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_96aac72f1574b88752e9fb0008" ON "auth"."users" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "auth"."users" ("email") `,
    );
    await queryRunner.query(
      `ALTER TABLE "auth"."permission" ADD CONSTRAINT "FK_8ec1323d871577a8795e54c9c4b" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth"."permission" ADD CONSTRAINT "FK_794c5efd32abc6eeed9d36c5798" FOREIGN KEY ("service_id") REFERENCES "auth"."service"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth"."service" ADD CONSTRAINT "FK_6c4f6adc2bc86736d090dc29071" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth"."service" DROP CONSTRAINT "FK_6c4f6adc2bc86736d090dc29071"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth"."permission" DROP CONSTRAINT "FK_794c5efd32abc6eeed9d36c5798"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth"."permission" DROP CONSTRAINT "FK_8ec1323d871577a8795e54c9c4b"`,
    );
    await queryRunner.query(
      `DROP INDEX "auth"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(
      `DROP INDEX "auth"."IDX_96aac72f1574b88752e9fb0008"`,
    );
    await queryRunner.query(`DROP TABLE "auth"."users"`);
    await queryRunner.query(
      `DROP INDEX "auth"."IDX_4e7cb4e84f82aa7842a0bafc67"`,
    );
    await queryRunner.query(`DROP TABLE "auth"."tenant"`);
    await queryRunner.query(
      `DROP INDEX "auth"."IDX_09b24ab5ff6801cbf66756126a"`,
    );
    await queryRunner.query(
      `DROP INDEX "auth"."IDX_48c5a0e13da2b2948fb7f3a0c4"`,
    );
    await queryRunner.query(`DROP TABLE "auth"."service"`);
    await queryRunner.query(
      `DROP INDEX "auth"."IDX_2df0e087d57ca12c813c220450"`,
    );
    await queryRunner.query(`DROP TABLE "auth"."permission"`);
    await queryRunner.query(`DROP SCHEMA "auth" CASCADE`);
  }
}
