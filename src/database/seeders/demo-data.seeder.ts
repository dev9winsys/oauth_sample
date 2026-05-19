import { QueryRunner } from "typeorm";
import * as bcrypt from "bcrypt";
import { v7 as uuidv7 } from "uuid";
import { Seeder } from "./seeder.interface";

/**
 * Demo Data Seeder
 * Seeds the database with demo users, services, and permissions for testing purposes.
 * This is separate from migrations to keep schema changes and test data independent.
 */
export class DemoDataSeeder implements Seeder {
  public async run(queryRunner: QueryRunner): Promise<void> {
    // Hash password for all demo users
    const hashedPassword = await bcrypt.hash("DemoPassword123!", 10);

    // 1. Create 4 users (1 admin, 1 manager, 2 regular users)
    // Note: tenant_id and approval_flag have been removed from the schema

    // Admin user
    const adminUserResult = await queryRunner.query(
      `
            INSERT INTO auth.users (user_id, name, email, password, email_verified)
            VALUES ($1, '管理者ユーザー', 'admin@demo.example.com', $2, true)
            RETURNING id;
        `,
      [uuidv7(), hashedPassword],
    );
    const adminUserId = adminUserResult[0].id;

    // Manager user
    const managerUserResult = await queryRunner.query(
      `
            INSERT INTO auth.users (user_id, name, email, password, email_verified)
            VALUES ($1, 'マネージャーユーザー', 'manager@demo.example.com', $2, true)
            RETURNING id;
        `,
      [uuidv7(), hashedPassword],
    );
    const managerUserId = managerUserResult[0].id;

    // Regular user 1
    await queryRunner.query(
      `
            INSERT INTO auth.users (user_id, name, email, password, email_verified)
            VALUES ($1, '一般ユーザー1', 'user1@demo.example.com', $2, true);
        `,
      [uuidv7(), hashedPassword],
    );

    // Regular user 2
    await queryRunner.query(
      `
            INSERT INTO auth.users (user_id, name, email, password, email_verified)
            VALUES ($1, '一般ユーザー2', 'user2@demo.example.com', $2, true);
        `,
      [uuidv7(), hashedPassword],
    );

    // 2. Create a service owned by the admin user (using serial ID, not UUID)
    const serviceResult = await queryRunner.query(
      `
            INSERT INTO auth.service (service_id, user_id, service_name, home_url, service_start_at, service_end_at)
            VALUES ($1, $2, 'DEMOサービス', 'https://demo.example.com', '2026-01-01', '9999-12-31')
            RETURNING id;
        `,
      [uuidv7(), adminUserId],
    );
    const serviceId = serviceResult[0].id;

    // 3. Create permissions (admin and manager roles)
    // Note: Using serial IDs for both user_id and service_id

    // Admin permission
    await queryRunner.query(
      `
            INSERT INTO auth.permission (user_id, service_id, permission_type, permission_start_at, permission_end_at)
            VALUES ($1, $2, 'admin', '2026-01-01', '9999-12-31');
        `,
      [adminUserId, serviceId],
    );

    // Manager permission
    await queryRunner.query(
      `
            INSERT INTO auth.permission (user_id, service_id, permission_type, permission_start_at, permission_end_at)
            VALUES ($1, $2, 'manager', '2026-01-01', '9999-12-31');
        `,
      [managerUserId, serviceId],
    );
  }

  public async revert(queryRunner: QueryRunner): Promise<void> {
    // Delete in reverse order to maintain referential integrity
    await queryRunner.query(`DELETE FROM auth.permission WHERE user_id IN (
            SELECT id FROM auth.users WHERE email LIKE '%@demo.example.com'
        );`);

    await queryRunner.query(`DELETE FROM auth.service WHERE user_id IN (
            SELECT id FROM auth.users WHERE email LIKE '%@demo.example.com'
        );`);

    await queryRunner.query(
      `DELETE FROM auth.users WHERE email LIKE '%@demo.example.com';`,
    );
  }
}
