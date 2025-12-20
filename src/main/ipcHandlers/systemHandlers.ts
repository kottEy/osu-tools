/**
 * SkinIni & Update IPC Handlers - skin.iniとアップデート関連のIPCハンドラー
 */
import { ipcMain, BrowserWindow, shell } from 'electron';
import {
  getSkinIniService,
  getUpdateService,
  getConfigService,
  getOsuFolderService,
} from '../services';

/**
 * skin.ini関連のIPCハンドラーを登録
 */
export function registerSkinIniHandlers(): void {
  ipcMain.handle('skinini:read', async () => {
    const skinIniService = getSkinIniService();
    try {
      const data = skinIniService.readSkinIni();
      if (data) {
        return { success: true, data };
      }
      return { success: false, error: 'スキンフォルダが設定されていないか、skin.iniが見つかりません' };
    } catch (error: any) {
      console.error('Failed to read skin.ini:', error);
      return { success: false, error: error.message || 'skin.iniの読み込みに失敗しました' };
    }
  });

  ipcMain.handle('skinini:save', async (_, skinIni: any) => {
    const skinIniService = getSkinIniService();
    return skinIniService.saveSkinIni(skinIni);
  });
}

/**
 * アップデート関連のIPCハンドラーを登録
 */
export function registerUpdateHandlers(mainWindow: BrowserWindow): void {
  // Update Service にメインウィンドウを設定
  const updateService = getUpdateService();
  updateService.setMainWindow(mainWindow);

  ipcMain.handle('update:check', async () => {
    return updateService.checkForUpdates();
  });

  ipcMain.handle('update:download', async () => {
    await updateService.downloadUpdate();
    return { success: true };
  });

  ipcMain.handle('update:install', async () => {
    updateService.quitAndInstall();
    return { success: true };
  });

  ipcMain.handle('update:ignore', async () => {
    updateService.ignoreUpdates();
    return { success: true };
  });

  ipcMain.handle('update:enableNotifications', async () => {
    updateService.enableUpdateNotifications();
    return { success: true };
  });
}

/**
 * スタートアップ関連のIPCハンドラーを登録
 */
export function registerStartupHandlers(): void {
  ipcMain.handle('app:startup', async () => {
    const configService = getConfigService();
    const osuFolderService = getOsuFolderService();
    const updateService = getUpdateService();

    const config = configService.getConfig();
    const needsSetup = !config.osuFolder;

    // osuFolder が設定されている場合は検証
    let isValidOsuFolder = false;
    if (config.osuFolder) {
      const validation = osuFolderService.validateOsuFolder(config.osuFolder);
      isValidOsuFolder = validation.valid;

      // currentSkin を更新
      if (isValidOsuFolder) {
        const currentSkin = osuFolderService.getCurrentSkinFromConfig(config.osuFolder);
        if (currentSkin && currentSkin !== config.currentSkin) {
          configService.setCurrentSkin(currentSkin);
        }
      }
    }

    // アップデートチェック（バックグラウンド）
    if (!config.updatePreferences.ignoreUpdates) {
      updateService.checkForUpdatesOnStartup().catch(console.error);
    }

    return {
      config: configService.getConfig(),
      needsSetup,
      isValidOsuFolder,
    };
  });
}

/**
 * Shell関連のIPCハンドラーを登録
 */
export function registerShellHandlers(): void {
  ipcMain.handle('shell:openExternal', async (_, url: string) => {
    await shell.openExternal(url);
    return { success: true };
  });
}
