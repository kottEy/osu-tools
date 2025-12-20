/**
 * useMediaList - メディアアイテム管理のカスタムフック
 * 
 * 画像/音声プリセットの追加、削除、適用などの共通操作を提供
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import type { MediaItem } from '../types';

interface UseMediaListOptions {
  /** データ読み込み関数 */
  loadData: () => Promise<MediaItem[]>;
  /** アイテム追加関数 */
  addItem?: (file: File) => Promise<MediaItem | null>;
  /** アイテム削除関数 */
  deleteItem?: (index: number, item: MediaItem) => Promise<boolean>;
  /** アイテム適用関数 */
  applyItem?: (item: MediaItem, options?: Record<string, unknown>) => Promise<boolean>;
  /** Current Skin判定パターン */
  currentSkinPattern?: string;
}

interface UseMediaListReturn {
  /** アイテム一覧 */
  items: MediaItem[];
  /** 読み込み中フラグ */
  isLoading: boolean;
  /** 適用中フラグ */
  isApplying: boolean;
  /** 保存中フラグ */
  isSaving: boolean;
  /** アイテムを設定 */
  setItems: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  /** データを再読み込み */
  reload: () => Promise<void>;
  /** アイテムを追加 */
  add: (file: File) => Promise<void>;
  /** アイテムを削除 */
  remove: (index: number) => Promise<void>;
  /** 指定インデックスがCurrent Skinか判定 */
  isCurrentSkin: (index: number) => boolean;
  /** Current Skinが存在するか */
  hasCurrentSkin: boolean;
  /** 適用中状態を設定 */
  setIsApplying: React.Dispatch<React.SetStateAction<boolean>>;
  /** 保存中状態を設定 */
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * メディアアイテムリストを管理するフック
 */
export function useMediaList(options: UseMediaListOptions): UseMediaListReturn {
  const {
    loadData,
    addItem,
    deleteItem,
    currentSkinPattern = 'Current Skin',
  } = options;

  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedItems = await loadData();
      setItems(loadedItems);
    } catch (error) {
      console.error('Failed to load items:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [loadData]);

  // 初期読み込み
  useEffect(() => {
    reload();
  }, []);

  const add = useCallback(async (file: File) => {
    if (!addItem) return;

    try {
      const newItem = await addItem(file);
      if (newItem) {
        setItems((current) => [...current, newItem]);
      }
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  }, [addItem]);

  const remove = useCallback(async (index: number) => {
    if (items.length <= 1) return;

    const item = items[index];
    if (item.name?.includes(currentSkinPattern)) return;

    if (deleteItem) {
      const success = await deleteItem(index, item);
      if (!success) {
        console.error('Failed to delete item');
        return;
      }
    }

    setItems((current) => current.filter((_, i) => i !== index));
  }, [items, deleteItem, currentSkinPattern]);

  const isCurrentSkin = useCallback((index: number) => {
    const item = items[index];
    return item?.name?.includes(currentSkinPattern) ?? false;
  }, [items, currentSkinPattern]);

  const hasCurrentSkin = items.some((item) => item.name?.includes(currentSkinPattern));

  return {
    items,
    isLoading,
    isApplying,
    isSaving,
    setItems,
    reload,
    add,
    remove,
    isCurrentSkin,
    hasCurrentSkin,
    setIsApplying,
    setIsSaving,
  };
}
