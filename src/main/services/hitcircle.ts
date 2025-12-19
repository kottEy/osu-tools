/**
 * HitCircle Service - ヒットサークル画像の管理と適用
 */
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { getImageService } from './image';
import { getConfigService } from './config';
import { getOsuFolderService } from './osuFolder';

const HITCIRCLE_SIZE = 128;
const HITCIRCLE_SIZE_2X = 256;

export interface HitCirclePreset {
  id: string;
  name: string;
  imagePath: string;
  previewUrl: string;
}

export interface NumberPreset {
  id: string;
  name: string;
  numbers: { [key: string]: string | null }; // default-0 ~ default-9
}

export interface ApplyResult {
  success: boolean;
  error?: string;
}

class HitCircleService {
  private hitcircleBasePath: string;
  private hitcircleOverlayBasePath: string;
  private defaultNumbersBasePath: string;
  private currentSkinNumbersCachePath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.hitcircleBasePath = path.join(userDataPath, 'images', 'hitcircle');
    this.hitcircleOverlayBasePath = path.join(userDataPath, 'images', 'hitcircleoverlay');
    this.defaultNumbersBasePath = path.join(userDataPath, 'images', 'default');
    this.currentSkinNumbersCachePath = path.join(userDataPath, 'images', 'current-skin-numbers-cache');
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist(): void {
    [this.hitcircleBasePath, this.hitcircleOverlayBasePath, this.defaultNumbersBasePath, this.currentSkinNumbersCachePath].forEach((p) => {
      if (!fs.existsSync(p)) {
        fs.mkdirSync(p, { recursive: true });
      }
    });
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
   * ヒットサークル画像一覧を取得
   */
  getHitCircleList(): HitCirclePreset[] {
    return this.getPresetList(this.hitcircleBasePath, 'hitcircle');
  }

  /**
   * ヒットサークルオーバーレイ画像一覧を取得
   */
  getHitCircleOverlayList(): HitCirclePreset[] {
    return this.getPresetList(this.hitcircleOverlayBasePath, 'hitcircleoverlay');
  }

  private getPresetList(basePath: string, category: string): HitCirclePreset[] {
    const presets: HitCirclePreset[] = [];

    if (!fs.existsSync(basePath)) {
      return presets;
    }

    // サブフォルダを探索
    const subcategories = fs.readdirSync(basePath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const subcategory of subcategories) {
      const subcategoryPath = path.join(basePath, subcategory);
      const files = fs.readdirSync(subcategoryPath).filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return ext === '.png' && !file.includes('@2x');
      });

      for (const file of files) {
        const filePath = path.join(subcategoryPath, file);
        const imageService = getImageService();
        const previewUrl = imageService.imageToDataUrl(filePath);

        presets.push({
          id: `${category}-${subcategory}-${path.basename(file, '.png')}`,
          name: `${subcategory}/${path.basename(file, '.png')}`,
          imagePath: filePath,
          previewUrl: previewUrl || '',
        });
      }
    }

