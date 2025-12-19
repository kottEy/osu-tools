/**
 * Cursor Service - カーソル画像の管理と適用
 */
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { getImageService } from './image';
import { getConfigService } from './config';
import { getOsuFolderService } from './osuFolder';

const CURSOR_MAX_SIZE = 100;

export interface CursorPreset {
  id: string;
  name: string;
  imagePath: string;
  previewUrl: string;
}

export interface ApplyResult {
  success: boolean;
  error?: string;
}

class CursorService {
  private cursorsBasePath: string;
  private cursorTrailsBasePath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.cursorsBasePath = path.join(userDataPath, 'images', 'cursor');
    this.cursorTrailsBasePath = path.join(userDataPath, 'images', 'cursortrail');
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist(): void {
    if (!fs.existsSync(this.cursorsBasePath)) {
      fs.mkdirSync(this.cursorsBasePath, { recursive: true });
    }
    if (!fs.existsSync(this.cursorTrailsBasePath)) {
      fs.mkdirSync(this.cursorTrailsBasePath, { recursive: true });
    }
  }

  /**
   * 画像をディレクトリ直下に保存（サブフォルダなし）
   */
  private saveImageDirect(
    imageBuffer: Buffer,
    basePath: string,
    baseName: string,
  ): { success: boolean; error?: string; savedPath?: string } {
    try {
      const imageService = getImageService();
      if (!imageService.validatePngBuffer(imageBuffer)) {
        return { success: false, error: 'PNG形式のみ対応しています' };
      }

      // ユニークなファイル名を生成
      let counter = 1;
      let fileName = `${baseName}-${counter}.png`;
      while (fs.existsSync(path.join(basePath, fileName))) {
        counter++;
        fileName = `${baseName}-${counter}.png`;
      }

      const fullPath = path.join(basePath, fileName);
      fs.writeFileSync(fullPath, imageBuffer);

      return { success: true, savedPath: fullPath };
    } catch (error) {
      console.error('Failed to save image:', error);
      return { success: false, error: '画像の保存に失敗しました' };
    }
  }

  /**
   * 保存されているカーソル画像一覧を取得
   */
  getCursorList(): CursorPreset[] {
    return this.getPresetList(this.cursorsBasePath, 'cursor');
  }

  /**
   * 保存されているカーソルトレイル画像一覧を取得
   */
  getCursorTrailList(): CursorPreset[] {
    return this.getPresetList(this.cursorTrailsBasePath, 'cursortrail');
  }

  private getPresetList(basePath: string, category: string): CursorPreset[] {
    const presets: CursorPreset[] = [];

    if (!fs.existsSync(basePath)) {
      return presets;
    }

    // 直下のファイルを探索（サブフォルダは無視）
    const files = fs.readdirSync(basePath, { withFileTypes: true })
      .filter((entry) => !entry.isDirectory())
      .filter((entry) => {
        const ext = path.extname(entry.name).toLowerCase();
        return ext === '.png' && !entry.name.includes('@2x');
      })
      .map((entry) => entry.name);

    for (const file of files) {
      const filePath = path.join(basePath, file);
      const imageService = getImageService();
      const previewUrl = imageService.imageToDataUrl(filePath);
      const baseName = path.basename(file, '.png');

      presets.push({
        id: `${category}-${baseName}`,
        name: baseName,
        imagePath: filePath,
        previewUrl: previewUrl || '',
      });
    }

    return presets;
  }

  /**
   * カーソル画像を追加
   */
  async addCursor(imageBuffer: Buffer, _subcategory: string, baseName: string): Promise<ApplyResult & { savedName?: string }> {
    const imageService = getImageService();

    // PNG検証
    if (!imageService.validatePngBuffer(imageBuffer)) {
      return { success: false, error: 'PNG形式のみ対応しています' };
    }

    // 100px制限でリサイズ
    const resizedBuffer = imageService.resizeImageKeepAspect(imageBuffer, CURSOR_MAX_SIZE);

    // 直下に保存（subcategoryは使用しない）
    const result = this.saveImageDirect(resizedBuffer, this.cursorsBasePath, baseName);
    
    // 保存されたファイル名を抽出
    let savedName: string | undefined;
    if (result.success && result.savedPath) {
      savedName = path.basename(result.savedPath, '.png');
    }
    
    return { success: result.success, error: result.error, savedName };
  }

