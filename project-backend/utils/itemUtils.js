export const isItemOnWishlist = (title, description, category, wishlist) => {
    if (!wishlist.length) return false;
    
    const lowerTitle = title.toLowerCase();
    const lowerDescription = description?.toLowerCase() || '';
    const lowerCategory = category?.toLowerCase() || '';

    return wishlist.some(word => 
        lowerTitle.includes(word.toLowerCase()) || 
        lowerDescription.includes(word.toLowerCase()) ||
        lowerCategory.includes(word.toLowerCase())
    );
};

export const filterItems = (items, filtered) => {
    if (!filtered.length) return items;

    return items.filter(item => 
        !filtered.some(word => 
            item.title.toLowerCase().includes(word.toLowerCase()) || 
            (item.description && item.description.toLowerCase().includes(word.toLowerCase())) ||
            (item.category && item.category.toLowerCase().includes(word.toLowerCase()))
        )
    );
};
