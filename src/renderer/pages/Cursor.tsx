/**
 * Cursor Editor Page - カーソル編集ページ
 * 
 * カーソルとカーソルトレイルの管理・適用を行う
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MediaCarouselSection } from '../components/common';
import { useCarousel, fileToBase64 } from '../hooks';
import type { MediaItem } from '../types';
import './Cursor.css';

// ============================================================
// 型定義
// ============================================================

interface CursorProps {
  currentSkin?: string;
}

interface CurrentSkinData {
  cursor: string | null;
  cursorTrail: string | null;
  cursorMiddle: string | null;
}

// ============================================================
// IPC API 関数
// ============================================================

const cursorApi = {
  /** カーソル一覧を取得 */
  getList: () => window.electron.ipcRenderer.invoke('cursor:getList'),
  
  /** トレイル一覧を取得 */
  getTrailList: () => window.electron.ipcRenderer.invoke('cursor:getTrailList'),
  
  /** 現在のスキンからカーソルを取得 */
  getCurrentSkin: () => window.electron.ipcRenderer.invoke('cursor:getCurrentSkin'),
  
  /** カーソルを追加 */
  add: (base64: string, subcategory: string, baseName: string) =>
    window.electron.ipcRenderer.invoke('cursor:add', base64, subcategory, baseName),
  
  /** トレイルを追加 */
  addTrail: (base64: string, subcategory: string, baseName: string) =>
    window.electron.ipcRenderer.invoke('cursor:addTrail', base64, subcategory, baseName),
  
  /** カーソルを適用 */
  apply: (base64: string, use2x: boolean) =>
    window.electron.ipcRenderer.invoke('cursor:apply', base64, use2x),
  
  /** トレイルを適用 */
  applyTrail: (base64: string, use2x: boolean, useCursorMiddle: boolean) =>
    window.electron.ipcRenderer.invoke('cursor:applyTrail', base64, use2x, useCursorMiddle),
  
  /** カーソルを削除 */
  delete: (presetId: string) =>
    window.electron.ipcRenderer.invoke('cursor:delete', presetId),
  
  /** トレイルを削除 */
  deleteTrail: (presetId: string) =>
    window.electron.ipcRenderer.invoke('cursor:deleteTrail', presetId),
  
  /** Current Skinのカーソルを保存 */
  saveCurrentSkinCursor: () =>
    window.electron.ipcRenderer.invoke('cursor:saveCurrentSkinCursor'),
  
  /** Current Skinのトレイルを保存 */
  saveCurrentSkinTrail: () =>
    window.electron.ipcRenderer.invoke('cursor:saveCurrentSkinTrail'),
};

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * バックエンドからのプリセットデータをMediaItemに変換
 */
function mapPresetToMediaItem(item: any, index: number): MediaItem {
  return {
    id: index + 1,
    name: item.name,
    preview: item.previewUrl,
    presetId: item.id,
  };
}

/**
 * プレースホルダーアイテムを作成
 */
function createPlaceholder(name: string): MediaItem {
  return { id: 1, name, preview: '' };
}

// ============================================================
// メインコンポーネント
// ============================================================

