import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../Assets/logo.png'

const NAV_LINKS = [
  { path: '/codecrafters/home',    label: 'Home' },
  { path: '/codecrafters/convert', label: 'Studio' },
  { path: '/codecrafters/learn-sign', label: 'Learn' },
  { path: '/codecrafters/all-videos', label: 'Gallery' },
];

function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="glass-nav fixed-top" style={{ zIndex: 1050 }}>
      <div className="container d-flex align-items-center justify-content-between" style={{ height: 72 }}>

        <Link to='/codecrafters/home' className="text-decoration-none d-flex align-items-center gap-2">
          <img src={logo} width={32} height={32} alt="Logo" style={{ borderRadius: 8 }} />
          <span style={{ fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.03em', color: '#e8eaf6' }}>
            CODE<span style={{ color: '#635bff' }}>CRAFTERS</span>
          </span>
        </Link>

        {/* Links */}
        <div className="d-flex align-items-center gap-1">
          {NAV_LINKS.map(({ path, label }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                style={{
                  padding: '8px 18px',
                  borderRadius: 100,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  color: active ? '#fff' : '#6b7a9f',
                  background: active ? 'var(--primary)' : 'transparent',
                  boxShadow: active ? '0 4px 14px rgba(99,91,255,0.4)' : 'none',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => { if (!active) { e.target.style.color = '#fff'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}}
                onMouseLeave={e => { if (!active) { e.target.style.color = '#6b7a9f'; e.target.style.background = 'transparent'; }}}
              >
                {label}
              </Link>
            );
          })}
          <Link to="/codecrafters/convert" className="btn-primary-glow ms-3" style={{ width: 'auto', padding: '10px 22px', borderRadius: 50, fontSize: '0.88rem' }}>
            Launch Studio
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;