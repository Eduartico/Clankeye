/**
 * Standardized search query model
 * Used to normalize search parameters across all platforms
 */
class SearchQuery {
  constructor({
    text = '',
    limit = 50,
    offset = 0,
    page = 1,
    sort = 'relevance',
    minPrice = null,
    maxPrice = null,
    currency = null,
    condition = null,
    category = null,
    location = null,
    filters = {},
  }) {
    this.text = text;
    this.limit = limit;
    this.offset = offset;
    this.page = page;
    this.sort = sort;
    this.minPrice = minPrice;
    this.maxPrice = maxPrice;
    this.currency = currency;
    this.condition = condition;
    this.category = category;
    this.location = location;
    this.filters = filters;
  }

  /**
   * Convert sort option to platform-specific format
   */
  static SORT_OPTIONS = {
    relevance: 'relevance',
    newest: 'newest',
    oldest: 'oldest',
    price_asc: 'price_asc',
    price_desc: 'price_desc',
  };

  /**
   * Validate the query has minimum required fields
   */
  isValid() {
    return this.text && this.text.trim().length > 0;
  }

  /**
   * Get the page number from offset and limit
   */
  getPage() {
    if (this.page > 1) return this.page;
    return Math.floor(this.offset / this.limit) + 1;
  }
}

export default SearchQuery;
