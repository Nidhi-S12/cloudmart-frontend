import ProductCard from '../components/ProductCard';
import CategorySidebar from '../components/CategorySidebar';
import { getProducts, getCategories } from '../lib/api';

export default async function HomePage({ searchParams }) {
  const { category, search } = await searchParams;

  let products = [];
  let categories = [];
  let error = null;

  try {
    [products, categories] = await Promise.all([
      getProducts({ category, search }),
      getCategories(),
    ]);
  } catch (err) {
    error = err.message;
  }

  if (error) {
    return <p className="error">Could not load products: {error}</p>;
  }

  return (
    <div className="shop-layout">
      <CategorySidebar categories={categories} active={category} />

      <div className="product-section">
        <div className="section-header">
          <h1>
            {search
              ? `Results for "${search}"`
              : category
                ? category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                : 'All Products'}
          </h1>
          <span className="product-count">{products.length} products</span>
        </div>

        {products.length === 0 ? (
          <p className="error">No products found.</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
