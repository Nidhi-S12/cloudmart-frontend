'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useCart } from '../context/CartContext';

export default function Header() {
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { totalItems } = useCart();
  const { data: session } = useSession();

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    router.push(`/?${params.toString()}`);
  }

  return (
    <header>
      <nav>
        <a href="/" className="logo">CloudMart</a>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <a href="/cart" className="cart-link">
          Cart {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </a>

        {session ? (
          <div className="user-menu">
            {session.user.image && (
              <img
                src={session.user.image}
                alt={session.user.name}
                className="user-avatar"
                width={32}
                height={32}
                referrerPolicy="no-referrer"
              />
            )}
            <span className="user-name">{session.user.name}</span>
            <button onClick={() => signOut()} className="btn-signout">Sign Out</button>
          </div>
        ) : (
          <button onClick={() => signIn('google')} className="btn-signin">
            Sign In with Google
          </button>
        )}
      </nav>
    </header>
  );
}
