# Clankeye Architecture Rework Plan

## Overview

Clankeye is an API gateway for collectors to search items across multiple online marketplaces. This document outlines the architecture rework to support scalable multi-platform integration and enhanced UI theming.

---

## 🎯 Goals

1. **Scalable Platform Support** - Easy addition of new marketplace platforms
2. **Unified Data Model** - All platforms output standardized `Item` objects
3. **Comprehensive Testing** - Each platform has its own test suite with status visibility
4. **Enhanced Theming** - Light/dark modes with customizable accent colors

---

## 📦 Backend Architecture

### Current Structure (Problems)
```
services/
  olxService.js      # Direct API calls, no abstraction
  vintedService.js   # Different implementation pattern
controllers/
  olxController.js   # Mixed concerns (transformation + routing)
  vintedController.js
  generalController.js # Hardcoded platform logic
```

### Proposed Structure
```
project-backend/
├── config/
│   ├── index.js                 # Main config export
│   ├── platforms.js             # Platform registry & feature flags
│   └── constants.js             # Shared constants
│
├── platforms/                   # 🆕 Platform-specific implementations
│   ├── base/
│   │   └── BasePlatform.js      # Abstract base class
│   │
│   ├── ebay/
│   │   ├── EbayPlatform.js      # Platform implementation
│   │   ├── ebay.config.js       # Platform-specific config
│   │   ├── ebay.transformer.js  # Response → Item transformation
│   │   └── ebay.test.js         # Platform tests
│   │
│   ├── olx-pt/
│   │   ├── OlxPtPlatform.js
│   │   ├── olx-pt.config.js
│   │   ├── olx-pt.transformer.js
│   │   └── olx-pt.test.js
│   │
│   ├── olx-br/
│   │   ├── OlxBrPlatform.js
│   │   ├── olx-br.config.js
│   │   ├── olx-br.transformer.js
│   │   └── olx-br.test.js
│   │
│   ├── olx-pl/
│   │   ├── OlxPlPlatform.js
│   │   ├── olx-pl.config.js
│   │   ├── olx-pl.transformer.js
│   │   └── olx-pl.test.js
│   │
│   ├── vinted/
│   │   ├── VintedPlatform.js
│   │   ├── vinted.config.js
│   │   ├── vinted.transformer.js
│   │   └── vinted.test.js
│   │
│   ├── wallapop/
│   │   ├── WallapopPlatform.js
│   │   ├── wallapop.config.js
│   │   ├── wallapop.transformer.js
│   │   └── wallapop.test.js
│   │
│   ├── todocoleccion/
│   │   ├── TodocoleccionPlatform.js
│   │   ├── todocoleccion.config.js
│   │   ├── todocoleccion.transformer.js
│   │   └── todocoleccion.test.js
│   │
│   ├── leboncoin/
│   │   ├── LeboncoinPlatform.js
│   │   ├── leboncoin.config.js
│   │   ├── leboncoin.transformer.js
│   │   └── leboncoin.test.js
│   │
│   └── index.js                 # Platform registry & factory
│
├── models/
│   ├── Item.js                  # Enhanced Item model
│   ├── SearchQuery.js           # Standardized search parameters
│   └── PlatformStatus.js        # Platform health/status model
│
├── controllers/
│   ├── searchController.js      # Unified search endpoint
│   ├── platformController.js    # Platform status & management
│   └── healthController.js      # API health checks
│
├── services/
│   ├── searchService.js         # Orchestrates multi-platform search
│   ├── cacheService.js          # Response caching (optional)
│   └── rateLimitService.js      # Per-platform rate limiting
│
├── middleware/
│   ├── errorHandler.js          # Global error handling
│   ├── requestLogger.js         # Request logging
│   └── validator.js             # Input validation
│
├── utils/
│   ├── httpClient.js            # Enhanced HTTP client
│   ├── retryHelper.js           # Retry logic with backoff
│   └── itemUtils.js             # Item utilities
│
├── tests/
│   ├── setup.js                 # Test configuration
│   ├── helpers/
│   │   ├── mockFactory.js       # Mock data generators
│   │   └── testUtils.js         # Test utilities
│   └── integration/
│       └── search.test.js       # Integration tests
│
├── routes.js                    # Route definitions
├── server.js                    # Server entry point
└── package.json
```

---

## 🔧 Core Components

### 1. Base Platform Class (`platforms/base/BasePlatform.js`)

