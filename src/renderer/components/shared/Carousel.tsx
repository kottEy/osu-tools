import React, { ReactNode } from 'react';
import './Carousel.css';

export type CarouselPosition = 'prev' | 'center' | 'next';

export interface MediaItem {
  id: number;
  name: string;
  preview: string;
}

interface CarouselRowProps {
  children: ReactNode;
}

interface CarouselProps {
  children: ReactNode;
  isAnimating?: boolean;
}

interface CarouselItemProps {
  item: MediaItem;
  position: CarouselPosition;
  isAnimating: boolean;
  slideDirection: 'left' | 'right' | null;
  showLabel: boolean;
  currentIndex: number;
  totalItems: number;
}

/**
 * getVisible: カルーセル用に表示対象のアイテムを取得
 * 前・現在・次の3つのアイテムを返す
 */
export function getVisible(
  items: MediaItem[],
  index: number,
): Array<MediaItem & { position: CarouselPosition }> {
  const total = items.length;
  const prev = (index - 1 + total) % total;
  const next = (index + 1) % total;
  return [
    { ...items[prev], position: 'prev' },
    { ...items[index], position: 'center' },
    { ...items[next], position: 'next' },
  ];
}

/**
 * CarouselRow: カルーセル全体を包むコンテナ
 * ナビゲーションボタンと中央のカルーセルを配置
 */
export function CarouselRow({ children }: CarouselRowProps) {
  return <div className="carousel-row">{children}</div>;
}

/**
 * Carousel: アイテムを表示するカルーセルコンテナ
 * スクロール位置を管理するFlexコンテナ
 */
export function Carousel({ children, isAnimating }: CarouselProps) {
  return <div className="carousel">{children}</div>;
}

/**
 * CarouselItem: 個別のカルーセルアイテム
 * 位置によってスケールとオパシティが変わる
 */
export function CarouselItem({
  item,
  position,
  isAnimating,
  slideDirection,
  showLabel,
  currentIndex,
  totalItems,
}: CarouselItemProps) {
  const animationClass =
    isAnimating && slideDirection ? `slide-${slideDirection}` : '';

  return (
    <div
      key={item.id + position}
      className={`carousel-item ${position} ${animationClass}`}
    >
      <img src={item.preview} alt={item.name} />
      {position === 'center' && showLabel && (
        <div className="item-label">
          ({currentIndex + 1}/{totalItems})
        </div>
      )}
    </div>
  );
}

/**
 * IconButton: カルーセルナビゲーション用ボタン
 * 矢印アイコン付きの小さいボタン
 */
interface IconButtonProps {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled?: boolean;
}

export function IconButton({ direction, onClick, disabled }: IconButtonProps) {
  const arrow = direction === 'prev' ? '◀' : '▶';
  const ariaLabel = direction === 'prev' ? 'prev' : 'next';
  return (
    <button
      className="icon-btn"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {arrow}
    </button>
  );
}
