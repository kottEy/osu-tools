import React, { ReactNode } from 'react';
import './Card.css';

interface CardProps {
  children: ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: ReactNode;
  icon?: 'default' | 'accent';
}

/**
 * Card: 統一されたカードレイアウトコンポーネント
 * グラデーション背景と透明なボーダーを持つカード
 */
export function Card({ children, className = '' }: CardProps) {
  return <section className={`card ${className}`}>{children}</section>;
}

/**
 * CardHeader: カードのヘッダー部分
 * ボーダー下部を持つヘッダー
 */
export function CardHeader({ children, className = '', onClick }: CardHeaderProps) {
  return (
    <header 
      className={`card-header ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {children}
    </header>
  );
}

/**
 * CardBody: カードの本体部分
 * パディングとフレックスレイアウトを持つ
 */
export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`card-body ${className}`}>{children}</div>;
}

/**
 * CardTitle: カードのタイトル
 * オプションでアイコンドット付き
 */
export function CardTitle({ children, icon = 'default' }: CardTitleProps) {
  return (
    <h3 className="card-title">
      <span className={`dot ${icon === 'accent' ? 'accent' : ''}`} />
      {children}
    </h3>
  );
}
