import { NavLink } from 'react-router-dom';
import './sidebar.css';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="logo-circle">st!</div>
        <div className="site-text">
          <div className="site-title">osu!tool</div>
          <div className="site-sub">Skin Customizer</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/cursor" className={({ isActive }) => (isActive ? 'sidebar-item active' : 'sidebar-item')}>
              <span className="sidebar-dot"></span>
              Cursor
            </NavLink>
          </li>
          <li>
            <NavLink to="/hitcircle" className={({ isActive }) => (isActive ? 'sidebar-item active' : 'sidebar-item')}>
              <span className="sidebar-dot"></span>
              HitCircle
            </NavLink>
          </li>
          <li>
            <NavLink to="/hitsounds" className={({ isActive }) => (isActive ? 'sidebar-item active' : 'sidebar-item')}>
              <span className="sidebar-dot"></span>
              HitSounds
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings" className={({ isActive }) => (isActive ? 'sidebar-item active' : 'sidebar-item')}>
              <span className="sidebar-dot"></span>
              Settings
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
