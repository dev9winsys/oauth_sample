# gRPC コントローラー

このディレクトリには、AuthJwtライブラリのgRPC実装が含まれています。

## 概要

gRPCコントローラーは、REST APIコントローラーと同じサービス層を使用しており、gRPC形式で同じ機能を提供します。

## 利用可能なgRPCサービス

### 1. AuthService (`auth.proto`)
- `IssueToken` - JWTトークンを発行
- `RefreshToken` - JWTトークンをリフレッシュ

### 2. UserService (`user.proto`)
- `CreateUser` - 新規ユーザーを作成
- `UpdateUser` - ユーザー情報を更新
- `SoftDeleteUser` - ユーザーを論理削除
- `VerifyEmail` - メールアドレスを検証

### 3. TenantService (`tenant.proto`)
- `CreateTenant` - 新規テナントを作成
- `UpdateTenant` - テナント情報を更新
- `DeleteTenant` - テナントを削除

### 4. ServiceService (`service.proto`)
- `CreateService` - 新規サービスを作成
- `UpdateService` - サービス情報を更新
- `SoftDeleteService` - サービスを論理削除

### 5. UserBlockService (`user-block.proto`)
- `BlockUser` - ユーザーをブロック
- `UnblockUser` - ユーザーのブロックを解除

## 使用方法

### NestJSアプリケーションでのgRPC設定

```typescript
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from 'auth-jwt';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: ['auth', 'user', 'tenant', 'service', 'user_block'],
        protoPath: [
          join(__dirname, '../node_modules/auth-jwt/proto/auth.proto'),
          join(__dirname, '../node_modules/auth-jwt/proto/user.proto'),
          join(__dirname, '../node_modules/auth-jwt/proto/tenant.proto'),
          join(__dirname, '../node_modules/auth-jwt/proto/service.proto'),
          join(__dirname, '../node_modules/auth-jwt/proto/user-block.proto'),
        ],
        url: '0.0.0.0:50051',
      },
    },
  );
  await app.listen();
}
bootstrap();
```

### ハイブリッドアプリケーション（RESTとgRPCの両方）

```typescript
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from 'auth-jwt';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // gRPCマイクロサービスを接続
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: ['auth', 'user', 'tenant', 'service', 'user_block'],
      protoPath: [
        join(__dirname, '../node_modules/auth-jwt/proto/auth.proto'),
        join(__dirname, '../node_modules/auth-jwt/proto/user.proto'),
        join(__dirname, '../node_modules/auth-jwt/proto/tenant.proto'),
        join(__dirname, '../node_modules/auth-jwt/proto/service.proto'),
        join(__dirname, '../node_modules/auth-jwt/proto/user-block.proto'),
      ],
      url: '0.0.0.0:50051',
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
```

## gRPCクライアントの例

### AuthServiceの使用例

```typescript
import { ClientGrpc } from '@nestjs/microservices';

interface AuthService {
  issueToken(data: { user_id: string; services?: any[] }): Observable<any>;
  refreshToken(data: { token: string }): Observable<any>;
}

@Injectable()
export class MyService {
  private authService: AuthService;

  constructor(@Inject('AUTH_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthService>('AuthService');
  }

  async getToken(userId: string) {
    return this.authService.issueToken({ 
      user_id: userId,
      services: [{
        service_id: 'service-1',
        service_name: 'My Service',
        permissions: ['read', 'write']
      }]
    }).toPromise();
  }
}
```

## セキュリティに関する重要な注意事項

⚠️ **認証・認可は必須です**

gRPCエンドポイントは、REST APIコントローラーとは異なり、**デフォルトでは `ApiKeyGuard` などの認証ガードを使用しません**。これらのエンドポイントは、トークン発行、ユーザー管理、テナント管理、ユーザーブロックなどの機密操作を含むため、**外部からアクセス可能なポートで公開する前に必ず適切な認証・認可を実装してください。**

### 推奨されるセキュリティ対策

1. **gRPCメタデータ検証ガードの実装**
   - `switchToRpc()` コンテキストでAPIキーやトークンを検証するガードまたはインターセプターを実装
   - すべてのgRPCコントローラーに適用

2. **ネットワーク分離**
   - gRPCポートを内部ネットワークのみからアクセス可能にする
   - 必要に応じてVPNやファイアウォールルールを設定

3. **TLS/mTLS の有効化**
   - 本番環境では必ずTLS暗号化を使用
   - 相互TLS (mTLS) による双方向認証を推奨

### 認証実装例

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class GrpcAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const metadata = context.switchToRpc().getContext();
    const apiKey = metadata.get('x-api-key')[0];
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
      throw new RpcException({
        code: 16, // UNAUTHENTICATED
        message: 'Invalid API key',
      });
    }
    
    return true;
  }
}
```

すべてのgRPCコントローラーに `@UseGuards(GrpcAuthGuard)` を追加してください。

## その他の注意事項

- gRPCコントローラーは、入力データに対してDTO検証を実行します（`class-validator` を使用）
- protoファイルは `proto/` ディレクトリに配置されており、npmパッケージに含まれています
- 日付フィールドは ISO 8601 形式の文字列として送信してください
- 無効なデータが送信された場合、適切なgRPCエラーコード（INVALID_ARGUMENT など）で応答します
