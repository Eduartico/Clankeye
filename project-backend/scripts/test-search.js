/**
 * Quick test search script
 * Run with: node scripts/test-search.js "your search query"
 * 
 * Tests the search functionality across all platforms
 */

import searchService from '../services/searchService.js';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

async function testSearch(query) {
  console.log('\n' + colors.cyan + `🔍 Searching for: "${query}"` + colors.reset + '\n');
  console.log('='.repeat(60));

  const startTime = Date.now();
  
  try {
    const results = await searchService.search({
      query,
      options: { limit: 10 },
    });

    const totalTime = Date.now() - startTime;

    // Platform results
    console.log('\n' + colors.blue + '📦 Platform Results:' + colors.reset + '\n');
    
    Object.entries(results.platforms).forEach(([name, data]) => {
      const icon = data.success ? colors.green + '✅' : colors.red + '❌';
      const count = data.success ? `${data.itemCount} items` : data.error;
      const latency = data.latency ? `${data.latency}ms` : '';
      
      console.log(`  ${icon} ${name.padEnd(18)}${colors.reset} ${count.toString().padEnd(20)} ${colors.dim}${latency}${colors.reset}`);
    });

    // Summary
    console.log('\n' + colors.blue + '📊 Summary:' + colors.reset);
    console.log(`   Total items:       ${results.meta.totalItems}`);
    console.log(`   Platforms success: ${results.meta.successfulPlatforms}`);
    console.log(`   Platforms failed:  ${results.meta.failedPlatforms}`);
    console.log(`   Total time:        ${totalTime}ms`);

    // Sample items
    if (results.items.length > 0) {
      console.log('\n' + colors.blue + '📋 Sample Items:' + colors.reset + '\n');
      
      results.items.slice(0, 5).forEach((item, i) => {
        console.log(`  ${i + 1}. ${colors.cyan}[${item.source}]${colors.reset} ${item.title.substring(0, 50)}...`);
        console.log(`     ${colors.dim}Price: ${item.price} ${item.currency || ''} | ${item.url.substring(0, 60)}...${colors.reset}`);
      });
    }

    console.log('\n');
    return results;
  } catch (error) {
    console.error(colors.red + 'Search failed:' + colors.reset, error.message);
    throw error;
  }
}

// Get query from command line args or use default
const query = process.argv[2] || 'pokemon cards';
testSearch(query).catch(console.error);

export default testSearch;
