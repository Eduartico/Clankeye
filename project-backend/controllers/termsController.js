/**
 * Terms Controller — CRUD for wishlist & filter terms
 */

import {
  getWishlistTerms, setWishlistTerms, addWishlistTerm, removeWishlistTerm,
  getFilterTerms, setFilterTerms, addFilterTerm, removeFilterTerm,
} from '../services/termService.js';

// ─── Wishlist ───────────────────────────────────────────────────

export function getWishlist(req, res) {
  try {
    res.json({ success: true, data: getWishlistTerms() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

export function updateWishlist(req, res) {
  try {
    const { terms } = req.body;
    if (!Array.isArray(terms)) return res.status(400).json({ success: false, error: 'terms must be an array' });
    res.json({ success: true, data: setWishlistTerms(terms) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

export function addToWishlist(req, res) {
  try {
    const { term } = req.body;
    if (!term) return res.status(400).json({ success: false, error: 'term is required' });
    res.json({ success: true, data: addWishlistTerm(term) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

export function removeFromWishlist(req, res) {
  try {
    const { term } = req.body;
    if (!term) return res.status(400).json({ success: false, error: 'term is required' });
    res.json({ success: true, data: removeWishlistTerm(term) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

// ─── Filter ─────────────────────────────────────────────────────

export function getFilter(req, res) {
  try {
    res.json({ success: true, data: getFilterTerms() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

export function updateFilter(req, res) {
  try {
    const { terms } = req.body;
    if (!Array.isArray(terms)) return res.status(400).json({ success: false, error: 'terms must be an array' });
    res.json({ success: true, data: setFilterTerms(terms) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

export function addToFilter(req, res) {
  try {
    const { term } = req.body;
    if (!term) return res.status(400).json({ success: false, error: 'term is required' });
    res.json({ success: true, data: addFilterTerm(term) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

export function removeFromFilter(req, res) {
  try {
    const { term } = req.body;
    if (!term) return res.status(400).json({ success: false, error: 'term is required' });
    res.json({ success: true, data: removeFilterTerm(term) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}
