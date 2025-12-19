import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardBody, CardTitle, Button } from '../components/ui';
import { PresetCard } from '../components/features/hitsounds';
import {
  type HitsoundType,
  type HitsoundSound,
  type Preset,
  type HitsoundFile,
  HITSOUND_COMBINATIONS,
  TYPE_LABELS,
  createEmptyPreset,
  getExtension,
} from '../types';
import './HitSounds.css';

interface HitSoundsProps {
  currentSkin?: string;
}

export default function HitSounds({ currentSkin }: HitSoundsProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [expandedPresets, setExpandedPresets] = useState<Set<string>>(new Set());
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [hasSavedCurrentSkin, setHasSavedCurrentSkin] = useState(false);
  const prevSkinRef = useRef<string | undefined>(undefined);

  // 初期データの読み込み
  useEffect(() => {
    loadData();
  }, []);

  // currentSkinが変更された時に自動で再読み込み
  useEffect(() => {
    if (prevSkinRef.current !== undefined && prevSkinRef.current !== currentSkin) {
      loadData();
      setHasSavedCurrentSkin(false); // スキンが変わったらリセット
    }
    prevSkinRef.current = currentSkin;
  }, [currentSkin]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const presetsArray: Preset[] = [];

      // 現在のスキンからヒットサウンドを取得
      const currentSkinPreset = await window.electron.ipcRenderer.invoke('hitsound:getCurrentSkin') as {
        id: string;
        name: string;
        hitsounds: Array<{
          type: HitsoundType;
          sound: HitsoundSound;
          filePath: string | null;
          extension: string | null;
        }>;
      } | null;

      console.log('[HitSounds] currentSkinPreset:', currentSkinPreset);

      if (currentSkinPreset) {
        // Current Skinプリセットを追加
        const preset: Preset = {
          id: 'current-skin',
          name: 'Current Skin',
          hitsounds: currentSkinPreset.hitsounds.map((hs) => ({
            type: hs.type,
            sound: hs.sound,
            file: null, // ファイルオブジェクトは後で読み込む
            preview: hs.filePath ? `${hs.type}-${hs.sound}${hs.extension}` : null,
            isCurrentSkin: true,
          })),
        };
        console.log('[HitSounds] Adding current skin preset:', preset);
        presetsArray.push(preset);
      }

      // 保存されているプリセットを取得
      const result = await window.electron.ipcRenderer.invoke('hitsound:getPresets') as {
        success: boolean;
        presets?: Preset[];
        error?: string;
      };

      if (result.success && result.presets) {
        presetsArray.push(...result.presets);
      }

      setPresets(presetsArray);
    } catch (error) {
      console.error('Failed to load hitsound presets:', error);
      setPresets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedByType = useMemo(
    () =>
      HITSOUND_COMBINATIONS.reduce((acc, combo) => {
        if (!acc[combo.type]) acc[combo.type] = [];
        acc[combo.type].push(combo.sound);
        return acc;
      }, {} as Record<HitsoundType, HitsoundSound[]>),
    [],
  );

  const makeUniqueName = (basePrefix: string) => {
    // Current Skinを除外したプリセットのみを対象に
    const nonCurrentSkinPresets = presets.filter((p) => p.id !== 'current-skin');
    
    // 既存のプリセット名から最大の番号を取得
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
    
    // 最大の番号 + 1 を使用
    return `${basePrefix} ${maxNumber + 1}`;
  };

  const togglePreset = (id: string) => {
    setExpandedPresets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addPreset = async () => {
    const name = makeUniqueName('Preset');

    try {
      const result = await window.electron.ipcRenderer.invoke('hitsound:createPreset', name) as {
        success: boolean;
        preset?: Preset;
        error?: string;
      };

      if (result.success && result.preset) {
        setPresets((prev) => [...prev, result.preset!]);
        setExpandedPresets((prev) => new Set(prev).add(result.preset!.id));
      } else {
        // フォールバック: ローカルで作成
        const newPreset = createEmptyPreset(name);
        setPresets((prev) => [...prev, newPreset]);
        setExpandedPresets((prev) => new Set(prev).add(newPreset.id));
      }
    } catch (error) {
      console.error('Failed to create preset:', error);
      const newPreset = createEmptyPreset(name);
      setPresets((prev) => [...prev, newPreset]);
      setExpandedPresets((prev) => new Set(prev).add(newPreset.id));
    }
  };

  const startEditing = (presetId: string, currentName: string) => {
    setEditingPresetId(presetId);
    setEditingNames((prev) => ({ ...prev, [presetId]: currentName }));
  };

  const handleSaveName = async (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setEditingPresetId(null);
      setEditingNames((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    const preset = presets.find((p) => p.id === id);
    if (!preset) return;

    const exists = presets.some(
      (p) => p.id !== id && p.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      window.alert('同じ名前のプリセットが既に存在します。');
      return;
    }

    // バックエンドでプリセット名を変更
    if (preset.id !== 'current-skin') {
      try {
        const result = await window.electron.ipcRenderer.invoke(
          'hitsound:renamePreset',
          preset.name,
          trimmed,
        ) as { success: boolean; error?: string };

        if (!result.success) {
          window.alert(result.error || 'プリセット名の変更に失敗しました');
          return;
        }
      } catch (error) {
        console.error('Failed to rename preset:', error);
        window.alert('プリセット名の変更に失敗しました');
        return;
      }
    }

    // IDも新しい名前に更新（バックエンドではフォルダ名がID）
    setPresets((prev) => prev.map((p) => (p.id === id ? { ...p, id: trimmed, name: trimmed } : p)));
    setEditingPresetId(null);
    setEditingNames((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const cancelEditing = (presetId: string) => {
    setEditingPresetId(null);
    setEditingNames((prev) => {
      const next = { ...prev };
      delete next[presetId];
      return next;
    });
  };

  const deletePreset = async (id: string) => {
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;

    try {
      // プリセット名でバックエンドに削除を依頼
      await window.electron.ipcRenderer.invoke('hitsound:deletePreset', preset.name);
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }

    setPresets((prev) => prev.filter((p) => p.id !== id));
    setExpandedPresets((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateHitsound = (
    presetId: string,
    type: HitsoundType,
    sound: HitsoundSound,
    updater: (hs: HitsoundFile) => HitsoundFile,
  ) => {
    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === presetId
          ? {
              ...preset,
              hitsounds: preset.hitsounds.map((hs) =>
                hs.type === type && hs.sound === sound ? updater(hs) : hs,
              ),
            }
          : preset,
      ),
    );
  };

  const handleFileSelected = async (
    presetId: string,
    type: HitsoundType,
    sound: HitsoundSound,
    file: File,
  ) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;

    try {
      // ファイルをBase64に変換
      const base64 = await fileToBase64(file);
      const extension = getExtension(file.name);

      // バックエンドに保存 (type-sound.ext 形式で保存: drum-hitclap.ogg など)
      const result = await window.electron.ipcRenderer.invoke(
        'hitsound:addToPreset',
        preset.name,
        type,
        sound,
        base64,
        extension,
      ) as { success: boolean; error?: string };

      if (result.success) {
        // 正しいファイル名で状態を更新
        const correctFileName = `${type}-${sound}.${extension}`;
        updateHitsound(presetId, type, sound, (hs) => ({
          ...hs,
          file,
          preview: correctFileName,
        }));
      } else {
        window.alert(result.error || 'ヒットサウンドの保存に失敗しました');
      }
    } catch (error) {
      console.error('Failed to save hitsound:', error);
      window.alert('ヒットサウンドの保存に失敗しました');
    }
  };

  const handleRemoveFile = async (presetId: string, type: HitsoundType, sound: HitsoundSound) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;

    try {
      // バックエンドからファイルを削除
      await window.electron.ipcRenderer.invoke(
        'hitsound:removeFromPreset',
        preset.name,
        type,
        sound,
      );

      // 状態を更新
      updateHitsound(presetId, type, sound, (hs) => ({
        ...hs,
        file: null,
        preview: null,
      }));
    } catch (error) {
      console.error('Failed to remove hitsound:', error);
    }
  };

  const handlePlay = async (presetId: string, type: HitsoundType, sound: HitsoundSound) => {
    const preset = presets.find((p) => p.id === presetId);
    const entry = preset?.hitsounds.find((hs) => hs.type === type && hs.sound === sound);
    
    // fileもpreviewもない場合は再生しない
    if (!entry?.file && !entry?.preview) return;

    const playbackKey = `${presetId}-${type}-${sound}`;
    setPlayingKey(playbackKey);

    try {
      let audioUrl: string;

      if (entry.file) {
        // 通常のFileオブジェクトがある場合
        audioUrl = URL.createObjectURL(entry.file);
      } else if (entry.isCurrentSkin) {
        // Current Skinの場合はバックエンドからBase64を取得
        const base64 = await window.electron.ipcRenderer.invoke(
          'hitsound:getCurrentSkinBase64',
          type,
          sound,
        ) as string | null;

        if (!base64) {
          setPlayingKey(null);
          return;
        }
        audioUrl = base64;
      } else {
        // その他の保存済みプリセットの場合
        const base64 = await window.electron.ipcRenderer.invoke(
          'hitsound:getBase64',
          preset?.name,
          type,
          sound,
        ) as string | null;

        if (!base64) {
          setPlayingKey(null);
          return;
        }
        audioUrl = base64;
      }

      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setPlayingKey((current) => (current === playbackKey ? null : current));
        if (entry.file) URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setPlayingKey((current) => (current === playbackKey ? null : current));
        if (entry.file) URL.revokeObjectURL(audioUrl);
      };
      await audio.play();
    } catch (error) {
      console.error('Failed to play sound:', error);
      setPlayingKey(null);
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

  const handleApply = async (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;

    // Current Skin の場合はキャッシュから適用
    if (presetId === 'current-skin') {
      setIsApplying(true);
      setStatusMessage(`${preset.name} を適用中...`);

      try {
        const result = await window.electron.ipcRenderer.invoke(
          'hitsound:applyCurrentSkinCache',
        ) as { success: boolean; error?: string };

        if (result.success) {
          setStatusMessage(`${preset.name} を適用しました`);
        } else {
          setStatusMessage(`エラー: ${result.error}`);
        }
      } catch (error) {
        console.error('Failed to apply current skin cache:', error);
        setStatusMessage('適用に失敗しました');
      } finally {
        setIsApplying(false);
      }
      return;
    }

    // 保存されたプリセット（file を持たない）の場合
    const hasFiles = preset.hitsounds.some((hs) => hs.file);
    const hasPreview = preset.hitsounds.some((hs) => hs.preview);

    if (!hasFiles && hasPreview) {
      // バックエンドに保存されたプリセットを直接適用
      setIsApplying(true);
      setStatusMessage(`${preset.name} を適用中...`);

      try {
        const result = await window.electron.ipcRenderer.invoke(
          'hitsound:applyPreset',
          preset.name,
        ) as { success: boolean; error?: string };

        if (result.success) {
          setStatusMessage(`${preset.name} を適用しました`);
        } else {
          setStatusMessage(`エラー: ${result.error}`);
        }
      } catch (error) {
        console.error('Failed to apply hitsound preset:', error);
        setStatusMessage('適用に失敗しました');
      } finally {
        setIsApplying(false);
      }
      return;
    }

    // fileを持つプリセットの場合（新規追加されたファイル）
    const missing = preset.hitsounds.filter((hs) => !hs.file && !hs.preview);
    if (missing.length > 0) {
      const names = missing
        .map((m) => `${m.type}-${m.sound}`)
        .join(', ');
      const proceed = window.confirm(
        `未設定のサウンドがあります: ${names}\n不足したまま適用しますか？`,
      );
      if (!proceed) return;
    }

    setIsApplying(true);
    setStatusMessage(`${preset.name} を適用中...`);

    try {
      // 各ヒットサウンドをBase64に変換して送信
      const hitsoundData: Array<{
        type: HitsoundType;
        sound: HitsoundSound;
        base64: string;
        extension: string;
      }> = [];

      for (const hs of preset.hitsounds) {
        if (hs.file) {
          const base64 = await fileToBase64(hs.file);
          hitsoundData.push({
            type: hs.type,
            sound: hs.sound,
            base64,
            extension: getExtension(hs.file.name),
          });
        }
      }

      const result = await window.electron.ipcRenderer.invoke(
        'hitsound:apply',
        presetId,
        hitsoundData,
      ) as { success: boolean; error?: string };

      if (result.success) {
        setStatusMessage(`${preset.name} を適用しました`);
      } else {
        setStatusMessage(`エラー: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to apply hitsound preset:', error);
      setStatusMessage('適用に失敗しました');
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveCurrentSkinAsPreset = async () => {
    // Add Presetと同様にデフォルト名を自動生成（最大番号 + 1）
    const name = makeUniqueName('Preset');

    setStatusMessage(`Saving Current Skin as "${name}"...`);

    try {
      const result = await window.electron.ipcRenderer.invoke(
        'hitsound:saveCurrentSkinAsPreset',
        name,
      ) as { success: boolean; error?: string };

      if (result.success) {
        setStatusMessage(`Saved as "${name}"`);
        setHasSavedCurrentSkin(true);
        // プリセット一覧を再読み込み
        await loadData();
      } else {
        setStatusMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to save current skin as preset:', error);
      setStatusMessage('Failed to save as preset');
    }
  };

  return (
    <div className="hitsounds-page page">
      <Card>
        <CardHeader className="hitsounds-header">
          <CardTitle icon="accent">HitSounds</CardTitle>
          <div className="header-actions">
            <Button variant="primary" onClick={addPreset}>
              Add Preset
            </Button>
          </div>
        </CardHeader>

        <CardBody className="preset-body">
          {statusMessage && <div className="status-text">{statusMessage}</div>}
          <div className="preset-list">
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isExpanded={expandedPresets.has(preset.id)}
                groupedByType={groupedByType}
                typeLabels={TYPE_LABELS}
                playingKey={playingKey}
                onToggleExpand={() => togglePreset(preset.id)}
                onStartEditing={() => startEditing(preset.id, preset.name)}
                onSaveName={(name) => handleSaveName(preset.id, name)}
                onCancelEditing={() => cancelEditing(preset.id)}
                onDelete={() => deletePreset(preset.id)}
                onApply={() => handleApply(preset.id)}
                onFileSelected={(type, sound, file) =>
                  handleFileSelected(preset.id, type, sound, file)
                }
                onPlay={(type, sound) => handlePlay(preset.id, type, sound)}
                onRemove={(type, sound) => handleRemoveFile(preset.id, type, sound)}
                getExtension={getExtension}
                isEditing={editingPresetId === preset.id}
                editingName={editingNames[preset.id] || ''}
                onEditingNameChange={(name) =>
                  setEditingNames((prev) => ({ ...prev, [preset.id]: name }))
                }
                isCurrentSkin={preset.id === 'current-skin'}
                onSaveAsPreset={preset.id === 'current-skin' && !hasSavedCurrentSkin ? handleSaveCurrentSkinAsPreset : undefined}
              />
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
