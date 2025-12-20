/**
 * Dialog & OSU Folder IPC Handlers - ダイアログとフォルダ関連のIPCハンドラー
 */
import { ipcMain, dialog, BrowserWindow } from 'electron';
import { getConfigService, getOsuFolderService } from '../services';

/**
 * ダイアログとosu!フォルダ関連のIPCハンドラーを登録
 */
export function registerDialogHandlers(mainWindow: BrowserWindow): void {
  // ========== osu! Folder IPC ==========

  ipcMain.handle('osu:validateFolder', async (_, folderPath: string) => {
    const osuFolderService = getOsuFolderService();
    return osuFolderService.validateOsuFolder(folderPath);
  });

  ipcMain.handle('osu:getSkinList', async () => {
    const configService = getConfigService();
    const osuFolderService = getOsuFolderService();

    const osuFolder = configService.getOsuFolder();
    if (!osuFolder) {
      return [];
    }

    return osuFolderService.getSkinList(osuFolder);
  });

  ipcMain.handle('osu:selectSkinFolder', async () => {
    const configService = getConfigService();
    const osuFolderService = getOsuFolderService();

    const osuFolder = configService.getOsuFolder();
    if (!osuFolder) {
      return { success: false, error: 'osu!フォルダが設定されていません' };
    }

    const skinsPath = `${osuFolder}\\Skins`;

    const result = await dialog.showOpenDialog(mainWindow, {
      defaultPath: skinsPath,
      properties: ['openDirectory'],
      title: 'スキンフォルダを選択',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const selectedPath = result.filePaths[0];
    const validation = osuFolderService.validateSkinFolder(selectedPath);

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // フォルダ名をスキン名として取得
    const skinName = selectedPath.split('\\').pop() || selectedPath.split('/').pop();
    if (skinName) {
      configService.setCurrentSkin(skinName);
      return { success: true, currentSkin: skinName };
    }

    return { success: false, error: 'スキン名の取得に失敗しました' };
  });

  // Lazerモード用: 任意の場所からスキンフォルダを選択
  ipcMain.handle('osu:selectLazerSkinFolder', async () => {
    const configService = getConfigService();
    const osuFolderService = getOsuFolderService();

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'スキンフォルダを選択（Lazer Mode）',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const selectedPath = result.filePaths[0];
    
    // skin.ini の存在チェック
    const validation = osuFolderService.validateSkinFolder(selectedPath);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // フォルダ名をスキン名として取得し、フルパスを保存
    const skinName = selectedPath.split('\\').pop() || selectedPath.split('/').pop();
    if (skinName) {
      configService.setLazerSkinPath(selectedPath);
      configService.setCurrentSkin(skinName);
      return { success: true, currentSkin: skinName };
    }

    return { success: false, error: 'スキン名の取得に失敗しました' };
  });

  ipcMain.handle('osu:openSkinsFolder', async () => {
    const configService = getConfigService();
    const osuFolderService = getOsuFolderService();

    const osuFolder = configService.getOsuFolder();
    if (!osuFolder) {
      return { success: false, error: 'osu!フォルダが設定されていません' };
    }

    await osuFolderService.openSkinsFolder(osuFolder);
    return { success: true };
  });

  // ========== Dialog IPC ==========

  ipcMain.handle('dialog:selectFolder', async (_, options?: { defaultPath?: string; title?: string }) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      defaultPath: options?.defaultPath,
      properties: ['openDirectory'],
      title: options?.title || 'フォルダを選択',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    return { success: true, path: result.filePaths[0] };
  });

  ipcMain.handle('dialog:selectFile', async (_, options?: {
    defaultPath?: string;
    title?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      defaultPath: options?.defaultPath,
      properties: ['openFile'],
      title: options?.title || 'ファイルを選択',
      filters: options?.filters,
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    return { success: true, path: result.filePaths[0] };
  });
}