export default function Cursor({ currentSkin }: CursorProps): React.ReactElement {
  // カーソルデータ
  const [cursors, setCursors] = useState<MediaItem[]>([]);
  const [trails, setTrails] = useState<MediaItem[]>([]);
  
  // カーソルカルーセル
  const cursorCarousel = useCarousel(cursors);
  const trailCarousel = useCarousel(trails);
  
  // オプション
  const [cursor2x, setCursor2x] = useState(false);
  const [trail2x, setTrail2x] = useState(false);
  const [useCursorMiddle, setUseCursorMiddle] = useState(false);
  
  // ステータス
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedCursor, setHasSavedCursor] = useState(false);
  const [hasSavedTrail, setHasSavedTrail] = useState(false);
  
  // スキン変更追跡
  const prevSkinRef = useRef<string | undefined>(undefined);

  // --------------------------------------------------------
  // データ読み込み
  // --------------------------------------------------------
  
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 保存されている画像一覧を取得
      const [cursorList, trailList, currentSkinData] = await Promise.all([
        cursorApi.getList() as Promise<any[]>,
        cursorApi.getTrailList() as Promise<any[]>,
        cursorApi.getCurrentSkin() as Promise<CurrentSkinData>,
      ]);

      // カーソル一覧を構築
      const cursorItems: MediaItem[] = cursorList.map(mapPresetToMediaItem);
      const trailItems: MediaItem[] = trailList.map(mapPresetToMediaItem);

      // Current Skinのカーソルを先頭に追加
      if (currentSkinData.cursor) {
        cursorItems.unshift({
          id: 0,
          name: 'Current Skin',
          preview: currentSkinData.cursor,
        });
      }

      // Current Skinのトレイル/ミドルを先頭に追加
      if (currentSkinData.cursorTrail) {
        trailItems.unshift({
          id: 0,
          name: 'Current Skin (Trail)',
          preview: currentSkinData.cursorTrail,
        });
      } else if (currentSkinData.cursorMiddle) {
        trailItems.unshift({
          id: 0,
          name: 'Current Skin (Middle)',
          preview: currentSkinData.cursorMiddle,
        });
        setUseCursorMiddle(true);
      }

      // プレースホルダー
      if (cursorItems.length === 0) {
        cursorItems.push(createPlaceholder('No cursor'));
      }
      if (trailItems.length === 0) {
        trailItems.push(createPlaceholder('No trail'));
      }

      setCursors(cursorItems);
      setTrails(trailItems);
    } catch (error) {
      console.error('Failed to load cursor data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初期読み込み
  useEffect(() => {
    loadData();
  }, [loadData]);

  // スキン変更時の再読み込み
  useEffect(() => {
    if (prevSkinRef.current !== undefined && prevSkinRef.current !== currentSkin) {
      loadData();
      setHasSavedCursor(false);
      setHasSavedTrail(false);
    }
    prevSkinRef.current = currentSkin;
  }, [currentSkin, loadData]);

  // --------------------------------------------------------
  // カーソル操作
  // --------------------------------------------------------

  const handleAddCursor = useCallback(async (file: File) => {
    if (!file.type.includes('png')) {
      window.alert('PNG形式のみ対応しています');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      const result = await cursorApi.add(base64, 'custom', 'cursor') as {
        success: boolean;
        savedName?: string;
        error?: string;
      };

      if (result.success) {
        const newItem: MediaItem = {
          id: cursors.length + 1,
          name: result.savedName || `cursor-${cursors.length + 1}`,
          preview: base64,
        };
        setCursors((prev) => [...prev, newItem]);
      } else {
        window.alert(result.error || 'カーソルの追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to add cursor:', error);
      window.alert('カーソルの追加に失敗しました');
    }
  }, [cursors.length]);

  const handleDeleteCursor = useCallback(async (index: number) => {
    if (cursors.length <= 1) return;

    const cursor = cursors[index];
    if (cursor.name === 'Current Skin') return;

    if (cursor.presetId) {
      try {
        await cursorApi.delete(cursor.presetId);
      } catch (error) {
        console.error('Failed to delete cursor:', error);
      }
    }

    const newLength = cursors.length - 1;
    setCursors((prev) => prev.filter((_, i) => i !== index));
    cursorCarousel.adjustIndexAfterDelete(index, newLength);
  }, [cursors, cursorCarousel]);

  const handleApplyCursor = useCallback(async () => {
    const cursor = cursors[cursorCarousel.selectedIndex];
    if (!cursor?.preview) return;

    setIsApplying(true);
    try {
      const result = await cursorApi.apply(cursor.preview, cursor2x) as {
        success: boolean;
        error?: string;
      };
      if (!result.success) {
        console.error('Failed to apply cursor:', result.error);
      }
    } catch (error) {
      console.error('Failed to apply cursor:', error);
    } finally {
      setIsApplying(false);
    }
  }, [cursors, cursorCarousel.selectedIndex, cursor2x]);

  const handleSaveCurrentSkinCursor = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await cursorApi.saveCurrentSkinCursor() as {
        success: boolean;
        error?: string;
      };
      if (result.success) {
        setHasSavedCursor(true);
        await loadData();
      } else {
        console.error('Failed to save cursor:', result.error);
      }
    } catch (error) {
      console.error('Failed to save cursor:', error);
    } finally {
      setIsSaving(false);
    }
  }, [loadData]);

  // --------------------------------------------------------
  // トレイル操作
  // --------------------------------------------------------

  const handleAddTrail = useCallback(async (file: File) => {
    if (!file.type.includes('png')) {
      window.alert('PNG形式のみ対応しています');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      const result = await cursorApi.addTrail(base64, 'custom', 'cursortrail') as {
        success: boolean;
        savedName?: string;
        error?: string;
      };

      if (result.success) {
        const newItem: MediaItem = {
          id: trails.length + 1,
          name: result.savedName || `cursortrail-${trails.length + 1}`,
          preview: base64,
        };
        setTrails((prev) => [...prev, newItem]);
      } else {
        window.alert(result.error || 'トレイルの追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to add trail:', error);
      window.alert('トレイルの追加に失敗しました');
    }
  }, [trails.length]);

  const handleDeleteTrail = useCallback(async (index: number) => {
    if (trails.length <= 1) return;

    const trail = trails[index];
    if (trail.name?.startsWith('Current Skin')) return;

    if (trail.presetId) {
      try {
        await cursorApi.deleteTrail(trail.presetId);
      } catch (error) {
        console.error('Failed to delete trail:', error);
      }
    }

    const newLength = trails.length - 1;
    setTrails((prev) => prev.filter((_, i) => i !== index));
    trailCarousel.adjustIndexAfterDelete(index, newLength);
  }, [trails, trailCarousel]);

  const handleApplyTrail = useCallback(async () => {
    const trail = trails[trailCarousel.selectedIndex];
    if (!trail?.preview) return;

    setIsApplying(true);
    try {
      const result = await cursorApi.applyTrail(trail.preview, trail2x, useCursorMiddle) as {
        success: boolean;
        error?: string;
      };
      if (!result.success) {
        console.error('Failed to apply trail:', result.error);
      }
    } catch (error) {
      console.error('Failed to apply trail:', error);
    } finally {
      setIsApplying(false);
    }
  }, [trails, trailCarousel.selectedIndex, trail2x, useCursorMiddle]);

  const handleSaveCurrentSkinTrail = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await cursorApi.saveCurrentSkinTrail() as {
        success: boolean;
        error?: string;
      };
      if (result.success) {
        setHasSavedTrail(true);
        await loadData();
      } else {
        console.error('Failed to save trail:', result.error);
      }
    } catch (error) {
      console.error('Failed to save trail:', error);
    } finally {
      setIsSaving(false);
    }
  }, [loadData]);

  // --------------------------------------------------------
  // Current Skin判定
  // --------------------------------------------------------

  const isCurrentSkinCursor = cursors[cursorCarousel.selectedIndex]?.name === 'Current Skin';
  const isCurrentSkinTrail = trails[trailCarousel.selectedIndex]?.name?.startsWith('Current Skin');
  const hasCurrentSkinCursor = cursors.some((c) => c.name === 'Current Skin');
  const hasCurrentSkinTrail = trails.some((t) => t.name?.startsWith('Current Skin'));

  // --------------------------------------------------------
  // レンダリング
  // --------------------------------------------------------

  if (isLoading) {
    return <div className="cursor-editor page loading">読み込み中...</div>;
  }

  return (
    <div className="cursor-editor page">
      {/* Cursor Section */}
      <MediaCarouselSection
        title="Cursor"
        iconType="default"
        items={cursors}
        selectedIndex={cursorCarousel.selectedIndex}
        isAnimating={cursorCarousel.isAnimating}
        slideDirection={cursorCarousel.slideDirection}
        onPrev={cursorCarousel.goToPrev}
        onNext={cursorCarousel.goToNext}
        onAdd={handleAddCursor}
        onDelete={handleDeleteCursor}
        onApply={handleApplyCursor}
        onSaveCurrentSkin={handleSaveCurrentSkinCursor}
        isCurrentSkin={isCurrentSkinCursor}
        hasCurrentSkin={hasCurrentSkinCursor}
        hasSaved={hasSavedCursor}
        use2x={cursor2x}
        onUse2xChange={setCursor2x}
        isApplying={isApplying}
        isSaving={isSaving}
        dropzoneText="Drop cursor image or click to add (PNG only)"
      />

      {/* Cursor Trail Section */}
      <MediaCarouselSection
        title="Cursor Trail"
        iconType="accent"
        items={trails}
        selectedIndex={trailCarousel.selectedIndex}
        isAnimating={trailCarousel.isAnimating}
        slideDirection={trailCarousel.slideDirection}
        onPrev={trailCarousel.goToPrev}
        onNext={trailCarousel.goToNext}
        onAdd={handleAddTrail}
        onDelete={handleDeleteTrail}
        onApply={handleApplyTrail}
        onSaveCurrentSkin={handleSaveCurrentSkinTrail}
        isCurrentSkin={isCurrentSkinTrail ?? false}
        hasCurrentSkin={hasCurrentSkinTrail}
        hasSaved={hasSavedTrail}
        use2x={trail2x}
        onUse2xChange={setTrail2x}
        isApplying={isApplying}
        isSaving={isSaving}
        dropzoneText="Drop trail image or click to add (PNG only)"
        additionalToggles={[
          {
            label: 'cursormiddle',
            checked: useCursorMiddle,
            onChange: setUseCursorMiddle,
          },
        ]}
      />
    </div>
  );
}
