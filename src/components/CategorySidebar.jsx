'use client';

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
          <a href="/" className={!active ? 'active' : ''}>
            All Products
          </a>
        </li>
        {categories.map((cat) => (
          <li key={cat}>
            <a
              href={`/?category=${cat}`}
              className={active === cat ? 'active' : ''}
            >
              {formatCategory(cat)}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
