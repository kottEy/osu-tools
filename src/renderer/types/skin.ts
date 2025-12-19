/**
 * Skin.ini 関連の型定義
 */

export interface SkinGeneral {
  name: string;
  author: string;
  version: string;
  sliderBallFlip: boolean;
  cursorRotate: boolean;
  cursorTrailRotate: boolean;
  cursorExpand: boolean;
  cursorCentre: boolean;
  sliderBallFrames: number;
  hitCircleOverlayAboveNumber: boolean;
  sliderStyle: number;
  allowSliderBallTint: boolean;
  spinnerFadePlayfield: boolean;
}

export interface SkinColours {
  combo1: string;
  combo2: string;
  combo3: string;
  combo4: string;
  combo5: string;
  songSelectActiveText: string;
  songSelectInactiveText: string;
  sliderBorder: string;
  sliderTrackOverride: string;
}

export interface SkinFonts {
  hitCirclePrefix: string;
  hitCircleOverlap: number;
  scorePrefix: string;
  scoreOverlap: number;
  comboPrefix: string;
  comboOverlap: number;
}

export interface SkinIni {
  general: SkinGeneral;
  colours: SkinColours;
  fonts: SkinFonts;
}

export const DEFAULT_SKIN_INI: SkinIni = {
  general: {
    name: 'My Skin',
    author: '',
    version: '2.4',
    sliderBallFlip: true,
    cursorRotate: false,
    cursorTrailRotate: false,
    cursorExpand: false,
    cursorCentre: true,
    sliderBallFrames: 60,
    hitCircleOverlayAboveNumber: true,
    sliderStyle: 2,
    allowSliderBallTint: true,
    spinnerFadePlayfield: false,
  },
  colours: {
    combo1: '30,144,255',
    combo2: '164,90,240',
    combo3: '37,185,239',
    combo4: '23,209,116',
    combo5: '238,120,238',
    songSelectActiveText: '250,250,250',
    songSelectInactiveText: '230,230,230',
    sliderBorder: '120,120,120',
    sliderTrackOverride: '0,0,0',
  },
  fonts: {
    hitCirclePrefix: 'default',
    hitCircleOverlap: 2,
    scorePrefix: 'num\\berlin',
    scoreOverlap: 0,
    comboPrefix: 'num\\berlin',
    comboOverlap: 5,
  },
};

/**
 * RGB文字列をHEXに変換
 */