    return presets;
  }

  /**
   * ヒットサークル画像を追加
   */
  async addHitCircle(imageBuffer: Buffer, subcategory: string, baseName: string): Promise<ApplyResult & { savedName?: string }> {
    const imageService = getImageService();

    if (!imageService.validatePngBuffer(imageBuffer)) {
      return { success: false, error: 'PNG形式のみ対応しています' };
    }

    // 128x128 にリサイズ
    const resizedBuffer = imageService.resizeImageExact(imageBuffer, HITCIRCLE_SIZE, HITCIRCLE_SIZE);

    const result = imageService.saveImage(resizedBuffer, 'hitcircle', subcategory, baseName);
    
    // 保存されたファイル名を抽出
    let savedName: string | undefined;
    if (result.success && result.savedPath) {
      savedName = path.basename(result.savedPath, '.png');
    }
    
    return { success: result.success, error: result.error, savedName };
  }

  /**
   * ヒットサークルオーバーレイ画像を追加
   */
  async addHitCircleOverlay(imageBuffer: Buffer, subcategory: string, baseName: string): Promise<ApplyResult & { savedName?: string }> {
    const imageService = getImageService();

    if (!imageService.validatePngBuffer(imageBuffer)) {
      return { success: false, error: 'PNG形式のみ対応しています' };
    }

    // 128x128 にリサイズ
    const resizedBuffer = imageService.resizeImageExact(imageBuffer, HITCIRCLE_SIZE, HITCIRCLE_SIZE);

    const result = imageService.saveImage(resizedBuffer, 'hitcircleoverlay', subcategory, baseName);
    
    // 保存されたファイル名を抽出
    let savedName: string | undefined;
    if (result.success && result.savedPath) {
      savedName = path.basename(result.savedPath, '.png');
    }
    
    return { success: result.success, error: result.error, savedName };
  }

  /**
   * ヒットサークルをスキンに適用
   */
  async applyHitCircle(imageBuffer: Buffer, use2x: boolean): Promise<ApplyResult> {
    const imageService = getImageService();

    const { skinFolderPath, error } = this.getSkinPath();
    if (!skinFolderPath) {
      return { success: false, error };
    }

    if (!fs.existsSync(skinFolderPath)) {
      return { success: false, error: 'スキンフォルダが見つかりません' };
    }

    if (!imageService.validatePngBuffer(imageBuffer)) {
      return { success: false, error: 'PNG形式のみ対応しています' };
    }

    try {
      // 128x128 にリサイズして保存
      const resized = imageService.resizeImageExact(imageBuffer, HITCIRCLE_SIZE, HITCIRCLE_SIZE);
      const result = imageService.saveImageToSkin(resized, skinFolderPath, 'hitcircle.png');
      if (!result.success) return result;

      if (use2x) {
        // 256x256 にリサイズして @2x 保存
        const resized2x = imageService.resizeImageExact(imageBuffer, HITCIRCLE_SIZE_2X, HITCIRCLE_SIZE_2X);
        const result2x = imageService.saveImageToSkin(resized2x, skinFolderPath, 'hitcircle@2x.png');
        if (!result2x.success) return result2x;
      } else {
        imageService.deleteImageFromSkin(skinFolderPath, 'hitcircle@2x.png');
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to apply hitcircle:', error);
      return { success: false, error: 'ヒットサークルの適用に失敗しました' };
    }
  }

  /**
   * ヒットサークルオーバーレイをスキンに適用
   */
  async applyHitCircleOverlay(imageBuffer: Buffer, use2x: boolean): Promise<ApplyResult> {
    const imageService = getImageService();

    const { skinFolderPath, error } = this.getSkinPath();
    if (!skinFolderPath) {
      return { success: false, error };
    }

    if (!fs.existsSync(skinFolderPath)) {
      return { success: false, error: 'スキンフォルダが見つかりません' };
    }

    if (!imageService.validatePngBuffer(imageBuffer)) {
      return { success: false, error: 'PNG形式のみ対応しています' };
    }

    try {
      // 128x128 にリサイズして保存
      const resized = imageService.resizeImageExact(imageBuffer, HITCIRCLE_SIZE, HITCIRCLE_SIZE);
      const result = imageService.saveImageToSkin(resized, skinFolderPath, 'hitcircleoverlay.png');
      if (!result.success) return result;

      if (use2x) {
        // 256x256 にリサイズして @2x 保存
        const resized2x = imageService.resizeImageExact(imageBuffer, HITCIRCLE_SIZE_2X, HITCIRCLE_SIZE_2X);
        const result2x = imageService.saveImageToSkin(resized2x, skinFolderPath, 'hitcircleoverlay@2x.png');
        if (!result2x.success) return result2x;
      } else {
        imageService.deleteImageFromSkin(skinFolderPath, 'hitcircleoverlay@2x.png');
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to apply hitcircle overlay:', error);
      return { success: false, error: 'ヒットサークルオーバーレイの適用に失敗しました' };
    }
  }

  /**
   * ヒットサークルとオーバーレイを両方適用
   */
  async applyAll(
    hitcircleBuffer: Buffer,
    overlayBuffer: Buffer,
    use2x: boolean,
  ): Promise<ApplyResult> {
    const hitcircleResult = await this.applyHitCircle(hitcircleBuffer, use2x);
    if (!hitcircleResult.success) {
      return hitcircleResult;
    }

    const overlayResult = await this.applyHitCircleOverlay(overlayBuffer, use2x);
    return overlayResult;
  }

  // ========== Number Preset Management ==========

  /**
   * デフォルト数字プリセット一覧を取得
   */
  getNumberPresets(): NumberPreset[] {
    const presets: NumberPreset[] = [];

    if (!fs.existsSync(this.defaultNumbersBasePath)) {
      return presets;
    }

    const presetFolders = fs.readdirSync(this.defaultNumbersBasePath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const presetName of presetFolders) {
      const presetPath = path.join(this.defaultNumbersBasePath, presetName);
      const numbers: { [key: string]: string | null } = {};

      // default-0 ~ default-9 を読み込み
      for (let i = 0; i <= 9; i++) {
        const fileName = `default-${i}.png`;
        const filePath = path.join(presetPath, fileName);
        const imageService = getImageService();

        if (fs.existsSync(filePath)) {
          numbers[`default-${i}`] = imageService.imageToDataUrl(filePath);
        } else {
          numbers[`default-${i}`] = null;
        }

        // @2x version
        const fileName2x = `default-${i}@2x.png`;
        const filePath2x = path.join(presetPath, fileName2x);
        if (fs.existsSync(filePath2x)) {
          numbers[`default-${i}@2x`] = imageService.imageToDataUrl(filePath2x);
        } else {
          numbers[`default-${i}@2x`] = null;
        }
      }

      presets.push({
        id: presetName,
        name: presetName,
        numbers,
      });
    }

    return presets;
  }

  /**
   * 新しい数字プリセットを作成
   */
  createNumberPreset(name: string): ApplyResult {
    // 同一名チェック
    const existingPresets = this.getNumberPresets();
    if (existingPresets.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return { success: false, error: '同じ名前のプリセットが既に存在します' };
    }

    const presetPath = path.join(this.defaultNumbersBasePath, name);
    try {
      fs.mkdirSync(presetPath, { recursive: true });
      return { success: true };
    } catch (error) {
      console.error('Failed to create number preset:', error);
      return { success: false, error: 'プリセットの作成に失敗しました' };
    }
  }

  /**
   * 数字プリセットに画像を追加
   */
  addNumberToPreset(presetName: string, numberIndex: number, imageBuffer: Buffer, is2x: boolean = false): ApplyResult {
    const imageService = getImageService();

    if (!imageService.validatePngBuffer(imageBuffer)) {
      return { success: false, error: 'PNG形式のみ対応しています' };
    }

    const presetPath = path.join(this.defaultNumbersBasePath, presetName);
    if (!fs.existsSync(presetPath)) {
      return { success: false, error: 'プリセットが見つかりません' };
    }

    const suffix = is2x ? '@2x' : '';
    const fileName = `default-${numberIndex}${suffix}.png`;
    const filePath = path.join(presetPath, fileName);

    try {
      fs.writeFileSync(filePath, imageBuffer);
      return { success: true };
    } catch (error) {
      console.error('Failed to add number to preset:', error);
      return { success: false, error: '画像の追加に失敗しました' };
    }
  }

  /**
   * 数字プリセットを削除
   */
  deleteNumberPreset(presetName: string): boolean {
    const presetPath = path.join(this.defaultNumbersBasePath, presetName);
    try {
      if (fs.existsSync(presetPath)) {
        fs.rmSync(presetPath, { recursive: true, force: true });
        return true;
      }
    } catch (error) {
      console.error('Failed to delete number preset:', error);
    }
    return false;
  }

  /**
   * 数字プリセット名を変更
   */
  renameNumberPreset(oldName: string, newName: string): ApplyResult {
    // 同一名チェック
    const existingPresets = this.getNumberPresets();
    if (existingPresets.some((p) => p.name.toLowerCase() === newName.toLowerCase() && p.name !== oldName)) {
      return { success: false, error: '同じ名前のプリセットが既に存在します' };
    }

    const oldPath = path.join(this.defaultNumbersBasePath, oldName);
    const newPath = path.join(this.defaultNumbersBasePath, newName);

    try {
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        return { success: true };
      }
      return { success: false, error: 'プリセットが見つかりません' };
    } catch (error) {
      console.error('Failed to rename number preset:', error);
      return { success: false, error: 'プリセット名の変更に失敗しました' };
    }
  }

  /**
   * 数字プリセットをスキンに適用
   */
  async applyNumberPreset(presetName: string): Promise<ApplyResult> {
    const { skinFolderPath, error } = this.getSkinPath();
    if (!skinFolderPath) {
      return { success: false, error };
    }

    const presetPath = path.join(this.defaultNumbersBasePath, presetName);

    if (!fs.existsSync(skinFolderPath)) {
      return { success: false, error: 'スキンフォルダが見つかりません' };
    }

    if (!fs.existsSync(presetPath)) {
      return { success: false, error: 'プリセットが見つかりません' };
    }

    try {
      // default-0 ~ default-9 をコピー
      for (let i = 0; i <= 9; i++) {
        const srcFile = path.join(presetPath, `default-${i}.png`);
        const destFile = path.join(skinFolderPath, `default-${i}.png`);

        if (fs.existsSync(srcFile)) {
          fs.copyFileSync(srcFile, destFile);
        }

        // @2x version
        const srcFile2x = path.join(presetPath, `default-${i}@2x.png`);
        const destFile2x = path.join(skinFolderPath, `default-${i}@2x.png`);

        if (fs.existsSync(srcFile2x)) {
          fs.copyFileSync(srcFile2x, destFile2x);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to apply number preset:', error);
      return { success: false, error: '数字プリセットの適用に失敗しました' };
    }
  }

  /**
   * 現在のスキンからヒットサークル画像を読み込む
   */
  getCurrentSkinHitCircle(): { hitcircle: string | null; hitcircleOverlay: string | null } {
    const imageService = getImageService();

    const { skinFolderPath } = this.getSkinPath();
    if (!skinFolderPath) {
      return { hitcircle: null, hitcircleOverlay: null };
    }

    const hitcirclePath = path.join(skinFolderPath, 'hitcircle.png');
    const overlayPath = path.join(skinFolderPath, 'hitcircleoverlay.png');

    return {
      hitcircle: fs.existsSync(hitcirclePath) ? imageService.imageToDataUrl(hitcirclePath) : null,
      hitcircleOverlay: fs.existsSync(overlayPath) ? imageService.imageToDataUrl(overlayPath) : null,
    };
  }

  /**
   * Current Skinの数字画像を一時キャッシュにコピー
   */
  cacheCurrentSkinDefaultNumbers(): ApplyResult {
    console.log('[HitCircleService] cacheCurrentSkinDefaultNumbers called');

    const { skinFolderPath, error } = this.getSkinPath();
    if (!skinFolderPath) {
      return { success: false, error };
    }

    if (!fs.existsSync(skinFolderPath)) {
      return { success: false, error: 'スキンフォルダが見つかりません' };
    }

    // キャッシュフォルダをクリア
    this.clearCurrentSkinNumbersCache();

    // キャッシュフォルダを作成
    if (!fs.existsSync(this.currentSkinNumbersCachePath)) {
      fs.mkdirSync(this.currentSkinNumbersCachePath, { recursive: true });
    }

    try {
      let copiedCount = 0;

      for (let i = 0; i <= 9; i++) {
        // 通常版
        const filePath = path.join(skinFolderPath, `default-${i}.png`);
        if (fs.existsSync(filePath)) {
          const destPath = path.join(this.currentSkinNumbersCachePath, `default-${i}.png`);
          fs.copyFileSync(filePath, destPath);
          copiedCount++;
        }

        // @2x版
        const filePath2x = path.join(skinFolderPath, `default-${i}@2x.png`);
        if (fs.existsSync(filePath2x)) {
          const destPath2x = path.join(this.currentSkinNumbersCachePath, `default-${i}@2x.png`);
          fs.copyFileSync(filePath2x, destPath2x);
          copiedCount++;
        }
      }

      console.log('[HitCircleService] Cached', copiedCount, 'number files');
      return { success: true };
    } catch (error) {
      console.error('Failed to cache current skin numbers:', error);
      return { success: false, error: 'キャッシュの作成に失敗しました' };
    }
  }

  /**
   * Current Skinの数字キャッシュをクリア
   */
  clearCurrentSkinNumbersCache(): void {
    console.log('[HitCircleService] clearCurrentSkinNumbersCache called');
    try {
      if (fs.existsSync(this.currentSkinNumbersCachePath)) {
        fs.rmSync(this.currentSkinNumbersCachePath, { recursive: true, force: true });
      }
      // フォルダを再作成
      fs.mkdirSync(this.currentSkinNumbersCachePath, { recursive: true });
    } catch (error) {
      console.error('Failed to clear current skin numbers cache:', error);
    }
  }

  /**
   * 数字キャッシュが存在するかチェック
   */
  hasCurrentSkinNumbersCache(): boolean {
    if (!fs.existsSync(this.currentSkinNumbersCachePath)) {
      return false;
    }
    const files = fs.readdirSync(this.currentSkinNumbersCachePath);
    return files.length > 0;
  }

  /**
   * 現在のスキンからdefault数字画像を読み込む（キャッシュから）
   */
  getCurrentSkinDefaultNumbers(): { [key: string]: string | null } {
    const imageService = getImageService();

    const numbers: { [key: string]: string | null } = {};

    // default-0 ~ default-9 と @2x を初期化
    for (let i = 0; i <= 9; i++) {
      numbers[`default-${i}`] = null;
      numbers[`default-${i}@2x`] = null;
    }

    // キャッシュが無い場合は作成
    if (!this.hasCurrentSkinNumbersCache()) {
      console.log('[HitCircleService] No cache found, creating cache...');
      const result = this.cacheCurrentSkinDefaultNumbers();
      if (!result.success) {
        console.log('[HitCircleService] Failed to create cache:', result.error);
        return numbers;
      }
    }

    // キャッシュから読み込む
    const cachePath = this.currentSkinNumbersCachePath;
    if (!fs.existsSync(cachePath)) {
      return numbers;
    }

    // default-0.png ~ default-9.png と @2x を読み込む
    for (let i = 0; i <= 9; i++) {
      // 通常版
      const filePath = path.join(cachePath, `default-${i}.png`);
      if (fs.existsSync(filePath)) {
        numbers[`default-${i}`] = imageService.imageToDataUrl(filePath);
      }

      // @2x版
      const filePath2x = path.join(cachePath, `default-${i}@2x.png`);
      if (fs.existsSync(filePath2x)) {
        numbers[`default-${i}@2x`] = imageService.imageToDataUrl(filePath2x);
      }
    }

    return numbers;
  }

  /**
   * Current Skin数字キャッシュをスキンに適用
   */
  async applyCurrentSkinNumbersCache(): Promise<ApplyResult> {
    const { skinFolderPath, error } = this.getSkinPath();
    if (!skinFolderPath) {
      return { success: false, error };
    }

    if (!fs.existsSync(skinFolderPath)) {
      return { success: false, error: 'スキンフォルダが見つかりません' };
    }

    if (!this.hasCurrentSkinNumbersCache()) {
      return { success: false, error: 'キャッシュが見つかりません' };
    }

    try {
      // 既存の数字ファイルを削除
      for (let i = 0; i <= 9; i++) {
        const filePath = path.join(skinFolderPath, `default-${i}.png`);
        const filePath2x = path.join(skinFolderPath, `default-${i}@2x.png`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        if (fs.existsSync(filePath2x)) {
          fs.unlinkSync(filePath2x);
        }
      }

      // キャッシュのファイルをコピー
      const files = fs.readdirSync(this.currentSkinNumbersCachePath);
      for (const file of files) {
        if (file.endsWith('.png')) {
          const srcPath = path.join(this.currentSkinNumbersCachePath, file);
          const destPath = path.join(skinFolderPath, file);
          fs.copyFileSync(srcPath, destPath);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to apply current skin numbers cache:', error);
      return { success: false, error: 'キャッシュからの適用に失敗しました' };
    }
  }

  /**
   * 現在のスキンのヒットサークルをアプリに保存
   */
  async saveCurrentSkinHitCircle(): Promise<ApplyResult & { savedName?: string }> {
    const { skinFolderPath, error } = this.getSkinPath();
    if (!skinFolderPath) {
      return { success: false, error };
    }

    const hitcirclePath = path.join(skinFolderPath, 'hitcircle.png');

    if (!fs.existsSync(hitcirclePath)) {
      return { success: false, error: 'Current Skinにヒットサークル画像がありません' };
    }

    try {
      const imageBuffer = fs.readFileSync(hitcirclePath);
      return this.addHitCircle(imageBuffer, 'saved', 'hitcircle');
    } catch (error) {
      console.error('Failed to save current skin hitcircle:', error);
      return { success: false, error: 'ヒットサークルの保存に失敗しました' };
    }
  }

  /**
   * 現在のスキンのオーバーレイをアプリに保存
   */
  async saveCurrentSkinOverlay(): Promise<ApplyResult & { savedName?: string }> {
    const { skinFolderPath, error } = this.getSkinPath();
    if (!skinFolderPath) {
      return { success: false, error };
    }

    const overlayPath = path.join(skinFolderPath, 'hitcircleoverlay.png');

    if (!fs.existsSync(overlayPath)) {
      return { success: false, error: 'Current Skinにオーバーレイ画像がありません' };
    }

    try {
      const imageBuffer = fs.readFileSync(overlayPath);
      return this.addHitCircleOverlay(imageBuffer, 'saved', 'hitcircleoverlay');
    } catch (error) {
      console.error('Failed to save current skin overlay:', error);
      return { success: false, error: 'オーバーレイの保存に失敗しました' };
    }
  }

  /**
   * 現在のスキンのdefault数字をプリセットとして保存
   */
  async saveCurrentSkinNumbersAsPreset(newPresetName: string): Promise<ApplyResult> {
    const { skinFolderPath, error } = this.getSkinPath();
    if (!skinFolderPath) {
      return { success: false, error };
    }

    // 同一名チェック
    const existingPresets = this.getNumberPresets();
    if (existingPresets.some((p) => p.name.toLowerCase() === newPresetName.toLowerCase())) {
      return { success: false, error: '同じ名前のプリセットが既に存在します' };
    }

    const presetPath = path.join(this.defaultNumbersBasePath, newPresetName);

    try {
      fs.mkdirSync(presetPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create preset folder:', error);
      return { success: false, error: 'プリセットフォルダの作成に失敗しました' };
    }

    try {
      let copiedCount = 0;

      for (let i = 0; i <= 9; i++) {
        // 通常版
        const fileName = `default-${i}.png`;
        const srcPath = path.join(skinFolderPath, fileName);

        if (fs.existsSync(srcPath)) {
          const destPath = path.join(presetPath, fileName);
          fs.copyFileSync(srcPath, destPath);
          copiedCount++;
        }

        // @2x版
        const fileName2x = `default-${i}@2x.png`;
        const srcPath2x = path.join(skinFolderPath, fileName2x);

        if (fs.existsSync(srcPath2x)) {
          const destPath2x = path.join(presetPath, fileName2x);
          fs.copyFileSync(srcPath2x, destPath2x);
        }
      }

      if (copiedCount === 0) {
        fs.rmSync(presetPath, { recursive: true, force: true });
        return { success: false, error: 'コピーできる数字画像がありませんでした' };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to save current skin numbers as preset:', error);
      try {
        fs.rmSync(presetPath, { recursive: true, force: true });
      } catch {}
      return { success: false, error: 'Current Skinの保存に失敗しました' };
    }
  }
}

// シングルトンインスタンス
let hitcircleServiceInstance: HitCircleService | null = null;

export function getHitCircleService(): HitCircleService {
  if (!hitcircleServiceInstance) {
    hitcircleServiceInstance = new HitCircleService();
  }
  return hitcircleServiceInstance;
}

export default HitCircleService;