```javascript
/**
 * Abstract base class for all marketplace platforms.
 * Each platform must implement these methods.
 */
export default class BasePlatform {
  constructor(config) {
    this.name = config.name;           // e.g., 'ebay'
    this.displayName = config.displayName; // e.g., 'eBay'
    this.baseUrl = config.baseUrl;
    this.enabled = config.enabled ?? true;
    this.rateLimit = config.rateLimit || { requests: 10, period: 1000 };
    this.timeout = config.timeout || 10000;
    this.region = config.region || null;
    this.currency = config.currency || 'EUR';
  }

  /**
   * Search for items on this platform
   * @param {SearchQuery} query - Standardized search parameters
   * @returns {Promise<Item[]>} - Array of normalized Item objects
   */
  async search(query) {
    throw new Error('search() must be implemented by subclass');
  }

  /**
   * Transform raw API response to Item model
   * @param {Object} rawData - Raw API response
   * @returns {Item[]} - Normalized items
   */
  transform(rawData) {
    throw new Error('transform() must be implemented by subclass');
  }

  /**
   * Build platform-specific query parameters
   * @param {SearchQuery} query - Standardized query
   * @returns {Object} - Platform-specific params
   */
  buildQueryParams(query) {
    throw new Error('buildQueryParams() must be implemented by subclass');
  }

  /**
   * Check if platform is healthy/accessible
   * @returns {Promise<PlatformStatus>}
   */
  async healthCheck() {
    throw new Error('healthCheck() must be implemented by subclass');
  }

  /**
   * Get platform-specific configuration
   * @returns {Object}
   */
  getConfig() {
    return {
      name: this.name,
      displayName: this.displayName,
      enabled: this.enabled,
      region: this.region,
      currency: this.currency,
    };
  }
}
```

### 2. Platform Implementation Example (`platforms/ebay/EbayPlatform.js`)

```javascript
import BasePlatform from '../base/BasePlatform.js';
import Item from '../../models/Item.js';
import { httpClient } from '../../utils/httpClient.js';
import config from './ebay.config.js';
import { transformEbayItem } from './ebay.transformer.js';

export default class EbayPlatform extends BasePlatform {
  constructor() {
    super(config);
    this.apiVersion = 'v1';
  }

  async search(query) {
    const params = this.buildQueryParams(query);
    
    const response = await httpClient.get(`${this.baseUrl}/search`, {
      params,
      timeout: this.timeout,
      headers: this.getHeaders(),
    });

    return this.transform(response.data);
  }

  buildQueryParams(query) {
    return {
      q: query.text,
      limit: query.limit || 50,
      offset: query.offset || 0,
      sort: this.mapSortOption(query.sort),
      filter: this.buildFilters(query),
    };
  }

  transform(rawData) {
    const items = rawData.itemSummaries || [];
    return items.map(item => transformEbayItem(item));
  }

  mapSortOption(sort) {
    const sortMap = {
      'newest': 'newlyListed',
      'price_asc': 'price',
      'price_desc': '-price',
      'relevance': 'bestMatch',
    };
    return sortMap[sort] || 'bestMatch';
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${process.env.EBAY_API_KEY}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
    };
  }

  async healthCheck() {
    try {
      await httpClient.get(`${this.baseUrl}/ping`, { timeout: 5000 });
      return { name: this.name, status: 'healthy', latency: 0 };
    } catch (error) {
      return { name: this.name, status: 'unhealthy', error: error.message };
    }
  }
}
```

### 3. Enhanced Item Model (`models/Item.js`)

