const { execSync } = require('child_process');

try {
  console.log('🔧 ビルド中...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('🌱 シーダー実行中...');
  execSync('node dist/database/seeder-runner.js', {
    stdio: 'inherit',
  });
  
  console.log('✅ シーダー実行完了');
} catch (err) {
  console.error('❌ エラー:', err.message);
  process.exit(1);
}
