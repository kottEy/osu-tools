/**
 * useCarousel - カルーセルナビゲーションのカスタムフック
 * 
 * 汎用的なカルーセル操作（前後移動、アニメーション制御）を提供
 */
import { useState, useCallback, useMemo } from 'react';

export type SlideDirection = 'left' | 'right';

interface UseCarouselOptions {
  /** アニメーション時間（ミリ秒）*/
  animationDuration?: number;
}

interface UseCarouselReturn<T> {
  /** 現在選択されているインデックス */
  selectedIndex: number;
  /** アニメーション中かどうか */
  isAnimating: boolean;
  /** スライド方向 */
  slideDirection: SlideDirection;
  /** 前のアイテムに移動 */
  goToPrev: () => void;
  /** 次のアイテムに移動 */
  goToNext: () => void;
  /** 特定のインデックスに移動 */
  goToIndex: (index: number) => void;
  /** 選択インデックスをリセット */
  reset: () => void;
  /** アイテム削除後にインデックスを調整 */
  adjustIndexAfterDelete: (deletedIndex: number, newTotalItems: number) => void;
  /** 現在選択されているアイテム */
  currentItem: T | undefined;
}

/**
 * カルーセルのナビゲーション状態を管理するフック
 */
export function useCarousel<T>(
  items: T[],
  options: UseCarouselOptions = {}
): UseCarouselReturn<T> {
  const { animationDuration = 300 } = options;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>('right');

  const totalItems = items.length;

  const goToPrev = useCallback(() => {
    if (isAnimating || totalItems <= 1) return;

    setIsAnimating(true);
    setSlideDirection('right');
    setSelectedIndex((current) => (current - 1 + totalItems) % totalItems);

    setTimeout(() => setIsAnimating(false), animationDuration);
  }, [isAnimating, totalItems, animationDuration]);

  const goToNext = useCallback(() => {
    if (isAnimating || totalItems <= 1) return;

    setIsAnimating(true);
    setSlideDirection('left');
    setSelectedIndex((current) => (current + 1) % totalItems);

    setTimeout(() => setIsAnimating(false), animationDuration);
  }, [isAnimating, totalItems, animationDuration]);

  const goToIndex = useCallback((index: number) => {
    if (isAnimating || index < 0 || index >= totalItems) return;

    setIsAnimating(true);
    setSlideDirection(index > selectedIndex ? 'left' : 'right');
    setSelectedIndex(index);

    setTimeout(() => setIsAnimating(false), animationDuration);
  }, [isAnimating, totalItems, selectedIndex, animationDuration]);

  const reset = useCallback(() => {
    setSelectedIndex(0);
    setIsAnimating(false);
    setSlideDirection('right');
  }, []);

  /**
   * アイテム削除後にインデックスを調整
   * 削除されたインデックス以降を選択していた場合、1つ前にずらす
   * 削除後のアイテム数が0になる場合は0にリセット
   */
  const adjustIndexAfterDelete = useCallback((deletedIndex: number, newTotalItems: number) => {
    if (newTotalItems <= 0) {
      setSelectedIndex(0);
      return;
    }

    setSelectedIndex((current) => {
      // 削除したアイテムより後ろを選択していた場合、1つ前にずらす
      if (current > deletedIndex) {
        return current - 1;
      }
      // 削除したアイテム自体を選択していた場合
      if (current === deletedIndex) {
        // 最後のアイテムを削除した場合は1つ前へ
        if (current >= newTotalItems) {
          return Math.max(0, newTotalItems - 1);
        }
        // そうでなければ同じインデックス（次のアイテムが繰り上がる）
        return current;
      }
      // 削除したアイテムより前を選択していた場合はそのまま
      return current;
    });
  }, []);

  const currentItem = useMemo(() => items[selectedIndex], [items, selectedIndex]);

  return {
    selectedIndex,
    isAnimating,
    slideDirection,
    goToPrev,
    goToNext,
    goToIndex,
    reset,
    adjustIndexAfterDelete,
    currentItem,
  };
}
