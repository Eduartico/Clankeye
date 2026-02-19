/**
 * Unified item model for all platforms
 * All platforms must transform their data to this format
 */
class Item {
  constructor({
    id,
    externalId,
    url,
    title,
    description = '',
    category = null,
    price = null,
    originalPrice = null,
    currency = 'EUR',
    shipping = null,
    condition = null,
    location = null,
    seller = null,
    createdTime = null,
    updatedTime = null,
    isOnWishlist = false,
    source,
    sourceRegion = null,
    photos = [],
    attributes = {},
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

export default Item;
