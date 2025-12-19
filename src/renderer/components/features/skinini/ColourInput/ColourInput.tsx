import React from 'react';
import { TrashButton } from '../../../ui';
import { rgbStringToHex, hexToRgbString } from '../../../../types';
import './ColourInput.css';

export interface ColourInputProps {
  /** Display label (e.g., "Combo 1") */
  label: string;
  /** RGB string value (e.g., "255,128,64") or empty string for unset */
  value: string;
  /** Called when colour changes */
  onChange: (value: string) => void;
  /** If provided, shows a delete button */
  onRemove?: () => void;
  /** Layout variant */
  variant?: 'compact' | 'horizontal';
}

/**
 * ColourInput: カラー入力コンポーネント
 * RGB文字列を受け取り、カラーピッカーで編集できる
 * 空文字列の場合は「未設定」として表示
 */
export function ColourInput({
  label,
  value,
  onChange,
  onRemove,
  variant = 'compact',
}: ColourInputProps) {
  const isEmpty = !value || value.trim() === '';
  const hexValue = isEmpty ? '#808080' : rgbStringToHex(value);

  const handleChange = (hex: string) => {
    onChange(hexToRgbString(hex));
  };

  return (
    <div className={`colour-input colour-input--${variant} ${isEmpty ? 'colour-input--empty' : ''}`}>
      <input
        type="color"
        className="colour-input__color"
        value={hexValue}
        onChange={(e) => handleChange(e.target.value)}
        title={isEmpty ? `Set ${label}` : `Change ${label}`}
      />
      <div className="colour-input__info">
        <span className="colour-input__label">{label}</span>
        <span className="colour-input__value">{isEmpty ? '(not set)' : value}</span>
      </div>
      {onRemove && (
        <TrashButton onClick={onRemove} title={`Remove ${label}`} />
      )}
    </div>
  );
}
