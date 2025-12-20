/**
 * HitCircle IPC Handlers - ヒットサークル関連のIPCハンドラー
 */
import { ipcMain } from 'electron';
import { getHitCircleService, getImageService } from '../services';

/**
 * ヒットサークル関連のIPCハンドラーを登録
 */
export function registerHitCircleHandlers(): void {
  // ========== 基本操作 ==========

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

  // ========== 適用操作 ==========

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

  // ========== Current Skin操作 ==========

  ipcMain.handle('hitcircle:getCurrentSkin', async () => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.getCurrentSkinHitCircle();
  });

  ipcMain.handle('hitcircle:delete', async (_, presetId: string) => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.deleteHitCircle(presetId);
  });

  ipcMain.handle('hitcircle:deleteOverlay', async (_, presetId: string) => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.deleteHitCircleOverlay(presetId);
  });

  ipcMain.handle('hitcircle:saveCurrentSkinHitCircle', async () => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.saveCurrentSkinHitCircle();
  });

  ipcMain.handle('hitcircle:saveCurrentSkinOverlay', async () => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.saveCurrentSkinOverlay();
  });

  // ========== 数字関連 ==========

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

  ipcMain.handle('hitcircle:saveCurrentSkinNumbersAsPreset', async (_, newPresetName: string) => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.saveCurrentSkinNumbersAsPreset(newPresetName);
  });

  // ========== Number Presets ==========

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

  ipcMain.handle('hitcircle:removeNumberFromPreset', async (
    _,
    presetId: string,
    numberKey: string,
  ) => {
    const hitcircleService = getHitCircleService();
    return hitcircleService.removeNumberFromPreset(presetId, numberKey);
  });
}
