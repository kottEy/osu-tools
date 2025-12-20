/**
 * HitCircle Editor Page - ヒットサークル編集ページ
 * 
 * ヒットサークル、オーバーレイ、数字プリセットの管理・適用を行う
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Button,
  Toggle,
} from '../components/ui';
import { MediaCarouselSection } from '../components/common';
import { NumberPresetCard } from '../components/features/numbers';
import { useCarousel, fileToBase64 } from '../hooks';
import type { MediaItem, NumberPreset } from '../types';
import { createEmptyNumberPreset } from '../types';
import { ControlsRowRight } from '../components/ui';
import './HitCircle.css';

// ============================================================
// 型定義
// ============================================================

interface HitCircleProps {
  currentSkin?: string;
}

interface CurrentSkinData {
  hitcircle: string | null;
  hitcircleOverlay: string | null;
}

// ============================================================
// IPC API 関数
// ============================================================

const hitcircleApi = {
  // ヒットサークル関連
  getList: () => window.electron.ipcRenderer.invoke('hitcircle:getList'),
  getOverlayList: () => window.electron.ipcRenderer.invoke('hitcircle:getOverlayList'),
  getCurrentSkin: () => window.electron.ipcRenderer.invoke('hitcircle:getCurrentSkin'),
  add: (base64: string, subcategory: string, baseName: string) =>
    window.electron.ipcRenderer.invoke('hitcircle:add', base64, subcategory, baseName),
  addOverlay: (base64: string, subcategory: string, baseName: string) =>
    window.electron.ipcRenderer.invoke('hitcircle:addOverlay', base64, subcategory, baseName),
  apply: (base64: string, use2x: boolean) =>
    window.electron.ipcRenderer.invoke('hitcircle:apply', base64, use2x),
  applyOverlay: (base64: string, use2x: boolean) =>
    window.electron.ipcRenderer.invoke('hitcircle:applyOverlay', base64, use2x),
  applyAll: (hitcircleBase64: string, overlayBase64: string, use2x: boolean) =>
    window.electron.ipcRenderer.invoke('hitcircle:applyAll', hitcircleBase64, overlayBase64, use2x),
  delete: (presetId: string) =>
    window.electron.ipcRenderer.invoke('hitcircle:delete', presetId),
  deleteOverlay: (presetId: string) =>
    window.electron.ipcRenderer.invoke('hitcircle:deleteOverlay', presetId),
  saveCurrentSkinHitCircle: () =>
    window.electron.ipcRenderer.invoke('hitcircle:saveCurrentSkinHitCircle'),
  saveCurrentSkinOverlay: () =>
    window.electron.ipcRenderer.invoke('hitcircle:saveCurrentSkinOverlay'),

  // 数字プリセット関連
  getCurrentSkinDefaultNumbers: () =>
    window.electron.ipcRenderer.invoke('hitcircle:getCurrentSkinDefaultNumbers'),
  getNumberPresets: () =>
    window.electron.ipcRenderer.invoke('hitcircle:getNumberPresets'),
  createNumberPreset: (name: string) =>
    window.electron.ipcRenderer.invoke('hitcircle:createNumberPreset', name),
  deleteNumberPreset: (id: string) =>
    window.electron.ipcRenderer.invoke('hitcircle:deleteNumberPreset', id),
  renameNumberPreset: (oldName: string, newName: string) =>
    window.electron.ipcRenderer.invoke('hitcircle:renameNumberPreset', oldName, newName),
  applyNumberPreset: (id: string, use2x: boolean) =>
    window.electron.ipcRenderer.invoke('hitcircle:applyNumberPreset', id, use2x),
  applyCurrentSkinNumbersCache: () =>
    window.electron.ipcRenderer.invoke('hitcircle:applyCurrentSkinNumbersCache'),
  updateNumberPresetImage: (presetId: string, numberKey: string, base64: string) =>
    window.electron.ipcRenderer.invoke('hitcircle:updateNumberPresetImage', presetId, numberKey, base64),
  removeNumberFromPreset: (presetId: string, numberKey: string) =>
    window.electron.ipcRenderer.invoke('hitcircle:removeNumberFromPreset', presetId, numberKey),
  saveCurrentSkinNumbersAsPreset: (name: string) =>
    window.electron.ipcRenderer.invoke('hitcircle:saveCurrentSkinNumbersAsPreset', name),
};

// ============================================================
// ヘルパー関数
// ============================================================

function mapPresetToMediaItem(item: any, index: number): MediaItem {
  return {
    id: index + 1,
    name: item.name,
    preview: item.previewUrl,
    presetId: item.id,
  };
}

function createPlaceholder(name: string): MediaItem {
  return { id: 1, name, preview: '' };
}

/**
 * プリセット名から一意の名前を生成
 */
