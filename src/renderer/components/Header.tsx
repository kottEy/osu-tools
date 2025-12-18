import './header.css';

interface HeaderProps {
  currentSkin?: string;
}

export default function Header({ currentSkin = 'Default' }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-current">
          <span className="label">Current Skin:</span>
          <span className="chip">{currentSkin}</span>
        </div>
        <div className="header-actions">
          <button className="icon-btn" title="Refresh current skin">⟳</button>
          <button className="icon-btn" title="Select skin folder">📁</button>
        </div>
      </div>
    </header>
  );
}
