import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, FileText, CreditCard,
  Users, LogOut, Menu, X, MapPin, Settings
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Tableau de bord', exact: true },
    { to: '/colis', icon: <Package size={18} />, label: 'Colis' },
    { to: '/factures', icon: <FileText size={18} />, label: 'Factures' },
    { to: '/paiement', icon: <CreditCard size={18} />, label: 'Paiement / Retrait' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ to: '/utilisateurs', icon: <Users size={18} />, label: 'Utilisateurs' });
    navItems.push({ to: '/parametres', icon: <Settings size={18} />, label: 'Paramètres' });
  }

  const initials = user?.nom?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img
            src="/anolalux-logo.svg"
            alt="Anolalux"
            style={{ width: '100%', maxWidth: 200, display: 'block', margin: '0 auto 6px' }}
          />
          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: 1 }}>
            Convoyage Express
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Navigation</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
          <div className="nav-section" style={{ marginTop: 16 }}>Public</div>
          <a
            href="/tracking"
            target="_blank"
            className="nav-item"
            rel="noreferrer"
          >
            <MapPin size={18} />
            Suivi colis
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="name">{user?.nom}</div>
              <div className="role">{user?.role}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Déconnexion">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Mobile topbar */}
        <div className="topbar">
          <button className="burger" onClick={() => setOpen(true)}>
            <Menu size={22} />
          </button>
          <img src="/anolalux-logo.svg" alt="Anolalux" style={{ height: 32 }} />
          <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
            {initials}
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
