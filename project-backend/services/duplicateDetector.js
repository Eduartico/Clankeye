/**
 * 🔍 Duplicate Detection Service
 * 
 * Detects duplicate items across platforms by comparing:
 * - Title similarity (normalized + Levenshtein distance)
 * - Seller/username similarity
 * - Image URL similarity
 * - Price proximity
 * 
 * Items from DIFFERENT platforms with high combined similarity
 * are grouped as duplicates.
 */

// ─── String Utilities ────────────────────────────────────────────

/**
 * Compute Levenshtein distance between two strings
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Compute similarity ratio between two strings (0-1)
 * Uses Levenshtein distance normalized by max string length
 */
function stringSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLen;
}

/**
 * Normalize a string for comparison:
 * lowercase, remove special chars, collapse whitespace
 */
function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compute Jaccard similarity between word sets of two strings
 */
function wordSetSimilarity(a, b) {
  if (!a || !b) return 0;

  const setA = new Set(normalizeString(a).split(' ').filter(w => w.length > 1));
  const setB = new Set(normalizeString(b).split(' ').filter(w => w.length > 1));

  if (setA.size === 0 || setB.size === 0) return 0;

  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
}

/**
 * Extract image filename/path for comparison (strip CDN domains etc.)
 */
function normalizeImageUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    // Return just the pathname (strips CDN domains like img.vinted.net etc.)
    return parsed.pathname.toLowerCase().replace(/\/$/, '');
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Compare image arrays between two items
 * Returns similarity score 0-1 based on shared image paths
 */
function imageSimilarity(photos1, photos2) {
  if (!photos1?.length || !photos2?.length) return 0;

  const paths1 = new Set(photos1.map(normalizeImageUrl).filter(Boolean));
  const paths2 = new Set(photos2.map(normalizeImageUrl).filter(Boolean));

  if (paths1.size === 0 || paths2.size === 0) return 0;

  // Check for exact URL matches (very strong signal)
  const shared = [...paths1].filter(p => paths2.has(p));
  if (shared.length > 0) return 1.0;

  // Check for filename similarity (last segment of path)
  const filenames1 = [...paths1].map(p => p.split('/').pop());
  const filenames2 = [...paths2].map(p => p.split('/').pop());
  
  let maxSim = 0;
  for (const f1 of filenames1) {
    for (const f2 of filenames2) {
      const sim = stringSimilarity(f1, f2);
      if (sim > maxSim) maxSim = sim;
    }
  }

  return maxSim > 0.8 ? maxSim * 0.7 : 0; // Only count if filenames are very similar
}

// ─── Price Comparison ────────────────────────────────────────────

/**
 * Parse price from various formats to a number
 */
