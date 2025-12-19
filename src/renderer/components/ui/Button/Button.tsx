import React, { ReactNode } from 'react';
import './Button.css';

interface ButtonProps {
  children: ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  variant?: 'default' | 'primary';
  disabled?: boolean;
  className?: string;
}

/**
 * Button: 汎用ボタンコンポーネント
 */
export function Button({
  children,
  onClick,
  variant = 'default',
  disabled = false,
  className = '',
}: ButtonProps) {
  const variantClass = variant === 'primary' ? 'btn--primary' : '';
  return (
    <button
      className={`btn ${variantClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
