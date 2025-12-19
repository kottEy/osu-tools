import React from 'react';
import { SoundCard } from '../SoundCard';
import type { HitsoundType, HitsoundSound, HitsoundFile } from '../../../../types/hitsound';
import './HitsoundTypeSection.css';

interface HitsoundTypeSectionProps {
  type: HitsoundType;
  label: string;
  sounds: HitsoundSound[];
  hitsounds: HitsoundFile[];
  presetName: string;
  playingKey: string | null;
  presetId: string;
  onFileSelected: (sound: HitsoundSound, file: File) => void;
  onPlay: (sound: HitsoundSound) => void;
  onRemove: (sound: HitsoundSound) => void;
  getExtension: (fileName: string) => string;
}

/**
 * HitsoundTypeSection: Drum/Normal/Soft のタイプごとのセクション
 * 複数のSoundCardを含む
 */
export function HitsoundTypeSection({
  type,
  label,
  sounds,
  hitsounds,
  presetName,
  playingKey,
  presetId,
  onFileSelected,
  onPlay,
  onRemove,
  getExtension,
}: HitsoundTypeSectionProps) {
  return (
    <div className="hitsound-type">
      <div className="hitsound-type__header">
        <div className="hitsound-type__label">{label}</div>
        <div className="hitsound-type__hint">{sounds.length} sounds</div>
      </div>
      <div className="hitsound-type__grid">
        {sounds.map((sound) => {
          const entry = hitsounds.find((hs) => hs.type === type && hs.sound === sound);
          const key = `${presetId}-${type}-${sound}`;
          const isPlaying = playingKey === key;
          const isEmpty = !entry?.file;

          return (
            <SoundCard
              key={key}
              sound={sound}
              fileName={entry?.preview || null}
              isPlaying={isPlaying}
              isEmpty={isEmpty}
              onFileSelected={(file) => onFileSelected(sound, file)}
              onPlay={() => onPlay(sound)}
              onRemove={() => onRemove(sound)}
            />
          );
        })}
      </div>
    </div>
  );
}
