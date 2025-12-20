import { NavLink } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <div className="sidebar__logo">st!</div>
        <div className="sidebar__text">
          <div className="sidebar__title">osu! Skin Editor</div>
          <div className="sidebar__subtitle">Skin Customizer</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        <ul>
          <li>
            <NavLink
              to="/cursor"
              className={({ isActive }) =>
                isActive ? 'sidebar__item sidebar__item--active' : 'sidebar__item'
              }
            >
              <span className="sidebar__dot"></span>
              Cursor
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/hitcircle"
              className={({ isActive }) =>
                isActive ? 'sidebar__item sidebar__item--active' : 'sidebar__item'
              }
            >
              <span className="sidebar__dot"></span>
              HitCircle
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/hitsounds"
              className={({ isActive }) =>
                isActive ? 'sidebar__item sidebar__item--active' : 'sidebar__item'
              }
            >
              <span className="sidebar__dot"></span>
              HitSounds
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/skinini"
              className={({ isActive }) =>
                isActive ? 'sidebar__item sidebar__item--active' : 'sidebar__item'
              }
            >
              <span className="sidebar__dot"></span>
              skin.ini
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                isActive ? 'sidebar__item sidebar__item--active' : 'sidebar__item'
              }
            >
              <span className="sidebar__dot"></span>
              Settings
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
