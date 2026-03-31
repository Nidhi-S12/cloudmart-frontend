'use client'; // this component uses state, so it must be a Client Component

import { useState } from 'react';
import OrderModal from './OrderModal';

export default function ProductCard({ product }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="product-card">
      <h2>{product.name}</h2>
      <p>{product.description || 'No description'}</p>
      <div className="price">${parseFloat(product.price).toFixed(2)}</div>
      <div className="stock">{product.stock} in stock</div>
      <button
        onClick={() => setShowModal(true)}
        disabled={product.stock === 0}
      >
        {product.stock === 0 ? 'Out of stock' : 'Place Order'}
      </button>

      {showModal && (
        <OrderModal
          product={product}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
