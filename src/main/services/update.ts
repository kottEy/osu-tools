/**
 * Update Service - アプリケーションのアップデート機能
 */
import { autoUpdater, UpdateCheckResult } from 'electron-updater';
import { app, BrowserWindow } from 'electron';
import log from 'electron-log';
import { getConfigService } from './config';

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseNotes?: string;
}

class UpdateService {
  private mainWindow: BrowserWindow | null = null;

  private formatVersion(version: string): string {
    return version.startsWith('v') ? version : `v${version}`;
  }

  constructor() {
    // ログ設定
    log.transports.file.level = 'info';
    autoUpdater.logger = log;

    // GitHubリリースの設定
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'kottEy',
      repo: 'osu-tools',
    });

    // 自動ダウンロードを無効化（ユーザー確認後にダウンロード）
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    this.setupEventListeners();
  }

  /**
   * メインウィンドウを設定
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * イベントリスナーをセットアップ
   */
  private setupEventListeners(): void {
    autoUpdater.on('checking-for-update', () => {
      this.sendToRenderer('update:checking');
    });

    autoUpdater.on('update-available', (info) => {
      this.sendToRenderer('update:available', {
        version: this.formatVersion(info.version),
        releaseNotes: info.releaseNotes,
      });
    });

    autoUpdater.on('update-not-available', () => {
      this.sendToRenderer('update:not-available');
    });

    autoUpdater.on('download-progress', (progressObj) => {
      this.sendToRenderer('update:download-progress', {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
      });
    });

    autoUpdater.on('update-downloaded', () => {
      this.sendToRenderer('update:downloaded');
    });

    autoUpdater.on('error', (error) => {
      console.error('Update error:', error);
      this.sendToRenderer('update:error', { message: error.message });
    });
  }

  /**
   * レンダラーにメッセージを送信
   */
  private sendToRenderer(channel: string, data?: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * アップデートをチェック
   */
  async checkForUpdates(): Promise<UpdateInfo> {
    // source of truth: app.getVersion() (package.json version)
    const currentVersionRaw = app.getVersion();
    const currentVersion = this.formatVersion(currentVersionRaw);

    try {
      const result: UpdateCheckResult | null = await autoUpdater.checkForUpdates();

      if (result && result.updateInfo) {
        const latestVersionRaw = result.updateInfo.version;
        const hasUpdate = latestVersionRaw !== currentVersionRaw;
        return {
          hasUpdate,
          currentVersion,
          latestVersion: this.formatVersion(latestVersionRaw),
          releaseNotes: typeof result.updateInfo.releaseNotes === 'string'
            ? result.updateInfo.releaseNotes
            : undefined,
        };
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }

    return {
      hasUpdate: false,
      currentVersion,
    };
  }

  /**
   * 起動時のアップデートチェック
   */
  async checkForUpdatesOnStartup(): Promise<void> {
    const configService = getConfigService();
    const updatePrefs = configService.getUpdatePreferences();

    // ignoreUpdates が true の場合はチェックしない
    if (updatePrefs.ignoreUpdates) {
      return;
    }

    const updateInfo = await this.checkForUpdates();

    if (updateInfo.hasUpdate) {
      this.sendToRenderer('update:available-on-startup', {
        currentVersion: updateInfo.currentVersion,
        latestVersion: updateInfo.latestVersion,
        releaseNotes: updateInfo.releaseNotes,
      });
    }
  }

  /**
   * アップデートをダウンロード
   */
  async downloadUpdate(): Promise<void> {
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('Failed to download update:', error);
      throw error;
    }
  }

  /**
   * アップデートをインストールして再起動
   */
  quitAndInstall(): void {
    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * 今後アップデート通知を表示しない設定
   */
  ignoreUpdates(): void {
    const configService = getConfigService();
    configService.setUpdatePreferences({ ignoreUpdates: true });
  }

  /**
   * アップデート通知を再度表示する設定
   */
  enableUpdateNotifications(): void {
    const configService = getConfigService();
    configService.setUpdatePreferences({ ignoreUpdates: false });
  }
}

// シングルトンインスタンス
let updateServiceInstance: UpdateService | null = null;

export function getUpdateService(): UpdateService {
  if (!updateServiceInstance) {
    updateServiceInstance = new UpdateService();
  }
  return updateServiceInstance;
}

export default UpdateService;
