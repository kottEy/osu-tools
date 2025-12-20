/**
 * Hitsound IPC Handlers - ヒットサウンド関連のIPCハンドラー
 */
import { ipcMain } from 'electron';
import {
  getHitsoundService,
  getConfigService,
  getOsuFolderService,
} from '../services';
import type { HitsoundType, HitsoundSound } from '../services';

/**
 * ヒットサウンド関連のIPCハンドラーを登録
 */
export function registerHitsoundHandlers(): void {
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
      type as HitsoundType,
      sound as HitsoundSound,
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
    return hitsoundService.removeHitsoundFromPreset(
      presetName,
      type as HitsoundType,
      sound as HitsoundSound
    );
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
      const presets = hitsoundService.getPresets();
      const targetPreset = presets.find(p => p.id === presetId || p.name === presetId);
      if (targetPreset) {
        return hitsoundService.applyPreset(targetPreset.name);
      }
    }

    try {
      const fs = require('fs');
      const path = require('path');
      
      for (const hs of hitsoundData) {
        // Base64をバッファに変換
        const base64Data = hs.base64.replace(/^data:audio\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // ファイル名を生成（例: drum-hitclap.wav）
        const fileName = `${hs.type}-${hs.sound}.${hs.extension}`;
        const filePath = path.join(skinPath, fileName);

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
    return hitsoundService.getHitsoundBase64(
      presetName,
      type as HitsoundType,
      sound as HitsoundSound
    );
  });

  ipcMain.handle('hitsound:getCurrentSkin', async () => {
    const hitsoundService = getHitsoundService();
    return hitsoundService.getCurrentSkinHitsounds();
  });

  ipcMain.handle('hitsound:getCurrentSkinBase64', async (_, type: string, sound: string) => {
    const hitsoundService = getHitsoundService();
    return hitsoundService.getCurrentSkinHitsoundBase64(
      type as HitsoundType,
      sound as HitsoundSound
    );
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
}