function makeUniquePresetName(presets: NumberPreset[], basePrefix: string): string {
  const nonCurrentSkinPresets = presets.filter((p) => p.id !== 'current-skin');
  
  let maxNumber = 0;
  const regex = new RegExp(`^${basePrefix}\\s*(\\d+)$`, 'i');
  for (const preset of nonCurrentSkinPresets) {
    const match = preset.name.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  }
  
  return `${basePrefix} ${maxNumber + 1}`;
}

// ============================================================
// メインコンポーネント
// ============================================================

export default function HitCircle({ currentSkin }: HitCircleProps): React.ReactElement {
  // データ
  const [hitcircles, setHitcircles] = useState<MediaItem[]>([]);
  const [overlays, setOverlays] = useState<MediaItem[]>([]);
  const [numberPresets, setNumberPresets] = useState<NumberPreset[]>([]);

  // カルーセル
  const circleCarousel = useCarousel(hitcircles);
  const overlayCarousel = useCarousel(overlays);

  // オプション
  const [hitcircles2x, setHitcircles2x] = useState(false);
  const [overlays2x, setOverlays2x] = useState(false);
  const [use2x, setUse2x] = useState(false);

  // ステータス
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedHitCircle, setHasSavedHitCircle] = useState(false);
  const [hasSavedOverlay, setHasSavedOverlay] = useState(false);
  const [hasSavedNumbers, setHasSavedNumbers] = useState(false);

  // Number Preset UI状態
  const [expandedPresets, setExpandedPresets] = useState<Set<string>>(new Set());
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [selectedPreviewKey, setSelectedPreviewKey] = useState<string | null>(null);

  // スキン変更追跡
  const prevSkinRef = useRef<string | undefined>(undefined);

  // --------------------------------------------------------
  // データ読み込み
  // --------------------------------------------------------

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 並列でデータ取得
      const [hitcircleList, overlayList, currentSkinData, currentSkinNumbers, savedPresets] = await Promise.all([
        hitcircleApi.getList() as Promise<any[]>,
        hitcircleApi.getOverlayList() as Promise<any[]>,
        hitcircleApi.getCurrentSkin() as Promise<CurrentSkinData>,
        hitcircleApi.getCurrentSkinDefaultNumbers() as Promise<{ [key: string]: string | null }>,
        hitcircleApi.getNumberPresets() as Promise<NumberPreset[]>,
      ]);

      // ヒットサークル一覧
      const hitcircleItems: MediaItem[] = hitcircleList.map(mapPresetToMediaItem);
      const overlayItems: MediaItem[] = overlayList.map(mapPresetToMediaItem);

      // Current Skin追加
      if (currentSkinData.hitcircle) {
        hitcircleItems.unshift({ id: 0, name: 'Current Skin', preview: currentSkinData.hitcircle });
      }
      if (currentSkinData.hitcircleOverlay) {
        overlayItems.unshift({ id: 0, name: 'Current Skin (Overlay)', preview: currentSkinData.hitcircleOverlay });
      }

      // プレースホルダー
      if (hitcircleItems.length === 0) hitcircleItems.push(createPlaceholder('No hitcircle'));
      if (overlayItems.length === 0) overlayItems.push(createPlaceholder('No overlay'));

      setHitcircles(hitcircleItems);
      setOverlays(overlayItems);

      // 数字プリセット
      const presetsArray: NumberPreset[] = [];
      
      const hasAnyNumber = Object.values(currentSkinNumbers).some((v) => v !== null);
      if (hasAnyNumber) {
        presetsArray.push({
          id: 'current-skin',
          name: 'Current Skin',
          numbers: currentSkinNumbers,
        });
        if (currentSkinNumbers['default-1']) {
          setSelectedPreviewKey('current-skin-default-1');
        }
      }

      if (savedPresets?.length > 0) {
        presetsArray.push(...savedPresets);
      }

      setNumberPresets(presetsArray);
    } catch (error) {
      console.error('Failed to load hitcircle data:', error);
      setHitcircles([createPlaceholder('No hitcircle')]);
      setOverlays([createPlaceholder('No overlay')]);
      setNumberPresets([]);
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
      setHasSavedHitCircle(false);
      setHasSavedOverlay(false);
      setHasSavedNumbers(false);
    }
    prevSkinRef.current = currentSkin;
  }, [currentSkin, loadData]);

  // --------------------------------------------------------
  // プレビュー用ヘルパー
  // --------------------------------------------------------

  const getPreviewNumberImage = useCallback(() => {
    if (!selectedPreviewKey) return null;
    const parts = selectedPreviewKey.split('-default-');
    if (parts.length !== 2) return null;
    const presetId = parts[0];
    const numberKey = `default-${parts[1]}`;
    const preset = numberPresets.find((p) => p.id === presetId);
    return preset?.numbers[numberKey] || null;
  }, [selectedPreviewKey, numberPresets]);

  const getPreviewDisplayNumber = useCallback(() => {
    if (!selectedPreviewKey) return '1';
    const parts = selectedPreviewKey.split('-default-');
    return parts.length === 2 ? parts[1] : '1';
  }, [selectedPreviewKey]);

  // --------------------------------------------------------
  // ヒットサークル操作
  // --------------------------------------------------------

  // Convert File or dataURL to a 256x256 PNG dataURL (preserve aspect ratio and center with transparent padding)
  const normalizeTo256 = async (input: File | string): Promise<string> => {
    const url = typeof input === 'string' ? input : await fileToBase64(input);
    return await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No canvas context'));
        ctx.clearRect(0, 0, size, size);
        // draw transparent background (default)
        const ratio = Math.min(size / img.width, size / img.height);
        const newW = Math.round(img.width * ratio);
        const newH = Math.round(img.height * ratio);
        const dx = Math.round((size - newW) / 2);
        const dy = Math.round((size - newH) / 2);
        ctx.drawImage(img, dx, dy, newW, newH);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (e) => reject(new Error('Failed to load image'));
      img.src = url;
    });
  };

  const handleAddHitcircle = useCallback(async (file: File) => {
    if (file.type !== 'image/png') {
      window.alert('PNG形式のみ対応しています');
      return;
    }

    try {
      const normalized = await normalizeTo256(file);
      const result = await hitcircleApi.add(normalized, 'custom', 'hitcircle') as {
        success: boolean;
        savedName?: string;
        error?: string;
      };

      if (result.success) {
        const newItem: MediaItem = {
          id: hitcircles.length + 1,
          name: result.savedName || `hitcircle-${hitcircles.length + 1}`,
          preview: normalized,
        };
        setHitcircles((prev) => [...prev, newItem]);
      } else {
        window.alert(result.error || 'ヒットサークルの追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to add hitcircle:', error);
      window.alert('ヒットサークルの追加に失敗しました');
    }
  }, [hitcircles.length]);

  const handleDeleteHitcircle = useCallback(async (index: number) => {
    if (hitcircles.length <= 1) return;
    const hitcircle = hitcircles[index];
    if (hitcircle.name === 'Current Skin') return;

    if (hitcircle.presetId) {
      try {
        await hitcircleApi.delete(hitcircle.presetId);
      } catch (error) {
        console.error('Failed to delete hitcircle:', error);
      }
    }
    const newLength = hitcircles.length - 1;
    setHitcircles((prev) => prev.filter((_, i) => i !== index));
    circleCarousel.adjustIndexAfterDelete(index, newLength);
  }, [hitcircles, circleCarousel]);

  const handleApplyHitcircle = useCallback(async () => {
    const hitcircle = hitcircles[circleCarousel.selectedIndex];
    if (!hitcircle?.preview) return;

    setIsApplying(true);
    try {
      const normalized = await normalizeTo256(hitcircle.preview);
      const result = await hitcircleApi.apply(normalized, hitcircles2x) as { success: boolean; error?: string };
      if (!result.success) console.error('Failed to apply hitcircle:', result.error);
    } catch (error) {
      console.error('Failed to apply hitcircle:', error);
    } finally {
      setIsApplying(false);
    }
  }, [hitcircles, circleCarousel.selectedIndex, hitcircles2x]);

  const handleSaveCurrentSkinHitCircle = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await hitcircleApi.saveCurrentSkinHitCircle() as { success: boolean; error?: string };
      if (result.success) {
        setHasSavedHitCircle(true);
        await loadData();
      }
    } catch (error) {
      console.error('Failed to save hitcircle:', error);
    } finally {
      setIsSaving(false);
    }
  }, [loadData]);

  // --------------------------------------------------------
  // オーバーレイ操作
  // --------------------------------------------------------

  const handleAddOverlay = useCallback(async (file: File) => {
    if (file.type !== 'image/png') {
      window.alert('PNG形式のみ対応しています');
      return;
    }

    try {
      const normalized = await normalizeTo256(file);
      const result = await hitcircleApi.addOverlay(normalized, 'custom', 'overlay') as {
        success: boolean;
        savedName?: string;
        error?: string;
      };

      if (result.success) {
        const newItem: MediaItem = {
          id: overlays.length + 1,
          name: result.savedName || `overlay-${overlays.length + 1}`,
          preview: normalized,
        };
        setOverlays((prev) => [...prev, newItem]);
      } else {
        window.alert(result.error || 'オーバーレイの追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to add overlay:', error);
      window.alert('オーバーレイの追加に失敗しました');
    }
  }, [overlays.length]);

  const handleDeleteOverlay = useCallback(async (index: number) => {
    if (overlays.length <= 1) return;
    const overlay = overlays[index];
    if (overlay.name === 'Current Skin (Overlay)') return;

    if (overlay.presetId) {
      try {
        await hitcircleApi.deleteOverlay(overlay.presetId);
      } catch (error) {
        console.error('Failed to delete overlay:', error);
      }
    }
    const newLength = overlays.length - 1;
    setOverlays((prev) => prev.filter((_, i) => i !== index));
    overlayCarousel.adjustIndexAfterDelete(index, newLength);
  }, [overlays, overlayCarousel]);

  const handleApplyOverlay = useCallback(async () => {
    const overlay = overlays[overlayCarousel.selectedIndex];
    if (!overlay?.preview) return;

    setIsApplying(true);
    try {
      const normalized = await normalizeTo256(overlay.preview);
      const result = await hitcircleApi.applyOverlay(normalized, overlays2x) as { success: boolean; error?: string };
      if (!result.success) console.error('Failed to apply overlay:', result.error);
    } catch (error) {
      console.error('Failed to apply overlay:', error);
    } finally {
      setIsApplying(false);
    }
  }, [overlays, overlayCarousel.selectedIndex, overlays2x]);

  const handleSaveCurrentSkinOverlay = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await hitcircleApi.saveCurrentSkinOverlay() as { success: boolean; error?: string };
      if (result.success) {
        setHasSavedOverlay(true);
        await loadData();
      }
    } catch (error) {
      console.error('Failed to save overlay:', error);
    } finally {
      setIsSaving(false);
    }
  }, [loadData]);

  // --------------------------------------------------------
  // 全体適用
  // --------------------------------------------------------

  const handleApplyAll = useCallback(async () => {
    const hitcircle = hitcircles[circleCarousel.selectedIndex];
    const overlay = overlays[overlayCarousel.selectedIndex];
    if (!hitcircle?.preview || !overlay?.preview) return;

    setIsApplying(true);
    try {
      const normalizedHit = await normalizeTo256(hitcircle.preview);
      const normalizedOverlay = await normalizeTo256(overlay.preview);
      const result = await hitcircleApi.applyAll(normalizedHit, normalizedOverlay, use2x) as { success: boolean; error?: string };
      if (!result.success) console.error('Failed to apply all:', result.error);
    } catch (error) {
      console.error('Failed to apply all:', error);
    } finally {
      setIsApplying(false);
    }
  }, [hitcircles, overlays, circleCarousel.selectedIndex, overlayCarousel.selectedIndex, use2x]);

  // --------------------------------------------------------
  // 数字プリセット操作
  // --------------------------------------------------------

  const handleAddPreset = useCallback(async () => {
    const name = makeUniquePresetName(numberPresets, 'Number Preset');
    try {
      const result = await hitcircleApi.createNumberPreset(name) as { success: boolean; preset?: NumberPreset; error?: string };
      if (result.success && result.preset) {
        setNumberPresets((prev) => [...prev, result.preset!]);
        setExpandedPresets((prev) => new Set(prev).add(result.preset!.id));
      } else {
        const newPreset = createEmptyNumberPreset(name);
        setNumberPresets((prev) => [...prev, newPreset]);
        setExpandedPresets((prev) => new Set(prev).add(newPreset.id));
      }
    } catch (error) {
      console.error('Failed to create preset:', error);
      const newPreset = createEmptyNumberPreset(name);
      setNumberPresets((prev) => [...prev, newPreset]);
      setExpandedPresets((prev) => new Set(prev).add(newPreset.id));
    }
  }, [numberPresets]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedPresets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleStartEditing = useCallback((preset: NumberPreset) => {
    setEditingPresetId(preset.id);
    setEditingName(preset.name);
  }, []);

  const handleSaveName = useCallback(async (id: string, name: string) => {
    const preset = numberPresets.find((p) => p.id === id);
    if (!preset) return;

    try {
      const result = await hitcircleApi.renameNumberPreset(preset.name, name) as { success: boolean; error?: string };
      if (result.success) {
        setNumberPresets((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
      } else {
        console.error('Failed to rename preset:', result.error);
        window.alert(result.error || 'プリセット名の変更に失敗しました');
      }
    } catch (error) {
      console.error('Failed to rename preset:', error);
      window.alert('プリセット名の変更に失敗しました');
    }
    setEditingPresetId(null);
  }, [numberPresets]);

  const handleDeletePreset = useCallback(async (id: string) => {
    try {
      await hitcircleApi.deleteNumberPreset(id);
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
    setNumberPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleApplyPreset = useCallback(async (preset: NumberPreset) => {
    setIsApplying(true);
    try {
      if (preset.id === 'current-skin') {
        await hitcircleApi.applyCurrentSkinNumbersCache();
      } else {
        await hitcircleApi.applyNumberPreset(preset.id, use2x);
      }
    } catch (error) {
      console.error('Failed to apply preset:', error);
    } finally {
      setIsApplying(false);
    }
  }, [use2x]);

  const handleImageUpload = useCallback(async (presetId: string, numberKey: string, file: File) => {
    if (!file.type.includes('png')) {
      window.alert('PNG形式のみ対応しています');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      const result = await hitcircleApi.updateNumberPresetImage(presetId, numberKey, base64) as { success: boolean; error?: string };

      if (result.success) {
        setNumberPresets((prev) =>
          prev.map((p) => (p.id === presetId ? { ...p, numbers: { ...p.numbers, [numberKey]: base64 } } : p))
        );
      } else {
        window.alert(result.error || '画像の追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      window.alert('画像の追加に失敗しました');
    }
  }, []);

  const handleImageRemove = useCallback(async (presetId: string, numberKey: string) => {
    if (presetId !== 'current-skin') {
      try {
        await hitcircleApi.removeNumberFromPreset(presetId, numberKey);
      } catch (error) {
        console.error('Failed to remove number from preset:', error);
      }
    }

    const removedKey = `${presetId}-${numberKey}`;
    if (selectedPreviewKey === removedKey) {
      setSelectedPreviewKey(null);
    }
    setNumberPresets((prev) =>
      prev.map((p) => (p.id === presetId ? { ...p, numbers: { ...p.numbers, [numberKey]: null } } : p))
    );
  }, [selectedPreviewKey]);

  const handleSelectForPreview = useCallback((presetId: string, numberKey: string) => {
    const key = `${presetId}-${numberKey}`;
    setSelectedPreviewKey((prev) => (prev === key ? null : key));
  }, []);

  const handleSaveCurrentSkinNumbersAsPreset = useCallback(async () => {
    const name = makeUniquePresetName(numberPresets, 'Number Preset');
    setIsSaving(true);
    try {
      const result = await hitcircleApi.saveCurrentSkinNumbersAsPreset(name) as { success: boolean; error?: string };
      if (result.success) {
        setHasSavedNumbers(true);
        await loadData();
      }
    } catch (error) {
      console.error('Failed to save numbers preset:', error);
    } finally {
      setIsSaving(false);
    }
  }, [numberPresets, loadData]);

  // --------------------------------------------------------
  // Current Skin判定
  // --------------------------------------------------------

  const isCurrentSkinHitCircle = hitcircles[circleCarousel.selectedIndex]?.name === 'Current Skin';
  const isCurrentSkinOverlay = overlays[overlayCarousel.selectedIndex]?.name?.startsWith('Current Skin');
  const hasCurrentSkinHitCircle = hitcircles.some((c) => c.name === 'Current Skin');
  const hasCurrentSkinOverlay = overlays.some((o) => o.name?.startsWith('Current Skin'));

  const previewNumberImage = getPreviewNumberImage();
  const displayNumber = getPreviewDisplayNumber();

  // --------------------------------------------------------
  // レンダリング
  // --------------------------------------------------------

  if (isLoading) {
    return <div className="hitcircle-editor page loading">読み込み中...</div>;
  }

  return (
    <div className="hitcircle-editor page">
      {/* Preview Section */}
      <div className="layout-top">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardBody className="preview-area">
            <div className="preview-combined">
              <img
                src={hitcircles[circleCarousel.selectedIndex]?.preview}
                alt="hitcircle"
                className="preview-base"
              />
              <img
                src={overlays[overlayCarousel.selectedIndex]?.preview}
                alt="overlay"
                className="preview-overlay"
              />
              {previewNumberImage ? (
                <img src={previewNumberImage} alt="number" className="preview-number-image" />
              ) : (
                <div className="preview-number">{displayNumber}</div>
              )}
            </div>
            <ControlsRowRight>
              <Toggle label="@2x" checked={use2x} onChange={setUse2x} labelPosition="right" size="sm" />
              <Button
                variant="primary"
                onClick={handleApplyAll}
                disabled={isApplying || !hitcircles[circleCarousel.selectedIndex]?.preview || !overlays[overlayCarousel.selectedIndex]?.preview}
              >
                {isApplying ? 'Applying...' : 'Apply All'}
              </Button>
            </ControlsRowRight>
          </CardBody>
        </Card>
      </div>

      {/* Hit Circle and Overlay Sections */}
      <div className="layout-bottom">
        <MediaCarouselSection
          title="Hit Circle"
          items={hitcircles}
          selectedIndex={circleCarousel.selectedIndex}
          isAnimating={circleCarousel.isAnimating}
          slideDirection={circleCarousel.slideDirection}
          onPrev={circleCarousel.goToPrev}
          onNext={circleCarousel.goToNext}
          onAdd={handleAddHitcircle}
          onDelete={handleDeleteHitcircle}
          onApply={handleApplyHitcircle}
          onSaveCurrentSkin={handleSaveCurrentSkinHitCircle}
          isCurrentSkin={isCurrentSkinHitCircle}
          hasCurrentSkin={hasCurrentSkinHitCircle}
          hasSaved={hasSavedHitCircle}
          use2x={hitcircles2x}
          onUse2xChange={setHitcircles2x}
          isApplying={isApplying}
          isSaving={isSaving}
          dropzoneText="Drop hit circle image or click to add (PNG only)"
          acceptedFileTypes="image/png"
        />

        <MediaCarouselSection
          title="Hit Circle Overlay"
          items={overlays}
          selectedIndex={overlayCarousel.selectedIndex}
          isAnimating={overlayCarousel.isAnimating}
          slideDirection={overlayCarousel.slideDirection}
          onPrev={overlayCarousel.goToPrev}
          onNext={overlayCarousel.goToNext}
          onAdd={handleAddOverlay}
          onDelete={handleDeleteOverlay}
          onApply={handleApplyOverlay}
          onSaveCurrentSkin={handleSaveCurrentSkinOverlay}
          isCurrentSkin={isCurrentSkinOverlay ?? false}
          hasCurrentSkin={hasCurrentSkinOverlay}
          hasSaved={hasSavedOverlay}
          use2x={overlays2x}
          onUse2xChange={setOverlays2x}
          isApplying={isApplying}
          isSaving={isSaving}
          dropzoneText="Drop overlay image or click to add (PNG only)"
          acceptedFileTypes="image/png"
        />
      </div>

      {/* Number Presets Section */}
      <div className="layout-numbers">
        <div className="numbers-header">
          <h3 className="numbers-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            Default Numbers
          </h3>
          <Button onClick={handleAddPreset}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, marginRight: 6 }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Preset
          </Button>
        </div>

        <div className="numbers-list">
          {numberPresets.map((preset) => (
            <NumberPresetCard
              key={preset.id}
              preset={preset}
              isExpanded={expandedPresets.has(preset.id)}
              selectedPreviewKey={selectedPreviewKey}
              onToggleExpand={() => handleToggleExpand(preset.id)}
              onStartEditing={() => handleStartEditing(preset)}
              onSaveName={(name) => handleSaveName(preset.id, name)}
              onCancelEditing={() => setEditingPresetId(null)}
              onDelete={() => handleDeletePreset(preset.id)}
              onApply={() => handleApplyPreset(preset)}
              onImageUpload={(key, file) => handleImageUpload(preset.id, key, file)}
              onImageRemove={(key) => handleImageRemove(preset.id, key)}
              onSelectForPreview={(pId, key) => handleSelectForPreview(pId, key)}
              isEditing={editingPresetId === preset.id}
              editingName={editingName}
              onEditingNameChange={setEditingName}
              isCurrentSkin={preset.id === 'current-skin'}
              onSaveAsPreset={preset.id === 'current-skin' && !hasSavedNumbers ? handleSaveCurrentSkinNumbersAsPreset : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
