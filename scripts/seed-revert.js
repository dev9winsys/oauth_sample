const { execSync } = require('child_process');

try {
  console.log('🔧 ビルド中...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('⏮️  シーダーリバート中...');
  execSync('node dist/database/seeder-runner.js revert', {
    stdio: 'inherit',
  });
  
  console.log('✅ シーダーリバート完了');
} catch (err) {
  console.error('❌ エラー:', err.message);
  process.exit(1);
}
