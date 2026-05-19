const { execSync } = require('child_process');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ マイグレーション名を指定してください');
  console.error('使用方法: npm run migration:generate <マイグレーション名>');
  process.exit(1);
}

const migrationName = args[0];
const migrationPath = `src/database/migrations/${migrationName}`;

try {
  console.log('🔧 ビルド中...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log(`🚀 マイグレーション生成中: ${migrationPath}`);
  execSync(`npx typeorm migration:generate ${migrationPath} -d dist/database/data-source.js`, {
    stdio: 'inherit',
  });
  
  console.log('✅ マイグレーション生成完了');
} catch (err) {
  console.error('❌ エラー:', err.message);
  process.exit(1);
}