```javascript
/**
 * Unified item model for all platforms
 */
export default class Item {
  constructor({
    id,
    externalId,        // Original platform ID
    url,
    title,
    description,
    category,
    price,
    originalPrice,     // For items on sale
    currency,
    shipping,          // Shipping cost info
    condition,         // new, used, refurbished, etc.
    location,          // Seller location
    seller,            // Seller info object
    createdTime,
    updatedTime,
    isOnWishlist = false,
    source,            // Platform name
    sourceRegion,      // Platform region (e.g., 'pt', 'fr')
    photos = [],
    attributes = {},   // Platform-specific attributes
  }) {
    this.id = id || `${source}-${externalId}`;
    this.externalId = externalId;
    this.url = url;
    this.title = title;
    this.description = description;
    this.category = category;
    this.price = price;
    this.originalPrice = originalPrice;
    this.currency = currency;
    this.shipping = shipping;
    this.condition = condition;
    this.location = location;
    this.seller = seller;
    this.createdTime = createdTime;
    this.updatedTime = updatedTime;
    this.isOnWishlist = isOnWishlist;
    this.source = source;
    this.sourceRegion = sourceRegion;
    this.photos = photos;
    this.attributes = attributes;
  }

  /**
   * Validate item has required fields
   */
  isValid() {
    return !!(this.id && this.title && this.source && this.url);
  }

  /**
   * Convert to JSON-serializable object
   */
  toJSON() {
    return {
      id: this.id,
      externalId: this.externalId,
      url: this.url,
      title: this.title,
      description: this.description,
      category: this.category,
      price: this.price,
      originalPrice: this.originalPrice,
      currency: this.currency,
      shipping: this.shipping,
      condition: this.condition,
      location: this.location,
      seller: this.seller,
      createdTime: this.createdTime,
      updatedTime: this.updatedTime,
      isOnWishlist: this.isOnWishlist,
      source: this.source,
      sourceRegion: this.sourceRegion,
      photos: this.photos,
      attributes: this.attributes,
    };
  }
}
```

### 4. Platform Registry (`platforms/index.js`)

```javascript
import EbayPlatform from './ebay/EbayPlatform.js';
import OlxPtPlatform from './olx-pt/OlxPtPlatform.js';
import OlxBrPlatform from './olx-br/OlxBrPlatform.js';
import OlxPlPlatform from './olx-pl/OlxPlPlatform.js';
import VintedPlatform from './vinted/VintedPlatform.js';
import WallapopPlatform from './wallapop/WallapopPlatform.js';
import TodocoleccionPlatform from './todocoleccion/TodocoleccionPlatform.js';
import LeboncoinPlatform from './leboncoin/LeboncoinPlatform.js';

/**
 * Platform registry - single source of truth for all platforms
 */
class PlatformRegistry {
  constructor() {
    this.platforms = new Map();
    this.registerDefaults();
  }

  registerDefaults() {
    this.register('ebay', EbayPlatform);
    this.register('olx-pt', OlxPtPlatform);
    this.register('olx-br', OlxBrPlatform);
    this.register('olx-pl', OlxPlPlatform);
    this.register('vinted', VintedPlatform);
    this.register('wallapop', WallapopPlatform);
    this.register('todocoleccion', TodocoleccionPlatform);
    this.register('leboncoin', LeboncoinPlatform);
  }

  register(name, PlatformClass) {
    this.platforms.set(name, new PlatformClass());
  }

  get(name) {
    return this.platforms.get(name);
  }

  getAll() {
    return Array.from(this.platforms.values());
  }

  getEnabled() {
    return this.getAll().filter(p => p.enabled);
  }

  getByNames(names) {
    return names.map(n => this.get(n)).filter(Boolean);
  }
}

export const platformRegistry = new PlatformRegistry();
export default platformRegistry;
```

### 5. Search Service (`services/searchService.js`)

