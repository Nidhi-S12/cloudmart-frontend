const API_URL =
  typeof window === 'undefined'
    ? process.env.API_URL || 'http://localhost:4000'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store', ...options });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export function getProducts() {
  return apiFetch('/api/products');
}

export function getProduct(id) {
  return apiFetch(`/api/products/${id}`);
}

export function createOrder(customerId, items) {
  return apiFetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId, items }),
  });
}
