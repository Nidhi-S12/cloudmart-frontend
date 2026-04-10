'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const toast = useToast();

  function handleAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast(`${product.name} added to cart`);
  }

  return (
    <div className="product-card">
      <Link href={`/products/${product.id}`} className="product-card-link">
        <div className="product-image">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              width={200}
              height={200}
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <div className="no-image">No Image</div>
          )}
        </div>

        <div className="product-info">
          {product.brand && <span className="brand">{product.brand}</span>}
          <h2>{product.name}</h2>

          <div className="rating">
            {'★'.repeat(Math.round(product.rating || 0))}
            {'☆'.repeat(5 - Math.round(product.rating || 0))}
            <span className="rating-num">{product.rating?.toFixed(1)}</span>
          </div>

          <div className="price">${parseFloat(product.price).toFixed(2)}</div>

          <div className="stock">
            {product.stock === 0 ? (
              <span className="out-of-stock">Out of Stock</span>
            ) : product.stock <= 5 ? (
              <span className="low-stock">Only {product.stock} left!</span>
            ) : (
              `${product.stock} in stock`
            )}
          </div>
        </div>
      </Link>

      <div className="product-card-action">
        <button onClick={handleAdd} disabled={product.stock === 0}>
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
