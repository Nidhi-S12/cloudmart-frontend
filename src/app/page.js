import ProductCard from '../components/ProductCard';
import { getProducts } from '../lib/api';

export default async function HomePage() {
  let products = [];
  let error = null;

  try {
    products = await getProducts();
  } catch (err) {
    error = err.message;
  }

  if (error) {
    return <p className="error">Could not load products: {error}</p>;
  }

  if (products.length === 0) {
    return <p className="error">No products found. Seed the database first.</p>;
  }

  return (
    <>
      <h1>Products</h1>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