```javascript
import platformRegistry from '../platforms/index.js';
import SearchQuery from '../models/SearchQuery.js';

/**
 * Orchestrates searches across multiple platforms
 */
export class SearchService {
  constructor() {
    this.registry = platformRegistry;
  }

  /**
   * Search across specified platforms
   * @param {Object} params - Search parameters
   * @param {string[]} params.platforms - Platform names to search
   * @param {string} params.query - Search text
   * @param {Object} params.options - Additional options
   */
  async search({ platforms, query, options = {} }) {
    const searchQuery = new SearchQuery({
      text: query,
      limit: options.limit || 50,
      offset: options.offset || 0,
      sort: options.sort || 'relevance',
      filters: options.filters || {},
    });

    const selectedPlatforms = platforms?.length
      ? this.registry.getByNames(platforms)
      : this.registry.getEnabled();

    const results = await Promise.allSettled(
      selectedPlatforms.map(platform => 
        this.searchPlatform(platform, searchQuery)
      )
    );

    return this.aggregateResults(results, selectedPlatforms);
  }

  async searchPlatform(platform, query) {
    const startTime = Date.now();
    try {
      const items = await platform.search(query);
      return {
        platform: platform.name,
        items,
        latency: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      return {
        platform: platform.name,
        items: [],
        error: error.message,
        latency: Date.now() - startTime,
        success: false,
      };
    }
  }

  aggregateResults(results, platforms) {
    const aggregated = {
      items: [],
      platforms: {},
      meta: {
        totalItems: 0,
        successfulPlatforms: 0,
        failedPlatforms: 0,
      },
    };

    results.forEach((result, index) => {
      const platformName = platforms[index].name;
      const value = result.status === 'fulfilled' ? result.value : {
        platform: platformName,
        items: [],
        error: result.reason?.message,
        success: false,
      };

      aggregated.platforms[platformName] = {
        success: value.success,
        itemCount: value.items.length,
        latency: value.latency,
        error: value.error,
      };

      if (value.success) {
        aggregated.items.push(...value.items);
        aggregated.meta.successfulPlatforms++;
      } else {
        aggregated.meta.failedPlatforms++;
      }
    });

    aggregated.meta.totalItems = aggregated.items.length;
    return aggregated;
  }

  /**
   * Get status of all platforms
   */
  async getStatus() {
    const platforms = this.registry.getAll();
    const checks = await Promise.allSettled(
      platforms.map(p => p.healthCheck())
    );

    return platforms.map((platform, i) => ({
      ...platform.getConfig(),
      health: checks[i].status === 'fulfilled' 
        ? checks[i].value 
        : { status: 'error', error: checks[i].reason?.message },
    }));
  }
}

export default new SearchService();
```

### 6. Unified Routes (`routes.js`)

```javascript
import express from 'express';
import searchController from './controllers/searchController.js';
import platformController from './controllers/platformController.js';
import healthController from './controllers/healthController.js';

const router = express.Router();

// Search endpoints
router.get('/search', searchController.search);
router.get('/search/:platform', searchController.searchPlatform);

// Platform management
router.get('/platforms', platformController.list);
router.get('/platforms/:name', platformController.get);
router.get('/platforms/:name/status', platformController.status);

// Health & status
router.get('/health', healthController.check);
router.get('/status', healthController.detailed);

export default router;
```

---

## 🧪 Testing Strategy

### Test Structure per Platform

```javascript
// platforms/ebay/ebay.test.js
import EbayPlatform from './EbayPlatform.js';
import { mockEbayResponse } from '../../tests/helpers/mockFactory.js';

describe('EbayPlatform', () => {
  let platform;

  beforeEach(() => {
    platform = new EbayPlatform();
  });

  describe('Configuration', () => {
    test('should have correct platform name', () => {
      expect(platform.name).toBe('ebay');
    });

    test('should be enabled by default', () => {
      expect(platform.enabled).toBe(true);
    });
  });

  describe('Query Building', () => {
    test('should build correct query params', () => {
      const query = { text: 'pokemon cards', limit: 20 };
      const params = platform.buildQueryParams(query);
      
      expect(params.q).toBe('pokemon cards');
      expect(params.limit).toBe(20);
    });
  });

  describe('Response Transformation', () => {
    test('should transform API response to Item model', () => {
      const mockResponse = mockEbayResponse();
      const items = platform.transform(mockResponse);

      expect(items).toHaveLength(mockResponse.itemSummaries.length);
      items.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('source', 'ebay');
      });
    });
  });

  describe('Search (Integration)', () => {
    test.skip('should search and return items', async () => {
      // Integration test - runs against real API
      const items = await platform.search({ text: 'test' });
      expect(Array.isArray(items)).toBe(true);
    });
  });
});
```

### Platform Status Dashboard Script

```javascript
// scripts/platform-status.js
import platformRegistry from '../platforms/index.js';

async function checkAllPlatforms() {
  console.log('\n🔍 Clankeye Platform Status\n');
  console.log('='.repeat(50));

  const platforms = platformRegistry.getAll();
  
  for (const platform of platforms) {
    try {
      const status = await platform.healthCheck();
      const icon = status.status === 'healthy' ? '✅' : '❌';
      console.log(`${icon} ${platform.displayName.padEnd(20)} ${status.status}`);
    } catch (error) {
      console.log(`❌ ${platform.displayName.padEnd(20)} error: ${error.message}`);
    }
  }

  console.log('='.repeat(50));
}

checkAllPlatforms();
```

### Jest Configuration

