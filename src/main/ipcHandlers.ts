/**
 * IPC Handlers - メインプロセスとレンダラープロセス間の通信
 */
import { ipcMain, dialog, BrowserWindow } from 'electron';
import {
  getConfigService,
  getOsuFolderService,
  getCursorService,
  getHitCircleService,
  getHitsoundService,
  getSkinIniService,
  getUpdateService,
  getImageService,
} from './services';

/**
 * すべてのIPCハンドラーを登録
 */
export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // Update Service にメインウィンドウを設定
  const updateService = getUpdateService();
  updateService.setMainWindow(mainWindow);

  // ========== Config IPC ==========
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

  // ========== Cursor IPC ==========
  ipcMain.handle('cursor:getList', async () => {
    const cursorService = getCursorService();
    return cursorService.getCursorList();
  });

  ipcMain.handle('cursor:getTrailList', async () => {
    const cursorService = getCursorService();
    return cursorService.getCursorTrailList();
  });

  ipcMain.handle('cursor:add', async (_, imageBase64: string, subcategory: string, baseName: string) => {
    const cursorService = getCursorService();
    const imageService = getImageService();
    const buffer = imageService.base64ToBuffer(imageBase64);
    return cursorService.addCursor(buffer, subcategory, baseName);
  });

  ipcMain.handle('cursor:addTrail', async (_, imageBase64: string, subcategory: string, baseName: string) => {
    const cursorService = getCursorService();
    const imageService = getImageService();
    const buffer = imageService.base64ToBuffer(imageBase64);
    return cursorService.addCursorTrail(buffer, subcategory, baseName);
  });

  ipcMain.handle('cursor:apply', async (_, imageBase64: string, use2x: boolean) => {
    const cursorService = getCursorService();
    const imageService = getImageService();
    const buffer = imageService.base64ToBuffer(imageBase64);
    return cursorService.applyCursor(buffer, use2x);
  });

  ipcMain.handle('cursor:applyTrail', async (_, imageBase64: string, use2x: boolean, useCursorMiddle: boolean) => {
    const cursorService = getCursorService();
    const imageService = getImageService();
    const buffer = imageService.base64ToBuffer(imageBase64);
    return cursorService.applyCursorTrail(buffer, use2x, useCursorMiddle);
  });

  ipcMain.handle('cursor:getCurrentSkin', async () => {
    const cursorService = getCursorService();
    return cursorService.getCurrentSkinCursor();
  });

  ipcMain.handle('cursor:delete', async (_, presetId: string) => {
    const cursorService = getCursorService();
    return cursorService.deleteCursor(presetId);
  });

  ipcMain.handle('cursor:deleteTrail', async (_, presetId: string) => {
    const cursorService = getCursorService();
    return cursorService.deleteCursorTrail(presetId);
  });

  ipcMain.handle('cursor:saveCurrentSkinCursor', async () => {
    const cursorService = getCursorService();
    return cursorService.saveCurrentSkinCursor();
  });

  ipcMain.handle('cursor:saveCurrentSkinTrail', async () => {
    const cursorService = getCursorService();
    return cursorService.saveCurrentSkinTrail();
  });

  // ========== HitCircle IPC ==========
  ipcMain.handle('hitcircle:getList', async () => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.getHitCircleList();
  });

  ipcMain.handle('hitcircle:getOverlayList', async () => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.getHitCircleOverlayList();
  });

  ipcMain.handle('hitcircle:add', async (_, imageBase64: string, subcategory: string, baseName: string) => {
    const hitcircleService = getHitCircleService();
    const imageService = getImageService();
    const buffer = imageService.base64ToBuffer(imageBase64);
    return hitcircleService.addHitCircle(buffer, subcategory, baseName);
  });

  ipcMain.handle('hitcircle:addOverlay', async (_, imageBase64: string, subcategory: string, baseName: string) => {
    const hitcircleService = getHitCircleService();
    const imageService = getImageService();
    const buffer = imageService.base64ToBuffer(imageBase64);
    return hitcircleService.addHitCircleOverlay(buffer, subcategory, baseName);
  });

  ipcMain.handle('hitcircle:apply', async (_, imageBase64: string, use2x: boolean) => {
    const hitcircleService = getHitCircleService();
    const imageService = getImageService();
    const buffer = imageService.base64ToBuffer(imageBase64);
    return hitcircleService.applyHitCircle(buffer, use2x);
  });

  ipcMain.handle('hitcircle:applyOverlay', async (_, imageBase64: string, use2x: boolean) => {
    const hitcircleService = getHitCircleService();
    const imageService = getImageService();
    const buffer = imageService.base64ToBuffer(imageBase64);
    return hitcircleService.applyHitCircleOverlay(buffer, use2x);
  });

  ipcMain.handle('hitcircle:applyAll', async (_, hitcircleBase64: string, overlayBase64: string, use2x: boolean) => {
    const hitcircleService = getHitCircleService();
    const imageService = getImageService();
    const hitcircleBuffer = imageService.base64ToBuffer(hitcircleBase64);
    const overlayBuffer = imageService.base64ToBuffer(overlayBase64);
    return hitcircleService.applyAll(hitcircleBuffer, overlayBuffer, use2x);
  });

  ipcMain.handle('hitcircle:getCurrentSkin', async () => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.getCurrentSkinHitCircle();
  });

  ipcMain.handle('hitcircle:getCurrentSkinDefaultNumbers', async () => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.getCurrentSkinDefaultNumbers();
  });

  ipcMain.handle('hitcircle:clearCurrentSkinNumbersCache', async () => {
    const hitcircleService = getHitCircleService();
    hitcircleService.clearCurrentSkinNumbersCache();
    return { success: true };
  });

  ipcMain.handle('hitcircle:applyCurrentSkinNumbersCache', async () => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.applyCurrentSkinNumbersCache();
  });

  ipcMain.handle('hitcircle:saveCurrentSkinHitCircle', async () => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.saveCurrentSkinHitCircle();
  });

  ipcMain.handle('hitcircle:saveCurrentSkinOverlay', async () => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.saveCurrentSkinOverlay();
  });

  ipcMain.handle('hitcircle:saveCurrentSkinNumbersAsPreset', async (_, newPresetName: string) => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.saveCurrentSkinNumbersAsPreset(newPresetName);
  });

  // Number Presets
  ipcMain.handle('hitcircle:getNumberPresets', async () => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.getNumberPresets();
  });

  ipcMain.handle('hitcircle:createNumberPreset', async (_, name: string) => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.createNumberPreset(name);
  });

  ipcMain.handle('hitcircle:addNumberToPreset', async (
    _,
    presetName: string,
    numberIndex: number,
    imageBase64: string,
    is2x: boolean,
  ) => {
    const hitcircleService = getHitCircleService();
    const imageService = getImageService();
    const buffer = imageService.base64ToBuffer(imageBase64);
    return hitcircleService.addNumberToPreset(presetName, numberIndex, buffer, is2x);
  });

  ipcMain.handle('hitcircle:deleteNumberPreset', async (_, presetName: string) => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.deleteNumberPreset(presetName);
  });

  ipcMain.handle('hitcircle:renameNumberPreset', async (_, oldName: string, newName: string) => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.renameNumberPreset(oldName, newName);
  });

  ipcMain.handle('hitcircle:applyNumberPreset', async (_, presetName: string) => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.applyNumberPreset(presetName);
  });

  ipcMain.handle('hitcircle:updateNumberPresetImage', async (
    _,
    presetId: string,
    numberKey: string,
    imageBase64: string,
  ) => {
    const hitcircleService = getHitCircleService();
    const imageService = getImageService();
    const buffer = imageService.base64ToBuffer(imageBase64);
    // numberKey は 'default-0' ~ 'default-9' の形式
    const numberIndex = parseInt(numberKey.replace('default-', ''), 10);
    return hitcircleService.addNumberToPreset(presetId, numberIndex, buffer, false);
  });

  // ========== Hitsound IPC ==========
  ipcMain.handle('hitsound:getPresets', async () => {
    const hitsoundService = getHitsoundService();
    const presets = hitsoundService.getPresets();
    
    // フロントエンドが期待する形式に変換
    const formattedPresets = presets.map((preset) => ({
      id: preset.id,
      name: preset.name,
      hitsounds: preset.hitsounds.map((hs) => ({
        type: hs.type,
        sound: hs.sound,
        file: null,
        preview: hs.filePath ? `${hs.type}-${hs.sound}${hs.extension}` : null,
        isCurrentSkin: false,
      })),
    }));
    
    return { success: true, presets: formattedPresets };
  });

  ipcMain.handle('hitsound:createPreset', async (_, name: string) => {
    const hitsoundService = getHitsoundService();
    return hitsoundService.createPreset(name);
  });

  ipcMain.handle('hitsound:addToPreset', async (
    _,
    presetName: string,
    type: string,
    sound: string,
    audioBase64: string,
    extension: string,
  ) => {
    const hitsoundService = getHitsoundService();
    // Base64をバッファに変換
    const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    return hitsoundService.addHitsoundToPreset(
      presetName,
      type as any,
      sound as any,
      buffer,
      extension,
    );
  });

  ipcMain.handle('hitsound:removeFromPreset', async (
    _,
    presetName: string,
    type: string,
    sound: string,
  ) => {
    const hitsoundService = getHitsoundService();
    return hitsoundService.removeHitsoundFromPreset(presetName, type as any, sound as any);
  });

  ipcMain.handle('hitsound:deletePreset', async (_, presetName: string) => {
    const hitsoundService = getHitsoundService();
    return hitsoundService.deletePreset(presetName);
  });

  ipcMain.handle('hitsound:saveCurrentSkinAsPreset', async (_, newPresetName: string) => {
    const hitsoundService = getHitsoundService();
    return hitsoundService.saveCurrentSkinAsPreset(newPresetName);
  });

  ipcMain.handle('hitsound:renamePreset', async (_, oldName: string, newName: string) => {
    const hitsoundService = getHitsoundService();
    return hitsoundService.renamePreset(oldName, newName);
  });

  ipcMain.handle('hitsound:applyPreset', async (_, presetName: string) => {
    const hitsoundService = getHitsoundService();
    return hitsoundService.applyPreset(presetName);
  });

  ipcMain.handle('hitsound:apply', async (
    _,
    presetId: string,
    hitsoundData: Array<{
      type: string;
      sound: string;
      base64: string;
      extension: string;
    }>,
  ) => {
    const hitsoundService = getHitsoundService();
    const configService = getConfigService();
    const osuFolderService = getOsuFolderService();

    // Lazerモード対応
    const lazerMode = configService.getLazerMode();
    const lazerSkinPath = configService.getLazerSkinPath();
    const osuFolder = configService.getOsuFolder();
    const currentSkin = configService.getCurrentSkin();

    let skinPath: string;
    if (lazerMode) {
      if (!lazerSkinPath) {
        return { success: false, error: 'Lazerモードでスキンフォルダが設定されていません' };
      }
      skinPath = lazerSkinPath;
    } else {
      if (!osuFolder || !currentSkin) {
        return { success: false, error: 'スキンフォルダが設定されていません' };
      }
      skinPath = osuFolderService.getSkinFolderPath(osuFolder, currentSkin);
    }

    // presetIdが保存されたプリセットの場合は、applyPresetを使用
    if (presetId !== 'current-skin' && hitsoundData.length === 0) {
      // プリセット名で適用を試みる
      const presets = hitsoundService.getPresets();
      const targetPreset = presets.find(p => p.id === presetId || p.name === presetId);
      if (targetPreset) {
        return hitsoundService.applyPreset(targetPreset.name);
      }
    }

    try {
      const fs = require('fs');
      for (const hs of hitsoundData) {
        // Base64をバッファに変換
        const base64Data = hs.base64.replace(/^data:audio\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // ファイル名を生成（例: drum-hitnormal.wav）
        const fileName = `${hs.type}-${hs.sound}.${hs.extension}`;
        const filePath = require('path').join(skinPath, fileName);

        // ファイルを書き込み
        fs.writeFileSync(filePath, buffer);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Failed to apply hitsound:', error);
      return { success: false, error: error.message || 'ヒットサウンドの適用に失敗しました' };
    }
  });

  ipcMain.handle('hitsound:getBase64', async (_, presetName: string, type: string, sound: string) => {
    const hitsoundService = getHitsoundService();
    return hitsoundService.getHitsoundBase64(presetName, type as any, sound as any);
  });

  ipcMain.handle('hitsound:getCurrentSkin', async () => {
    const hitsoundService = getHitsoundService();
    return hitsoundService.getCurrentSkinHitsounds();
  });

  ipcMain.handle('hitsound:getCurrentSkinBase64', async (_, type: string, sound: string) => {
    const hitsoundService = getHitsoundService();
    return hitsoundService.getCurrentSkinHitsoundBase64(type as any, sound as any);
  });

  ipcMain.handle('hitsound:clearCurrentSkinCache', async () => {
    const hitsoundService = getHitsoundService();
    hitsoundService.clearCurrentSkinCache();
    return { success: true };
  });

  ipcMain.handle('hitsound:applyCurrentSkinCache', async () => {
    const hitsoundService = getHitsoundService();
    return hitsoundService.applyCurrentSkinCache();
  });

  // ========== SkinIni IPC ==========
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

  // ========== Update IPC ==========
  ipcMain.handle('update:check', async () => {
    const updateService = getUpdateService();
    return updateService.checkForUpdates();
  });

  ipcMain.handle('update:download', async () => {
    const updateService = getUpdateService();
    await updateService.downloadUpdate();
    return { success: true };
  });

  ipcMain.handle('update:install', async () => {
    const updateService = getUpdateService();
    updateService.quitAndInstall();
    return { success: true };
  });

  ipcMain.handle('update:ignore', async () => {
    const updateService = getUpdateService();
    updateService.ignoreUpdates();
    return { success: true };
  });

  ipcMain.handle('update:enableNotifications', async () => {
    const updateService = getUpdateService();
    updateService.enableUpdateNotifications();
    return { success: true };
  });

  // ========== Startup IPC ==========
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
