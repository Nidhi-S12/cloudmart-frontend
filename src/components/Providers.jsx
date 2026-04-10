'use client';

import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from './Toast';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <CartProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </CartProvider>
    </SessionProvider>
  );
}