```javascript
// jest.config.js
export default {
  testEnvironment: 'node',
  testMatch: [
    '**/platforms/**/*.test.js',
    '**/tests/**/*.test.js',
  ],
  collectCoverageFrom: [
    'platforms/**/*.js',
    'services/**/*.js',
    '!**/*.config.js',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
  setupFilesAfterEnv: ['./tests/setup.js'],
};
```

---

## 🎨 Frontend Architecture (Theming)

### Current Theme Structure (Limited)
- Only dark/light toggle
- Hardcoded colors in Tailwind config

### Proposed Theme System

```
project-ui/
├── src/
│   ├── themes/
│   │   ├── index.ts              # Theme exports
│   │   ├── types.ts              # Theme type definitions
│   │   ├── presets/
│   │   │   ├── default.ts        # Default theme
│   │   │   ├── ocean.ts          # Blue ocean theme
│   │   │   ├── sunset.ts         # Orange/red theme
│   │   │   ├── forest.ts         # Green theme
│   │   │   └── midnight.ts       # Dark purple theme
│   │   └── utils/
│   │       ├── colorUtils.ts     # Color manipulation
│   │       └── cssVariables.ts   # CSS variable generation
│   │
│   ├── contexts/
│   │   └── ThemeContext.tsx      # Enhanced theme context
│   │
│   └── components/
│       └── theme/
│           ├── ThemePicker.tsx   # Theme selection UI
│           ├── ColorCustomizer.tsx # Color customization
│           └── ThemePreview.tsx  # Theme preview card
```

### Theme Type Definitions (`themes/types.ts`)

```typescript
export interface ThemeColors {
  // Primary colors
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  
  // Semantic colors
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
  
  // Background & surface
  background: {
    default: string;
    paper: string;
    elevated: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  
  // Border colors
  border: {
    default: string;
    light: string;
    focus: string;
  };
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;  // Main color
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface Theme {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  colors: ThemeColors;
  fonts?: {
    heading: string;
    body: string;
  };
  borderRadius?: {
    sm: string;
    md: string;
    lg: string;
  };
}

export interface ThemeConfig {
  activeTheme: string;
  mode: 'light' | 'dark' | 'system';
  customColors?: Partial<ThemeColors>;
}
```

### Enhanced Theme Context (`contexts/ThemeContext.tsx`)

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, ThemeConfig, ThemeColors } from '../themes/types';
import { themes, defaultTheme } from '../themes';
import { generateCSSVariables } from '../themes/utils/cssVariables';

interface ThemeContextValue {
  // Current state
  theme: Theme;
  mode: 'light' | 'dark';
  config: ThemeConfig;
  
  // Actions
  setTheme: (themeId: string) => void;
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  toggleMode: () => void;
  setCustomColors: (colors: Partial<ThemeColors>) => void;
  resetToDefault: () => void;
  
