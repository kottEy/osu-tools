/**
 * SkinIni Service - skin.ini の読み書き
 */
import * as fs from 'fs';
import * as path from 'path';
import { getConfigService } from './config';
import { getOsuFolderService } from './osuFolder';

/**
 * [General] セクションの設定
 * スキンの基本情報と動作設定
 */
export interface SkinGeneral {
  /** スキンの名前 */
  name: string;
  /** スキンの作者名 */
  author: string;
  /** スキンのバージョン (1.0, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, latest) */
  version: string;
  /** スライダーボールを移動方向に応じて反転させるか (true: 反転する) */
  sliderBallFlip: boolean;
  /** カーソルを回転させるか (true: 回転する) */
  cursorRotate: boolean;
  /** カーソルトレイルを回転させるか (true: 回転する) */
  cursorTrailRotate: boolean;
  /** クリック時にカーソルを拡大させるか (true: 拡大する) */
  cursorExpand: boolean;
  /** カーソルの原点を中心にするか (true: 中心, false: 左上) */
  cursorCentre: boolean;
  /** スライダーボールのアニメーションフレーム数 */
  sliderBallFrames: number;
  /** ヒットサークルオーバーレイを数字の上に表示するか (true: 上に表示) */
  hitCircleOverlayAboveNumber: boolean;
  /** スライダーのスタイル (1: セグメント, 2: グラデーション) */
  sliderStyle: number;
  /** スライダーボールにコンボ色を適用するか (true: 適用する) */
  allowSliderBallTint: boolean;
  /** スピナー中にプレイフィールドをフェードアウトさせるか (true: フェードする) */
  spinnerFadePlayfield: boolean;
}

/**
 * [Colours] セクションの設定
 * 色の設定 (RGB形式: "R,G,B" または "R,G,B,A")
 */
export interface SkinColours {
  /** コンボカラー1 (最初のコンボの色) */
  combo1: string;
  /** コンボカラー2 */
  combo2: string;
  /** コンボカラー3 */
  combo3: string;
  /** コンボカラー4 */
  combo4: string;
  /** コンボカラー5 (オプション) */
  combo5: string;
  /** コンボカラー6 (オプション) */
  combo6: string;
  /** コンボカラー7 (オプション) */
  combo7: string;
  /** コンボカラー8 (オプション) */
  combo8: string;
  /** 選曲画面のアクティブなテキストの色 */
  songSelectActiveText: string;
  /** 選曲画面の非アクティブなテキストの色 */
  songSelectInactiveText: string;
  /** スライダーの境界線の色 */
  sliderBorder: string;
  /** スライダートラックの色を上書き */
  sliderTrackOverride: string;
  /** 入力オーバーレイのテキストの色 (キー/マウス表示) */
  inputOverlayText: string;
  /** メニューの光彩の色 */
  menuGlow: string;
  /** スライダーボールの色 */
  sliderBall: string;
  /** スピナーの背景色 */
  spinnerBackground: string;
  /** スターバーストの加算色 */
  starBreakAdditive: string;
}

/**
 * [Fonts] セクションの設定
 * フォント・数字画像の設定
 */
export interface SkinFonts {
  /** ヒットサークル内の数字のプレフィックス (例: "default", "score") */
  hitCirclePrefix: string;
  /** ヒットサークル数字の重なりピクセル数 (負の値で間隔が広がる) */
  hitCircleOverlap: number;
  /** スコア表示の数字のプレフィックス */
  scorePrefix: string;
  /** スコア数字の重なりピクセル数 */
  scoreOverlap: number;
  /** コンボ表示の数字のプレフィックス */
  comboPrefix: string;
  /** コンボ数字の重なりピクセル数 */
  comboOverlap: number;
}

/**
 * [CatchTheBeat] セクションの設定
 * Catch the Beat (CTB) モード専用の設定
 */
export interface SkinCatchTheBeat {
  /** ハイパーダッシュ時のキャッチャーの色 */
  hyperDash: string;
  /** ハイパーダッシュを発動するフルーツの色 */
  hyperDashFruit: string;
  /** ハイパーダッシュの残像の色 */
  hyperDashAfterImage: string;
}

/**
 * [ManiaX] セクションの設定 (Xはキー数: 1-18)
 * osu!mania モード専用の設定
 */
