/**
 * SkinIni Service - skin.ini の読み書き
 */
import * as fs from 'fs';
import * as path from 'path';
import { getConfigService } from './config';
import { getOsuFolderService } from './osuFolder';

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
  combo6: string;
  combo7: string;
  combo8: string;
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

export interface ApplyResult {
  success: boolean;
  error?: string;
}

const DEFAULT_SKIN_INI: SkinIni = {
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
    combo6: '',
    combo7: '',
    combo8: '',
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

class SkinIniService {
  /**
   * Lazerモード対応のスキンフォルダパスを取得
   */
  private getSkinPath(): { skinFolderPath: string | null; error?: string } {
    const configService = getConfigService();
    const osuFolderService = getOsuFolderService();

    const osuFolder = configService.getOsuFolder();
    const currentSkin = configService.getCurrentSkin();
    const lazerMode = configService.getLazerMode();
    const lazerSkinPath = configService.getLazerSkinPath();

    if (lazerMode) {
      if (!lazerSkinPath) {
        return { skinFolderPath: null, error: 'Lazerモードでスキンフォルダが設定されていません' };
      }
      return { skinFolderPath: lazerSkinPath };
    }

    if (!osuFolder || !currentSkin) {
      return { skinFolderPath: null, error: 'osu!フォルダまたはスキンが設定されていません' };
    }

    return { skinFolderPath: osuFolderService.getSkinFolderPath(osuFolder, currentSkin) };
  }

  /**
   * 現在のスキンの skin.ini を読み込む
   */
  readSkinIni(): SkinIni | null {
    const { skinFolderPath } = this.getSkinPath();
    if (!skinFolderPath) {
      return null;
    }

    const skinIniPath = path.join(skinFolderPath, 'skin.ini');

    if (!fs.existsSync(skinIniPath)) {
      return { ...DEFAULT_SKIN_INI };
    }

    try {
      const content = fs.readFileSync(skinIniPath, 'utf-8');
      return this.parseSkinIni(content);
    } catch (error) {
      console.error('Failed to read skin.ini:', error);
      return { ...DEFAULT_SKIN_INI };
    }
  }

  /**
   * skin.ini をパース
   */
  private parseSkinIni(content: string): SkinIni {
    // coloursは空文字列をデフォルトにする（skin.iniに存在する色のみ使用）
    const emptyColours: SkinColours = {
      combo1: '',
      combo2: '',
      combo3: '',
      combo4: '',
      combo5: '',
      combo6: '',
      combo7: '',
      combo8: '',
      songSelectActiveText: '',
      songSelectInactiveText: '',
      sliderBorder: '',
      sliderTrackOverride: '',
    };

    const result: SkinIni = {
      general: { ...DEFAULT_SKIN_INI.general },
      colours: { ...emptyColours },
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
            this.parseGeneralKey(result.general, key, value);
            break;
          case 'colours':
            this.parseColoursKey(result.colours, key, value);
            break;
          case 'fonts':
            this.parseFontsKey(result.fonts, key, value);
            break;
        }
      }
    }

    return result;
  }

  private parseGeneralKey(general: SkinGeneral, key: string, value: string): void {
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

  private parseColoursKey(colours: SkinColours, key: string, value: string): void {
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
    }
  }

  private parseFontsKey(fonts: SkinFonts, key: string, value: string): void {
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
   * skin.ini を生成
   */
  generateSkinIni(skin: SkinIni): string {
    const boolToStr = (b: boolean) => (b ? '1' : '0');

    const comboLines: string[] = [];
    for (let i = 1; i <= 8; i++) {
      const key = `combo${i}` as keyof SkinColours;
      const value = skin.colours[key];
      if (typeof value === 'string' && value.trim() !== '') {
        comboLines.push(`Combo${i}: ${value}`);
      }
    }

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
${comboLines.join('\n')}

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
   * skin.ini を保存
   */
  saveSkinIni(skinIni: SkinIni): ApplyResult {
    const { skinFolderPath, error } = this.getSkinPath();
    if (!skinFolderPath) {
      return { success: false, error };
    }

    const skinIniPath = path.join(skinFolderPath, 'skin.ini');

    if (!fs.existsSync(skinFolderPath)) {
      return { success: false, error: 'スキンフォルダが見つかりません' };
    }

    try {
      const content = this.generateSkinIni(skinIni);
      fs.writeFileSync(skinIniPath, content, 'utf-8');
      return { success: true };
    } catch (error) {
      console.error('Failed to save skin.ini:', error);
      return { success: false, error: 'skin.ini の保存に失敗しました' };
    }
  }
}

// シングルトンインスタンス
let skinIniServiceInstance: SkinIniService | null = null;

export function getSkinIniService(): SkinIniService {
  if (!skinIniServiceInstance) {
    skinIniServiceInstance = new SkinIniService();
  }
  return skinIniServiceInstance;
}

export default SkinIniService;
