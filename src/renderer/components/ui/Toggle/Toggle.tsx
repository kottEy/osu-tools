import React from 'react';
import './Toggle.css';

interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelPosition?: 'left' | 'right';
  size?: 'sm' | 'md';
}

/**
 * Toggle: プレミアムなトグルスイッチコンポーネント
 * チェックボックスの代わりに使用
 */
export function Toggle({
  label,
  checked,
  onChange,
  labelPosition = 'left',
  size = 'md',
}: ToggleProps) {
  return (
    <label className={`toggle toggle--${size} ${labelPosition === 'right' ? 'toggle--label-right' : ''}`}>
      {label && labelPosition === 'left' && (
        <span className="toggle__label">{label}</span>
      )}
      <div className="toggle__switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle__slider" />
      </div>
      {label && labelPosition === 'right' && (
        <span className="toggle__label">{label}</span>
      )}
    </label>
  );
}
