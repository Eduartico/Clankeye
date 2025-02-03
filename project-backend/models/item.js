class Item {
    constructor({
        id,
        url,
        title,
        description,
        price,
        currency,
        createdTime,
        isOnWishlist,
    }) {
        this.id = id;
        this.url = url;
        this.title = title;
        this.description = description;
        this.price = price;
        this.currency = currency;
        this.createdTime = createdTime;
        this.isOnWishlist = isOnWishlist;
    }
}

export default Item;
