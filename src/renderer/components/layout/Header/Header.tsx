import { Toggle } from '../../ui';
import './Header.css';

interface HeaderProps {
  currentSkin?: string;
  onRefresh?: () => void;
  onSelectSkin?: () => void;
  lazerMode?: boolean;
  onLazerModeChange?: (enabled: boolean) => void;
}

export default function Header({ 
  currentSkin = 'スキン未選択', 
  onRefresh,
  onSelectSkin,
  lazerMode = false,
  onLazerModeChange,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header__left">
        <div className="header__current">
          <span className="header__label">Current Skin:</span>
          <span className="header__chip">{currentSkin || 'スキン未選択'}</span>
        </div>
        <div className="header__actions">
          <button 
            className="header__icon-btn" 
            title="Refresh current skin"
            onClick={onRefresh}
            disabled={lazerMode}
          >
            ⟳
          </button>
          <button 
            className="header__icon-btn" 
            title="Select skin folder"
            onClick={onSelectSkin}
          >
            📁
          </button>
        </div>
      </div>
      <div className="header__right">
        <Toggle
          label="Lazer Mode"
          checked={lazerMode}
          onChange={(checked) => onLazerModeChange?.(checked)}
          labelPosition="left"
          size="sm"
        />
      </div>
    </header>
  );
}
