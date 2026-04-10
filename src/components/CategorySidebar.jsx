'use client';

import Link from 'next/link';

export default function CategorySidebar({ categories, active }) {
  function formatCategory(cat) {
    return cat
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return (
    <aside className="category-sidebar">
      <h3>Categories</h3>
      <ul>
        <li>
          <Link href="/" className={!active ? 'active' : ''}>
            All Products
          </Link>
        </li>
        {categories.map((cat) => (
          <li key={cat}>
            <Link
              href={`/?category=${cat}`}
              className={active === cat ? 'active' : ''}
            >
              {formatCategory(cat)}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
