/**
 * Config IPC Handlers - 設定関連のIPCハンドラー
 */
import { ipcMain } from 'electron';
import { getConfigService, getOsuFolderService } from '../services';

/**
 * 設定関連のIPCハンドラーを登録
 */
export function registerConfigHandlers(): void {
  ipcMain.handle('config:get', async () => {
    const configService = getConfigService();
    return configService.getConfig();
  });

  ipcMain.handle('config:getOsuFolder', async () => {
    const configService = getConfigService();
    return configService.getOsuFolder();
  });

  ipcMain.handle('config:setOsuFolder', async (_, folderPath: string) => {
    const configService = getConfigService();
    const osuFolderService = getOsuFolderService();

    // フォルダを検証
    const validation = osuFolderService.validateOsuFolder(folderPath);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // フォルダを保存
    configService.setOsuFolder(folderPath);

    // currentSkin を取得して保存
    const currentSkin = osuFolderService.getCurrentSkinFromConfig(folderPath);
    if (currentSkin) {
      configService.setCurrentSkin(currentSkin);
    }

    return { success: true, currentSkin };
  });

  ipcMain.handle('config:getCurrentSkin', async () => {
    const configService = getConfigService();
    return configService.getCurrentSkin();
  });

  ipcMain.handle('config:refreshCurrentSkin', async () => {
    const configService = getConfigService();
    const osuFolderService = getOsuFolderService();

    const osuFolder = configService.getOsuFolder();
    if (!osuFolder) {
      return { success: false, error: 'osu!フォルダが設定されていません' };
    }

    const currentSkin = osuFolderService.getCurrentSkinFromConfig(osuFolder);
    if (currentSkin) {
      configService.setCurrentSkin(currentSkin);
      return { success: true, currentSkin };
    }

    return { success: false, error: 'スキンの取得に失敗しました' };
  });

  ipcMain.handle('config:setLazerMode', async (_, enabled: boolean) => {
    const configService = getConfigService();
    configService.setLazerMode(enabled);
    return { success: true };
  });

  ipcMain.handle('config:getVersion', async () => {
    const configService = getConfigService();
    return configService.getVersion();
  });
}
