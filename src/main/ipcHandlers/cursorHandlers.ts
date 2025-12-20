/**
 * Cursor IPC Handlers - カーソル関連のIPCハンドラー
 */
import { ipcMain } from 'electron';
import { getCursorService, getImageService } from '../services';

/**
 * カーソル関連のIPCハンドラーを登録
 */
export function registerCursorHandlers(): void {
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
}
