'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder } from '../lib/api';

export default function OrderModal({ product, onClose }) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState('');
  const [quantity, setQuantity]     = useState(1);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!customerId.trim()) {
      setError('Customer ID is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const order = await createOrder(customerId, [
        { productId: product.id, quantity, price: parseFloat(product.price) },
      ]);
      // Redirect to confirmation page with order details
      router.push(`/orders?id=${order.id}&total=${order.total}`);
    } catch (err) {
      setError('Failed to place order. Is the api-gateway running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* stopPropagation prevents closing when clicking inside the modal */}
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Order: {product.name}</h2>

        <form onSubmit={handleSubmit}>
          <label>Customer ID</label>
          <input
            type="text"
            placeholder="e.g. user-123"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />

          <label>Quantity</label>
          <input
            type="number"
            min="1"
            max={product.stock}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
          />

          {error && <p style={{ color: '#e94560', marginBottom: '1rem' }}>{error}</p>}

          <div className="modal-actions">
            <button type="button" className="cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Placing...' : `Order — $${(product.price * quantity).toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