export interface SkinMania {
  /** キー数 (1-18) */
  keys: number;
  /** ステージの左端の開始位置 */
  columnStart: number;
  /** ステージの右端の位置 */
  columnRight: number;
  /** 各列間のスペース (カンマ区切り) */
  columnSpacing: string;
  /** 各列の幅 (カンマ区切り) */
  columnWidth: string;
  /** 列区切り線の幅 (カンマ区切り) */
  columnLineWidth: string;
  /** 小節線の高さ */
  barlineHeight: number;
  /** ヒット位置のY座標 */
  hitPosition: number;
  /** ライトの位置のY座標 */
  lightPosition: number;
  /** スコア表示のY座標 */
  scorePosition: number;
  /** コンボ表示のY座標 */
  comboPosition: number;
  /** 判定ラインを表示するか */
  judgementLine: boolean;
  /** 特殊キースタイル (None, Left, Right) */
  specialStyle: string;
  /** コンボバーストのスタイル (0: 左, 1: 右, 2: 両方) */
  comboBurstStyle: number;
  /** ステージを分割するか (8K以上で有効) */
  splitStages: boolean;
  /** 分割ステージ間の距離 */
  stageSeparation: number;
  /** スコアを各ステージに分けて表示するか */
  separateScore: boolean;
  /** キーをノーツの下に表示するか */
  keysUnderNotes: boolean;
  /** ノーツを上から下に流すか (DDRスタイル) */
  upsideDown: boolean;
  /** 列1の色 */
  colour1: string;
  /** 列2の色 */
  colour2: string;
  /** 列3の色 */
  colour3: string;
  /** 列4の色 */
  colour4: string;
  /** 列5の色 */
  colour5: string;
  /** 列6の色 */
  colour6: string;
  /** 列7の色 */
  colour7: string;
  /** 列8の色 */
  colour8: string;
  /** ライトの色 */
  colourLight1: string;
  /** 列区切り線の色 */
  colourColumnLine: string;
  /** 小節線の色 */
  colourBarline: string;
  /** 判定ラインの色 */
  colourJudgementLine: string;
  /** キー警告の色 */
  colourKeyWarning: string;
  /** ホールドノーツの色 */
  colourHold: string;
  /** ブレイクの色 */
  colourBreak: string;
}

/**
 * 未知の設定を保持するためのマップ
 * アプリで明示的にサポートしていない設定を保持し、再生成時に消えないようにする
 */
export interface UnknownSettings {
  [key: string]: string;
}

/**
 * skin.ini の全体構造
 * osu!スキンの設定ファイルを表現するインターフェース
 */
export interface SkinIni {
  /** [General] セクション - 基本情報と動作設定 */
  general: SkinGeneral;
  /** [Colours] セクション - 色の設定 */
  colours: SkinColours;
  /** [Fonts] セクション - フォント設定 */
  fonts: SkinFonts;
  /** [CatchTheBeat] セクション - CTBモード設定 (オプション) */
  catchTheBeat?: SkinCatchTheBeat;
  /** [ManiaX] セクション - Maniaモード設定 (オプション) */
  mania?: SkinMania;
  /** 未知のセクションを保持 (例: [CatchTheBeat], [Mania4] など) */
  unknownSections: { [section: string]: UnknownSettings };
  /** [General] セクションの未知の設定を保持 */
  unknownGeneral: UnknownSettings;
  /** [Colours] セクションの未知の設定を保持 */
  unknownColours: UnknownSettings;
  /** [Fonts] セクションの未知の設定を保持 */
  unknownFonts: UnknownSettings;
}

/**
 * skin.ini の適用結果
 */
export interface ApplyResult {
  /** 成功したかどうか */
  success: boolean;
  /** エラーメッセージ (失敗時のみ) */
  error?: string;
}

