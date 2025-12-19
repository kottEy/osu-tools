/**
 * HitSound関連の型定義
 */

export type HitsoundType = 'drum' | 'normal' | 'soft';

export type HitsoundSound =
  | 'hitclap'
  | 'hitfinish'
  | 'hitnormal'
  | 'hitsoft'
  | 'hitwhistle'
  | 'sliderslide'
  | 'slidertick'
  | 'sliderwhistle';

export interface HitsoundFile {
  type: HitsoundType;
  sound: HitsoundSound;
  file: File | null;
  preview: string | null;
  isCurrentSkin?: boolean;
}

export interface Preset {
  id: string;
  name: string;
  hitsounds: HitsoundFile[];
}

export const HITSOUND_COMBINATIONS: { type: HitsoundType; sound: HitsoundSound }[] = [
  { type: 'drum', sound: 'hitclap' },
  { type: 'drum', sound: 'hitfinish' },
  { type: 'drum', sound: 'hitnormal' },
  { type: 'drum', sound: 'hitwhistle' },
  { type: 'drum', sound: 'sliderslide' },
  { type: 'drum', sound: 'slidertick' },
  { type: 'drum', sound: 'sliderwhistle' },
  { type: 'normal', sound: 'hitclap' },
  { type: 'normal', sound: 'hitfinish' },
  { type: 'normal', sound: 'hitnormal' },
  { type: 'normal', sound: 'hitwhistle' },
  { type: 'normal', sound: 'sliderslide' },
  { type: 'normal', sound: 'slidertick' },
  { type: 'normal', sound: 'sliderwhistle' },
  { type: 'soft', sound: 'hitclap' },
  { type: 'soft', sound: 'hitfinish' },
  { type: 'soft', sound: 'hitnormal' },
  { type: 'soft', sound: 'hitsoft' },
  { type: 'soft', sound: 'hitwhistle' },
  { type: 'soft', sound: 'sliderslide' },
  { type: 'soft', sound: 'slidertick' },
  { type: 'soft', sound: 'sliderwhistle' },
];

export const TYPE_LABELS: Record<HitsoundType, string> = {
  drum: 'Drum',
  normal: 'Normal',
  soft: 'Soft',
};

/**
 * 空のプリセットを作成
 */
export const createEmptyPreset = (name: string): Preset => ({
  id: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`,
  name,
  hitsounds: HITSOUND_COMBINATIONS.map((combo) => ({
    ...combo,
    file: null,
    preview: null,
  })),
});

/**
 * ファイル名から拡張子を取得
 */
export const getExtension = (fileName: string): string => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : 'ogg';
};
