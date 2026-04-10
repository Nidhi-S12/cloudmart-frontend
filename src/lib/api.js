const API_URL =
  typeof window === 'undefined'
    ? process.env.API_URL || 'http://localhost:4000'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store', ...options });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export function getProducts({ category, search } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (search) params.set('search', search);
  const qs = params.toString();
  return apiFetch(`/api/products${qs ? `?${qs}` : ''}`);
}

export function getProduct(id) {
  return apiFetch(`/api/products/${id}`);
}

export function getCategories() {
  return apiFetch('/api/products/categories');
}

export function createOrder(customerId, items) {
  return apiFetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId, items }),
  });
}

export function getOrder(id) {
  return apiFetch(`/api/orders/${id}`);
}

export function getOrdersByCustomer(email) {
  return apiFetch(`/api/orders?customer=${encodeURIComponent(email)}`);
}
