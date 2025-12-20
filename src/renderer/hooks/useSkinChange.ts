/**
 * useSkinChange - スキン変更監視のカスタムフック
 * 
 * currentSkinの変更を検知して再読み込みを実行
 */
import { useEffect, useRef, useCallback } from 'react';

interface UseSkinChangeOptions {
  /** スキン変更時のコールバック */
  onSkinChange?: () => void | Promise<void>;
  /** 追加のクリーンアップ処理 */
  onCleanup?: () => void;
}

/**
 * スキン変更を監視し、変更時に処理を実行するフック
 */
export function useSkinChange(
  currentSkin: string | undefined,
  options: UseSkinChangeOptions = {}
): void {
  const { onSkinChange, onCleanup } = options;
  const prevSkinRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // 初回以外でスキンが変更された場合
    if (prevSkinRef.current !== undefined && prevSkinRef.current !== currentSkin) {
      if (onCleanup) {
        onCleanup();
      }
      if (onSkinChange) {
        onSkinChange();
      }
    }
    prevSkinRef.current = currentSkin;
  }, [currentSkin, onSkinChange, onCleanup]);
}

/**
 * 保存済みフラグをリセットする関数を生成
 */
export function createResetSavedFlags(
  ...setters: React.Dispatch<React.SetStateAction<boolean>>[]
): () => void {
  return () => {
    setters.forEach((setter) => setter(false));
  };
}
