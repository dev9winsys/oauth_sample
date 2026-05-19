const { execSync } = require('child_process');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ マイグレーション名を指定してください');
  console.error('使用方法: npm run migration:create <マイグレーション名>');
  process.exit(1);
}

const migrationName = args[0];

try {
  console.log(`🚀 マイグレーション作成中: ${migrationName}`);
  execSync(`npx typeorm migration:create src/database/migrations/${migrationName}`, {
    stdio: 'inherit',
  });
  
  console.log('✅ マイグレーション作成完了');
} catch (err) {
  console.error('❌ エラー:', err.message);
  process.exit(1);
}
