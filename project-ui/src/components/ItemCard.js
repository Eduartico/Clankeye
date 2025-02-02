import React from 'react';
import { Link } from 'react-router-dom';

function ItemCard({ item }) {
    return (
        <div className="item-card">
            <Link to={`/item/${item.id}`}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <p>Price: {item.price} {item.currency}</p>
            </Link>
        </div>
    );
}

export default ItemCard;