function parsePrice(price) {
  if (typeof price === 'number') return price;
  if (!price) return null;
  
  const cleaned = String(price)
    .replace(/[^\d.,]/g, '')
    .replace(',', '.');
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Compare prices - returns similarity 0-1
 * Same price = 1.0, within 10% = 0.8, within 20% = 0.5
 */
function priceSimilarity(price1, price2) {
  const p1 = parsePrice(price1);
  const p2 = parsePrice(price2);

  if (p1 === null || p2 === null) return 0; // can't compare
  if (p1 === 0 && p2 === 0) return 1;

  const avg = (p1 + p2) / 2;
  if (avg === 0) return 0;

  const diff = Math.abs(p1 - p2) / avg;

  if (diff === 0) return 1.0;
  if (diff <= 0.05) return 0.95;
  if (diff <= 0.10) return 0.8;
  if (diff <= 0.20) return 0.5;
  if (diff <= 0.30) return 0.3;
  return 0;
}

// ─── Main Duplicate Detector ─────────────────────────────────────

/**
 * Duplicate detection weights
 */
const WEIGHTS = {
  titleLevenshtein: 0.40,   // Levenshtein on normalized titles (main signal)
  titleWordSet: 0.30,        // Jaccard word overlap
  seller: 0.05,              // Seller name similarity (weak signal across platforms)
  price: 0.15,               // Price proximity
  images: 0.10,              // Image URL similarity
};

const DUPLICATE_THRESHOLD = 0.78; // minimum combined score to flag as duplicate
const MIN_TITLE_SIMILARITY = 0.60; // both title metrics must EACH exceed this floor

class DuplicateDetector {
  constructor(options = {}) {
    this.threshold = options.threshold || DUPLICATE_THRESHOLD;
    this.minTitleSimilarity = options.minTitleSimilarity || MIN_TITLE_SIMILARITY;
    this.weights = { ...WEIGHTS, ...options.weights };
  }

  /**
   * Compare two items and return a similarity score (0-1)
   */
  compareItems(item1, item2) {
    // Never compare items from the same platform
    if (item1.source === item2.source) return { score: 0, breakdown: {} };

    const normTitle1 = normalizeString(item1.title);
    const normTitle2 = normalizeString(item2.title);

    const breakdown = {
      titleLevenshtein: stringSimilarity(normTitle1, normTitle2),
      titleWordSet: wordSetSimilarity(item1.title, item2.title),
      seller: stringSimilarity(
        normalizeString(item1.seller?.name || item1.seller || ''),
        normalizeString(item2.seller?.name || item2.seller || '')
      ),
      price: priceSimilarity(item1.price, item2.price),
      images: imageSimilarity(item1.photos || item1.images, item2.photos || item2.images),
    };

    // Weighted average
    let score = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(this.weights)) {
      if (breakdown[key] !== undefined) {
        score += breakdown[key] * weight;
        totalWeight += weight;
      }
    }

    // Normalize if not all signals available
    if (totalWeight > 0 && totalWeight < 1) {
      score = score / totalWeight;
    }

    // Hard floor: if BOTH title metrics are below the minimum,
    // the items are clearly different products — force score to 0.
    if (breakdown.titleLevenshtein < this.minTitleSimilarity &&
        breakdown.titleWordSet < this.minTitleSimilarity) {
      score = 0;
    }

    return { score, breakdown };
  }

  /**
   * Detect duplicates across an array of items from multiple platforms.
   * Returns duplicate groups.
   * 
   * @param {Array} items - All items from all platforms
   * @returns {Array} Array of duplicate groups
   */
  detectDuplicates(items) {
    if (!items || items.length < 2) return [];

    const duplicateMap = new Map(); // item.id -> groupId
    const groups = [];
    let groupCounter = 0;

    // Compare every pair of items from DIFFERENT platforms
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const item1 = items[i];
        const item2 = items[j];

        // Skip same-platform comparisons
        if (item1.source === item2.source) continue;

        const { score, breakdown } = this.compareItems(item1, item2);

        if (score >= this.threshold) {
          const id1 = item1.id || item1.externalId || `${item1.source}-${i}`;
          const id2 = item2.id || item2.externalId || `${item2.source}-${j}`;

          const existingGroupId1 = duplicateMap.get(id1);
          const existingGroupId2 = duplicateMap.get(id2);

          if (existingGroupId1 !== undefined && existingGroupId2 !== undefined) {
            // Both already in groups - merge groups if different
            if (existingGroupId1 !== existingGroupId2) {
              // Merge group2 into group1
              const group1 = groups.find(g => g.groupId === existingGroupId1);
              const group2 = groups.find(g => g.groupId === existingGroupId2);
              if (group1 && group2) {
                group1.items.push(...group2.items);
                group1.maxSimilarity = Math.max(group1.maxSimilarity, group2.maxSimilarity, score);
                group2.items.forEach(it => {
                  const itId = it.id || it.externalId;
                  duplicateMap.set(itId, existingGroupId1);
                });
                // Remove empty group
                const idx = groups.indexOf(group2);
                if (idx >= 0) groups.splice(idx, 1);
              }
            }
          } else if (existingGroupId1 !== undefined) {
            // item1 already in a group, add item2
            const group = groups.find(g => g.groupId === existingGroupId1);
            if (group && !group.items.find(it => (it.id || it.externalId) === id2)) {
              group.items.push(item2);
              group.maxSimilarity = Math.max(group.maxSimilarity, score);
              duplicateMap.set(id2, existingGroupId1);
            }
          } else if (existingGroupId2 !== undefined) {
            // item2 already in a group, add item1
            const group = groups.find(g => g.groupId === existingGroupId2);
            if (group && !group.items.find(it => (it.id || it.externalId) === id1)) {
              group.items.push(item1);
              group.maxSimilarity = Math.max(group.maxSimilarity, score);
              duplicateMap.set(id1, existingGroupId2);
            }
          } else {
            // Neither in a group - create new group
            const groupId = `dup-${++groupCounter}`;
            groups.push({
              groupId,
              items: [item1, item2],
              maxSimilarity: score,
              breakdown,
            });
            duplicateMap.set(id1, groupId);
            duplicateMap.set(id2, groupId);
          }
        }
      }
    }

    return groups.map(g => ({
      groupId: g.groupId,
      items: g.items.map(it => ({
        id: it.id || it.externalId,
        title: it.title,
        price: it.price,
        source: it.source,
        url: it.url,
        image: it.photos?.[0] || it.image || null,
        seller: it.seller,
      })),
      itemCount: g.items.length,
      platforms: [...new Set(g.items.map(it => it.source))],
      maxSimilarity: Math.round(g.maxSimilarity * 100) / 100,
    }));
  }

  /**
   * Annotate items with their duplicate group IDs.
   * Adds `duplicateGroupId` and `duplicateCount` to matching items.
   * 
   * @param {Array} items - All items
   * @param {Array} groups - Duplicate groups from detectDuplicates()
   * @returns {Array} Items with duplicate annotations
   */
  annotateItems(items, groups) {
    // Build lookup: itemId -> groupId
    const lookup = new Map();
    for (const group of groups) {
      for (const dupItem of group.items) {
        lookup.set(dupItem.id, {
          groupId: group.groupId,
          duplicateCount: group.itemCount,
          platforms: group.platforms,
        });
      }
    }

    return items.map(item => {
      const itemId = item.id || item.externalId;
      const dupInfo = lookup.get(itemId);
      
      if (dupInfo) {
        return {
          ...item,
          duplicateGroupId: dupInfo.groupId,
          duplicateCount: dupInfo.duplicateCount,
          duplicatePlatforms: dupInfo.platforms,
        };
      }
      return item;
    });
  }
}

// Export singleton and class
export const duplicateDetector = new DuplicateDetector();
export { DuplicateDetector, normalizeString, stringSimilarity, wordSetSimilarity, parsePrice };
export default duplicateDetector;
