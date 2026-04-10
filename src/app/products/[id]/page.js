'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../components/Toast';
import { getProduct } from '../../../lib/api';

export default function ProductPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProduct(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  function handleAdd() {
    addItem(product);
    toast(`${product.name} added to cart`);
  }

  if (loading) {
    return <div className="product-detail-loading">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="product-detail-empty">
        <h1>Product Not Found</h1>
        <Link href="/" className="btn-primary">Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="product-detail">
      <Link href="/" className="back-link">Back to Shop</Link>

      <div className="product-detail-layout">
        <div className="product-detail-image">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              width={400}
              height={400}
              style={{ objectFit: 'contain' }}
              priority
            />
          ) : (
            <div className="no-image-lg">No Image</div>
          )}
        </div>

        <div className="product-detail-info">
          {product.brand && <span className="brand">{product.brand}</span>}
          <h1>{product.name}</h1>

          <div className="rating">
            {'★'.repeat(Math.round(product.rating || 0))}
            {'☆'.repeat(5 - Math.round(product.rating || 0))}
            <span className="rating-num">{product.rating?.toFixed(1)}</span>
          </div>

          <div className="detail-price">${parseFloat(product.price).toFixed(2)}</div>

          {product.category && (
            <div className="detail-category">
              Category: <Link href={`/?category=${product.category}`}>{product.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</Link>
            </div>
          )}

          <div className="detail-stock">
            {product.stock === 0 ? (
              <span className="out-of-stock">Out of Stock</span>
            ) : product.stock <= 5 ? (
              <span className="low-stock">Only {product.stock} left!</span>
            ) : (
              <span className="in-stock">{product.stock} in stock</span>
            )}
          </div>

          {product.description && (
            <div className="detail-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          <button
            className="btn-add-cart"
            onClick={handleAdd}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
