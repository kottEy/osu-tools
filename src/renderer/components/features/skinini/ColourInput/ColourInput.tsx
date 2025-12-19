import React from 'react';
import { TrashButton } from '../../../ui';
import { rgbStringToHex, hexToRgbString } from '../../../../types';
import './ColourInput.css';

export interface ColourInputProps {
  /** Display label (e.g., "Combo 1") */
  label: string;
  /** RGB string value (e.g., "255,128,64") */
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
 */
export function ColourInput({
  label,
  value,
  onChange,
  onRemove,
  variant = 'compact',
}: ColourInputProps) {
  const hexValue = rgbStringToHex(value);

  const handleChange = (hex: string) => {
    onChange(hexToRgbString(hex));
  };

  return (
    <div className={`colour-input colour-input--${variant}`}>
      <input
        type="color"
        className="colour-input__color"
        value={hexValue}
        onChange={(e) => handleChange(e.target.value)}
        title={`Change ${label}`}
      />
      <div className="colour-input__info">
        <span className="colour-input__label">{label}</span>
        <span className="colour-input__value">{value}</span>
      </div>
      {onRemove && (
        <TrashButton onClick={onRemove} title={`Remove ${label}`} />
      )}
    </div>
  );
}
