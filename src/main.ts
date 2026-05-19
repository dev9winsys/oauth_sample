import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle("Auth JWT API")
    .setDescription(
      "JWT認証システムAPI - ユーザー、テナント、サービスの管理とトークン発行",
    )
    .setVersion("1.0")
    .addApiKey({ type: "apiKey", name: "X-API-Key", in: "header" }, "X-API-Key")
    .addTag("auth", "認証関連のエンドポイント - トークンの発行と更新")
    .addTag("users", "ユーザー管理エンドポイント - ユーザーの作成、更新、削除")
    .addTag("tenant", "テナント管理エンドポイント - テナントの作成、更新、削除")
    .addTag(
      "services",
      "サービス管理エンドポイント - サービスの作成、更新、削除",
    )
    .addTag("app", "アプリケーション情報エンドポイント")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
