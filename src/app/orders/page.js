'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OrderConfirmation() {
  const params = useSearchParams();
  const orderId = params.get('id');
  const total   = params.get('total');

  return (
    <div className="confirmation">
      <h1>Order Confirmed!</h1>
      <p>Your order has been placed and is being processed.</p>
      <p><strong>Order ID:</strong> {orderId}</p>
      <p><strong>Total:</strong> ${parseFloat(total).toFixed(2)}</p>
      <br />
      <a href="/">Back to products</a>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <OrderConfirmation />
    </Suspense>
  );
}
