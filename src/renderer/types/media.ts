/**
 * メディア関連の型定義
 */

export type CarouselPosition = 'prev' | 'center' | 'next';

export interface MediaItem {
  id: number;
  name: string;
  preview: string;
  presetId?: string; // バックエンドで使用するプリセットID
}

export interface MediaItemWithPosition extends MediaItem {
  position: CarouselPosition;
}
