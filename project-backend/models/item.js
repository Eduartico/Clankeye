class Item {
    constructor({
        id,
        url,
        title,
        description,
        category,
        price,
        currency,
        createdTime,
        isOnWishlist,
        photos = []
    }) {
        this.id = id;
        this.url = url;
        this.title = title;
        this.description = description;
        this.category = category;
        this.price = price;
        this.currency = currency;
        this.createdTime = createdTime;
        this.isOnWishlist = isOnWishlist;
        this.photos = photos;
    }
}

export default Item;
