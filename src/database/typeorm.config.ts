import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const parsedPort = parseInt(
      configService.get<string>("DB_PORT") || "5432",
      10,
    );
    const port = Number.isNaN(parsedPort) ? 5432 : parsedPort;

    return {
      type: "postgres",
      host: configService.get<string>("DB_HOST"),
      port,
      username:
        configService.get<string>("DB_USERNAME") ||
        configService.get<string>("DB_USER"),
      password: configService.get<string>("DB_PASSWORD"),
      database: configService.get<string>("DB_NAME"),
      schema: configService.get<string>("DB_SCHEMA") || "public",
      synchronize: configService.get<string>("SYNCHRONIZE") === "true",
      logging: configService.get<string>("DB_LOGGING") === "true",
      autoLoadEntities: true,
    };
  },
};
