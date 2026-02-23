declare module "*.png" {
  const value: string;
  export default value;
}

// Allow JS service modules to be imported from TS components
declare module "*.js" {
  const value: any;
  export default value;
  export const crawlSearch: any;
  export const crawlMore: any;
  export const fetchItems: any;
  export const getCrawlPlatforms: any;
  export const getWishlistTerms: any;
  export const addWishlistTerm: any;
  export const removeWishlistTerm: any;
  export const getFilterTerms: any;
  export const addFilterTerm: any;
  export const removeFilterTerm: any;
}
