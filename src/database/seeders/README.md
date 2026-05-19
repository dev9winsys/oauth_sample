# データベースシーダー

このディレクトリには、開発・DEMO環境用のテストデータを投入するためのシーダーファイルが含まれています。

## シーダーとは

シーダーは、データベースに初期データやテストデータを投入するためのスクリプトです。
マイグレーション（スキーマ変更）とは別に管理され、以下のような用途で使用されます：

- 開発環境用のテストデータ投入
- DEMO環境用のサンプルデータ投入
- 初期マスターデータの投入

## シーダーの実行方法

### すべてのシーダーを実行

```bash
npm run seed:run
```

### シーダーをリバート（データ削除）

```bash
npm run seed:revert
```

## シーダーの追加方法

1. このディレクトリに新しいシーダーファイルを作成します（例: `new-data.seeder.ts`）

```typescript
import { QueryRunner } from "typeorm";

export class NewDataSeeder {
    public async run(queryRunner: QueryRunner): Promise<void> {
        // データ投入処理
        await queryRunner.query(`INSERT INTO ...`);
    }

    public async revert(queryRunner: QueryRunner): Promise<void> {
        // データ削除処理
        await queryRunner.query(`DELETE FROM ...`);
    }
}
```

2. `index.ts` の `seeders` 配列に追加します

```typescript
import { DemoDataSeeder } from './demo-data.seeder';
import { NewDataSeeder } from './new-data.seeder';

export const seeders = [
  DemoDataSeeder,
  NewDataSeeder, // 追加
];
```

## 注意事項

- シーダーは実行順序が重要です。`index.ts` の配列順に実行されます
- `revert` メソッドは配列の逆順で実行されます
- 本番環境ではシーダーを実行しないでください
- シーダーで投入するデータは、簡単に識別・削除できるようにしてください（例: 特定のメールドメイン、フラグなど）
