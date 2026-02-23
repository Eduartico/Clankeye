/**
 * Wishlist & Filter Term Service
 *
 * Manages two local JSON files in the project root:
 *   - wishlist.json  →  terms that HIGHLIGHT matching items
 *   - filter.json    →  terms that REMOVE matching items (takes priority over wishlist)
 *
 * Each file is a simple JSON array of lowercase strings.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

const WISHLIST_FILE = path.join(DATA_DIR, 'wishlist.json');
const FILTER_FILE = path.join(DATA_DIR, 'filter.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ─── Helpers ────────────────────────────────────────────────────

function readTermsFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const terms = JSON.parse(raw);
    return Array.isArray(terms) ? terms.map(t => String(t).toLowerCase().trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeTermsFile(filePath, terms) {
  const unique = [...new Set(terms.map(t => String(t).toLowerCase().trim()).filter(Boolean))];
  fs.writeFileSync(filePath, JSON.stringify(unique, null, 2), 'utf-8');
  return unique;
}

// ─── Public API ─────────────────────────────────────────────────

export function getWishlistTerms() {
  return readTermsFile(WISHLIST_FILE);
}

export function setWishlistTerms(terms) {
  return writeTermsFile(WISHLIST_FILE, terms);
}

export function addWishlistTerm(term) {
  const terms = getWishlistTerms();
  const normalized = String(term).toLowerCase().trim();
  if (!normalized || terms.includes(normalized)) return terms;
  terms.push(normalized);
  return writeTermsFile(WISHLIST_FILE, terms);
}

export function removeWishlistTerm(term) {
  const terms = getWishlistTerms();
  const normalized = String(term).toLowerCase().trim();
  const filtered = terms.filter(t => t !== normalized);
  return writeTermsFile(WISHLIST_FILE, filtered);
}

export function getFilterTerms() {
  return readTermsFile(FILTER_FILE);
}

export function setFilterTerms(terms) {
  return writeTermsFile(FILTER_FILE, terms);
}

export function addFilterTerm(term) {
  const terms = getFilterTerms();
  const normalized = String(term).toLowerCase().trim();
  if (!normalized || terms.includes(normalized)) return terms;
  terms.push(normalized);
  return writeTermsFile(FILTER_FILE, terms);
}

export function removeFilterTerm(term) {
  const terms = getFilterTerms();
  const normalized = String(term).toLowerCase().trim();
  const filtered = terms.filter(t => t !== normalized);
  return writeTermsFile(FILTER_FILE, filtered);
}

/**
 * Check if an item matches any term from a list.
 * Matches against title, description, and category (case-insensitive).
 *
 * @param {Object} item - Item with title, description, category fields
 * @param {string[]} terms - Array of lowercase terms
 * @returns {string[]} Array of matching terms
 */
export function matchingTerms(item, terms) {
  if (!terms || terms.length === 0) return [];

  const searchable = [
    item.title || '',
    item.description || '',
    item.category || '',
  ].join(' ').toLowerCase();

  return terms.filter(term => searchable.includes(term));
}
