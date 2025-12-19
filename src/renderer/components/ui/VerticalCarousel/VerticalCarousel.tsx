import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NumberPreset } from '../../../types';
import './VerticalCarousel.css';

interface VerticalCarouselProps {
  presets: NumberPreset[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onAddPreset: () => void;
  onDeletePreset: (id: string) => void;
  onRenamePreset: (id: string, name: string) => void;
  onImageUpload: (presetId: string, numberKey: string, file: File) => void;
  onImageRemove: (presetId: string, numberKey: string) => void;
}

const NUMBER_KEYS = [
  'default-0', 'default-1', 'default-2', 'default-3', 'default-4',
  'default-5', 'default-6', 'default-7', 'default-8', 'default-9'
];

/**
 * VerticalCarousel: 縦カルーセルでNumberPresetを選択
 * 中央のプリセットがアクティブになる
 */
export function VerticalCarousel({
  presets,
  selectedIndex,
  onSelect,
  onAddPreset,
  onDeletePreset,
  onRenamePreset,
  onImageUpload,
  onImageRemove,
}: VerticalCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll('.v-carousel__item');
    const target = items[index] as HTMLElement;
    if (!target) return;
    
    const containerHeight = container.clientHeight;
    const itemTop = target.offsetTop;
    const itemHeight = target.clientHeight;
    const scrollTop = itemTop - (containerHeight / 2) + (itemHeight / 2);
    
    container.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    });
  }, []);

  useEffect(() => {
    scrollToIndex(selectedIndex);
  }, [selectedIndex, scrollToIndex]);

  const handlePrev = () => {
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : presets.length - 1;
    onSelect(newIndex);
  };

  const handleNext = () => {
    const newIndex = selectedIndex < presets.length - 1 ? selectedIndex + 1 : 0;
    onSelect(newIndex);
  };

  const startEditing = (preset: NumberPreset) => {
    setEditingId(preset.id);
    setEditingName(preset.name);
  };

  const saveEditing = () => {
    if (editingId && editingName.trim()) {
      onRenamePreset(editingId, editingName.trim());
    }
    setEditingId(null);
  };

  const handleDrop = (e: React.DragEvent, presetId: string, numberKey: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) {
      onImageUpload(presetId, numberKey, file);
    }
  };

  const getFilledCount = (preset: NumberPreset) => {
    return Object.values(preset.numbers).filter(Boolean).length;
  };

  const selectedPreset = presets[selectedIndex];

  return (
    <div className="v-carousel-container">
      {/* Vertical Carousel */}
      <div className="v-carousel-wrapper">
        <button className="v-carousel__nav v-carousel__nav--up" onClick={handlePrev}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>

        <div className="v-carousel" ref={containerRef}>
          <div className="v-carousel__spacer" />
          {presets.map((preset, index) => {
            const isSelected = index === selectedIndex;
            const filledCount = getFilledCount(preset);
            
            return (
              <div
                key={preset.id}
                className={`v-carousel__item ${isSelected ? 'v-carousel__item--active' : ''}`}
                onClick={() => onSelect(index)}
              >
                <div className="v-carousel__item-content">
                  {editingId === preset.id ? (
                    <input
                      className="v-carousel__name-input"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditing();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={saveEditing}
                      autoFocus
                    />
                  ) : (
                    <span className="v-carousel__name">{preset.name}</span>
                  )}
                  <span className="v-carousel__count">{filledCount}/10</span>
                </div>
                
                {isSelected && (
                  <div className="v-carousel__actions">
                    <button
                      className="v-carousel__action-btn"
                      onClick={(e) => { e.stopPropagation(); startEditing(preset); }}
                      title="Rename"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    {presets.length > 1 && (
                      <button
                        className="v-carousel__action-btn v-carousel__action-btn--danger"
                        onClick={(e) => { e.stopPropagation(); onDeletePreset(preset.id); }}
                        title="Delete"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div className="v-carousel__spacer" />
        </div>

        <button className="v-carousel__nav v-carousel__nav--down" onClick={handleNext}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <button className="v-carousel__add-btn" onClick={onAddPreset}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Preset
        </button>
      </div>

      {/* Number Grid Editor */}
      {selectedPreset && (
        <div className="v-carousel__editor">
          <h4 className="v-carousel__editor-title">{selectedPreset.name}</h4>
          <div className="v-carousel__number-grid">
            {NUMBER_KEYS.map((key) => {
              const num = key.replace('default-', '');
              const imageUrl = selectedPreset.numbers[key];
              const inputId = `${selectedPreset.id}-${key}`;

              return (
                <div
                  key={key}
                  className={`v-carousel__number-slot ${imageUrl ? 'v-carousel__number-slot--filled' : ''}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, selectedPreset.id, key)}
                  onClick={() => !imageUrl && fileInputRefs.current[inputId]?.click()}
                >
                  {imageUrl ? (
                    <>
                      <img src={imageUrl} alt={`default-${num}`} />
                      <button
                        className="v-carousel__number-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          onImageRemove(selectedPreset.id, key);
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <span className="v-carousel__number-placeholder">{num}</span>
                  )}
                  <input
                    ref={(el) => { fileInputRefs.current[inputId] = el; }}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onImageUpload(selectedPreset.id, key, file);
                      e.currentTarget.value = '';
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
