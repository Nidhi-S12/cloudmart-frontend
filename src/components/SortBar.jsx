'use client';

import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';

const ITEMS_PER_PAGE = 20;

export default function SortBar({ products }) {
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const copy = [...products];
    switch (sort) {
      case 'price-low':  return copy.sort((a, b) => a.price - b.price);
      case 'price-high': return copy.sort((a, b) => b.price - a.price);
      case 'rating':     return copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'name':       return copy.sort((a, b) => a.name.localeCompare(b.name));
      default:           return copy;
    }
  }, [products, sort]);

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function handleSort(e) {
    setSort(e.target.value);
    setPage(1);
  }

  return (
    <>
      <div className="sort-bar">
        <label>Sort by:</label>
        <select value={sort} onChange={handleSort}>
          <option value="default">Default</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
          <option value="name">Name: A-Z</option>
        </select>
      </div>

      <div className="product-grid">
        {paginated.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
            className="page-btn"
          >
            Previous
          </button>
          <span className="page-info">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page === totalPages}
            className="page-btn"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
