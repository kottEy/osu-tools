import './Header.css';

interface HeaderProps {
  currentSkin?: string;
}

export default function Header({ currentSkin = 'Default' }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header__left">
        <div className="header__current">
          <span className="header__label">Current Skin:</span>
          <span className="header__chip">{currentSkin}</span>
        </div>
        <div className="header__actions">
          <button className="header__icon-btn" title="Refresh current skin">⟳</button>
          <button className="header__icon-btn" title="Select skin folder">📁</button>
        </div>
      </div>
    </header>
  );
}