  /**
   * カーソルトレイル画像を追加
   */
  async addCursorTrail(imageBuffer: Buffer, _subcategory: string, baseName: string): Promise<ApplyResult & { savedName?: string }> {
    const imageService = getImageService();

    // PNG検証
    if (!imageService.validatePngBuffer(imageBuffer)) {
      return { success: false, error: 'PNG形式のみ対応しています' };
    }

    // 100px制限でリサイズ
    const resizedBuffer = imageService.resizeImageKeepAspect(imageBuffer, CURSOR_MAX_SIZE);

    // 直下に保存（subcategoryは使用しない）
    const result = this.saveImageDirect(resizedBuffer, this.cursorTrailsBasePath, baseName);
    
    // 保存されたファイル名を抽出
    let savedName: string | undefined;
    if (result.success && result.savedPath) {
      savedName = path.basename(result.savedPath, '.png');
    }
    
    return { success: result.success, error: result.error, savedName };
  }

  /**
   * カーソルをスキンに適用
   */
  async applyCursor(imageBuffer: Buffer, use2x: boolean): Promise<ApplyResult> {
    const configService = getConfigService();
    const osuFolderService = getOsuFolderService();
    const imageService = getImageService();

    const osuFolder = configService.getOsuFolder();
    const currentSkin = configService.getCurrentSkin();
    const lazerMode = configService.getLazerMode();
    const lazerSkinPath = configService.getLazerSkinPath();

    if (!lazerMode && (!osuFolder || !currentSkin)) {
      return { success: false, error: 'osu!フォルダまたはスキンが設定されていません' };
    }

    if (lazerMode && !lazerSkinPath) {
      return { success: false, error: 'Lazerモードでスキンフォルダが設定されていません' };
    }

    const skinFolderPath = lazerMode ? lazerSkinPath : osuFolderService.getSkinFolderPath(osuFolder, currentSkin);

    if (!fs.existsSync(skinFolderPath)) {
      return { success: false, error: 'スキンフォルダが見つかりません' };
    }

    // PNG検証
    if (!imageService.validatePngBuffer(imageBuffer)) {
      return { success: false, error: 'PNG形式のみ対応しています' };
    }

    // 100px制限でリサイズ
    const resizedBuffer = imageService.resizeImageKeepAspect(imageBuffer, CURSOR_MAX_SIZE);

    try {
      // 通常版を保存
      const result = imageService.saveImageToSkin(resizedBuffer, skinFolderPath, 'cursor.png');
      if (!result.success) {
        return result;
      }

      if (use2x) {
        // @2x版も保存
        const result2x = imageService.saveImageToSkin(resizedBuffer, skinFolderPath, 'cursor@2x.png');
        if (!result2x.success) {
          return result2x;
        }
      } else {
        // @2x版を削除
        imageService.deleteImageFromSkin(skinFolderPath, 'cursor@2x.png');
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to apply cursor:', error);
      return { success: false, error: 'カーソルの適用に失敗しました' };
    }
  }

  /**
   * カーソルトレイルをスキンに適用
   */
  async applyCursorTrail(imageBuffer: Buffer, use2x: boolean, useCursorMiddle: boolean): Promise<ApplyResult> {
    const configService = getConfigService();
    const osuFolderService = getOsuFolderService();
    const imageService = getImageService();

    const osuFolder = configService.getOsuFolder();
    const currentSkin = configService.getCurrentSkin();
    const lazerMode = configService.getLazerMode();
    const lazerSkinPath = configService.getLazerSkinPath();

    if (!lazerMode && (!osuFolder || !currentSkin)) {
      return { success: false, error: 'osu!フォルダまたはスキンが設定されていません' };
    }

    if (lazerMode && !lazerSkinPath) {
      return { success: false, error: 'Lazerモードでスキンフォルダが設定されていません' };
    }

    const skinFolderPath = lazerMode ? lazerSkinPath : osuFolderService.getSkinFolderPath(osuFolder, currentSkin);

    if (!fs.existsSync(skinFolderPath)) {
      return { success: false, error: 'スキンフォルダが見つかりません' };
    }

    // PNG検証
    if (!imageService.validatePngBuffer(imageBuffer)) {
      return { success: false, error: 'PNG形式のみ対応しています' };
    }

    // 100px制限でリサイズ
    const resizedBuffer = imageService.resizeImageKeepAspect(imageBuffer, CURSOR_MAX_SIZE);

    try {
      if (useCursorMiddle) {
        // cursortrail を削除して cursormiddle を作成
        imageService.deleteImageFromSkin(skinFolderPath, 'cursortrail.png');
        imageService.deleteImageFromSkin(skinFolderPath, 'cursortrail@2x.png');

        const result = imageService.saveImageToSkin(resizedBuffer, skinFolderPath, 'cursormiddle.png');
        if (!result.success) {
          return result;
        }

        if (use2x) {
          const result2x = imageService.saveImageToSkin(resizedBuffer, skinFolderPath, 'cursormiddle@2x.png');
          if (!result2x.success) {
            return result2x;
          }
        } else {
          imageService.deleteImageFromSkin(skinFolderPath, 'cursormiddle@2x.png');
        }
      } else {
        // cursormiddle を削除して cursortrail を作成
        imageService.deleteImageFromSkin(skinFolderPath, 'cursormiddle.png');
        imageService.deleteImageFromSkin(skinFolderPath, 'cursormiddle@2x.png');

        const result = imageService.saveImageToSkin(resizedBuffer, skinFolderPath, 'cursortrail.png');
        if (!result.success) {
          return result;
        }

        if (use2x) {
          const result2x = imageService.saveImageToSkin(resizedBuffer, skinFolderPath, 'cursortrail@2x.png');
          if (!result2x.success) {
            return result2x;
          }
        } else {
          imageService.deleteImageFromSkin(skinFolderPath, 'cursortrail@2x.png');
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to apply cursor trail:', error);
      return { success: false, error: 'カーソルトレイルの適用に失敗しました' };
    }
  }

  /**
   * 現在のスキンからカーソル画像を読み込む
   */
  getCurrentSkinCursor(): { cursor: string | null; cursorTrail: string | null; cursorMiddle: string | null } {
    const configService = getConfigService();
    const osuFolderService = getOsuFolderService();
    const imageService = getImageService();

    const osuFolder = configService.getOsuFolder();
    const currentSkin = configService.getCurrentSkin();
    const lazerMode = configService.getLazerMode();
    const lazerSkinPath = configService.getLazerSkinPath();

    if (!lazerMode && (!osuFolder || !currentSkin)) {
      return { cursor: null, cursorTrail: null, cursorMiddle: null };
    }

    if (lazerMode && !lazerSkinPath) {
      return { cursor: null, cursorTrail: null, cursorMiddle: null };
    }

    const skinFolderPath = lazerMode ? lazerSkinPath : osuFolderService.getSkinFolderPath(osuFolder, currentSkin);

    const cursorPath = path.join(skinFolderPath, 'cursor.png');
    const trailPath = path.join(skinFolderPath, 'cursortrail.png');
    const middlePath = path.join(skinFolderPath, 'cursormiddle.png');

    return {
      cursor: fs.existsSync(cursorPath) ? imageService.imageToDataUrl(cursorPath) : null,
      cursorTrail: fs.existsSync(trailPath) ? imageService.imageToDataUrl(trailPath) : null,
      cursorMiddle: fs.existsSync(middlePath) ? imageService.imageToDataUrl(middlePath) : null,
    };
  }

  /**
   * 現在のスキンのカーソルをアプリに保存
   */
  async saveCurrentSkinCursor(): Promise<ApplyResult & { savedName?: string }> {
    const configService = getConfigService();
    const osuFolderService = getOsuFolderService();

    const osuFolder = configService.getOsuFolder();
    const currentSkin = configService.getCurrentSkin();
    const lazerMode = configService.getLazerMode();
    const lazerSkinPath = configService.getLazerSkinPath();

    if (!lazerMode && (!osuFolder || !currentSkin)) {
      return { success: false, error: 'osu!フォルダまたはスキンが設定されていません' };
    }

    if (lazerMode && !lazerSkinPath) {
      return { success: false, error: 'Lazerモードでスキンフォルダが設定されていません' };
    }

    const skinFolderPath = lazerMode ? lazerSkinPath : osuFolderService.getSkinFolderPath(osuFolder, currentSkin);
    const cursorPath = path.join(skinFolderPath, 'cursor.png');

    if (!fs.existsSync(cursorPath)) {
      return { success: false, error: 'Current Skinにカーソル画像がありません' };
    }

    try {
      const imageBuffer = fs.readFileSync(cursorPath);
      return this.addCursor(imageBuffer, '', 'cursor');
    } catch (error) {
      console.error('Failed to save current skin cursor:', error);
      return { success: false, error: 'カーソルの保存に失敗しました' };
    }
  }

  /**
   * 現在のスキンのカーソルトレイルをアプリに保存
   */
  async saveCurrentSkinTrail(): Promise<ApplyResult & { savedName?: string }> {
    const configService = getConfigService();
    const osuFolderService = getOsuFolderService();

    const osuFolder = configService.getOsuFolder();
    const currentSkin = configService.getCurrentSkin();
    const lazerMode = configService.getLazerMode();
    const lazerSkinPath = configService.getLazerSkinPath();

    if (!lazerMode && (!osuFolder || !currentSkin)) {
      return { success: false, error: 'osu!フォルダまたはスキンが設定されていません' };
    }

    if (lazerMode && !lazerSkinPath) {
      return { success: false, error: 'Lazerモードでスキンフォルダが設定されていません' };
    }

    const skinFolderPath = lazerMode ? lazerSkinPath : osuFolderService.getSkinFolderPath(osuFolder, currentSkin);
    const trailPath = path.join(skinFolderPath, 'cursortrail.png');
    const middlePath = path.join(skinFolderPath, 'cursormiddle.png');

    let sourcePath: string | null = null;
    let baseName = 'cursortrail';

    if (fs.existsSync(trailPath)) {
      sourcePath = trailPath;
      baseName = 'cursortrail';
    } else if (fs.existsSync(middlePath)) {
      sourcePath = middlePath;
      baseName = 'cursormiddle';
    }

    if (!sourcePath) {
      return { success: false, error: 'Current Skinにトレイル画像がありません' };
    }

    try {
      const imageBuffer = fs.readFileSync(sourcePath);
      return this.addCursorTrail(imageBuffer, '', baseName);
    } catch (error) {
      console.error('Failed to save current skin trail:', error);
      return { success: false, error: 'トレイルの保存に失敗しました' };
    }
  }

  /**
   * カーソル画像を削除
   */
  deleteCursor(presetId: string): boolean {
    // ID形式: cursor-basename (例: cursor-cursor-1)
    const prefix = 'cursor-';
    if (!presetId.startsWith(prefix)) return false;

    const baseName = presetId.substring(prefix.length);
    const filePath = path.join(this.cursorsBasePath, `${baseName}.png`);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    } catch (error) {
      console.error('Failed to delete cursor:', error);
    }
    return false;
  }

  /**
   * カーソルトレイル画像を削除
   */
  deleteCursorTrail(presetId: string): boolean {
    // ID形式: cursortrail-basename (例: cursortrail-cursortrail-1)
    const prefix = 'cursortrail-';
    if (!presetId.startsWith(prefix)) return false;

    const baseName = presetId.substring(prefix.length);
    const filePath = path.join(this.cursorTrailsBasePath, `${baseName}.png`);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    } catch (error) {
      console.error('Failed to delete cursor trail:', error);
    }
    return false;
  }
}

// シングルトンインスタンス
let cursorServiceInstance: CursorService | null = null;

export function getCursorService(): CursorService {
  if (!cursorServiceInstance) {
    cursorServiceInstance = new CursorService();
  }
  return cursorServiceInstance;
}

export default CursorService;
