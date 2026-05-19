import { QueryRunner } from "typeorm";

/**
 * Seeder interface
 * All seeders must implement this interface
 */
export interface Seeder {
  run(queryRunner: QueryRunner): Promise<void>;
  revert(queryRunner: QueryRunner): Promise<void>;
}

/**
 * Seeder constructor type
 */
export type SeederConstructor = new () => Seeder;