  // Available themes
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('clankeye-theme-config');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      activeTheme: 'default',
      mode: 'system',
      customColors: undefined,
    };
  });

  const [systemMode, setSystemMode] = useState<'light' | 'dark'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  // Listen to system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemMode(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Calculate effective mode
  const effectiveMode = config.mode === 'system' ? systemMode : config.mode;

  // Get current theme
  const baseTheme = themes.find(t => t.id === config.activeTheme) || defaultTheme;
  const theme: Theme = {
    ...baseTheme,
    mode: effectiveMode,
    colors: {
      ...baseTheme.colors,
      ...(config.customColors || {}),
    },
  };

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Set dark mode class
    if (effectiveMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply CSS variables
    const cssVars = generateCSSVariables(theme);
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Save config
    localStorage.setItem('clankeye-theme-config', JSON.stringify(config));
  }, [config, theme, effectiveMode]);

  const value: ThemeContextValue = {
    theme,
    mode: effectiveMode,
    config,
    availableThemes: themes,

    setTheme: (themeId) => {
      setConfig(prev => ({ ...prev, activeTheme: themeId }));
    },

    setMode: (mode) => {
      setConfig(prev => ({ ...prev, mode }));
    },

    toggleMode: () => {
      setConfig(prev => ({
        ...prev,
        mode: effectiveMode === 'dark' ? 'light' : 'dark',
      }));
    },

    setCustomColors: (colors) => {
      setConfig(prev => ({
        ...prev,
        customColors: { ...prev.customColors, ...colors },
      }));
    },

    resetToDefault: () => {
      setConfig({
        activeTheme: 'default',
        mode: 'system',
        customColors: undefined,
      });
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### Theme Preset Example (`themes/presets/ocean.ts`)

```typescript
import { Theme } from '../types';

export const oceanTheme: Theme = {
  id: 'ocean',
  name: 'Ocean Blue',
  mode: 'light',
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    secondary: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
      950: '#042f2e',
    },
    accent: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef',
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
      950: '#4a044e',
    },
    // ... other color definitions
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
      elevated: '#f1f5f9',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      disabled: '#94a3b8',
      inverse: '#f8fafc',
    },
    border: {
      default: '#e2e8f0',
      light: '#f1f5f9',
      focus: '#3b82f6',
    },
    success: { /* ... */ },
    warning: { /* ... */ },
    error: { /* ... */ },
    info: { /* ... */ },
  },
};
```

### Tailwind Integration (`tailwind.config.js`)

```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Use CSS variables for dynamic theming
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
          950: 'var(--color-primary-950)',
        },
        secondary: {
          // Same pattern as primary
        },
        accent: {
          // Same pattern as primary
        },
        surface: {
          DEFAULT: 'var(--color-background-default)',
          paper: 'var(--color-background-paper)',
          elevated: 'var(--color-background-elevated)',
        },
      },
      textColor: {
        base: 'var(--color-text-primary)',
        muted: 'var(--color-text-secondary)',
        disabled: 'var(--color-text-disabled)',
      },
      borderColor: {
        DEFAULT: 'var(--color-border-default)',
        light: 'var(--color-border-light)',
        focus: 'var(--color-border-focus)',
      },
    },
  },
  plugins: [],
};
```

---

## 📋 Implementation Roadmap

### Phase 1: Backend Foundation (Week 1-2)
- [ ] Create `BasePlatform` abstract class
- [ ] Create `SearchQuery` and `PlatformStatus` models
- [ ] Enhance `Item` model with new fields
- [ ] Set up platform registry system
- [ ] Create folder structure for platforms

### Phase 2: Migrate Existing Platforms (Week 2-3)
- [ ] Migrate OLX PT to new architecture
- [ ] Migrate Vinted to new architecture
- [ ] Create platform-specific tests
- [ ] Update routes and controllers

### Phase 3: Add New Platforms (Week 3-5)
- [ ] Implement eBay platform
- [ ] Implement Wallapop platform
- [ ] Implement Todo Coleccion platform
- [ ] Implement Leboncoin platform
- [ ] Implement OLX Brasil platform
- [ ] Implement OLX Poland platform

### Phase 4: Frontend Theming (Week 5-6)
- [ ] Create theme type definitions
- [ ] Implement enhanced ThemeContext
- [ ] Create theme presets (5 themes)
- [ ] Build ThemePicker component
- [ ] Build ColorCustomizer component
- [ ] Update Tailwind config for CSS variables

### Phase 5: Integration & Testing (Week 6-7)
- [ ] Integration tests for search service
- [ ] E2E tests for theme system
- [ ] Platform status dashboard
- [ ] Documentation updates

---

## 🚀 API Reference (New Endpoints)

### Search

```
GET /api/search
  Query params:
    - query: string (required)
    - platforms: string (comma-separated, optional)
    - limit: number (default: 50)
    - offset: number (default: 0)
    - sort: string (relevance|newest|price_asc|price_desc)

  Response:
    {
      "success": true,
      "data": {
        "items": Item[],
        "platforms": {
          "ebay": { "success": true, "itemCount": 50, "latency": 234 },
          "vinted": { "success": true, "itemCount": 45, "latency": 456 }
        },
        "meta": {
          "totalItems": 95,
          "successfulPlatforms": 2,
          "failedPlatforms": 0
        }
      }
    }
```

### Platform Management

```
GET /api/platforms
  Response: Platform configurations

GET /api/platforms/:name/status
  Response: Platform health status

GET /api/health
  Response: Overall API health
```

---

## 📝 Notes

1. **Rate Limiting**: Each platform has different rate limits. The architecture supports per-platform rate limiting.

2. **Error Handling**: Platform failures don't break the entire search. Results from working platforms are still returned.

3. **Extensibility**: Adding a new platform requires:
   - Creating a folder in `/platforms`
   - Implementing the `BasePlatform` class
   - Registering in the platform registry
   - Adding tests

4. **Caching**: Consider adding Redis/memory caching for frequently searched queries.

5. **Authentication**: Some platforms (eBay) require API keys. Use environment variables.
