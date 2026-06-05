import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__brand">KeyType</Link>

      <div className="navbar__links">
        <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          Test
        </NavLink>
        <NavLink to="/lessons" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          Lessons
        </NavLink>
        {user && (
          <NavLink to="/stats" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            Stats
          </NavLink>
        )}

        {user ? (
          <>
            <span className="nav-link nav-link--accent" style={{ cursor: 'default' }}>
              {user.username}
            </span>
            <button className="nav-btn" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="nav-link">Login</NavLink>
            <NavLink to="/register" className="nav-btn">Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}