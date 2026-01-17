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
  // UIで編集しない設定を保持
  unknownSettings: Record<string, string>;
}

export interface SkinColours {
  combo1: string;
  combo2: string;
  combo3: string;
  combo4: string;
  combo5: string;
  combo6: string;
  combo7: string;
  combo8: string;
  songSelectActiveText: string;
  songSelectInactiveText: string;
  sliderBorder: string;
  sliderTrackOverride: string;
  // UIで編集しない設定を保持
  unknownSettings: Record<string, string>;
}

export interface SkinFonts {
  hitCirclePrefix: string;
  hitCircleOverlap: number;
  scorePrefix: string;
  scoreOverlap: number;
  comboPrefix: string;
  comboOverlap: number;
  // UIで編集しない設定を保持
  unknownSettings: Record<string, string>;
}

// [CatchTheBeat] セクション
export interface SkinCatchTheBeat {
  unknownSettings: Record<string, string>;
}

// [Mania] セクション（キー数ごとに複数のセクションが存在する可能性あり）
export interface SkinManiaSection {
  keys: number;
  settings: Record<string, string>;
}

export interface SkinIni {
  general: SkinGeneral;
  colours: SkinColours;
  fonts: SkinFonts;
  catchTheBeat: SkinCatchTheBeat;
  mania: SkinManiaSection[];
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
    unknownSettings: {},
  },
  colours: {
    combo1: '30,144,255',
    combo2: '164,90,240',
    combo3: '37,185,239',
    combo4: '23,209,116',
    combo5: '238,120,238',
    combo6: '',
    combo7: '',
    combo8: '',
    songSelectActiveText: '250,250,250',
    songSelectInactiveText: '230,230,230',
    sliderBorder: '120,120,120',
    sliderTrackOverride: '0,0,0',
    unknownSettings: {},
  },
  fonts: {
    hitCirclePrefix: 'default',
    hitCircleOverlap: 2,
    scorePrefix: 'num\\berlin',
    scoreOverlap: 0,
    comboPrefix: 'num\\berlin',
    comboOverlap: 5,
    unknownSettings: {},
  },
  catchTheBeat: {
    unknownSettings: {},
  },
  mania: [],
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
    general: { ...DEFAULT_SKIN_INI.general, unknownSettings: {} },
    colours: { ...DEFAULT_SKIN_INI.colours, unknownSettings: {} },
    fonts: { ...DEFAULT_SKIN_INI.fonts, unknownSettings: {} },
    catchTheBeat: { unknownSettings: {} },
    mania: [],
  };

  let currentSection = '';
  let currentManiaSection: SkinManiaSection | null = null;
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;

    // Section header
    const sectionMatch = trimmed.match(/^\[(\w+)\]$/i);
    if (sectionMatch) {
      // 前のManiaセクションを保存
      if (currentManiaSection) {
        result.mania!.push(currentManiaSection);
        currentManiaSection = null;
      }

      currentSection = sectionMatch[1].toLowerCase();

      // Maniaセクションの開始
      if (currentSection === 'mania') {
        currentManiaSection = { keys: 0, settings: {} };
      }
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
        case 'catchthebeat':
          // CatchTheBeatセクションは全て unknownSettings に保存
          result.catchTheBeat!.unknownSettings[key] = value;
          break;
        case 'mania':
          if (currentManiaSection) {
            // Keys は特別扱い
            if (key.toLowerCase() === 'keys') {
              currentManiaSection.keys = parseInt(value, 10) || 0;
            }
            // 全ての設定をsettingsに保存
            currentManiaSection.settings[key] = value;
          }
          break;
      }
    }
  }

  // 最後のManiaセクションを保存
  if (currentManiaSection) {
    result.mania!.push(currentManiaSection);
  }

  return result;
}

function parseGeneralKey(general: SkinGeneral, key: string, value: string) {
  const keyLower = key.toLowerCase().replace(/[_-]/g, '');
  const boolValue = value === '1' || value.toLowerCase() === 'true';
  const numValue = parseInt(value, 10);

  // 既知のキーのリスト
  const knownKeys = [
    'name', 'author', 'version', 'sliderballflip', 'cursorrotate',
    'cursortrailrotate', 'cursorexpand', 'cursorcentre', 'cursorcenter',
    'sliderballframes', 'hitcircleoverlayabovenumber', 'hitcircleoverlayabovenumer',
    'sliderstyle', 'allowsliderballtint', 'spinnerfadeplayfield'
  ];

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
    default:
      // 未知の設定は元のキー名を保持して保存
      if (!knownKeys.includes(keyLower)) {
        general.unknownSettings[key] = value;
      }
      break;
  }
}

