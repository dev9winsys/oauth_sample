import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule, JwtModuleOptions } from "@nestjs/jwt";
import {
  AppController,
  ServiceController,
  TenantController,
  UserController,
  AuthController,
  UserBlockController,
  PasswordResetController,
} from "src/controller";
import {
  AuthGrpcController,
  UserGrpcController,
  TenantGrpcController,
  ServiceGrpcController,
  UserBlockGrpcController,
} from "src/grpc-controller";
import { typeOrmAsyncConfig } from "src/database/typeorm.config";
import {
  AppService,
  ServiceService,
  UserService,
  TenantService,
  EmailVerificationService,
  AuthService,
  EmailService,
  UserBlockService,
  PasswordResetService,
} from "src/service";
import {
  Service,
  User,
  Tenant,
  Permission,
  UserBlockHistory,
  LoginHistory,
} from "src/database/entity";
import {
  ServiceRepository,
  UserRepository,
  TenantRepository,
  PermissionRepository,
  UserBlockHistoryRepository,
  LoginHistoryRepository,
} from "src/database/repository";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV || "local"}`,
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
    TypeOrmModule.forFeature([
      Service,
      Tenant,
      User,
      Permission,
      UserBlockHistory,
      LoginHistory,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService,
      ): Promise<JwtModuleOptions> => ({
        secret: configService.get<string>("JWT_SECRET") || "secret",
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRES_IN") || "1h",
        } as any,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AppController,
    ServiceController,
    TenantController,
    UserController,
    AuthController,
    UserBlockController,
    PasswordResetController,
    AuthGrpcController,
    UserGrpcController,
    TenantGrpcController,
    ServiceGrpcController,
    UserBlockGrpcController,
  ],
  providers: [
    AppService,
    ServiceService,
    ServiceRepository,
    TenantService,
    TenantRepository,
    UserService,
    UserRepository,
    PermissionRepository,
    EmailVerificationService,
    AuthService,
    EmailService,
    UserBlockService,
    UserBlockHistoryRepository,
    LoginHistoryRepository,
    PasswordResetService,
  ],
  exports: [
    AppService,
    ServiceService,
    ServiceRepository,
    TenantService,
    TenantRepository,
    UserService,
    UserRepository,
    PermissionRepository,
    EmailVerificationService,
    AuthService,
    EmailService,
    UserBlockService,
    UserBlockHistoryRepository,
    LoginHistoryRepository,
    PasswordResetService,
  ],
})
export class AppModule {}
