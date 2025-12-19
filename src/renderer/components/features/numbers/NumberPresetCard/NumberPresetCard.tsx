import React, { useRef } from 'react';
import { Card, CardHeader, CardBody, Button, TrashButton } from '../../../ui';
import type { NumberPreset } from '../../../../types';
import './NumberPresetCard.css';

interface NumberPresetCardProps {
  preset: NumberPreset;
  isExpanded: boolean;
  selectedPreviewKey: string | null; // e.g., 'presetId-default-4'
  onToggleExpand: () => void;
  onStartEditing: () => void;
  onSaveName: (name: string) => void;
  onCancelEditing: () => void;
  onDelete: () => void;
  onApply: () => void;
  onImageUpload: (numberKey: string, file: File) => void;
  onImageRemove: (numberKey: string) => void;
  onSelectForPreview: (presetId: string, numberKey: string) => void;
  isEditing: boolean;
  editingName: string;
  onEditingNameChange: (name: string) => void;
}

const NUMBER_KEYS = [
  'default-0', 'default-1', 'default-2', 'default-3', 'default-4',
  'default-5', 'default-6', 'default-7', 'default-8', 'default-9'
];

const NUMBER_KEYS_2X = [
  'default-0@2x', 'default-1@2x', 'default-2@2x', 'default-3@2x', 'default-4@2x',
  'default-5@2x', 'default-6@2x', 'default-7@2x', 'default-8@2x', 'default-9@2x'
];

/**
 * NumberPresetCard: 展開型のNumber Presetカード
 * HitSoundsのPresetCardと同じデザイン
 */
export function NumberPresetCard({
  preset,
  isExpanded,
  selectedPreviewKey,
  onToggleExpand,
  onStartEditing,
  onSaveName,
  onCancelEditing,
  onDelete,
  onApply,
  onImageUpload,
  onImageRemove,
  onSelectForPreview,
  isEditing,
  editingName,
  onEditingNameChange,
}: NumberPresetCardProps) {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const filledCount = Object.values(preset.numbers).filter(Boolean).length;
  const normalCount = NUMBER_KEYS.filter(k => preset.numbers[k]).length;
  const hdCount = NUMBER_KEYS_2X.filter(k => preset.numbers[k]).length;

  const handleSave = () => {
    const trimmed = editingName.trim();
    if (trimmed) {
      onSaveName(trimmed);
    }
  };

  const handleDrop = (e: React.DragEvent, numberKey: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) {
      onImageUpload(numberKey, file);
    }
  };

  return (
    <Card className={`number-preset-card ${isExpanded ? 'number-preset-card--expanded' : ''}`}>
      <CardHeader className="number-preset-card__header" onClick={!isEditing ? onToggleExpand : undefined}>
        <div className="number-preset-card__header-row">
          <div className="number-preset-card__header-left">
            <button 
              className="number-preset-card__expand-btn"
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
                  className="number-preset-card__name-input"
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
                  className="number-preset-card__icon-btn number-preset-card__icon-btn--save"
                  onClick={(e) => { e.stopPropagation(); handleSave(); }}
                  title="Save"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </button>
                <button 
                  className="number-preset-card__icon-btn"
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
                <span className="number-preset-card__name">{preset.name}</span>
                <button 
                  className="number-preset-card__icon-btn"
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

          <div className="number-preset-card__header-right">
            <span className="number-preset-card__count">{filledCount} / 20</span>
            <Button 
              variant="primary" 
              onClick={(e) => { e?.stopPropagation(); onApply(); }}
              className="number-preset-card__apply-btn"
            >
              Apply
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardBody className="number-preset-card__body">
          {/* Hint for preview */}
          <div className="number-preset-card__preview-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Click on a number image to preview it
          </div>

          {/* Normal resolution section */}
          <div className="number-preset-card__section">
            <div className="number-preset-card__section-header">
              <span className="number-preset-card__section-title">Standard</span>
              <span className="number-preset-card__section-count">{normalCount}/10</span>
            </div>
            <div className="number-preset-card__grid">
              {NUMBER_KEYS.map((key) => {
                const num = key.replace('default-', '');
                const imageUrl = preset.numbers[key];
                const inputId = `${preset.id}-${key}`;
                const currentKey = `${preset.id}-${key}`;
                const isSelected = selectedPreviewKey === currentKey;

                return (
                  <div
                    key={key}
                    className={`number-slot ${imageUrl ? 'number-slot--filled' : ''} ${isSelected ? 'number-slot--selected' : ''}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, key)}
                    onClick={() => {
                      if (imageUrl) {
                        onSelectForPreview(preset.id, key);
                      } else {
                        fileInputRefs.current[inputId]?.click();
                      }
                    }}
                  >
                    {imageUrl ? (
                      <>
                        <img src={imageUrl} alt={`default-${num}`} className="number-slot__image" />
                        <button
                          className="number-slot__remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            onImageRemove(key);
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <span className="number-slot__number">{num}</span>
                    )}
                    <input
                      ref={(el) => { fileInputRefs.current[inputId] = el; }}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onImageUpload(key, file);
                        e.currentTarget.value = '';
                      }}
                    />
                    <span className="number-slot__label">{num}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* @2x HD resolution section */}
          <div className="number-preset-card__section number-preset-card__section--2x">
            <div className="number-preset-card__section-header">
              <span className="number-preset-card__section-title">
                HD Resolution
                <span className="number-preset-card__section-badge">@2x</span>
              </span>
              <span className="number-preset-card__section-count">{hdCount}/10</span>
            </div>
            <div className="number-preset-card__grid">
              {NUMBER_KEYS_2X.map((key) => {
                const num = key.replace('default-', '').replace('@2x', '');
                const imageUrl = preset.numbers[key];
                const inputId = `${preset.id}-${key}`;
                const currentKey = `${preset.id}-${key}`;
                const isSelected = selectedPreviewKey === currentKey;

                return (
                  <div
                    key={key}
                    className={`number-slot number-slot--2x ${imageUrl ? 'number-slot--filled' : ''} ${isSelected ? 'number-slot--selected' : ''}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, key)}
                    onClick={() => {
                      if (imageUrl) {
                        onSelectForPreview(preset.id, key);
                      } else {
                        fileInputRefs.current[inputId]?.click();
                      }
                    }}
                  >
                    {imageUrl ? (
                      <>
                        <img src={imageUrl} alt={`default-${num}@2x`} className="number-slot__image" />
                        <button
                          className="number-slot__remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            onImageRemove(key);
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <span className="number-slot__number">{num}</span>
                    )}
                    <input
                      ref={(el) => { fileInputRefs.current[inputId] = el; }}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onImageUpload(key, file);
                        e.currentTarget.value = '';
                      }}
                    />
                    <span className="number-slot__label">{num}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="number-preset-card__footer">
            <TrashButton onClick={() => onDelete()} title="Delete preset" />
          </div>
        </CardBody>
      )}
    </Card>
  );
}
