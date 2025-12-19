import React from 'react';
import { Card, CardHeader, CardBody, Button, TrashButton } from '../../../ui';
import { HitsoundTypeSection } from '../HitsoundTypeSection';
import type { HitsoundType, HitsoundSound, Preset } from '../../../../types/hitsound';
import './PresetCard.css';

interface PresetCardProps {
  preset: Preset;
  isExpanded: boolean;
  groupedByType: Record<HitsoundType, HitsoundSound[]>;
  typeLabels: Record<HitsoundType, string>;
  playingKey: string | null;
  onToggleExpand: () => void;
  onStartEditing: () => void;
  onSaveName: (name: string) => void;
  onCancelEditing: () => void;
  onDelete: () => void;
  onApply: () => void;
  onFileSelected: (type: HitsoundType, sound: HitsoundSound, file: File) => void;
  onPlay: (type: HitsoundType, sound: HitsoundSound) => void;
  onRemove: (type: HitsoundType, sound: HitsoundSound) => void;
  getExtension: (fileName: string) => string;
  isEditing: boolean;
  editingName: string;
  onEditingNameChange: (name: string) => void;
}

/**
 * PresetCard: hitsoundプリセット全体のカード
 * ヘッダー（名前編集、アクション）とコンテンツ（タイプセクション）を含む
 */
export function PresetCard({
  preset,
  isExpanded,
  groupedByType,
  typeLabels,
  playingKey,
  onToggleExpand,
  onStartEditing,
  onSaveName,
  onCancelEditing,
  onDelete,
  onApply,
  onFileSelected,
  onPlay,
  onRemove,
  getExtension,
  isEditing,
  editingName,
  onEditingNameChange,
}: PresetCardProps) {
  const filledCount = preset.hitsounds.filter((hs) => hs.file).length;

  const handleSave = () => {
    const trimmed = editingName.trim();
    if (trimmed) {
      onSaveName(trimmed);
    }
  };

  return (
    <Card className={`preset-card ${isExpanded ? 'preset-card--expanded' : ''}`}>
      <CardHeader className="preset-card__header" onClick={!isEditing ? onToggleExpand : undefined}>
        <div className="preset-card__header-row">
          <div className="preset-card__header-left">
            <button 
              className="preset-card__expand-btn"
              onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            
            {isEditing ? (
              <>
                <input
                  className="preset-card__name-input"
                  value={editingName}
                  onChange={(e) => onEditingNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') onCancelEditing();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
                <button 
                  className="preset-card__icon-btn preset-card__icon-btn--save"
                  onClick={(e) => { e.stopPropagation(); handleSave(); }}
                  title="Save"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </button>
                <button 
                  className="preset-card__icon-btn"
                  onClick={(e) => { e.stopPropagation(); onCancelEditing(); }}
                  title="Cancel"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <span className="preset-card__name">{preset.name}</span>
                <button 
                  className="preset-card__icon-btn"
                  onClick={(e) => { e.stopPropagation(); onStartEditing(); }}
                  title="Rename"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </>
            )}
          </div>

          <div className="preset-card__header-right">
            <span className="preset-card__count">
              {filledCount} / {preset.hitsounds.length}
            </span>
            <Button 
              variant="primary" 
              onClick={(e) => { e?.stopPropagation(); onApply(); }}
              className="preset-card__apply-btn"
            >
              Apply
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardBody className="preset-card__body">
          <div className="preset-card__types">
            {(Object.keys(groupedByType) as HitsoundType[]).map((type) => (
              <HitsoundTypeSection
                key={type}
                type={type}
                label={typeLabels[type]}
                sounds={groupedByType[type]}
                hitsounds={preset.hitsounds}
                presetName={preset.name}
                playingKey={playingKey}
                presetId={preset.id}
                onFileSelected={(sound, file) => onFileSelected(type, sound, file)}
                onPlay={(sound) => onPlay(type, sound)}
                onRemove={(sound) => onRemove(type, sound)}
                getExtension={getExtension}
              />
            ))}
          </div>
          <div className="preset-card__footer">
            <TrashButton onClick={() => onDelete()} title="Delete preset" />
          </div>
        </CardBody>
      )}
    </Card>
  );
}