/**
 * デフォルトのskin.ini設定
 * 新規作成時やパース失敗時に使用される
 */
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
    inputOverlayText: '',
    menuGlow: '',
    sliderBall: '',
    spinnerBackground: '',
    starBreakAdditive: '',
  },
  fonts: {
    hitCirclePrefix: 'default',
    hitCircleOverlap: 2,
    scorePrefix: 'num\\berlin',
    scoreOverlap: 0,
    comboPrefix: 'num\\berlin',
    comboOverlap: 5,
  },
  unknownSections: {},
  unknownGeneral: {},
  unknownColours: {},
  unknownFonts: {},
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
      inputOverlayText: '',
      menuGlow: '',
      sliderBall: '',
      spinnerBackground: '',
      starBreakAdditive: '',
    };

    const result: SkinIni = {
      general: { ...DEFAULT_SKIN_INI.general },
      colours: { ...emptyColours },
      fonts: { ...DEFAULT_SKIN_INI.fonts },
      unknownSections: {},
      unknownGeneral: {},
      unknownColours: {},
      unknownFonts: {},
    };

    let currentSection = '';
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;

      // Section header
      const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1].toLowerCase();
        // 未知のセクションを初期化
        if (!['general', 'colours', 'fonts'].includes(currentSection)) {
          if (!result.unknownSections[currentSection]) {
            result.unknownSections[currentSection] = {};
          }
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
            if (!this.parseGeneralKey(result.general, key, value)) {
              // 未知のキーは保存
              result.unknownGeneral[key] = value;
            }
            break;
          case 'colours':
            if (!this.parseColoursKey(result.colours, key, value)) {
              // 未知のキーは保存
              result.unknownColours[key] = value;
            }
            break;
          case 'fonts':
            if (!this.parseFontsKey(result.fonts, key, value)) {
              // 未知のキーは保存
              result.unknownFonts[key] = value;
            }
            break;
          default:
            // 未知のセクションの設定を保存
            if (result.unknownSections[currentSection]) {
              result.unknownSections[currentSection][key] = value;
            }
            break;
        }
      }
    }

    return result;
  }

  private parseGeneralKey(general: SkinGeneral, key: string, value: string): boolean {
    const keyLower = key.toLowerCase().replace(/[_-]/g, '');
    const boolValue = value === '1' || value.toLowerCase() === 'true';
    const numValue = parseInt(value, 10);

    switch (keyLower) {
      case 'name':
        general.name = value;
        return true;
      case 'author':
        general.author = value;
        return true;
      case 'version':
        general.version = value;
        return true;
      case 'sliderballflip':
        general.sliderBallFlip = boolValue;
        return true;
      case 'cursorrotate':
        general.cursorRotate = boolValue;
        return true;
      case 'cursortrailrotate':
        general.cursorTrailRotate = boolValue;
        return true;
      case 'cursorexpand':
        general.cursorExpand = boolValue;
        return true;
      case 'cursorcentre':
      case 'cursorcenter':
        general.cursorCentre = boolValue;
        return true;
      case 'sliderballframes':
        if (!isNaN(numValue)) general.sliderBallFrames = numValue;
        return true;
      case 'hitcircleoverlayabovenumber':
      case 'hitcircleoverlayabovenumer':
        general.hitCircleOverlayAboveNumber = boolValue;
        return true;
      case 'sliderstyle':
        if (!isNaN(numValue)) general.sliderStyle = numValue;
        return true;
      case 'allowsliderballtint':
        general.allowSliderBallTint = boolValue;
        return true;
      case 'spinnerfadeplayfield':
        general.spinnerFadePlayfield = boolValue;
        return true;
      default:
        return false;
    }
  }

  private parseColoursKey(colours: SkinColours, key: string, value: string): boolean {
    const keyLower = key.toLowerCase().replace(/[_-]/g, '');

    switch (keyLower) {
      case 'combo1':
        colours.combo1 = value;
        return true;
      case 'combo2':
        colours.combo2 = value;
        return true;
      case 'combo3':
        colours.combo3 = value;
        return true;
      case 'combo4':
        colours.combo4 = value;
        return true;
      case 'combo5':
        colours.combo5 = value;
        return true;
      case 'combo6':
        colours.combo6 = value;
        return true;
      case 'combo7':
        colours.combo7 = value;
        return true;
      case 'combo8':
        colours.combo8 = value;
        return true;
      case 'songselectactivetext':
        colours.songSelectActiveText = value;
        return true;
      case 'songselectinactivetext':
        colours.songSelectInactiveText = value;
        return true;
      case 'sliderborder':
        colours.sliderBorder = value;
        return true;
      case 'slidertrackoverride':
        colours.sliderTrackOverride = value;
        return true;
      case 'inputoverlaytext':
        colours.inputOverlayText = value;
        return true;
      case 'menuglow':
        colours.menuGlow = value;
        return true;
      case 'sliderball':
        colours.sliderBall = value;
        return true;
      case 'spinnerbackground':
        colours.spinnerBackground = value;
        return true;
      case 'starbreakadditive':
        colours.starBreakAdditive = value;
        return true;
      default:
        return false;
    }
  }

  private parseFontsKey(fonts: SkinFonts, key: string, value: string): boolean {
    const keyLower = key.toLowerCase().replace(/[_-]/g, '');
    const numValue = parseInt(value, 10);

    switch (keyLower) {
      case 'hitcircleprefix':
        fonts.hitCirclePrefix = value;
        return true;
      case 'hitcircleoverlap':
        if (!isNaN(numValue)) fonts.hitCircleOverlap = numValue;
        return true;
      case 'scoreprefix':
        fonts.scorePrefix = value;
        return true;
      case 'scoreoverlap':
        if (!isNaN(numValue)) fonts.scoreOverlap = numValue;
        return true;
      case 'comboprefix':
        fonts.comboPrefix = value;
        return true;
      case 'combooverlap':
        if (!isNaN(numValue)) fonts.comboOverlap = numValue;
        return true;
      default:
        return false;
    }
  }

  /**
   * skin.ini を生成
   */
  generateSkinIni(skin: SkinIni): string {
    const boolToStr = (b: boolean) => (b ? '1' : '0');

    // Combo色を生成（空でないもののみ）
    const comboLines: string[] = [];
    for (let i = 1; i <= 8; i++) {
      const key = `combo${i}` as keyof SkinColours;
      const value = skin.colours[key];
      if (typeof value === 'string' && value.trim() !== '') {
        comboLines.push(`Combo${i}: ${value}`);
      }
    }

    // 追加の色設定を生成（空でないもののみ）
    const additionalColourLines: string[] = [];
    if (skin.colours.inputOverlayText && skin.colours.inputOverlayText.trim() !== '') {
      additionalColourLines.push(`InputOverlayText: ${skin.colours.inputOverlayText}`);
    }
    if (skin.colours.menuGlow && skin.colours.menuGlow.trim() !== '') {
      additionalColourLines.push(`MenuGlow: ${skin.colours.menuGlow}`);
    }
    if (skin.colours.sliderBall && skin.colours.sliderBall.trim() !== '') {
      additionalColourLines.push(`SliderBall: ${skin.colours.sliderBall}`);
    }
    if (skin.colours.spinnerBackground && skin.colours.spinnerBackground.trim() !== '') {
      additionalColourLines.push(`SpinnerBackground: ${skin.colours.spinnerBackground}`);
    }
    if (skin.colours.starBreakAdditive && skin.colours.starBreakAdditive.trim() !== '') {
      additionalColourLines.push(`StarBreakAdditive: ${skin.colours.starBreakAdditive}`);
    }

    // 未知のGeneral設定を生成
    const unknownGeneralLines: string[] = [];
    if (skin.unknownGeneral) {
      for (const [key, value] of Object.entries(skin.unknownGeneral)) {
        unknownGeneralLines.push(`${key}: ${value}`);
      }
    }

    // 未知のColours設定を生成
    const unknownColoursLines: string[] = [];
    if (skin.unknownColours) {
      for (const [key, value] of Object.entries(skin.unknownColours)) {
        unknownColoursLines.push(`${key}: ${value}`);
      }
    }

    // 未知のFonts設定を生成
    const unknownFontsLines: string[] = [];
    if (skin.unknownFonts) {
      for (const [key, value] of Object.entries(skin.unknownFonts)) {
        unknownFontsLines.push(`${key}: ${value}`);
      }
    }

    // 未知のセクションを生成
    let unknownSectionsStr = '';
    if (skin.unknownSections) {
      for (const [section, settings] of Object.entries(skin.unknownSections)) {
        if (Object.keys(settings).length > 0) {
          const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
          unknownSectionsStr += `\n[${sectionName}]\n`;
          for (const [key, value] of Object.entries(settings)) {
            unknownSectionsStr += `${key}: ${value}\n`;
          }
        }
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
${unknownGeneralLines.length > 0 ? '\n' + unknownGeneralLines.join('\n') : ''}

[Colours]
${comboLines.join('\n')}

SongSelectActiveText: ${skin.colours.songSelectActiveText}
SongSelectInactiveText: ${skin.colours.songSelectInactiveText}

SliderBorder: ${skin.colours.sliderBorder}
SliderTrackOverride: ${skin.colours.sliderTrackOverride}
${additionalColourLines.length > 0 ? '\n' + additionalColourLines.join('\n') : ''}${unknownColoursLines.length > 0 ? '\n' + unknownColoursLines.join('\n') : ''}

[Fonts]
HitCirclePrefix: ${skin.fonts.hitCirclePrefix}
HitCircleOverlap: ${skin.fonts.hitCircleOverlap}

ScorePrefix: ${skin.fonts.scorePrefix}
ScoreOverlap: ${skin.fonts.scoreOverlap}

ComboPrefix: ${skin.fonts.comboPrefix}
ComboOverlap: ${skin.fonts.comboOverlap}
${unknownFontsLines.length > 0 ? '\n' + unknownFontsLines.join('\n') : ''}${unknownSectionsStr}`;
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
