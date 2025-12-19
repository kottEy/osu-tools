/**
 * Config Service - アプリケーション設定管理
 */
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface AppConfig {
  osuFolder: string;
  currentSkin: string;
  version: string;
  updatePreferences: {
    ignoreUpdates: boolean;
  };
  lazerMode: boolean;
  lazerSkinPath: string;
}

const DEFAULT_CONFIG: AppConfig = {
  osuFolder: '',
  currentSkin: '',
  version: 'v1.0.0',
  updatePreferences: {
    ignoreUpdates: false,
  },
  lazerMode: false,
  lazerSkinPath: '',
};

class ConfigService {
  private configPath: string;
  private config: AppConfig;

  constructor() {
    // アプリケーションのユーザーデータディレクトリに config.json を保存
    const userDataPath = app.getPath('userData');
    this.configPath = path.join(userDataPath, 'config.json');
    this.config = this.loadConfig();
  }

  /**
   * 設定ファイルを読み込む
   */
  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          updatePreferences: {
            ...DEFAULT_CONFIG.updatePreferences,
            ...parsed.updatePreferences,
          },
        };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
    return { ...DEFAULT_CONFIG };
  }

  /**
   * 設定ファイルを保存する
   */
  private saveConfig(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  /**
   * 全設定を取得
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * osu! フォルダパスを取得
   */
  getOsuFolder(): string {
    return this.config.osuFolder;
  }

  /**
   * osu! フォルダパスを設定
   */
  setOsuFolder(folderPath: string): void {
    this.config.osuFolder = folderPath;
    this.saveConfig();
  }

  /**
   * 現在のスキン名を取得
   */
  getCurrentSkin(): string {
    return this.config.currentSkin;
  }

  /**
   * 現在のスキン名を設定
   */
  setCurrentSkin(skinName: string): void {
    this.config.currentSkin = skinName;
    this.saveConfig();
  }

  /**
   * バージョン情報を取得
   */
  getVersion(): string {
    return this.config.version;
  }

  /**
   * アップデート設定を取得
   */
  getUpdatePreferences(): { ignoreUpdates: boolean } {
    return { ...this.config.updatePreferences };
  }

  /**
   * アップデート設定を更新
   */
  setUpdatePreferences(prefs: Partial<{ ignoreUpdates: boolean }>): void {
    this.config.updatePreferences = {
      ...this.config.updatePreferences,
      ...prefs,
    };
    this.saveConfig();
  }

  /**
   * 設定をリセット
   */
  resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
  }

  /**
   * Lazerモードを取得
   */
  getLazerMode(): boolean {
    return this.config.lazerMode;
  }

  /**
   * Lazerモードを設定
   */
  setLazerMode(enabled: boolean): void {
    this.config.lazerMode = enabled;
    this.saveConfig();
  }

  /**
   * LazerスキンPathを取得
   */
  getLazerSkinPath(): string {
    return this.config.lazerSkinPath;
  }

  /**
   * LazerスキンPathを設定
   */
  setLazerSkinPath(skinPath: string): void {
    this.config.lazerSkinPath = skinPath;
    this.saveConfig();
  }
}

// シングルトンインスタンス
let configServiceInstance: ConfigService | null = null;

export function getConfigService(): ConfigService {
  if (!configServiceInstance) {
    configServiceInstance = new ConfigService();
  }
  return configServiceInstance;
}

export default ConfigService;
