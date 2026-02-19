/**
 * Platform Status Script
 * Run with: node scripts/platform-status.js
 * 
 * Checks the health status of all registered platforms
 */

import platformRegistry from '../platforms/index.js';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

async function checkAllPlatforms() {
  console.log('\n' + colors.cyan + '🔍 Clankeye Platform Status Check' + colors.reset + '\n');
  console.log('='.repeat(60));

  const platforms = platformRegistry.getAll();
  const results = [];

  for (const platform of platforms) {
    process.stdout.write(`  Checking ${platform.displayName.padEnd(20)}... `);
    
    const startTime = Date.now();
    try {
      const status = await platform.healthCheck();
      const latency = Date.now() - startTime;
      
      if (status.status === 'healthy') {
        console.log(colors.green + '✅ HEALTHY' + colors.reset + colors.dim + ` (${latency}ms)` + colors.reset);
        results.push({ name: platform.name, status: 'healthy', latency });
      } else {
        console.log(colors.red + '❌ UNHEALTHY' + colors.reset + ` - ${status.error || 'Unknown error'}`);
        results.push({ name: platform.name, status: 'unhealthy', error: status.error });
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      console.log(colors.red + '❌ ERROR' + colors.reset + ` - ${error.message}`);
      results.push({ name: platform.name, status: 'error', error: error.message, latency });
    }
  }

  console.log('='.repeat(60));
  
  // Summary
  const healthy = results.filter(r => r.status === 'healthy').length;
  const unhealthy = results.filter(r => r.status !== 'healthy').length;
  
  console.log('\n' + colors.blue + '📊 Summary:' + colors.reset);
  console.log(`   ${colors.green}Healthy:${colors.reset}   ${healthy}/${platforms.length}`);
  console.log(`   ${colors.red}Unhealthy:${colors.reset} ${unhealthy}/${platforms.length}`);
  
  if (healthy === platforms.length) {
    console.log('\n' + colors.green + '🎉 All platforms are operational!' + colors.reset + '\n');
  } else {
    console.log('\n' + colors.yellow + '⚠️  Some platforms have issues.' + colors.reset + '\n');
  }

  return results;
}

// Run if called directly
checkAllPlatforms().catch(console.error);

export default checkAllPlatforms;
