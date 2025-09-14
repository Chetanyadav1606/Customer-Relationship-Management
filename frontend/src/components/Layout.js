import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  Home, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: Users,
      current: location.pathname.startsWith('/customers')
    }
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">Mini CRM</h1>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Customer Relationship Management
          </p>
        </div>
        
        <nav>
          <ul className="sidebar-nav">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name} className="sidebar-nav-item">
                  <Link
                    to={item.href}
                    className={`sidebar-nav-link ${item.current ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="sidebar-nav-icon" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile Section */}
        <div style={{ position: 'absolute', bottom: '1rem', left: '1.5rem', right: '1.5rem' }}>
          <div 
            className="user-menu" 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{ position: 'relative', cursor: 'pointer' }}
          >
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1e293b' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {user?.role}
              </div>
            </div>
            <ChevronDown style={{ 
              width: '1rem', 
              height: '1rem', 
              color: '#64748b',
              transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }} />
          </div>

          {/* Dropdown Menu */}
          {userMenuOpen && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              marginBottom: '0.5rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              zIndex: 50
            }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#dc2626',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <LogOut style={{ width: '1rem', height: '1rem' }} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="modal-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{ display: 'block', background: 'rgba(0, 0, 0, 0.5)' }}
        />
      )}

      {/* Main content */}
      <main className="main-content">
        <div className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="btn-secondary mobile-menu-btn"
            >
              <Menu style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            <h1 className="header-title">
              {navigation.find(item => item.current)?.name || 'Dashboard'}
            </h1>
          </div>
          
          <div className="header-actions">
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Welcome back, <span style={{ fontWeight: '500', color: '#1e293b' }}>{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary"
              title="Sign Out"
              style={{ marginLeft: '1rem' }}
            >
              <LogOut style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              <span className="desktop-only">Sign Out</span>
            </button>
          </div>
        </div>

        <Outlet />
      </main>

      {/* Click outside handler for user menu */}
      {userMenuOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            background: 'transparent'
          }}
          onClick={() => setUserMenuOpen(false)}
        />
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex !important;
          }
          .desktop-only {
            display: none;
          }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;