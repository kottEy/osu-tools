import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import type { MediaItem } from '../types';
import './Cursor.css';

interface CursorProps {
  currentSkin?: string;
}

export default function Cursor({ currentSkin }: CursorProps) {
  const [cursors, setCursors] = useState<MediaItem[]>([]);
  const [trails, setTrails] = useState<MediaItem[]>([]);
  const [selectedCursor, setSelectedCursor] = useState(0);
  const [selectedTrail, setSelectedTrail] = useState(0);
  const [isAnimatingCursor, setIsAnimatingCursor] = useState(false);
  const [isAnimatingTrail, setIsAnimatingTrail] = useState(false);
  const [cursor2x, setCursor2x] = useState(false);
  const [trail2x, setTrail2x] = useState(false);
  const [useCursorMiddle, setUseCursorMiddle] = useState(false);
  const [cursorDragActive, setCursorDragActive] = useState(false);
  const [trailDragActive, setTrailDragActive] = useState(false);
  const [cursorSlideDir, setCursorSlideDir] = useState<'left' | 'right'>('right');
  const [trailSlideDir, setTrailSlideDir] = useState<'left' | 'right'>('right');
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedCursor, setHasSavedCursor] = useState(false);
  const [hasSavedTrail, setHasSavedTrail] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const trailInputRef = React.useRef<HTMLInputElement | null>(null);
  const prevSkinRef = useRef<string | undefined>(undefined);

  // 初期データの読み込み
  useEffect(() => {
    loadData();
  }, []);

  // currentSkinが変更された時に自動で再読み込み
  useEffect(() => {
    if (prevSkinRef.current !== undefined && prevSkinRef.current !== currentSkin) {
      loadData();
      setHasSavedCursor(false);
      setHasSavedTrail(false);
    }
    prevSkinRef.current = currentSkin;
  }, [currentSkin]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 保存されているカーソル画像一覧を取得
      const cursorList = await window.electron.ipcRenderer.invoke('cursor:getList') as any[];
      const trailList = await window.electron.ipcRenderer.invoke('cursor:getTrailList') as any[];

      const cursorItems: MediaItem[] = cursorList.map((item, idx) => ({
        id: idx + 1,
        name: item.name,
        preview: item.previewUrl,
      }));

      const trailItems: MediaItem[] = trailList.map((item, idx) => ({
        id: idx + 1,
        name: item.name,
        preview: item.previewUrl,
      }));

      // 現在のスキンからカーソル画像を取得
      const currentSkinCursors = await window.electron.ipcRenderer.invoke('cursor:getCurrentSkin') as {
        cursor: string | null;
        cursorTrail: string | null;
        cursorMiddle: string | null;
      };

      // 現在のスキンのカーソルがあれば先頭に追加
      if (currentSkinCursors.cursor) {
        cursorItems.unshift({
          id: 0,
          name: 'Current Skin',
          preview: currentSkinCursors.cursor,
        });
      }

      if (currentSkinCursors.cursorTrail) {
        trailItems.unshift({
          id: 0,
          name: 'Current Skin (Trail)',
          preview: currentSkinCursors.cursorTrail,
        });
      } else if (currentSkinCursors.cursorMiddle) {
        trailItems.unshift({
          id: 0,
          name: 'Current Skin (Middle)',
          preview: currentSkinCursors.cursorMiddle,
        });
        setUseCursorMiddle(true);
      }

      // 最低1つは表示するためのプレースホルダー
      if (cursorItems.length === 0) {
        cursorItems.push({ id: 1, name: 'No cursor', preview: '' });
      }
      if (trailItems.length === 0) {
        trailItems.push({ id: 1, name: 'No trail', preview: '' });
      }

      setCursors(cursorItems);
      setTrails(trailItems);
    } catch (error) {
      console.error('Failed to load cursor data:', error);
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

  /**
   * Navigate to previous item with animation
   */
  const handlePrevCursor = () => {
    if (isAnimatingCursor || cursors.length <= 1) return;
    setIsAnimatingCursor(true);
    setCursorSlideDir('right');
    setSelectedCursor((idx) => (idx - 1 + cursors.length) % cursors.length);
    setTimeout(() => setIsAnimatingCursor(false), 300);
  };

  const handleNextCursor = () => {
    if (isAnimatingCursor || cursors.length <= 1) return;
    setIsAnimatingCursor(true);
    setCursorSlideDir('left');
    setSelectedCursor((idx) => (idx + 1) % cursors.length);
    setTimeout(() => setIsAnimatingCursor(false), 300);
  };

  const handlePrevTrail = () => {
    if (isAnimatingTrail || trails.length <= 1) return;
    setIsAnimatingTrail(true);
    setTrailSlideDir('right');
    setSelectedTrail((idx) => (idx - 1 + trails.length) % trails.length);
    setTimeout(() => setIsAnimatingTrail(false), 300);
  };

  const handleNextTrail = () => {
    if (isAnimatingTrail || trails.length <= 1) return;
    setIsAnimatingTrail(true);
    setTrailSlideDir('left');
    setSelectedTrail((idx) => (idx + 1) % trails.length);
    setTimeout(() => setIsAnimatingTrail(false), 300);
  };

  /**
   * Add new cursor from file
   */
  const handleAddCursor = async (file?: File) => {
    if (!file) return;
    
    // PNG検証
    if (!file.type.includes('png')) {
      window.alert('PNG形式のみ対応しています');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      
      // バックエンドに保存 (cursor-1, cursor-2... の連番で保存)
      const result = await window.electron.ipcRenderer.invoke(
        'cursor:add',
        base64,
        'custom',
        'cursor',
      ) as { success: boolean; savedName?: string; error?: string };

      if (result.success) {
        const savedName = result.savedName || `cursor-${cursors.length + 1}`;
        const newItem: MediaItem = {
          id: cursors.length + 1,
          name: savedName,
          preview: base64,
        };
        setCursors((s) => [...s, newItem]);
      } else {
        window.alert(result.error || 'カーソルの追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to add cursor:', error);
      window.alert('カーソルの追加に失敗しました');
    }
  };

  /**
   * Add new trail from file
   */
  const handleAddTrail = async (file?: File) => {
    if (!file) return;
    
    if (!file.type.includes('png')) {
      window.alert('PNG形式のみ対応しています');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      
      // バックエンドに保存 (cursortrail-1, cursortrail-2... の連番で保存)
      const result = await window.electron.ipcRenderer.invoke(
        'cursor:addTrail',
        base64,
        'custom',
        'cursortrail',
      ) as { success: boolean; savedName?: string; error?: string };

      if (result.success) {
        const savedName = result.savedName || `cursortrail-${trails.length + 1}`;
        const newItem: MediaItem = {
          id: trails.length + 1,
          name: savedName,
          preview: base64,
        };
        setTrails((s) => [...s, newItem]);
      } else {
        window.alert(result.error || 'トレイルの追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to add trail:', error);
      window.alert('トレイルの追加に失敗しました');
    }
  };

  const onCursorDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setCursorDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleAddCursor(file);
  };

  const onTrailDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setTrailDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleAddTrail(file);
  };

  /**
   * Delete cursor at specified index
   */
  const handleDeleteCursor = (index: number) => {
    if (cursors.length <= 1) {
      return;
    }

    setCursors((s) => s.filter((_, i) => i !== index));
    const newIndex = Math.max(0, Math.min(selectedCursor, cursors.length - 2));
    setSelectedCursor(newIndex);
  };

  /**
   * Delete trail at specified index
   */
  const handleDeleteTrail = (index: number) => {
    if (trails.length <= 1) {
      return;
    }

    setTrails((s) => s.filter((_, i) => i !== index));
    const newIndex = Math.max(0, Math.min(selectedTrail, trails.length - 2));
    setSelectedTrail(newIndex);
  };

  /**
   * Apply cursor to skin
   */
  const handleApplyCursor = async () => {
    const cursor = cursors[selectedCursor];
    if (!cursor || !cursor.preview) {
      return;
    }

    setIsApplying(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'cursor:apply',
        cursor.preview,
        cursor2x,
      ) as { success: boolean; error?: string };

      if (result.success) {
        // 適用成功
      } else {
        console.error('Failed to apply cursor:', result.error);
      }
    } catch (error) {
      console.error('Failed to apply cursor:', error);
    } finally {
      setIsApplying(false);
    }
  };

  /**
   * Apply cursor trail to skin
   */
  const handleApplyTrail = async () => {
    const trail = trails[selectedTrail];
    if (!trail || !trail.preview) {
      return;
    }

    setIsApplying(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'cursor:applyTrail',
        trail.preview,
        trail2x,
        useCursorMiddle,
      ) as { success: boolean; error?: string };

      if (result.success) {
        // 適用成功
      } else {
        console.error('Failed to apply trail:', result.error);
      }
    } catch (error) {
      console.error('Failed to apply trail:', error);
    } finally {
      setIsApplying(false);
    }
  };

  /**
   * Save Current Skin cursor to app
   */
  const handleSaveCurrentSkinCursor = async () => {
    setIsSaving(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'cursor:saveCurrentSkinCursor',
      ) as { success: boolean; savedName?: string; error?: string };

      if (result.success) {
        setHasSavedCursor(true);
        // 保存成功、リストを再読み込み
        await loadData();
      } else {
        console.error('Failed to save cursor:', result.error);
      }
    } catch (error) {
      console.error('Failed to save cursor:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Save Current Skin trail to app
   */
  const handleSaveCurrentSkinTrail = async () => {
    setIsSaving(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'cursor:saveCurrentSkinTrail',
      ) as { success: boolean; savedName?: string; error?: string };

      if (result.success) {
        setHasSavedTrail(true);
        // 保存成功、リストを再読み込み
        await loadData();
      } else {
        console.error('Failed to save trail:', result.error);
      }
    } catch (error) {
      console.error('Failed to save trail:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Current Skinが選択されているか
  const isCurrentSkinCursor = cursors[selectedCursor]?.name === 'Current Skin';
  const isCurrentSkinTrail = trails[selectedTrail]?.name?.startsWith('Current Skin');
  
  // Current Skinが存在するか
  const hasCurrentSkinCursor = cursors.some(c => c.name === 'Current Skin');
  const hasCurrentSkinTrail = trails.some(t => t.name?.startsWith('Current Skin'));

  if (isLoading) {
    return <div className="cursor-editor page loading">読み込み中...</div>;
  }

  return (
    <div className="cursor-editor page">
      {/* Cursor Section */}
      <Card>
        <CardHeader>
          <CardTitle icon="default">Cursor</CardTitle>
        </CardHeader>
        <CardBody>
          <CarouselRow>
            <IconButton
              direction="prev"
              onClick={handlePrevCursor}
              disabled={isAnimatingCursor || cursors.length <= 1}
            />
            <Carousel isAnimating={isAnimatingCursor}>
              {getVisible(cursors, selectedCursor).map((it) => (
                <CarouselItem
                  key={it.id + it.position}
                  item={it}
                  position={it.position}
                  isAnimating={isAnimatingCursor}
                  slideDirection={cursorSlideDir}
                  showLabel={true}
                  currentIndex={selectedCursor}
                  totalItems={cursors.length}
                  isCurrentSkin={it.name === 'Current Skin' && it.position === 'center'}
                  hasCurrentSkin={hasCurrentSkinCursor}
                />
              ))}
            </Carousel>
            <IconButton
              direction="next"
              onClick={handleNextCursor}
              disabled={isAnimatingCursor || cursors.length <= 1}
            />
          </CarouselRow>

          <Uploader
            onDrop={onCursorDrop}
            onClick={() => fileInputRef.current?.click()}
            isDragActive={cursorDragActive}
            dropzoneText="Drop cursor image or click to add (PNG only)"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAddCursor(f);
                e.currentTarget.value = '';
              }}
            />
            <ControlsRow>
              {!isCurrentSkinCursor && (
                <TrashButton
                  onClick={() => handleDeleteCursor(selectedCursor)}
                  title="Remove selected cursor"
                />
              )}
              <ControlsRowRight>
                {isCurrentSkinCursor && !hasSavedCursor && (
                  <Button
                    variant="default"
                    onClick={handleSaveCurrentSkinCursor}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save to App'}
                  </Button>
                )}
                <Toggle
                  label="@2x"
                  checked={cursor2x}
                  onChange={(checked) => setCursor2x(checked)}
                  labelPosition="right"
                  size="sm"
                />
                <Button
                  variant="primary"
                  onClick={handleApplyCursor}
                  disabled={isApplying || !cursors[selectedCursor]?.preview}
                >
                  {isApplying ? 'Applying...' : 'Apply'}
                </Button>
              </ControlsRowRight>
            </ControlsRow>
          </Uploader>
        </CardBody>
      </Card>

      {/* Cursor Trail Section */}
      <Card>
        <CardHeader>
          <CardTitle icon="accent">Cursor Trail</CardTitle>
        </CardHeader>
        <CardBody>
          <CarouselRow>
            <IconButton
              direction="prev"
              onClick={handlePrevTrail}
              disabled={isAnimatingTrail || trails.length <= 1}
            />
            <Carousel isAnimating={isAnimatingTrail}>
              {getVisible(trails, selectedTrail).map((it) => (
                <CarouselItem
                  key={it.id + it.position}
                  item={it}
                  position={it.position}
                  isAnimating={isAnimatingTrail}
                  slideDirection={trailSlideDir}
                  showLabel={true}
                  currentIndex={selectedTrail}
                  totalItems={trails.length}
                  isCurrentSkin={it.name?.startsWith('Current Skin') && it.position === 'center'}
                  hasCurrentSkin={hasCurrentSkinTrail}
                />
              ))}
            </Carousel>
            <IconButton
              direction="next"
              onClick={handleNextTrail}
              disabled={isAnimatingTrail || trails.length <= 1}
            />
          </CarouselRow>

          <Uploader
            onDrop={onTrailDrop}
            onClick={() => trailInputRef.current?.click()}
            isDragActive={trailDragActive}
            dropzoneText="Drop trail image or click to add (PNG only)"
          >
            <input
              ref={trailInputRef}
              type="file"
              accept="image/png"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAddTrail(f);
                e.currentTarget.value = '';
              }}
            />
            <ControlsRow>
              {!isCurrentSkinTrail && (
                <TrashButton
                  onClick={() => handleDeleteTrail(selectedTrail)}
                  title="Remove selected trail"
                />
              )}
              <ControlsRowRight>
                {isCurrentSkinTrail && !hasSavedTrail && (
                  <Button
                    variant="default"
                    onClick={handleSaveCurrentSkinTrail}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save to App'}
                  </Button>
                )}
                <Toggle
                  label="@2x"
                  checked={trail2x}
                  onChange={(checked) => setTrail2x(checked)}
                  labelPosition="right"
                  size="sm"
                />
                <Toggle
                  label="cursormiddle"
                  checked={useCursorMiddle}
                  onChange={(checked) => setUseCursorMiddle(checked)}
                  labelPosition="right"
                  size="sm"
                />
                <Button
                  variant="primary"
                  onClick={handleApplyTrail}
                  disabled={isApplying || !trails[selectedTrail]?.preview}
                >
                  {isApplying ? 'Applying...' : 'Apply'}
                </Button>
              </ControlsRowRight>
            </ControlsRow>
          </Uploader>
        </CardBody>
      </Card>
    </div>
  );
}