function parseColoursKey(colours: SkinColours, key: string, value: string) {
  const keyLower = key.toLowerCase().replace(/[_-]/g, '');

  // 既知のキーのリスト
  const knownKeys = [
    'combo1', 'combo2', 'combo3', 'combo4', 'combo5', 'combo6', 'combo7', 'combo8',
    'songselectactivetext', 'songselectinactivetext', 'sliderborder', 'slidertrackoverride'
  ];

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
    case 'combo6':
      colours.combo6 = value;
      break;
    case 'combo7':
      colours.combo7 = value;
      break;
    case 'combo8':
      colours.combo8 = value;
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
    default:
      // 未知の設定は元のキー名を保持して保存
      if (!knownKeys.includes(keyLower)) {
        colours.unknownSettings[key] = value;
      }
      break;
  }
}

function parseFontsKey(fonts: SkinFonts, key: string, value: string) {
  const keyLower = key.toLowerCase().replace(/[_-]/g, '');
  const numValue = parseInt(value, 10);

  // 既知のキーのリスト
  const knownKeys = [
    'hitcircleprefix', 'hitcircleoverlap', 'scoreprefix',
    'scoreoverlap', 'comboprefix', 'combooverlap'
  ];

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
    default:
      // 未知の設定は元のキー名を保持して保存
      if (!knownKeys.includes(keyLower)) {
        fonts.unknownSettings[key] = value;
      }
      break;
  }
}

/**
 * skin.iniを生成
 */
export function generateSkinIni(skin: SkinIni): string {
  const boolToStr = (b: boolean) => (b ? '1' : '0');

  // [General] セクションのunknownSettingsを生成
  const generalUnknownLines = Object.entries(skin.general.unknownSettings || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  // コンボカラーの行を生成
  const comboLines: string[] = [];
  for (let i = 1; i <= 8; i += 1) {
    const key = `combo${i}` as keyof SkinColours;
    const value = skin.colours[key];
    if (typeof value === 'string' && value.trim() !== '') {
      comboLines.push(`Combo${i}: ${value}`);
    }
  }

  // [Colours] セクションのunknownSettingsを生成
  const coloursUnknownLines = Object.entries(skin.colours.unknownSettings || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  // [Fonts] セクションのunknownSettingsを生成
  const fontsUnknownLines = Object.entries(skin.fonts.unknownSettings || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  // [CatchTheBeat] セクションを生成
  const catchTheBeatLines = Object.entries(skin.catchTheBeat?.unknownSettings || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  const catchTheBeatSection = catchTheBeatLines
    ? `\n[CatchTheBeat]\n${catchTheBeatLines}\n`
    : '';

  // [Mania] セクションを生成
  const maniaSections = (skin.mania || [])
    .map((maniaSection) => {
      const settingsLines = Object.entries(maniaSection.settings)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      return `\n[Mania]\n${settingsLines}`;
    })
    .join('\n');

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
${generalUnknownLines ? '\n' + generalUnknownLines : ''}

[Colours]
${comboLines.join('\n')}

SongSelectActiveText: ${skin.colours.songSelectActiveText}
SongSelectInactiveText: ${skin.colours.songSelectInactiveText}

SliderBorder: ${skin.colours.sliderBorder}
SliderTrackOverride: ${skin.colours.sliderTrackOverride}
${coloursUnknownLines ? '\n' + coloursUnknownLines : ''}

[Fonts]
HitCirclePrefix: ${skin.fonts.hitCirclePrefix}
HitCircleOverlap: ${skin.fonts.hitCircleOverlap}

ScorePrefix: ${skin.fonts.scorePrefix}
ScoreOverlap: ${skin.fonts.scoreOverlap}

ComboPrefix: ${skin.fonts.comboPrefix}
ComboOverlap: ${skin.fonts.comboOverlap}
${fontsUnknownLines ? '\n' + fontsUnknownLines : ''}${catchTheBeatSection}${maniaSections}
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