export function rgbStringToHex(rgb: string): string {
  const parts = rgb.split(',').map((n) => parseInt(n.trim(), 10));
  if (parts.length !== 3 || parts.some(isNaN)) return '#ffffff';
  return `#${parts.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * HEXをRGB文字列に変換
 */
export function hexToRgbString(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '255,255,255';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

/**
 * skin.iniをパース
 */
export function parseSkinIni(content: string): Partial<SkinIni> {
  const result: Partial<SkinIni> = {
    general: { ...DEFAULT_SKIN_INI.general },
    colours: { ...DEFAULT_SKIN_INI.colours },
    fonts: { ...DEFAULT_SKIN_INI.fonts },
  };

  let currentSection = '';
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;

    // Section header
    const sectionMatch = trimmed.match(/^\[(\w+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].toLowerCase();
      continue;
    }

    // Key-value pair
    const kvMatch = trimmed.match(/^([^:]+):\s*(.*)$/);
    if (kvMatch && currentSection) {
      const key = kvMatch[1].trim();
      const value = kvMatch[2].trim();

      switch (currentSection) {
        case 'general':
          parseGeneralKey(result.general!, key, value);
          break;
        case 'colours':
          parseColoursKey(result.colours!, key, value);
          break;
        case 'fonts':
          parseFontsKey(result.fonts!, key, value);
          break;
      }
    }
  }

  return result;
}

function parseGeneralKey(general: SkinGeneral, key: string, value: string) {
  const keyLower = key.toLowerCase().replace(/[_-]/g, '');
  const boolValue = value === '1' || value.toLowerCase() === 'true';
  const numValue = parseInt(value, 10);

  switch (keyLower) {
    case 'name':
      general.name = value;
      break;
    case 'author':
      general.author = value;
      break;
    case 'version':
      general.version = value;
      break;
    case 'sliderballflip':
      general.sliderBallFlip = boolValue;
      break;
    case 'cursorrotate':
      general.cursorRotate = boolValue;
      break;
    case 'cursortrailrotate':
      general.cursorTrailRotate = boolValue;
      break;
    case 'cursorexpand':
      general.cursorExpand = boolValue;
      break;
    case 'cursorcentre':
    case 'cursorcenter':
      general.cursorCentre = boolValue;
      break;
    case 'sliderballframes':
      if (!isNaN(numValue)) general.sliderBallFrames = numValue;
      break;
    case 'hitcircleoverlayabovenumber':
    case 'hitcircleoverlayabovenumer':
      general.hitCircleOverlayAboveNumber = boolValue;
      break;
    case 'sliderstyle':
      if (!isNaN(numValue)) general.sliderStyle = numValue;
      break;
    case 'allowsliderballtint':
      general.allowSliderBallTint = boolValue;
      break;
    case 'spinnerfadeplayfield':
      general.spinnerFadePlayfield = boolValue;
      break;
  }
}

function parseColoursKey(colours: SkinColours, key: string, value: string) {
  const keyLower = key.toLowerCase().replace(/[_-]/g, '');

  switch (keyLower) {
    case 'combo1':
      colours.combo1 = value;
      break;
    case 'combo2':
      colours.combo2 = value;
      break;
    case 'combo3':
      colours.combo3 = value;
      break;
    case 'combo4':
      colours.combo4 = value;
      break;
    case 'combo5':
      colours.combo5 = value;
      break;
    case 'songselectactivetext':
      colours.songSelectActiveText = value;
      break;
    case 'songselectinactivetext':
      colours.songSelectInactiveText = value;
      break;
    case 'sliderborder':
      colours.sliderBorder = value;
      break;
    case 'slidertrackoverride':
      colours.sliderTrackOverride = value;
      break;
  }
}

function parseFontsKey(fonts: SkinFonts, key: string, value: string) {
  const keyLower = key.toLowerCase().replace(/[_-]/g, '');
  const numValue = parseInt(value, 10);

  switch (keyLower) {
    case 'hitcircleprefix':
      fonts.hitCirclePrefix = value;
      break;
    case 'hitcircleoverlap':
      if (!isNaN(numValue)) fonts.hitCircleOverlap = numValue;
      break;
    case 'scoreprefix':
      fonts.scorePrefix = value;
      break;
    case 'scoreoverlap':
      if (!isNaN(numValue)) fonts.scoreOverlap = numValue;
      break;
    case 'comboprefix':
      fonts.comboPrefix = value;
      break;
    case 'combooverlap':
      if (!isNaN(numValue)) fonts.comboOverlap = numValue;
      break;
  }
}

/**
 * skin.iniを生成
 */
export function generateSkinIni(skin: SkinIni): string {
  const boolToStr = (b: boolean) => (b ? '1' : '0');

  return `[General]
Name: ${skin.general.name}
Author: ${skin.general.author}
Version: ${skin.general.version}

SliderBallFlip: ${boolToStr(skin.general.sliderBallFlip)}
CursorRotate: ${boolToStr(skin.general.cursorRotate)}
CursorTrailRotate: ${boolToStr(skin.general.cursorTrailRotate)}
CursorExpand: ${boolToStr(skin.general.cursorExpand)}
CursorCentre: ${boolToStr(skin.general.cursorCentre)}
SliderBallFrames: ${skin.general.sliderBallFrames}
HitCircleOverlayAboveNumer: ${boolToStr(skin.general.hitCircleOverlayAboveNumber)}
SliderStyle: ${skin.general.sliderStyle}

AllowSliderBallTint: ${boolToStr(skin.general.allowSliderBallTint)}

SpinnerFadePlayfield: ${boolToStr(skin.general.spinnerFadePlayfield)}

[Colours]
Combo1: ${skin.colours.combo1}
Combo2: ${skin.colours.combo2}
Combo3: ${skin.colours.combo3}
Combo4: ${skin.colours.combo4}
Combo5: ${skin.colours.combo5}

SongSelectActiveText: ${skin.colours.songSelectActiveText}
SongSelectInactiveText: ${skin.colours.songSelectInactiveText}

SliderBorder: ${skin.colours.sliderBorder}
SliderTrackOverride: ${skin.colours.sliderTrackOverride}

[Fonts]
HitCirclePrefix: ${skin.fonts.hitCirclePrefix}
HitCircleOverlap: ${skin.fonts.hitCircleOverlap}

ScorePrefix: ${skin.fonts.scorePrefix}
ScoreOverlap: ${skin.fonts.scoreOverlap}

ComboPrefix: ${skin.fonts.comboPrefix}
ComboOverlap: ${skin.fonts.comboOverlap}
`;
}

/**
 * 数字プリセットの型
 */
export interface NumberPreset {
  id: string;
  name: string;
  numbers: { [key: string]: string | null }; // default-0 ~ default-9, default-0@2x ~ default-9@2x
}

export function createEmptyNumberPreset(name: string): NumberPreset {
  return {
    id: crypto.randomUUID(),
    name,
    numbers: {
      'default-0': null,
      'default-1': null,
      'default-2': null,
      'default-3': null,
      'default-4': null,
      'default-5': null,
      'default-6': null,
      'default-7': null,
      'default-8': null,
      'default-9': null,
      'default-0@2x': null,
      'default-1@2x': null,
      'default-2@2x': null,
      'default-3@2x': null,
      'default-4@2x': null,
      'default-5@2x': null,
      'default-6@2x': null,
      'default-7@2x': null,
      'default-8@2x': null,
      'default-9@2x': null,
    },
  };
}
