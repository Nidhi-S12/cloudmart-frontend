// Server-side (SSR/Server Components): uses API_URL — internal Docker network or localhost
// Client-side (browser):               uses NEXT_PUBLIC_API_URL — must be reachable from browser
const API_URL =
  typeof window === 'undefined'
    ? process.env.API_URL || 'http://localhost:4000'           // server-side
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'; // client-side

export async function getProducts() {
  const res = await fetch(`${API_URL}/api/products`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function getProduct(id) {
  const res = await fetch(`${API_URL}/api/products/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

export async function createOrder(customerId, items) {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId, items }),
  });
  if (!res.ok) throw new Error('Failed to create order');
  return res.json();
}
