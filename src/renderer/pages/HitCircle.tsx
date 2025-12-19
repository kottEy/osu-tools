import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Carousel,
  CarouselRow,
  CarouselItem,
  IconButton,
  getVisible,
  Uploader,
  ControlsRow,
  ControlsRowRight,
  TrashButton,
  Toggle,
  Button,
} from '../components/ui';
import { NumberPresetCard } from '../components/features/numbers';
import type { MediaItem, NumberPreset } from '../types';
import { createEmptyNumberPreset } from '../types';
import './HitCircle.css';

interface HitCircleProps {
  currentSkin?: string;
}

export default function HitCircle({ currentSkin }: HitCircleProps) {
  const [hitcircles, setHitcircles] = useState<MediaItem[]>([]);
  const [overlays, setOverlays] = useState<MediaItem[]>([]);
  const [hitcircles2x, setHitcircles2x] = useState(false);
  const [overlays2x, setOverlays2x] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState(0);
  const [selectedOverlay, setSelectedOverlay] = useState(0);
  const [isAnimatingCircle, setIsAnimatingCircle] = useState(false);
  const [isAnimatingOverlay, setIsAnimatingOverlay] = useState(false);
  const [circleSlideDir, setCircleSlideDir] = useState<'left' | 'right' | null>(null);
  const [overlaySlideDir, setOverlaySlideDir] = useState<'left' | 'right' | null>(null);
  const [use2x, setUse2x] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedHitCircle, setHasSavedHitCircle] = useState(false);
  const [hasSavedOverlay, setHasSavedOverlay] = useState(false);
  const [hasSavedNumbers, setHasSavedNumbers] = useState(false);

  // Number Preset State
  const [numberPresets, setNumberPresets] = useState<NumberPreset[]>([]);
  const [expandedPresets, setExpandedPresets] = useState<Set<string>>(new Set());
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  // Format: 'presetId-default-N' or null
  const [selectedPreviewKey, setSelectedPreviewKey] = useState<string | null>(null);

  const fileRefCircle = React.useRef<HTMLInputElement | null>(null);
  const fileRefOverlay = React.useRef<HTMLInputElement | null>(null);
  const prevSkinRef = useRef<string | undefined>(undefined);

  // 初期データの読み込み
  useEffect(() => {
    loadData();
  }, []);

  // currentSkinが変更された時に自動で再読み込み
  useEffect(() => {
    if (prevSkinRef.current !== undefined && prevSkinRef.current !== currentSkin) {
      loadData();
      setHasSavedHitCircle(false);
      setHasSavedOverlay(false);
      setHasSavedNumbers(false);
    }
    prevSkinRef.current = currentSkin;
  }, [currentSkin]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // ヒットサークル一覧を取得
      const hitcircleList = await window.electron.ipcRenderer.invoke('hitcircle:getList') as any[];
      const overlayList = await window.electron.ipcRenderer.invoke('hitcircle:getOverlayList') as any[];

      const hitcircleItems: MediaItem[] = hitcircleList.map((item, idx) => ({
        id: idx + 1,
        name: item.name,
        preview: item.previewUrl,
      }));

      const overlayItems: MediaItem[] = overlayList.map((item, idx) => ({
        id: idx + 1,
        name: item.name,
        preview: item.previewUrl,
      }));

      // 現在のスキンからヒットサークル画像を取得
      const currentSkin = await window.electron.ipcRenderer.invoke('hitcircle:getCurrentSkin') as {
        hitcircle: string | null;
        hitcircleOverlay: string | null;
      };

      if (currentSkin.hitcircle) {
        hitcircleItems.unshift({
          id: 0,
          name: 'Current Skin',
          preview: currentSkin.hitcircle,
        });
      }

      if (currentSkin.hitcircleOverlay) {
        overlayItems.unshift({
          id: 0,
          name: 'Current Skin (Overlay)',
          preview: currentSkin.hitcircleOverlay,
        });
      }

      // 最低1つは表示するためのプレースホルダー
      if (hitcircleItems.length === 0) {
        hitcircleItems.push({ id: 1, name: 'No hitcircle', preview: '' });
      }
      if (overlayItems.length === 0) {
        overlayItems.push({ id: 1, name: 'No overlay', preview: '' });
      }

      setHitcircles(hitcircleItems);
      setOverlays(overlayItems);

      // 数字プリセットを取得
      const presetsArray: NumberPreset[] = [];

      // 現在のスキンからdefault数字を取得
      const currentSkinNumbers = await window.electron.ipcRenderer.invoke('hitcircle:getCurrentSkinDefaultNumbers') as {
        [key: string]: string | null;
      };

      // 1つでも画像があればCurrent Skinプリセットを追加
      const hasAnyNumber = Object.values(currentSkinNumbers).some((v) => v !== null);
      if (hasAnyNumber) {
        presetsArray.push({
          id: 'current-skin',
          name: 'Current Skin',
          numbers: currentSkinNumbers,
        });
        
        // Current Skinの「1」をデフォルトプレビューに設定
        if (currentSkinNumbers['default-1']) {
          setSelectedPreviewKey('current-skin-default-1');
        }
      }

      // 保存されているプリセットを取得
      const presets = await window.electron.ipcRenderer.invoke('hitcircle:getNumberPresets') as NumberPreset[];
      if (presets && presets.length > 0) {
        presetsArray.push(...presets);
      }

      setNumberPresets(presetsArray);
    } catch (error) {
      console.error('Failed to load hitcircle data:', error);
      // エラー時はプレースホルダーを表示
      setHitcircles([{ id: 1, name: 'No hitcircle', preview: '' }]);
      setOverlays([{ id: 1, name: 'No overlay', preview: '' }]);
      setNumberPresets([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ファイルをBase64に変換
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Get the preview number image from selected key
  const getPreviewNumberImage = () => {
    if (!selectedPreviewKey) return null;
    // Parse 'presetId-default-N'
    const parts = selectedPreviewKey.split('-default-');
    if (parts.length !== 2) return null;
    const presetId = parts[0];
    const numberKey = `default-${parts[1]}`;
    const preset = numberPresets.find((p) => p.id === presetId);
    return preset?.numbers[numberKey] || null;
  };

  // Get the display number (0-9) from selected key
  const getPreviewDisplayNumber = () => {
    if (!selectedPreviewKey) return '1'; // default
    const parts = selectedPreviewKey.split('-default-');
    if (parts.length !== 2) return '1';
    return parts[1];
  };

  // Navigation handlers
  const handlePrevCircle = () => {
    if (isAnimatingCircle || hitcircles.length <= 1) return;
    setCircleSlideDir('right');
    setIsAnimatingCircle(true);
    setSelectedCircle((s) => (s === 0 ? hitcircles.length - 1 : s - 1));
    setTimeout(() => setIsAnimatingCircle(false), 300);
  };

  const handleNextCircle = () => {
    if (isAnimatingCircle || hitcircles.length <= 1) return;
    setCircleSlideDir('left');
    setIsAnimatingCircle(true);
    setSelectedCircle((s) => (s === hitcircles.length - 1 ? 0 : s + 1));
    setTimeout(() => setIsAnimatingCircle(false), 300);
  };

  const handlePrevOverlay = () => {
    if (isAnimatingOverlay || overlays.length <= 1) return;
    setOverlaySlideDir('right');
    setIsAnimatingOverlay(true);
    setSelectedOverlay((s) => (s === 0 ? overlays.length - 1 : s - 1));
    setTimeout(() => setIsAnimatingOverlay(false), 300);
  };

  const handleNextOverlay = () => {
    if (isAnimatingOverlay || overlays.length <= 1) return;
    setOverlaySlideDir('left');
    setIsAnimatingOverlay(true);
    setSelectedOverlay((s) => (s === overlays.length - 1 ? 0 : s + 1));
    setTimeout(() => setIsAnimatingOverlay(false), 300);
  };

  // File handlers
  const handleAddHitcircle = async (file?: File) => {
    if (!file) return;

    if (!file.type.includes('png')) {
      window.alert('PNG形式のみ対応しています');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      // バックエンドに保存 (hitcircle-1, hitcircle-2... の連番で保存)
      const result = await window.electron.ipcRenderer.invoke(
        'hitcircle:add',
        base64,
        'custom',
        'hitcircle',
      ) as { success: boolean; savedName?: string; error?: string };

      if (result.success) {
        const savedName = result.savedName || `hitcircle-${hitcircles.length + 1}`;
        const newItem: MediaItem = {
          id: hitcircles.length + 1,
          name: savedName,
          preview: base64,
        };
        setHitcircles((s) => [...s, newItem]);
      } else {
        window.alert(result.error || 'ヒットサークルの追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to add hitcircle:', error);
      window.alert('ヒットサークルの追加に失敗しました');
    }
  };

  const handleAddOverlay = async (file?: File) => {
    if (!file) return;

    if (!file.type.includes('png')) {
      window.alert('PNG形式のみ対応しています');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      // バックエンドに保存 (overlay-1, overlay-2... の連番で保存)
      const result = await window.electron.ipcRenderer.invoke(
        'hitcircle:addOverlay',
        base64,
        'custom',
        'overlay',
      ) as { success: boolean; savedName?: string; error?: string };

      if (result.success) {
        const savedName = result.savedName || `overlay-${overlays.length + 1}`;
        const newItem: MediaItem = {
          id: overlays.length + 1,
          name: savedName,
          preview: base64,
        };
        setOverlays((s) => [...s, newItem]);
      } else {
        window.alert(result.error || 'オーバーレイの追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to add overlay:', error);
      window.alert('オーバーレイの追加に失敗しました');
    }
  };

  const handleDropCircle = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type.includes('png')) handleAddHitcircle(f);
  };

  const handleDropOverlay = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type.includes('png')) handleAddOverlay(f);
  };

  const handleDeleteCircle = (index: number) => {
    if (hitcircles.length <= 1) {
      return;
    }

    setHitcircles((s) => s.filter((_, i) => i !== index));
    setSelectedCircle(Math.max(0, Math.min(selectedCircle, hitcircles.length - 2)));
  };

  const handleDeleteOverlay = (index: number) => {
    if (overlays.length <= 1) {
      return;
    }

    setOverlays((s) => s.filter((_, i) => i !== index));
    setSelectedOverlay(Math.max(0, Math.min(selectedOverlay, overlays.length - 2)));
  };

  /**
   * ヒットサークルを適用
   */
  const handleApplyHitcircle = async () => {
    const hitcircle = hitcircles[selectedCircle];
    if (!hitcircle || !hitcircle.preview) {
      return;
    }

    setIsApplying(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'hitcircle:apply',
        hitcircle.preview,
        hitcircles2x,
      ) as { success: boolean; error?: string };

      if (result.success) {
        // 適用成功
      } else {
        console.error('Failed to apply hitcircle:', result.error);
      }
    } catch (error) {
      console.error('Failed to apply hitcircle:', error);
    } finally {
      setIsApplying(false);
    }
  };

  /**
   * オーバーレイを適用
   */
  const handleApplyOverlay = async () => {
    const overlay = overlays[selectedOverlay];
    if (!overlay || !overlay.preview) {
      return;
    }

    setIsApplying(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'hitcircle:applyOverlay',
        overlay.preview,
        overlays2x,
      ) as { success: boolean; error?: string };

      if (result.success) {
        // 適用成功
      } else {
        console.error('Failed to apply overlay:', result.error);
      }
    } catch (error) {
      console.error('Failed to apply overlay:', error);
    } finally {
      setIsApplying(false);
    }
  };

  /**
   * ヒットサークルとオーバーレイを両方適用
   */
  const handleApplyAll = async () => {
    const hitcircle = hitcircles[selectedCircle];
    const overlay = overlays[selectedOverlay];

    if (!hitcircle?.preview || !overlay?.preview) {
      return;
    }

    setIsApplying(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'hitcircle:applyAll',
        hitcircle.preview,
        overlay.preview,
        use2x,
      ) as { success: boolean; error?: string };

      if (result.success) {
        // 適用成功
      } else {
        console.error('Failed to apply all:', result.error);
      }
    } catch (error) {
      console.error('Failed to apply all:', error);
    } finally {
      setIsApplying(false);
    }
  };

  // Number Preset handlers
  const handleAddPreset = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'hitcircle:createNumberPreset',
        `Number Preset ${numberPresets.length + 1}`,
      ) as { success: boolean; preset?: NumberPreset; error?: string };

      if (result.success && result.preset) {
        setNumberPresets((prev) => [...prev, result.preset!]);
        setExpandedPresets((prev) => new Set(prev).add(result.preset!.id));
      } else {
        // フォールバック: ローカルで作成
        const newPreset = createEmptyNumberPreset(`Number Preset ${numberPresets.length + 1}`);
        setNumberPresets((prev) => [...prev, newPreset]);
        setExpandedPresets((prev) => new Set(prev).add(newPreset.id));
      }
    } catch (error) {
      console.error('Failed to create preset:', error);
      const newPreset = createEmptyNumberPreset(`Number Preset ${numberPresets.length + 1}`);
      setNumberPresets((prev) => [...prev, newPreset]);
      setExpandedPresets((prev) => new Set(prev).add(newPreset.id));
    }
  };

  const handleToggleExpand = (id: string) => {
    setExpandedPresets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStartEditing = (preset: NumberPreset) => {
    setEditingPresetId(preset.id);
    setEditingName(preset.name);
  };

  const handleSaveName = (id: string, name: string) => {
    setNumberPresets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    );
    setEditingPresetId(null);
  };

  const handleDeletePreset = async (id: string) => {
    try {
      await window.electron.ipcRenderer.invoke('hitcircle:deleteNumberPreset', id);
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
    setNumberPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const handleApplyPreset = async (preset: NumberPreset) => {
    setIsApplying(true);
    try {
      // Current Skin の場合はキャッシュから適用
      if (preset.id === 'current-skin') {
        const result = await window.electron.ipcRenderer.invoke(
          'hitcircle:applyCurrentSkinNumbersCache',
        ) as { success: boolean; error?: string };

        if (!result.success) {
          console.error('Failed to apply current skin cache:', result.error);
        }
      } else {
        const result = await window.electron.ipcRenderer.invoke(
          'hitcircle:applyNumberPreset',
          preset.id,
          use2x,
        ) as { success: boolean; error?: string };

        if (!result.success) {
          console.error('Failed to apply preset:', result.error);
        }
      }
    } catch (error) {
      console.error('Failed to apply preset:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleImageUpload = async (presetId: string, numberKey: string, file: File) => {
    if (!file.type.includes('png')) {
      window.alert('PNG形式のみ対応しています');
      return;
    }

    try {
      const base64 = await fileToBase64(file);

      const result = await window.electron.ipcRenderer.invoke(
        'hitcircle:updateNumberPresetImage',
        presetId,
        numberKey,
        base64,
      ) as { success: boolean; error?: string };

      if (result.success) {
        setNumberPresets((prev) =>
          prev.map((p) =>
            p.id === presetId
              ? { ...p, numbers: { ...p.numbers, [numberKey]: base64 } }
              : p
          )
        );
      } else {
        window.alert(result.error || '画像の追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      window.alert('画像の追加に失敗しました');
    }
  };

  const handleImageRemove = (presetId: string, numberKey: string) => {
    // Clear preview if the removed image was being previewed
    const removedKey = `${presetId}-${numberKey}`;
    if (selectedPreviewKey === removedKey) {
      setSelectedPreviewKey(null);
    }
    setNumberPresets((prev) =>
      prev.map((p) =>
        p.id === presetId
          ? { ...p, numbers: { ...p.numbers, [numberKey]: null } }
          : p
      )
    );
  };

  const handleSelectForPreview = (presetId: string, numberKey: string) => {
    const key = `${presetId}-${numberKey}`;
    // Toggle selection: if already selected, deselect
    if (selectedPreviewKey === key) {
      setSelectedPreviewKey(null);
    } else {
      setSelectedPreviewKey(key);
    }
  };

  /**
   * Save Current Skin hitcircle to app
   */
  const handleSaveCurrentSkinHitCircle = async () => {
    setIsSaving(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'hitcircle:saveCurrentSkinHitCircle',
      ) as { success: boolean; savedName?: string; error?: string };

      if (result.success) {
        setHasSavedHitCircle(true);
        await loadData();
      } else {
        console.error('Failed to save hitcircle:', result.error);
      }
    } catch (error) {
      console.error('Failed to save hitcircle:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Save Current Skin overlay to app
   */
  const handleSaveCurrentSkinOverlay = async () => {
    setIsSaving(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'hitcircle:saveCurrentSkinOverlay',
      ) as { success: boolean; savedName?: string; error?: string };

      if (result.success) {
        setHasSavedOverlay(true);
        await loadData();
      } else {
        console.error('Failed to save overlay:', result.error);
      }
    } catch (error) {
      console.error('Failed to save overlay:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Save Current Skin numbers as preset
   */
  const handleSaveCurrentSkinNumbersAsPreset = async () => {
    // Add Presetと同様にデフォルト名を自動生成
    const baseName = `Number Preset ${numberPresets.length + 1}`;
    let candidate = baseName;
    let counter = 2;
    const lowerNames = numberPresets.map((p) => p.name.toLowerCase());
    while (lowerNames.includes(candidate.toLowerCase())) {
      candidate = `${baseName} ${counter}`;
      counter += 1;
    }

    setIsSaving(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'hitcircle:saveCurrentSkinNumbersAsPreset',
        candidate,
      ) as { success: boolean; error?: string };

      if (result.success) {
        setHasSavedNumbers(true);
        await loadData();
      } else {
        console.error('Failed to save numbers preset:', result.error);
      }
    } catch (error) {
      console.error('Failed to save numbers preset:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Current Skinが選択されているか
  const isCurrentSkinHitCircle = hitcircles[selectedCircle]?.name === 'Current Skin';
  const isCurrentSkinOverlay = overlays[selectedOverlay]?.name?.startsWith('Current Skin');
  const hasCurrentSkinHitCircle = hitcircles.some(c => c.name === 'Current Skin');
  const hasCurrentSkinOverlay = overlays.some(o => o.name?.startsWith('Current Skin'));

  const previewNumberImage = getPreviewNumberImage();
  const displayNumber = getPreviewDisplayNumber();

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
                src={hitcircles[selectedCircle]?.preview}
                alt="hitcircle"
                className="preview-base"
              />
              <img
                src={overlays[selectedOverlay]?.preview}
                alt="overlay"
                className="preview-overlay"
              />
              {previewNumberImage ? (
                <img
                  src={previewNumberImage}
                  alt="number"
                  className="preview-number-image"
                />
              ) : (
                <div className="preview-number">{displayNumber}</div>
              )}
            </div>
            <ControlsRowRight>
              <Toggle label="@2x" checked={use2x} onChange={setUse2x} labelPosition="right" size="sm" />
              <Button
                variant="primary"
                onClick={handleApplyAll}
                disabled={isApplying || !hitcircles[selectedCircle]?.preview || !overlays[selectedOverlay]?.preview}
              >
                {isApplying ? 'Applying...' : 'Apply All'}
              </Button>
            </ControlsRowRight>
          </CardBody>
        </Card>
      </div>

      {/* Hit Circle and Overlay Sections */}
      <div className="layout-bottom">
        {/* Hit Circle Section */}
        <Card>
          <CardHeader>
            <CardTitle>Hit Circle</CardTitle>
          </CardHeader>
          <CardBody>
            <CarouselRow>
              <IconButton direction="prev" onClick={handlePrevCircle} disabled={isAnimatingCircle} />
              <Carousel isAnimating={isAnimatingCircle}>
                {getVisible(hitcircles, selectedCircle).map((it) => (
                  <CarouselItem
                    key={it.id + it.position}
                    item={it}
                    position={it.position}
                    isAnimating={isAnimatingCircle}
                    slideDirection={circleSlideDir}
                    showLabel={true}
                    currentIndex={selectedCircle}
                    totalItems={hitcircles.length}
                    isCurrentSkin={it.name === 'Current Skin' && it.position === 'center'}
                    hasCurrentSkin={hasCurrentSkinHitCircle}
                  />
                ))}
              </Carousel>
              <IconButton direction="next" onClick={handleNextCircle} disabled={isAnimatingCircle} />
            </CarouselRow>

            <Uploader
              onDrop={handleDropCircle}
              onClick={() => fileRefCircle.current?.click()}
              dropzoneText="Drop hit circle image or click to add"
            >
              <input
                ref={fileRefCircle}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAddHitcircle(f);
                  e.currentTarget.value = '';
                }}
              />
              <ControlsRow>
                {!isCurrentSkinHitCircle && (
                  <TrashButton onClick={() => handleDeleteCircle(selectedCircle)} title="Remove selected hit circle" />
                )}
                <ControlsRowRight>
                  {isCurrentSkinHitCircle && !hasSavedHitCircle && (
                    <Button
                      variant="default"
                      onClick={handleSaveCurrentSkinHitCircle}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save to App'}
                    </Button>
                  )}
                  <Toggle label="@2x" checked={hitcircles2x} onChange={setHitcircles2x} labelPosition="right" size="sm" />
                  <Button
                    variant="primary"
                    onClick={handleApplyHitcircle}
                    disabled={isApplying || !hitcircles[selectedCircle]?.preview}
                  >
                    {isApplying ? 'Applying...' : 'Apply'}
                  </Button>
                </ControlsRowRight>
              </ControlsRow>
            </Uploader>
          </CardBody>
        </Card>

        {/* Overlay Section */}
        <Card>
          <CardHeader>
            <CardTitle>Hit Circle Overlay</CardTitle>
          </CardHeader>
          <CardBody>
            <CarouselRow>
              <IconButton direction="prev" onClick={handlePrevOverlay} disabled={isAnimatingOverlay} />
              <Carousel isAnimating={isAnimatingOverlay}>
                {getVisible(overlays, selectedOverlay).map((it) => (
                  <CarouselItem
                    key={it.id + it.position}
                    item={it}
                    position={it.position}
                    isAnimating={isAnimatingOverlay}
                    slideDirection={overlaySlideDir}
                    showLabel={true}
                    currentIndex={selectedOverlay}
                    totalItems={overlays.length}
                    isCurrentSkin={it.name?.startsWith('Current Skin') && it.position === 'center'}
                    hasCurrentSkin={hasCurrentSkinOverlay}
                  />
                ))}
              </Carousel>
              <IconButton direction="next" onClick={handleNextOverlay} disabled={isAnimatingOverlay} />
            </CarouselRow>

            <Uploader
              onDrop={handleDropOverlay}
              onClick={() => fileRefOverlay.current?.click()}
              dropzoneText="Drop overlay image or click to add"
            >
              <input
                ref={fileRefOverlay}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAddOverlay(f);
                  e.currentTarget.value = '';
                }}
              />
              <ControlsRow>
                {!isCurrentSkinOverlay && (
                  <TrashButton onClick={() => handleDeleteOverlay(selectedOverlay)} title="Remove selected overlay" />
                )}
                <ControlsRowRight>
                  {isCurrentSkinOverlay && !hasSavedOverlay && (
                    <Button
                      variant="default"
                      onClick={handleSaveCurrentSkinOverlay}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save to App'}
                    </Button>
                  )}
                  <Toggle label="@2x" checked={overlays2x} onChange={setOverlays2x} labelPosition="right" size="sm" />
                  <Button
                    variant="primary"
                    onClick={handleApplyOverlay}
                    disabled={isApplying || !overlays[selectedOverlay]?.preview}
                  >
                    {isApplying ? 'Applying...' : 'Apply'}
                  </Button>
                </ControlsRowRight>
              </ControlsRow>
            </Uploader>
          </CardBody>
        </Card>
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
