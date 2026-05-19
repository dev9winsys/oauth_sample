# ユーザ管理

## 機能一覧
・ユーザ登録・変更・削除
・メール検証（仮登録メール送信）
・JWT発行・更新
・臨時JWT発行
・gRPC API対応（REST APIと同等の機能を提供）

## ライブラリとしての使用

このパッケージは他のNestJSアプリケーションから利用可能なライブラリとして構築されています。

### インストール

#### GitHubから直接インストール

```bash
$ npm install git+https://github.com/dev9winsys/AuthJwt.git
```

#### ローカルパッケージとしてインストール（開発用）

```bash
$ npm install /path/to/AuthJwt
```

### 基本的な使い方

他のNestJSアプリケーションでこのライブラリをインポートして使用できます：

```typescript
import { AppModule, AuthService, UserService, ApiKeyGuard } from 'auth-jwt';
import { Module } from '@nestjs/common';

@Module({
  imports: [AppModule],
  // ... 他のモジュール設定
})
export class YourAppModule {}
```

### エクスポートされるコンポーネント

- **モジュール**: `AppModule`
- **サービス**: `AuthService`, `UserService`, `TenantService`, `ServiceService`, `EmailService`, `EmailVerificationService`
- **REST コントローラー**: `AuthController`, `UserController`, `TenantController`, `ServiceController`, `UserBlockController`
- **gRPC コントローラー**: `AuthGrpcController`, `UserGrpcController`, `TenantGrpcController`, `ServiceGrpcController`, `UserBlockGrpcController`
- **ガード**: `ApiKeyGuard`
- **エンティティ**: `User`, `Tenant`, `Service`, `Permission`
- **リポジトリ**: `UserRepository`, `TenantRepository`, `ServiceRepository`, `PermissionRepository`
- **DTO**: 各種DTOクラス（`CreateUserDto`, `UpdateUserDto`, `IssueTokenDto`等）

### gRPC サポート

このライブラリはgRPC APIもサポートしています。詳細な使用方法については、[gRPCコントローラーのREADME](src/grpc-controller/README.md)を参照してください。

利用可能なgRPCサービス：
- **AuthService** - JWT トークンの発行とリフレッシュ
- **UserService** - ユーザー管理 (CRUD、メール検証)
- **TenantService** - テナント管理
- **ServiceService** - サービス管理
- **UserBlockService** - ユーザーブロック/アンブロック

### 必要な環境変数と設定

`AppModule` は、データベース接続や JWT、メール送信のために、いくつかの環境変数に依存しています。  
このライブラリを他の NestJS アプリケーションから利用する場合、最低限以下の環境変数をアプリケーション側で設定してください。

#### データベース設定

- `DB_HOST` — データベースホスト名（例: `localhost`）
- `DB_PORT` — データベースポート（例: `5432`）
- `DB_USERNAME`（または `DB_USER`） — データベースユーザ名
- `DB_PASSWORD` — データベースパスワード
- `DB_NAME` — データベース名

#### JWT 設定

- `JWT_SECRET` — JWT 署名に使用するシークレットキー

#### SMTP / メール送信設定

メール認証（仮登録メール送信）などの機能を利用するには、SMTP サーバの設定が必要です。

- `SMTP_HOST` — SMTP サーバホスト名
- `SMTP_PORT` — SMTP サーバポート（例: `587`）
- `SMTP_USER` — SMTP 認証ユーザ名
- `SMTP_PASSWORD` — SMTP 認証パスワード
- `SMTP_FROM` — 送信元メールアドレス（例: `no-reply@example.com`）

#### 設定方法の例

1. アプリケーションルートに `.env` ファイルを作成し、次のように記述します:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
   
   JWT_SECRET=your_jwt_secret
   
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your_smtp_user
   SMTP_PASSWORD=your_smtp_password
   SMTP_FROM=no-reply@example.com
   ```

2. NestJS アプリケーション側で `@nestjs/config` などを用いて `.env` を読み込む、または
3. CI/CD や実行環境（例: `docker-compose.yml` の `environment` セクション）で同名の環境変数を設定します。

これらの環境変数が正しく設定されていない場合、アプリケーション起動時に接続エラーや認証エラーが発生する可能性があります。

## ドキュメント

- [メール認証設定](docs/EMAIL-VERIFICATION.md) - メール認証機能の設定方法
- [JWT API](docs/JWT-API.md) - JWT認証APIのドキュメント
- [Swagger API ドキュメント](docs/SWAGGER.md) - Swagger/OpenAPI仕様の利用方法
- [DEMOダミーデータ](docs/DEMO-DATA.md) - DEMO環境用のダミーデータについて

## スタンドアロンアプリケーションとしての起動


```bash
$ npm install
$ make start
```

```bash
$ npm install
$ docker compose up -d
$ npm run start:dev
$ npm run start:prod
```

## データベースマイグレーション

### マイグレーションファイルの作成（手動）

```bash
$ npm run migration:create <マイグレーション名>
```

空のマイグレーションファイルが `src/database/migrations/` に作成されます。

### マイグレーションファイルの自動生成

データベースに接続し、エンティティとの差分から自動的にマイグレーションを生成します：

```bash
$ npm run migration:generate <マイグレーション名>
```

注意: このコマンドは実行中のデータベースが必要です。

### マイグレーションの実行

```bash
$ npm run migration:run
```

### マイグレーションのロールバック

```bash
$ npm run migration:revert
```

## データベースシーダー

シーダーは、開発・DEMO環境用のテストデータを投入するために使用します。マイグレーション（スキーマ変更）とは別に管理されています。

### シーダーの実行

```bash
$ npm run seed:run
```

シーダーファイルは `src/database/seeders/` ディレクトリに配置されています。

### シーダーのリバート（データ削除）

```bash
$ npm run seed:revert
```

注意: シーダーで投入されたデータのみが削除されます。

## テスト

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
