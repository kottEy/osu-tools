import React, { useRef } from 'react';
import './SoundCard.css';

interface SoundCardProps {
  sound: string;
  fileName: string | null;
  isPlaying: boolean;
  isEmpty: boolean;
  onFileSelected: (file: File) => void;
  onPlay: () => void;
  onRemove: () => void;
}

/**
 * SoundCard: 個々のhitsoundファイルのカード
 * D&D、ファイル選択、再生、削除機能を持つ
 */
export function SoundCard({
  sound,
  fileName,
  isPlaying,
  isEmpty,
  onFileSelected,
  onPlay,
  onRemove,
}: SoundCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isEmpty) {
      const file = e.dataTransfer.files?.[0];
      if (file?.type.startsWith('audio/')) {
        onFileSelected(file);
      }
    }
  };

  return (
    <div
      className={`sound-card ${isEmpty ? 'sound-card--empty' : 'sound-card--filled'} ${isPlaying ? 'sound-card--playing' : ''}`}
      onDragOver={isEmpty ? (e) => e.preventDefault() : undefined}
      onDrop={handleDrop}
      onClick={isEmpty ? openPicker : undefined}
      role={isEmpty ? 'button' : undefined}
      tabIndex={isEmpty ? 0 : undefined}
      onKeyDown={
        isEmpty
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openPicker();
              }
            }
          : undefined
      }
    >
      <div className="sound-card__row">
        <div className="sound-card__meta">
          <div className="sound-card__name">{sound}</div>
          {isEmpty ? (
            <div className="sound-card__file">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Drop or click to add
            </div>
          ) : (
            <>
              <div className="sound-card__file">{fileName}</div>
            </>
          )}
        </div>
        {!isEmpty && (
          <div className="sound-card__actions">
            <button
              className={`sound-card__btn sound-card__btn--play ${isPlaying ? 'sound-card__btn--playing' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onPlay();
              }}
              disabled={isPlaying}
              title={isPlaying ? 'Playing...' : 'Play sound'}
            >
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
            <button
              className="sound-card__btn sound-card__btn--remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              title="Remove sound"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onFileSelected(file);
            e.currentTarget.value = '';
          }
        }}
      />
    </div>
  );
}
