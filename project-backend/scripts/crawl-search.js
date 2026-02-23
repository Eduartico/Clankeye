/**
 * 🔍 Crawlee Search Orchestrator
 * 
 * Searches for a term across ALL supported marketplace platforms using
 * Crawlee + Playwright for real browser-based scraping.
 * 
 * ⚡ All platforms are searched IN PARALLEL for maximum speed.
 * 
 * Usage:
 *   node scripts/crawl-search.js                          # defaults to "clone wars"
 *   node scripts/crawl-search.js "star wars figures"      # custom search term
 *   node scripts/crawl-search.js "clone wars" ebay,vinted # specific platforms only
 */

import { log, LogLevel } from 'crawlee';
import { createScraper, getScraperNames } from '../scrapers/index.js';

// ─── Configuration ───────────────────────────────────────────────
const SEARCH_TERM = process.argv[2] || 'clone wars';
const PLATFORMS_ARG = process.argv[3]; // optional comma-separated platform names
const HEADLESS = process.env.HEADLESS !== 'false'; // set HEADLESS=false to see browsers
const LOG_VERBOSE = process.env.LOG_VERBOSE === 'true';
const PAGE = parseInt(process.env.PAGE || '1', 10);

// Set Crawlee log level - use INFO by default, DEBUG if LOG_VERBOSE=true
log.setLevel(LOG_VERBOSE ? LogLevel.DEBUG : LogLevel.INFO);

// ─── Platform selection ──────────────────────────────────────────
const allPlatforms = getScraperNames();
const selectedPlatforms = PLATFORMS_ARG 
  ? PLATFORMS_ARG.split(',').map(p => p.trim()).filter(p => allPlatforms.includes(p))
  : allPlatforms;

if (selectedPlatforms.length === 0) {
  console.error(`❌ No valid platforms selected. Available: ${allPlatforms.join(', ')}`);
  process.exit(1);
}

// ─── Main execution ──────────────────────────────────────────────
console.log('\n');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         ⚡ CLANKEYE PARALLEL SEARCH ENGINE                  ║');
console.log('╠══════════════════════════════════════════════════════════════╣');
console.log(`║  Search term:  "${SEARCH_TERM}"`);
console.log(`║  Platforms:    ${selectedPlatforms.join(', ')}`);
console.log(`║  Headless:     ${HEADLESS}`);
console.log(`║  Page:         ${PAGE}`);
console.log(`║  Mode:         ⚡ PARALLEL (all at once)`);
console.log(`║  Total:        ${selectedPlatforms.length} platform(s)`);
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('\n');

const overallStart = Date.now();

/**
 * Scrape a single platform - returns result object
 */
async function scrapePlatform(platformName) {
  const startTime = Date.now();
  try {
    const scraper = createScraper(platformName, {
      headless: HEADLESS,
      maxRequestsPerCrawl: 1,
      requestHandlerTimeoutSecs: 90,
      navigationTimeoutSecs: 60,
    });

    const items = await scraper.search(SEARCH_TERM, PAGE);
    const elapsed = Date.now() - startTime;
    return { platform: platformName, items, elapsed, error: null };
  } catch (error) {
    const elapsed = Date.now() - startTime;
    return { platform: platformName, items: [], elapsed, error: error.message };
  }
}

// ⚡ Launch ALL platforms in parallel
console.log(`⚡ Launching ${selectedPlatforms.length} scrapers in parallel...\n`);

const results = await Promise.all(
  selectedPlatforms.map(name => scrapePlatform(name))
);

const totalElapsed = Date.now() - overallStart;

// ─── Build results maps ──────────────────────────────────────────
const allResults = {};
const errors = {};
const timings = {};

for (const r of results) {
  if (r.error) {
    errors[r.platform] = r.error;
  } else {
    allResults[r.platform] = r.items;
  }
  timings[r.platform] = r.elapsed;
}

// ─── Summary Report ──────────────────────────────────────────────
console.log('\n');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║                    📊 SEARCH SUMMARY                        ║');
console.log('╠══════════════════════════════════════════════════════════════╣');

let totalItems = 0;
for (const r of results) {
  totalItems += r.items.length;
  const status = r.error ? '❌ FAILED' : `✅ ${r.items.length} items`;
  console.log(`║  ${r.platform.padEnd(18)} │ ${status.padEnd(20)} │ ${r.elapsed}ms`);
  if (r.error) {
    console.log(`║  ${''.padEnd(18)} │ Error: ${r.error.substring(0, 40)}`);
  }
}

console.log('╠══════════════════════════════════════════════════════════════╣');
console.log(`║  TOTAL: ${totalItems} items from ${Object.keys(allResults).length} platforms`);
console.log(`║  ERRORS: ${Object.keys(errors).length} platform(s) failed`);
console.log(`║  WALL TIME: ${totalElapsed}ms (parallel)`);
console.log(`║  SUM TIME:  ${Object.values(timings).reduce((a, b) => a + b, 0)}ms (if sequential)`);
console.log('╚══════════════════════════════════════════════════════════════╝');

// ─── Detailed results dump ───────────────────────────────────────
console.log('\n\n📋 DETAILED RESULTS PER PLATFORM:\n');

for (const [platform, items] of Object.entries(allResults)) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`🏪 ${platform.toUpperCase()} (${items.length} items)`);
  console.log(`${'─'.repeat(50)}`);
  
  if (items.length === 0) {
    console.log('   (no items found)');
    continue;
  }

  const preview = items.slice(0, 5);
  preview.forEach((item, i) => {
    console.log(`\n   [${i + 1}] Title: ${item.title || '(no title)'}`);
    console.log(`       Price: ${item.price || '(no price)'}`);
    console.log(`       URL:   ${item.url || '(no url)'}`);
    console.log(`       Image: ${item.image ? item.image.substring(0, 80) + '...' : '(no image)'}`);
  });

  if (items.length > 5) {
    console.log(`\n   ... and ${items.length - 5} more items`);
  }
}

// ─── Write full results to JSON file ─────────────────────────────
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '..', 'crawl-results.json');

const output = {
  searchTerm: SEARCH_TERM,
  timestamp: new Date().toISOString(),
  platforms: selectedPlatforms,
  page: PAGE,
  mode: 'parallel',
  wallTimeMs: totalElapsed,
  results: allResults,
  errors,
  timings,
  summary: {
    totalItems,
    successfulPlatforms: Object.keys(allResults).length,
    failedPlatforms: Object.keys(errors).length,
  },
};

writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`\n💾 Full results saved to: ${outputPath}`);
console.log('\nDone! 🎉');
