'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dash', href: '/' },
  { label: 'タスク管理', href: '/todo' },
  { label: '更新ログ', href: '/updates' },
];

const isActive = (pathname, href) => {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
};

export default function NavBar() {
  const pathname = usePathname() || '/';

  return (
    <nav className="nav-bar">
      <div className="nav-title">主権統御院・中枢管理システム</div>
      <div className="nav-actions">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-btn ${isActive(pathname, item.href) ? 'active' : ''}`}
          >
            [ {item.label} ]
          </Link>
        ))}
      </div>
    </nav>
  );
}
