'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import { useCart } from '../../context/CartContext';
import { createOrder } from '../../lib/api';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleCheckout(e) {
    e.preventDefault();
    if (!session?.user?.email || items.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const orderItems = items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: parseFloat(item.price),
      }));
      const order = await createOrder(session.user.email, orderItems);
      clearCart();
      router.push(`/orders?id=${order.id}&total=${order.total}`);
    } catch (err) {
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <h1>Your Cart is Empty</h1>
        <p>Add some products to get started.</p>
        <Link href="/" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>

      <div className="cart-items">
        {items.map((item) => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-image">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  width={80}
                  height={80}
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <div className="no-image-sm">No Image</div>
              )}
            </div>

            <div className="cart-item-details">
              <h3>{item.name}</h3>
              {item.brand && <span className="brand">{item.brand}</span>}
              <div className="price">${parseFloat(item.price).toFixed(2)}</div>
            </div>

            <div className="cart-item-actions">
              <div className="quantity-control">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
              </div>
              <div className="item-total">
                ${(parseFloat(item.price) * item.quantity).toFixed(2)}
              </div>
              <button className="remove-btn" onClick={() => removeItem(item.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-total">
          <span>Total:</span>
          <span className="total-price">${totalPrice.toFixed(2)}</span>
        </div>

        {session ? (
          <form onSubmit={handleCheckout}>
            <p className="checkout-user">
              Ordering as: <strong>{session.user.email}</strong>
            </p>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-checkout" disabled={loading}>
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>
        ) : (
          <div className="signin-prompt">
            <p>Please sign in to checkout</p>
            <button onClick={() => signIn('google')} className="btn-signin">
              Sign In with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
