class Item {
    constructor({
        id,
        url,
        title,
        description,
        price,
        currency,
        negotiable,
        createdTime,
        lastRefreshTime,
        validToTime,
        isHighlighted,
        isUrgent,
        isTopAd,
        business,
    }) {
        this.id = id;
        this.url = url;
        this.title = title;
        this.description = description;
        this.price = price;
        this.currency = currency;
        this.negotiable = negotiable;
        this.createdTime = createdTime;
        this.lastRefreshTime = lastRefreshTime;
        this.validToTime = validToTime;
        this.isHighlighted = isHighlighted;
        this.isUrgent = isUrgent;
        this.isTopAd = isTopAd;
        this.business = business;
    }
}

module.exports = Item;
