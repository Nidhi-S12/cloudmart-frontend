'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Suspense } from 'react';
import { getOrder, getOrdersByCustomer } from '../../lib/api';

function OrderConfirmation({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrder(orderId)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <div className="order-loading">Loading order...</div>;

  if (!order) {
    return (
      <div className="confirmation">
        <h1>Order Confirmed!</h1>
        <p>Order ID: <strong>{orderId}</strong></p>
        <p>Your order has been placed.</p>
        <Link href="/" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="order-confirmation">
      <div className="confirmation-header">
        <div className="check-icon">&#10003;</div>
        <h1>Order Confirmed!</h1>
        <p className="order-id">Order #{order.id.slice(0, 8)}</p>
        <p className="order-date">{new Date(order.createdAt).toLocaleString()}</p>
      </div>

      <div className="order-items-list">
        <h3>Items Ordered</h3>
        {order.items.map((item, i) => (
          <div key={i} className="order-item-row">
            {item.image_url && (
              <img src={item.image_url} alt="" className="order-item-thumb" />
            )}
            <span className="order-item-qty">{item.quantity}x</span>
            <span className="order-item-name">{item.name || `Product #${item.productId}`}</span>
            <span className="order-item-price">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="order-total-row">
        <span>Total</span>
        <span className="order-total-amount">${order.total.toFixed(2)}</span>
      </div>

      <div className="order-status-badge">
        Status: <span className={`status-${order.status}`}>{order.status}</span>
      </div>

      <Link href="/" className="btn-primary">Continue Shopping</Link>
    </div>
  );
}

function OrderHistory() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }
    getOrdersByCustomer(session.user.email)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [session?.user?.email]);

  if (!session) {
    return (
      <div className="orders-empty">
        <h1>My Orders</h1>
        <p>Please sign in to view your orders.</p>
      </div>
    );
  }

  if (loading) return <div className="order-loading">Loading orders...</div>;

  if (orders.length === 0) {
    return (
      <div className="orders-empty">
        <h1>My Orders</h1>
        <p>You haven&apos;t placed any orders yet.</p>
        <Link href="/" className="btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h1>My Orders</h1>
      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-card-header">
              <div>
                <span className="order-card-id">Order #{order.id.slice(0, 8)}</span>
                <span className="order-card-date">{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <span className={`status-badge status-${order.status}`}>{order.status}</span>
            </div>
            <div className="order-card-items">
              {order.items.map((item, i) => (
                <span key={i} className="order-card-item">
                  {item.quantity}x {item.name || `Product #${item.productId}`}
                </span>
              ))}
            </div>
            <div className="order-card-total">
              Total: <strong>${order.total.toFixed(2)}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersContent() {
  const params = useSearchParams();
  const orderId = params.get('id');

  if (orderId) {
    return <OrderConfirmation orderId={orderId} />;
  }

  return <OrderHistory />;
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="order-loading">Loading...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
