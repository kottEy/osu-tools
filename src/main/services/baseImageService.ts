/**
 * BaseImageService - 画像サービスの基底クラス
 * 
 * Cursor/HitCircleサービスで共通する処理を提供
 */
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { getImageService } from './image';
import { getConfigService } from './config';
import { getOsuFolderService } from './osuFolder';

// ============================================================
// 型定義
// ============================================================

export interface ImagePreset {
  id: string;
  name: string;
  imagePath: string;
  previewUrl: string;
}

export interface ApplyResult {
  success: boolean;
  error?: string;
}

export interface SaveResult extends ApplyResult {
  savedName?: string;
  savedPath?: string;
}

export interface SkinPathResult {
  skinFolderPath: string | null;
  error?: string;
}

// ============================================================
// 基底クラス
// ============================================================

/**
 * 画像管理サービスの基底クラス
 * 共通のディレクトリ管理、画像保存、スキンパス取得などを提供
 */
export abstract class BaseImageService {
  protected basePath: string;

  constructor(subFolder: string) {
    const userDataPath = app.getPath('userData');
    this.basePath = path.join(userDataPath, 'images', subFolder);
    this.ensureDirectoryExists(this.basePath);
  }

  /**
   * ディレクトリが存在することを確認（なければ作成）
   */
  protected ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Lazerモード対応のスキンフォルダパスを取得
   */
  protected getSkinPath(): SkinPathResult {
    const configService = getConfigService();
    const osuFolderService = getOsuFolderService();

    const lazerMode = configService.getLazerMode();
    const lazerSkinPath = configService.getLazerSkinPath();
    const osuFolder = configService.getOsuFolder();
    const currentSkin = configService.getCurrentSkin();

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
   * 画像をディレクトリ直下に保存（サブフォルダなし）
   * ユニークなファイル名を自動生成（basename-1.png, basename-2.png, ...）
   */
  protected saveImageDirect(
    imageBuffer: Buffer,
    basePath: string,
    baseName: string,
  ): SaveResult {
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

      return { success: true, savedPath: fullPath, savedName: path.basename(fullPath, '.png') };
    } catch (error) {
      console.error('Failed to save image:', error);
      return { success: false, error: '画像の保存に失敗しました' };
    }
  }

  /**
   * 指定パスの画像プリセット一覧を取得
   */
  protected getPresetList(basePath: string, category: string): ImagePreset[] {
    const presets: ImagePreset[] = [];

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

    const imageService = getImageService();

    for (const file of files) {
      const filePath = path.join(basePath, file);
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
   * プリセットIDからファイルを削除
   */
  protected deletePresetById(presetId: string, prefix: string, basePath: string): boolean {
    if (!presetId.startsWith(prefix)) return false;

    const baseName = presetId.substring(prefix.length);
    const filePath = path.join(basePath, `${baseName}.png`);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    } catch (error) {
      console.error(`Failed to delete preset ${presetId}:`, error);
    }
    return false;
  }

  /**
   * スキンフォルダから画像を読み込んでDataURLに変換
   */
  protected readSkinImageAsDataUrl(skinFolderPath: string, fileName: string): string | null {
    const imageService = getImageService();
    const filePath = path.join(skinFolderPath, fileName);
    
    if (fs.existsSync(filePath)) {
      return imageService.imageToDataUrl(filePath);
    }
    return null;
  }

  /**
   * スキンフォルダから画像をBufferとして読み込み
   */
  protected readSkinImageAsBuffer(skinFolderPath: string, fileName: string): Buffer | null {
    const filePath = path.join(skinFolderPath, fileName);
    
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
    return null;
  }

  /**
   * 画像をスキンフォルダに保存
   */
  protected saveToSkin(
    imageBuffer: Buffer,
    skinFolderPath: string,
    fileName: string,
    use2x: boolean,
    baseFileName?: string,
  ): ApplyResult {
    const imageService = getImageService();

    if (!fs.existsSync(skinFolderPath)) {
      return { success: false, error: 'スキンフォルダが見つかりません' };
    }

    try {
      // 通常版を保存
      const result = imageService.saveImageToSkin(imageBuffer, skinFolderPath, fileName);
      if (!result.success) {
        return result;
      }

      // @2x処理
      const base = baseFileName || fileName.replace('.png', '');
      const fileName2x = `${base}@2x.png`;

      if (use2x) {
        const result2x = imageService.saveImageToSkin(imageBuffer, skinFolderPath, fileName2x);
        if (!result2x.success) {
          return result2x;
        }
      } else {
        // @2x版を削除
        imageService.deleteImageFromSkin(skinFolderPath, fileName2x);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to save to skin:', error);
      return { success: false, error: 'スキンへの保存に失敗しました' };
    }
  }
}
