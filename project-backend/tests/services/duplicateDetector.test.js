/**
 * Tests for DuplicateDetector service
 */

import { jest } from '@jest/globals';

// Dynamic import for ESM compatibility
let DuplicateDetector, normalizeString, stringSimilarity, wordSetSimilarity, parsePrice;

beforeAll(async () => {
  const mod = await import('../../services/duplicateDetector.js');
  DuplicateDetector = mod.DuplicateDetector;
  normalizeString = mod.normalizeString;
  stringSimilarity = mod.stringSimilarity;
  wordSetSimilarity = mod.wordSetSimilarity;
  parsePrice = mod.parsePrice;
});

describe('DuplicateDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new DuplicateDetector();
  });

  // ─── String Utilities ────────────────────────────────────────

  describe('normalizeString', () => {
    test('lowercases and removes special chars', () => {
      expect(normalizeString('Clone Wars™ Figure!')).toBe('clone wars figure');
    });

    test('collapses whitespace', () => {
      expect(normalizeString('  hello   world  ')).toBe('hello world');
    });

    test('handles null/undefined', () => {
      expect(normalizeString(null)).toBe('');
      expect(normalizeString(undefined)).toBe('');
    });
  });

  describe('stringSimilarity', () => {
    test('identical strings return 1', () => {
      expect(stringSimilarity('hello', 'hello')).toBe(1);
    });

    test('completely different strings return low score', () => {
      expect(stringSimilarity('abc', 'xyz')).toBeLessThan(0.3);
    });

    test('similar strings return high score', () => {
      expect(stringSimilarity('clone wars figure', 'clone wars figures')).toBeGreaterThan(0.9);
    });

    test('handles empty strings', () => {
      expect(stringSimilarity('', '')).toBe(0); // both empty = no data to compare
      expect(stringSimilarity('hello', '')).toBe(0);
    });
  });

  describe('wordSetSimilarity', () => {
    test('identical word sets return 1', () => {
      expect(wordSetSimilarity('clone wars figure', 'clone wars figure')).toBe(1);
    });

    test('overlapping words return partial score', () => {
      const score = wordSetSimilarity('clone wars figure hasbro', 'clone wars toy');
      expect(score).toBeGreaterThan(0.2);
      expect(score).toBeLessThan(0.8);
    });

    test('no overlap returns 0', () => {
      expect(wordSetSimilarity('hello world', 'foo bar')).toBe(0);
    });
  });

  describe('parsePrice', () => {
    test('parses number directly', () => {
      expect(parsePrice(25.99)).toBe(25.99);
    });

    test('parses string with currency symbol', () => {
      expect(parsePrice('€25.99')).toBe(25.99);
    });

    test('parses string with comma decimal', () => {
      expect(parsePrice('25,99')).toBe(25.99);
    });

    test('returns null for invalid', () => {
      expect(parsePrice(null)).toBeNull();
      expect(parsePrice('free')).toBeNull();
    });
  });

  // ─── compareItems ────────────────────────────────────────────

  describe('compareItems', () => {
    test('same platform items always return 0', () => {
      const item1 = { title: 'Clone Wars Figure', source: 'ebay', price: '25' };
      const item2 = { title: 'Clone Wars Figure', source: 'ebay', price: '25' };
      const { score } = detector.compareItems(item1, item2);
      expect(score).toBe(0);
    });

    test('very similar items from different platforms score high', () => {
      const item1 = {
        title: 'Star Wars Clone Wars Action Figure Hasbro',
        source: 'ebay',
        price: '29.99',
        seller: { name: 'toys_collector' },
      };
      const item2 = {
        title: 'Star Wars Clone Wars Action Figure Hasbro',
        source: 'vinted',
        price: '30.00',
        seller: { name: 'toys_collector' },
      };
      const { score } = detector.compareItems(item1, item2);
      expect(score).toBeGreaterThan(0.8);
    });

    test('completely different items score low', () => {
      const item1 = {
        title: 'Red sneakers Nike size 42',
        source: 'ebay',
        price: '50',
      };
      const item2 = {
        title: 'Vintage Clock Grandfather Antique',
        source: 'vinted',
        price: '200',
      };
      const { score } = detector.compareItems(item1, item2);
      expect(score).toBeLessThan(0.3);
    });
  });

  // ─── detectDuplicates ────────────────────────────────────────

  describe('detectDuplicates', () => {
    test('empty array returns no groups', () => {
      expect(detector.detectDuplicates([])).toEqual([]);
    });

    test('single item returns no groups', () => {
      expect(detector.detectDuplicates([{ title: 'test', source: 'ebay' }])).toEqual([]);
    });

    test('detects duplicates across platforms', () => {
      const items = [
        { id: 'ebay-1', title: 'Clone Wars Figure Hasbro', source: 'ebay', price: '25' },
        { id: 'vinted-1', title: 'Clone Wars Figure Hasbro', source: 'vinted', price: '25' },
        { id: 'ebay-2', title: 'Red Shoes Nike', source: 'ebay', price: '50' },
      ];

      const groups = detector.detectDuplicates(items);
      expect(groups.length).toBeGreaterThanOrEqual(1);
      expect(groups[0].items.length).toBe(2);
      expect(groups[0].platforms).toContain('ebay');
      expect(groups[0].platforms).toContain('vinted');
    });

    test('does not group items from the same platform', () => {
      const items = [
        { id: 'ebay-1', title: 'Clone Wars Figure', source: 'ebay', price: '25' },
        { id: 'ebay-2', title: 'Clone Wars Figure', source: 'ebay', price: '25' },
      ];

      const groups = detector.detectDuplicates(items);
      expect(groups.length).toBe(0);
    });
  });

  // ─── annotateItems ──────────────────────────────────────────

  describe('annotateItems', () => {
    test('adds duplicate info to matching items', () => {
      const items = [
        { id: 'ebay-1', title: 'Test Item', source: 'ebay' },
        { id: 'vinted-1', title: 'Test Item', source: 'vinted' },
      ];

      const groups = [{
        groupId: 'dup-1',
        items: [
          { id: 'ebay-1', source: 'ebay', title: 'Test Item' },
          { id: 'vinted-1', source: 'vinted', title: 'Test Item' },
        ],
        itemCount: 2,
        platforms: ['ebay', 'vinted'],
        maxSimilarity: 0.95,
      }];

      const annotated = detector.annotateItems(items, groups);
      expect(annotated[0].duplicateGroupId).toBe('dup-1');
      expect(annotated[0].duplicateCount).toBe(2);
      expect(annotated[1].duplicateGroupId).toBe('dup-1');
    });

    test('items without duplicates are unchanged', () => {
      const items = [{ id: 'ebay-99', title: 'Unique Item', source: 'ebay' }];
      const annotated = detector.annotateItems(items, []);
      expect(annotated[0].duplicateGroupId).toBeUndefined();
    });
  });
});
