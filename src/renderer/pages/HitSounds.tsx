import React, { useMemo, useState } from 'react';
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

export default function HitSounds() {
  const [presets, setPresets] = useState<Preset[]>([createEmptyPreset('Preset 1')]);
  const [expandedPresets, setExpandedPresets] = useState<Set<string>>(new Set());
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const groupedByType = useMemo(
    () =>
      HITSOUND_COMBINATIONS.reduce((acc, combo) => {
        if (!acc[combo.type]) acc[combo.type] = [];
        acc[combo.type].push(combo.sound);
        return acc;
      }, {} as Record<HitsoundType, HitsoundSound[]>),
    [],
  );

  const makeUniqueName = (base: string) => {
    let candidate = base;
    let counter = 2;
    const lowerNames = presets.map((p) => p.name.toLowerCase());
    while (lowerNames.includes(candidate.toLowerCase())) {
      candidate = `${base} ${counter}`;
      counter += 1;
    }
    return candidate;
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

  const addPreset = () => {
    const name = makeUniqueName(`Preset ${presets.length + 1}`);
    const newPreset = createEmptyPreset(name);
    setPresets((prev) => [...prev, newPreset]);
    setExpandedPresets((prev) => new Set(prev).add(newPreset.id));
  };

  const startEditing = (presetId: string, currentName: string) => {
    setEditingPresetId(presetId);
    setEditingNames((prev) => ({ ...prev, [presetId]: currentName }));
  };

  const handleSaveName = (id: string, newName: string) => {
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

    const exists = presets.some(
      (p) => p.id !== id && p.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      window.alert('同じ名前のプリセットが既に存在します。');
      return;
    }

    setPresets((prev) => prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p)));
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

  const deletePreset = (id: string) => {
    if (presets.length <= 1) {
      window.alert('少なくとも1つのプリセットが必要です。');
      return;
    }
    if (!window.confirm('このプリセットを削除しますか？')) return;

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

  const handleFileSelected = (
    presetId: string,
    type: HitsoundType,
    sound: HitsoundSound,
    file: File,
  ) => {
    updateHitsound(presetId, type, sound, (hs) => ({
      ...hs,
      file,
      preview: file.name,
    }));
  };

  const handleRemoveFile = (presetId: string, type: HitsoundType, sound: HitsoundSound) => {
    updateHitsound(presetId, type, sound, (hs) => ({
      ...hs,
      file: null,
      preview: null,
    }));
  };

  const handlePlay = (presetId: string, type: HitsoundType, sound: HitsoundSound) => {
    const preset = presets.find((p) => p.id === presetId);
    const entry = preset?.hitsounds.find((hs) => hs.type === type && hs.sound === sound);
    if (!entry?.file) return;

    const playbackKey = `${presetId}-${type}-${sound}`;
    const url = URL.createObjectURL(entry.file);
    const audio = new Audio(url);
    setPlayingKey(playbackKey);
    audio.onended = () => {
      setPlayingKey((current) => (current === playbackKey ? null : current));
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => {
      setPlayingKey((current) => (current === playbackKey ? null : current));
      URL.revokeObjectURL(url);
      window.alert('音声の再生に失敗しました。ファイル形式を確認してください。');
    };
    audio.play().catch(() => {
      setPlayingKey((current) => (current === playbackKey ? null : current));
      URL.revokeObjectURL(url);
      window.alert('音声の再生を開始できませんでした。');
    });
  };

  const handleApply = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;

    const missing = preset.hitsounds.filter((hs) => !hs.file);
    if (missing.length > 0) {
      const names = missing
        .map((m) => `${m.type}-${m.sound}`)
        .join(', ');
      const proceed = window.confirm(
        `未設定のサウンドがあります: ${names}\n不足したまま適用しますか？`,
      );
      if (!proceed) return;
    }

    const basePath = `sounds/hitsounds/${preset.name}`;
    const plannedFiles = preset.hitsounds
      .filter((hs) => hs.file)
      .map((hs) => `${basePath}/${hs.type}-${hs.sound}.${getExtension(hs.preview || '')}`);

    setStatusMessage(
      `Apply: ${preset.name} を適用予定。既存の hitsound を削除し、プリセットで置き換えます。`,
    );
    console.log('Apply hitsound preset', {
      preset: preset.name,
      targetFolder: basePath,
      files: plannedFiles,
    });
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
              />
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
