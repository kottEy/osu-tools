/**
 * Image Service - 画像処理とファイル管理
 */
import * as fs from 'fs';
import * as path from 'path';
import { app, nativeImage } from 'electron';

export interface ImageSaveResult {
  success: boolean;
  error?: string;
  savedPath?: string;
}

export interface ImageResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  exactWidth?: number;
  exactHeight?: number;
}

class ImageService {
  private imagesBasePath: string;

  constructor() {
    // アプリケーションのユーザーデータディレクトリに images フォルダを作成
    this.imagesBasePath = path.join(app.getPath('userData'), 'images');
    this.ensureDirectoryExists(this.imagesBasePath);
  }

  /**
   * ディレクトリが存在しない場合作成
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * PNG ファイルかどうかを検証
   */
  validatePngFile(filePath: string): boolean {
    try {
      const ext = path.extname(filePath).toLowerCase();
      if (ext !== '.png') {
        return false;
      }

      // ファイルヘッダーをチェック (PNG signature)
      const buffer = Buffer.alloc(8);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 8, 0);
      fs.closeSync(fd);

      const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      return pngSignature.every((byte, index) => buffer[index] === byte);
    } catch {
      return false;
    }
  }

  /**
   * バッファから PNG を検証
   */
  validatePngBuffer(buffer: Buffer): boolean {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return pngSignature.every((byte, index) => buffer[index] === byte);
  }

  /**
   * 画像をリサイズする（アスペクト比維持、最大サイズ制限）
   */
  resizeImageKeepAspect(imageBuffer: Buffer, maxSize: number): Buffer {
    const image = nativeImage.createFromBuffer(imageBuffer);
    const size = image.getSize();

    // どちらかが maxSize を超えている場合リサイズ
    if (size.width > maxSize || size.height > maxSize) {
      const ratio = Math.min(maxSize / size.width, maxSize / size.height);
      const newWidth = Math.round(size.width * ratio);
      const newHeight = Math.round(size.height * ratio);
      return image.resize({ width: newWidth, height: newHeight }).toPNG();
    }

    return imageBuffer;
  }

  /**
   * 画像を指定サイズにリサイズする（トリミングなし）
   */
  resizeImageExact(imageBuffer: Buffer, width: number, height: number): Buffer {
    const image = nativeImage.createFromBuffer(imageBuffer);
    return image.resize({ width, height }).toPNG();
  }

  /**
   * 画像を保存（カテゴリ/サブカテゴリ/ファイル名構造）
   */
  saveImage(
    imageBuffer: Buffer,
    category: string,
    subcategory: string,
    baseName: string,
  ): ImageSaveResult {
    try {
      // PNG 検証
      if (!this.validatePngBuffer(imageBuffer)) {
        return { success: false, error: 'PNG形式のみ対応しています' };
      }

      // ディレクトリ作成
      const categoryPath = path.join(this.imagesBasePath, category, subcategory);
      this.ensureDirectoryExists(categoryPath);

      // 自動インクリメントでファイル名を生成
      const fileName = this.generateUniqueFileName(categoryPath, baseName);
      const fullPath = path.join(categoryPath, fileName);

      fs.writeFileSync(fullPath, imageBuffer);

      return { success: true, savedPath: fullPath };
    } catch (error) {
      console.error('Failed to save image:', error);
      return { success: false, error: '画像の保存に失敗しました' };
    }
  }

  /**
   * ユニークなファイル名を生成（自動インクリメント）
   */
  private generateUniqueFileName(dirPath: string, baseName: string): string {
    const ext = '.png';
    let counter = 1;
    let fileName = `${baseName}-${counter}${ext}`;

    while (fs.existsSync(path.join(dirPath, fileName))) {
      counter++;
      fileName = `${baseName}-${counter}${ext}`;
    }

    return fileName;
  }

  /**
   * カテゴリ内の画像一覧を取得
   */
  getImagesInCategory(category: string, subcategory?: string): string[] {
    try {
      const targetPath = subcategory
        ? path.join(this.imagesBasePath, category, subcategory)
        : path.join(this.imagesBasePath, category);

      if (!fs.existsSync(targetPath)) {
        return [];
      }

      return fs.readdirSync(targetPath).filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return ext === '.png' && !fs.statSync(path.join(targetPath, file)).isDirectory();
      });
    } catch (error) {
      console.error('Failed to get images:', error);
      return [];
    }
  }

  /**
   * 画像をスキンフォルダにコピー
   */
  copyImageToSkin(
    sourcePath: string,
    skinFolderPath: string,
    targetFileName: string,
  ): ImageSaveResult {
    try {
      if (!fs.existsSync(sourcePath)) {
        return { success: false, error: 'ソースファイルが見つかりません' };
      }

      const targetPath = path.join(skinFolderPath, targetFileName);
      fs.copyFileSync(sourcePath, targetPath);

      return { success: true, savedPath: targetPath };
    } catch (error) {
      console.error('Failed to copy image:', error);
      return { success: false, error: '画像のコピーに失敗しました' };
    }
  }

  /**
   * バッファから直接スキンフォルダに画像を保存
   */
  saveImageToSkin(
    imageBuffer: Buffer,
    skinFolderPath: string,
    targetFileName: string,
    resizeOptions?: ImageResizeOptions,
  ): ImageSaveResult {
    try {
      if (!this.validatePngBuffer(imageBuffer)) {
        return { success: false, error: 'PNG形式のみ対応しています' };
      }

      let processedBuffer = imageBuffer;

      // リサイズオプションがある場合
      if (resizeOptions) {
        if (resizeOptions.maxWidth || resizeOptions.maxHeight) {
          const maxSize = Math.min(
            resizeOptions.maxWidth || Infinity,
            resizeOptions.maxHeight || Infinity,
          );
          processedBuffer = this.resizeImageKeepAspect(processedBuffer, maxSize);
        } else if (resizeOptions.exactWidth && resizeOptions.exactHeight) {
          processedBuffer = this.resizeImageExact(
            processedBuffer,
            resizeOptions.exactWidth,
            resizeOptions.exactHeight,
          );
        }
      }

      const targetPath = path.join(skinFolderPath, targetFileName);
      fs.writeFileSync(targetPath, processedBuffer);

      return { success: true, savedPath: targetPath };
    } catch (error) {
      console.error('Failed to save image to skin:', error);
      return { success: false, error: '画像の保存に失敗しました' };
    }
  }

  /**
   * スキンフォルダから画像を削除
   */
  deleteImageFromSkin(skinFolderPath: string, fileName: string): boolean {
    try {
      const targetPath = path.join(skinFolderPath, fileName);
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete image:', error);
      return false;
    }
  }

  /**
   * 画像ファイルを読み込む
   */
  readImageFile(filePath: string): Buffer | null {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      return fs.readFileSync(filePath);
    } catch (error) {
      console.error('Failed to read image:', error);
      return null;
    }
  }

  /**
   * 画像をBase64データURLに変換
   */
  imageToDataUrl(filePath: string): string | null {
    const buffer = this.readImageFile(filePath);
    if (!buffer) return null;
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  /**
   * Base64からBufferに変換
   */
  base64ToBuffer(base64Data: string): Buffer {
    // data:image/png;base64, プレフィックスを除去
    const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64, 'base64');
  }

  /**
   * 画像の保存パスを取得
   */
  getImagesBasePath(): string {
    return this.imagesBasePath;
  }
}

// シングルトンインスタンス
let imageServiceInstance: ImageService | null = null;

export function getImageService(): ImageService {
  if (!imageServiceInstance) {
    imageServiceInstance = new ImageService();
  }
  return imageServiceInstance;
}

export default ImageService;
