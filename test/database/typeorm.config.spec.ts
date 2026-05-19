import { ConfigService } from "@nestjs/config";
import { typeOrmAsyncConfig } from "src/database/typeorm.config";

describe("typeorm.config", () => {
  it("should parse DB_PORT and fall back from DB_USERNAME to DB_USER", async () => {
    const config: Record<string, string | undefined> = {
      DB_HOST: "localhost",
      DB_PORT: "5433",
      DB_USER: "db_user",
      DB_PASSWORD: "db_password",
      DB_NAME: "db_name",
      DB_SCHEMA: "public",
      SYNCHRONIZE: "true",
      DB_LOGGING: "true",
    };

    const configService = {
      get: jest.fn((key: string) => config[key]),
    } as unknown as ConfigService;

    const options = await typeOrmAsyncConfig.useFactory?.(configService);

    expect(options).toMatchObject({
      type: "postgres",
      host: "localhost",
      port: 5433,
      username: "db_user",
      password: "db_password",
      database: "db_name",
      schema: "public",
      synchronize: true,
      logging: true,
      autoLoadEntities: true,
    });
  });

  it("should fallback DB_PORT to 5432 when value is not numeric", async () => {
    const config: Record<string, string | undefined> = {
      DB_HOST: "localhost",
      DB_PORT: "abc",
      DB_USER: "db_user",
      DB_PASSWORD: "db_password",
      DB_NAME: "db_name",
      DB_SCHEMA: "public",
      SYNCHRONIZE: "false",
      DB_LOGGING: "false",
    };

    const configService = {
      get: jest.fn((key: string) => config[key]),
    } as unknown as ConfigService;

    const options = await typeOrmAsyncConfig.useFactory?.(configService);

    expect(options).toMatchObject({
      port: 5432,
    });
  });
});
