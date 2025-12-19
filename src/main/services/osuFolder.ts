/**
 * osu! Folder Service - osu!フォルダの検証と現在のスキン取得
 */
import * as fs from 'fs';
import * as path from 'path';
import { shell } from 'electron';

export interface OsuFolderValidationResult {
  valid: boolean;
  error?: string;
  hasOsuExe: boolean;
  hasUserConfig: boolean;
  configFileName?: string;
}

export interface SkinValidationResult {
  valid: boolean;
  error?: string;
  hasSkinIni: boolean;
}

class OsuFolderService {
  /**
   * osu! フォルダを検証する
   * - osu!.exe が存在するか
   * - osu!.[username].cfg が存在するか
   */
  validateOsuFolder(folderPath: string): OsuFolderValidationResult {
    const result: OsuFolderValidationResult = {
      valid: false,
      hasOsuExe: false,
      hasUserConfig: false,
    };

    if (!folderPath || !fs.existsSync(folderPath)) {
      result.error = 'フォルダが存在しません';
      return result;
    }

    // osu!.exe をチェック
    const osuExePath = path.join(folderPath, 'osu!.exe');
    result.hasOsuExe = fs.existsSync(osuExePath);

    if (!result.hasOsuExe) {
      result.error = 'osu!.exe が見つかりません';
      return result;
    }

    // osu!.[username].cfg を検索
    const configFile = this.findUserConfig(folderPath);
    if (configFile) {
      result.hasUserConfig = true;
      result.configFileName = configFile;
    } else {
      result.error = 'osu!.[username].cfg が見つかりません';
      return result;
    }

    result.valid = true;
    return result;
  }

  /**
   * osu!.[username].cfg ファイルを検索
   */
  private findUserConfig(folderPath: string): string | null {
    try {
      const files = fs.readdirSync(folderPath);
      // osu!.*.cfg パターンにマッチするファイルを検索（osu!.cfg は除外）
      const configFile = files.find((file) => {
        return /^osu!\..+\.cfg$/i.test(file) && file.toLowerCase() !== 'osu!.cfg';
      });
      return configFile || null;
    } catch (error) {
      console.error('Failed to search for user config:', error);
      return null;
    }
  }

  /**
   * osu!.[username].cfg から現在のスキン名を取得
   */
  getCurrentSkinFromConfig(osuFolder: string): string | null {
    try {
      const configFile = this.findUserConfig(osuFolder);
      if (!configFile) {
        return null;
      }

      const configPath = path.join(osuFolder, configFile);
      const content = fs.readFileSync(configPath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        // "Skin = スキン名" の形式
        if (trimmed.toLowerCase().startsWith('skin')) {
          const match = trimmed.match(/^skin\s*=\s*(.*)$/i);
          if (match) {
            return match[1].trim();
          }
        }
      }
    } catch (error) {
      console.error('Failed to read current skin from config:', error);
    }
    return null;
  }

  /**
   * スキンフォルダを検証する
   * - skin.ini が存在するか
   */
  validateSkinFolder(skinFolderPath: string): SkinValidationResult {
    const result: SkinValidationResult = {
      valid: false,
      hasSkinIni: false,
    };

    if (!skinFolderPath || !fs.existsSync(skinFolderPath)) {
      result.error = 'スキンフォルダが存在しません';
      return result;
    }

    // skin.ini をチェック
    const skinIniPath = path.join(skinFolderPath, 'skin.ini');
    result.hasSkinIni = fs.existsSync(skinIniPath);

    if (!result.hasSkinIni) {
      result.error = 'skin.ini が見つかりません';
      return result;
    }

    result.valid = true;
    return result;
  }

  /**
   * スキンフォルダの完全パスを取得
   * lazerモードの場合はlazerSkinPathを優先
   */
  getSkinFolderPath(osuFolder: string, skinName: string, lazerSkinPath?: string): string {
    if (lazerSkinPath) {
      return lazerSkinPath;
    }
    return path.join(osuFolder, 'Skins', skinName);
  }

  /**
   * 現在のスキンフォルダパスを取得（Lazerモード対応）
   * Lazerモードの場合はlazerSkinPathを使用、通常は osuFolder/Skins/skinName
   */
  getCurrentSkinFolderPath(osuFolder: string, skinName: string, lazerMode: boolean, lazerSkinPath: string): string | null {
    if (lazerMode && lazerSkinPath) {
      return lazerSkinPath;
    }
    if (osuFolder && skinName) {
      return path.join(osuFolder, 'Skins', skinName);
    }
    return null;
  }

  /**
   * スキン一覧を取得
   */
  getSkinList(osuFolder: string): string[] {
    try {
      const skinsFolder = path.join(osuFolder, 'Skins');
      if (!fs.existsSync(skinsFolder)) {
        return [];
      }

      const entries = fs.readdirSync(skinsFolder, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    } catch (error) {
      console.error('Failed to get skin list:', error);
      return [];
    }
  }

  /**
   * ファイルエクスプローラーでフォルダを開く
   */
  async openInExplorer(folderPath: string): Promise<void> {
    await shell.openPath(folderPath);
  }

  /**
   * スキンフォルダをエクスプローラーで開く
   */
  async openSkinsFolder(osuFolder: string): Promise<void> {
    const skinsPath = path.join(osuFolder, 'Skins');
    if (fs.existsSync(skinsPath)) {
      await this.openInExplorer(skinsPath);
    }
  }
}

// シングルトンインスタンス
let osuFolderServiceInstance: OsuFolderService | null = null;

export function getOsuFolderService(): OsuFolderService {
  if (!osuFolderServiceInstance) {
    osuFolderServiceInstance = new OsuFolderService();
  }
  return osuFolderServiceInstance;
}

export default OsuFolderService;
