/**
 * Hitsound Service - ヒットサウンドの管理と適用
 */
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { getConfigService } from './config';
import { getOsuFolderService } from './osuFolder';

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
  filePath: string | null;
  extension: string | null;
}

export interface HitsoundPreset {
  id: string;
  name: string;
  hitsounds: HitsoundFile[];
}

export interface ApplyResult {
  success: boolean;
  error?: string;
}

const VALID_EXTENSIONS = ['.wav', '.mp3', '.ogg'];

const HITSOUND_COMBINATIONS: { type: HitsoundType; sound: HitsoundSound }[] = [
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

class HitsoundService {
  private hitsoundsBasePath: string;
  private currentSkinCachePath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.hitsoundsBasePath = path.join(userDataPath, 'sounds', 'hitsounds');
    this.currentSkinCachePath = path.join(userDataPath, 'sounds', 'current-skin-cache');
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.hitsoundsBasePath)) {
      fs.mkdirSync(this.hitsoundsBasePath, { recursive: true });
    }
    if (!fs.existsSync(this.currentSkinCachePath)) {
      fs.mkdirSync(this.currentSkinCachePath, { recursive: true });
    }
  }

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
   * 音声ファイルの拡張子を検証
   */
  validateAudioFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return VALID_EXTENSIONS.includes(ext);
  }

  /**
   * バッファの音声形式を検証（簡易チェック）
   */
  validateAudioBuffer(buffer: Buffer, extension: string): boolean {
    const ext = extension.toLowerCase();
    if (!ext.startsWith('.')) {
      return VALID_EXTENSIONS.includes(`.${ext}`);
    }
    return VALID_EXTENSIONS.includes(ext);
  }

  /**
   * ヒットサウンドプリセット一覧を取得
   */
  getPresets(): HitsoundPreset[] {
    const presets: HitsoundPreset[] = [];

    if (!fs.existsSync(this.hitsoundsBasePath)) {
      return presets;
    }

    const presetFolders = fs.readdirSync(this.hitsoundsBasePath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const presetName of presetFolders) {
      const preset = this.loadPreset(presetName);
      if (preset) {
        presets.push(preset);
      }
    }

    return presets;
  }

  /**
   * 特定のプリセットを読み込む
   */
  private loadPreset(presetName: string): HitsoundPreset | null {
    const presetPath = path.join(this.hitsoundsBasePath, presetName);

    if (!fs.existsSync(presetPath)) {
      return null;
    }

    const hitsounds: HitsoundFile[] = HITSOUND_COMBINATIONS.map((combo) => {
      // 対応するファイルを検索
      const baseFileName = `${combo.type}-${combo.sound}`;
      const files = fs.readdirSync(presetPath);
      const matchingFile = files.find((file) => {
        const baseName = path.basename(file, path.extname(file));
        return baseName === baseFileName && VALID_EXTENSIONS.includes(path.extname(file).toLowerCase());
      });

      if (matchingFile) {
        return {
          type: combo.type,
          sound: combo.sound,
          filePath: path.join(presetPath, matchingFile),
          extension: path.extname(matchingFile).toLowerCase(),
        };
      }

      return {
        type: combo.type,
        sound: combo.sound,
        filePath: null,
        extension: null,
      };
    });

    return {
      id: presetName,
      name: presetName,
      hitsounds,
    };
  }

  /**
   * 新しいプリセットを作成
   */
  createPreset(name: string): ApplyResult {
    // 同一名チェック
    const existingPresets = this.getPresets();
    if (existingPresets.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return { success: false, error: '同じ名前のプリセットが既に存在します' };
    }

    const presetPath = path.join(this.hitsoundsBasePath, name);
    try {
      fs.mkdirSync(presetPath, { recursive: true });
      return { success: true };
    } catch (error) {
      console.error('Failed to create hitsound preset:', error);
      return { success: false, error: 'プリセットの作成に失敗しました' };
    }
  }

  /**
   * プリセットにヒットサウンドを追加
   */
  addHitsoundToPreset(
    presetName: string,
    type: HitsoundType,
    sound: HitsoundSound,
    audioBuffer: Buffer,
    originalExtension: string,
  ): ApplyResult {
    const ext = originalExtension.startsWith('.') ? originalExtension : `.${originalExtension}`;

    if (!VALID_EXTENSIONS.includes(ext.toLowerCase())) {
      return { success: false, error: 'WAV, MP3, OGG形式のみ対応しています' };
    }

    const presetPath = path.join(this.hitsoundsBasePath, presetName);
    if (!fs.existsSync(presetPath)) {
      return { success: false, error: 'プリセットが見つかりません' };
    }

    // 既存の同名ファイルを削除
    const baseFileName = `${type}-${sound}`;
    const existingFiles = fs.readdirSync(presetPath).filter((file) => {
      const baseName = path.basename(file, path.extname(file));
      return baseName === baseFileName;
    });
    existingFiles.forEach((file) => {
      fs.unlinkSync(path.join(presetPath, file));
    });

    // 新しいファイルを保存
    const fileName = `${baseFileName}${ext.toLowerCase()}`;
    const filePath = path.join(presetPath, fileName);

    try {
      fs.writeFileSync(filePath, audioBuffer);
      return { success: true };
    } catch (error) {
      console.error('Failed to add hitsound to preset:', error);
      return { success: false, error: 'ヒットサウンドの追加に失敗しました' };
    }
  }

  /**
   * プリセットからヒットサウンドを削除
   */
  removeHitsoundFromPreset(
    presetName: string,
    type: HitsoundType,
    sound: HitsoundSound,
  ): boolean {
    const presetPath = path.join(this.hitsoundsBasePath, presetName);
    if (!fs.existsSync(presetPath)) {
      return false;
    }

    const baseFileName = `${type}-${sound}`;
    const files = fs.readdirSync(presetPath);
    const matchingFile = files.find((file) => {
      const baseName = path.basename(file, path.extname(file));
      return baseName === baseFileName;
    });

    if (matchingFile) {
      try {
        fs.unlinkSync(path.join(presetPath, matchingFile));
        return true;
      } catch (error) {
        console.error('Failed to remove hitsound:', error);
      }
    }
    return false;
  }

  /**
   * プリセットを削除
   */
  deletePreset(presetName: string): boolean {
    const presetPath = path.join(this.hitsoundsBasePath, presetName);
    try {
      if (fs.existsSync(presetPath)) {
        fs.rmSync(presetPath, { recursive: true, force: true });
        return true;
      }
    } catch (error) {
      console.error('Failed to delete hitsound preset:', error);
    }
    return false;
  }

  /**
   * Current Skinのヒットサウンドをプリセットとして保存
   */
  saveCurrentSkinAsPreset(newPresetName: string): ApplyResult {
    const { skinFolderPath, error } = this.getSkinPath();
    if (!skinFolderPath) {
      return { success: false, error };
    }

    // 同一名チェック
    const existingPresets = this.getPresets();
    if (existingPresets.some((p) => p.name.toLowerCase() === newPresetName.toLowerCase())) {
      return { success: false, error: '同じ名前のプリセットが既に存在します' };
    }

    if (!fs.existsSync(skinFolderPath)) {
      return { success: false, error: 'スキンフォルダが見つかりません' };
    }

    // 新しいプリセットフォルダを作成
    const newPresetPath = path.join(this.hitsoundsBasePath, newPresetName);
    try {
      fs.mkdirSync(newPresetPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create preset folder:', error);
      return { success: false, error: 'プリセットフォルダの作成に失敗しました' };
    }

    // Current Skinからヒットサウンドファイルをコピー
    try {
      const files = fs.readdirSync(skinFolderPath);
      let copiedCount = 0;

      for (const combo of HITSOUND_COMBINATIONS) {
        const expectedBaseName = `${combo.type}-${combo.sound}`.toLowerCase();

        for (const ext of VALID_EXTENSIONS) {
          // Case-insensitive search
          const matchingFile = files.find((f) => {
            const fileName = path.basename(f, path.extname(f)).toLowerCase();
            const fileExt = path.extname(f).toLowerCase();
            return fileName === expectedBaseName && fileExt === ext;
          });

          if (matchingFile) {
            const srcPath = path.join(skinFolderPath, matchingFile);
            // ファイル名を正規化（小文字に統一）
            const destFileName = `${combo.type}-${combo.sound}${ext.toLowerCase()}`;
            const destPath = path.join(newPresetPath, destFileName);
            fs.copyFileSync(srcPath, destPath);
            copiedCount++;
            break; // 同じtype-soundで複数の拡張子がある場合は最初のものだけ
          }
        }
      }

      if (copiedCount === 0) {
        // コピーしたファイルがない場合はフォルダを削除
        fs.rmSync(newPresetPath, { recursive: true, force: true });
        return { success: false, error: 'コピーできるヒットサウンドファイルがありませんでした' };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to save current skin as preset:', error);
      // エラー時はフォルダを削除
      try {
        fs.rmSync(newPresetPath, { recursive: true, force: true });
      } catch {}
      return { success: false, error: 'Current Skinの保存に失敗しました' };
    }
  }

  /**
   * プリセット名を変更
   */
  renamePreset(oldName: string, newName: string): ApplyResult {
    // 同一名チェック
    const existingPresets = this.getPresets();
    if (existingPresets.some((p) => p.name.toLowerCase() === newName.toLowerCase() && p.name !== oldName)) {
      return { success: false, error: '同じ名前のプリセットが既に存在します' };
    }

    const oldPath = path.join(this.hitsoundsBasePath, oldName);
    const newPath = path.join(this.hitsoundsBasePath, newName);

    try {
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        return { success: true };
      }
      return { success: false, error: 'プリセットが見つかりません' };
    } catch (error) {
      console.error('Failed to rename hitsound preset:', error);
      return { success: false, error: 'プリセット名の変更に失敗しました' };
    }
  }

  /**
   * プリセットをスキンに適用（既存のヒットサウンドを全削除後、置き換え）
   */
  async applyPreset(presetName: string): Promise<ApplyResult> {
    const { skinFolderPath, error } = this.getSkinPath();
    if (!skinFolderPath) {
      return { success: false, error };
    }

    const presetPath = path.join(this.hitsoundsBasePath, presetName);

    if (!fs.existsSync(skinFolderPath)) {
      return { success: false, error: 'スキンフォルダが見つかりません' };
    }

    if (!fs.existsSync(presetPath)) {
      return { success: false, error: 'プリセットが見つかりません' };
    }

    try {
      // 既存のヒットサウンドファイルを削除
      for (const combo of HITSOUND_COMBINATIONS) {
        const baseFileName = `${combo.type}-${combo.sound}`;
        for (const ext of VALID_EXTENSIONS) {
          const filePath = path.join(skinFolderPath, `${baseFileName}${ext}`);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }

      // プリセットのファイルをコピー
      const files = fs.readdirSync(presetPath);
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (VALID_EXTENSIONS.includes(ext)) {
          const srcPath = path.join(presetPath, file);
          const destPath = path.join(skinFolderPath, file);
          fs.copyFileSync(srcPath, destPath);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to apply hitsound preset:', error);
      return { success: false, error: 'ヒットサウンドの適用に失敗しました' };
    }
  }

  /**
   * Current Skinキャッシュをスキンに適用
   */
  async applyCurrentSkinCache(): Promise<ApplyResult> {
    const { skinFolderPath, error } = this.getSkinPath();
    if (!skinFolderPath) {
      return { success: false, error };
    }

    if (!fs.existsSync(skinFolderPath)) {
      return { success: false, error: 'スキンフォルダが見つかりません' };
    }

    if (!this.hasCurrentSkinCache()) {
      return { success: false, error: 'キャッシュが見つかりません' };
    }

    try {
      // 既存のヒットサウンドファイルを削除
      for (const combo of HITSOUND_COMBINATIONS) {
        const baseFileName = `${combo.type}-${combo.sound}`;
        for (const ext of VALID_EXTENSIONS) {
          const filePath = path.join(skinFolderPath, `${baseFileName}${ext}`);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }

      // キャッシュのファイルをコピー
      const files = fs.readdirSync(this.currentSkinCachePath);
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (VALID_EXTENSIONS.includes(ext)) {
          const srcPath = path.join(this.currentSkinCachePath, file);
          const destPath = path.join(skinFolderPath, file);
          fs.copyFileSync(srcPath, destPath);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to apply current skin cache:', error);
      return { success: false, error: 'キャッシュからの適用に失敗しました' };
    }
  }

  /**
   * ヒットサウンドファイルをBase64で取得（プレビュー用）
   */
  getHitsoundBase64(presetName: string, type: HitsoundType, sound: HitsoundSound): string | null {
    const preset = this.loadPreset(presetName);
    if (!preset) return null;

    const hitsound = preset.hitsounds.find((h) => h.type === type && h.sound === sound);
    if (!hitsound?.filePath || !fs.existsSync(hitsound.filePath)) return null;

    try {
      const buffer = fs.readFileSync(hitsound.filePath);
      const mimeType = this.getMimeType(hitsound.extension || '.ogg');
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (error) {
      console.error('Failed to read hitsound file:', error);
      return null;
    }
  }

  private getMimeType(extension: string): string {
    switch (extension.toLowerCase()) {
      case '.wav':
        return 'audio/wav';
      case '.mp3':
        return 'audio/mpeg';
      case '.ogg':
        return 'audio/ogg';
      default:
        return 'audio/ogg';
    }
  }

  /**
   * Current Skinのヒットサウンドを一時キャッシュにコピー
   */
  cacheCurrentSkinHitsounds(): ApplyResult {
    console.log('[HitsoundService] cacheCurrentSkinHitsounds called');

    const { skinFolderPath, error } = this.getSkinPath();
    if (!skinFolderPath) {
      return { success: false, error };
    }

    if (!fs.existsSync(skinFolderPath)) {
      return { success: false, error: 'スキンフォルダが見つかりません' };
    }

    // キャッシュフォルダをクリア
    this.clearCurrentSkinCache();

    // キャッシュフォルダを作成
    if (!fs.existsSync(this.currentSkinCachePath)) {
      fs.mkdirSync(this.currentSkinCachePath, { recursive: true });
    }

    try {
      const files = fs.readdirSync(skinFolderPath);
      let copiedCount = 0;

      for (const combo of HITSOUND_COMBINATIONS) {
        const baseFileName = `${combo.type}-${combo.sound}`;

        for (const file of files) {
          const lowerFile = file.toLowerCase();
          for (const ext of VALID_EXTENSIONS) {
            const expectedName = `${baseFileName}${ext}`.toLowerCase();
            if (lowerFile === expectedName) {
              const srcPath = path.join(skinFolderPath, file);
              const destPath = path.join(this.currentSkinCachePath, `${baseFileName}${ext.toLowerCase()}`);
              fs.copyFileSync(srcPath, destPath);
              copiedCount++;
              break;
            }
          }
        }
      }

      console.log('[HitsoundService] Cached', copiedCount, 'hitsound files');
      return { success: true };
    } catch (error) {
      console.error('Failed to cache current skin hitsounds:', error);
      return { success: false, error: 'キャッシュの作成に失敗しました' };
    }
  }

  /**
   * Current Skinのキャッシュをクリア
   */
  clearCurrentSkinCache(): void {
    console.log('[HitsoundService] clearCurrentSkinCache called');
    try {
      if (fs.existsSync(this.currentSkinCachePath)) {
        fs.rmSync(this.currentSkinCachePath, { recursive: true, force: true });
      }
      // フォルダを再作成
      fs.mkdirSync(this.currentSkinCachePath, { recursive: true });
    } catch (error) {
      console.error('Failed to clear current skin cache:', error);
    }
  }

  /**
   * キャッシュが存在するかチェック
   */
  hasCurrentSkinCache(): boolean {
    if (!fs.existsSync(this.currentSkinCachePath)) {
      return false;
    }
    const files = fs.readdirSync(this.currentSkinCachePath);
    return files.length > 0;
  }

  /**
   * 現在のスキンからヒットサウンドを読み込む（キャッシュから）
   */
  getCurrentSkinHitsounds(): HitsoundPreset | null {
    console.log('[HitsoundService] getCurrentSkinHitsounds called');

    // キャッシュが無い場合は作成
    if (!this.hasCurrentSkinCache()) {
      console.log('[HitsoundService] No cache found, creating cache...');
      const result = this.cacheCurrentSkinHitsounds();
      if (!result.success) {
        console.log('[HitsoundService] Failed to create cache:', result.error);
        return null;
      }
    }

    // キャッシュから読み込む
    const cachePath = this.currentSkinCachePath;
    if (!fs.existsSync(cachePath)) {
      console.log('[HitsoundService] Cache path does not exist');
      return null;
    }

    const hitsounds: HitsoundFile[] = [];
    let hasAnyFile = false;

    const files = fs.readdirSync(cachePath);
    console.log('[HitsoundService] Files in cache:', files);

    for (const combo of HITSOUND_COMBINATIONS) {
      const baseFileName = `${combo.type}-${combo.sound}`;
      let foundFile: { filePath: string; extension: string } | null = null;

      for (const file of files) {
        const lowerFile = file.toLowerCase();
        for (const ext of VALID_EXTENSIONS) {
          const expectedName = `${baseFileName}${ext}`.toLowerCase();
          if (lowerFile === expectedName) {
            foundFile = { filePath: path.join(cachePath, file), extension: ext };
            hasAnyFile = true;
            break;
          }
        }
        if (foundFile) break;
      }

      hitsounds.push({
        type: combo.type,
        sound: combo.sound,
        filePath: foundFile?.filePath || null,
        extension: foundFile?.extension || null,
      });
    }

    console.log('[HitsoundService] hasAnyFile:', hasAnyFile);
    console.log('[HitsoundService] Found hitsounds count:', hitsounds.filter(h => h.filePath).length);

    if (!hasAnyFile) {
      console.log('[HitsoundService] No files found in cache');
      return null;
    }

    const result = {
      id: 'current-skin',
      name: 'Current Skin',
      hitsounds,
    };
    console.log('[HitsoundService] Returning preset with', hitsounds.filter(h => h.filePath).length, 'sounds');
    return result;
  }

  /**
   * 現在のスキンのヒットサウンドをBase64で取得（キャッシュから）
   */
  getCurrentSkinHitsoundBase64(type: HitsoundType, sound: HitsoundSound): string | null {
    // キャッシュが無い場合は作成
    if (!this.hasCurrentSkinCache()) {
      const result = this.cacheCurrentSkinHitsounds();
      if (!result.success) {
        return null;
      }
    }

    const cachePath = this.currentSkinCachePath;
    if (!fs.existsSync(cachePath)) {
      return null;
    }

    const baseFileName = `${type}-${sound}`;

    const files = fs.readdirSync(cachePath);
    for (const file of files) {
      const lowerFile = file.toLowerCase();
      for (const ext of VALID_EXTENSIONS) {
        if (lowerFile === `${baseFileName}${ext}`.toLowerCase()) {
          try {
            const buffer = fs.readFileSync(path.join(cachePath, file));
            const mimeType = this.getMimeType(ext);
            return `data:${mimeType};base64,${buffer.toString('base64')}`;
          } catch (error) {
            console.error('Failed to read hitsound file:', error);
            return null;
          }
        }
      }
    }

    return null;
  }
}

// シングルトンインスタンス
let hitsoundServiceInstance: HitsoundService | null = null;

export function getHitsoundService(): HitsoundService {
  if (!hitsoundServiceInstance) {
    hitsoundServiceInstance = new HitsoundService();
  }
  return hitsoundServiceInstance;
}

export default HitsoundService;
