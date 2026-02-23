import searchOrchestrator from './services/searchOrchestrator.js';

console.log('Testing OLX BR + Leboncoin scrapers...');
console.log('==========================================');

try {
  const r = await searchOrchestrator.search({
    query: 'playstation',
    platforms: ['olx-br', 'leboncoin'],
    detectDuplicates: false,
  });

  console.log('\n=== RESULTS ===');
  console.log('OLX-BR:', r.platformStats['olx-br']?.count || 0, 'items');
  console.log('Leboncoin:', r.platformStats['leboncoin']?.count || 0, 'items');
  console.log('Total:', r.items.length, 'items');

  if (r.items.length > 0) {
    console.log('\nFirst 3 items:');
    r.items.slice(0, 3).forEach((item, i) => {
      console.log(`  [${i}] ${item.source}: "${item.title}" - ${item.price} - ${item.url?.substring(0, 80)}`);
    });
  }

  console.log('\nPlatform Stats:', JSON.stringify(r.platformStats, null, 2));
  if (Object.keys(r.errors).length > 0) {
    console.log('Errors:', JSON.stringify(r.errors, null, 2));
  }

  // Check dump files
  console.log('\nDump files should be in project-backend/data/dumps/');
} catch (e) {
  console.error('Test failed:', e.message);
  console.error(e.stack);
}

process.exit(0);
