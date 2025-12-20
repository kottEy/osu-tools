/**
 * IPC Handlers Index - すべてのIPCハンドラーをエクスポート
 */
import { BrowserWindow } from 'electron';
import { registerConfigHandlers } from './configHandlers';
import { registerCursorHandlers } from './cursorHandlers';
import { registerHitCircleHandlers } from './hitcircleHandlers';
import { registerHitsoundHandlers } from './hitsoundHandlers';
import { registerDialogHandlers } from './dialogHandlers';
import {
  registerSkinIniHandlers,
  registerUpdateHandlers,
  registerStartupHandlers,
} from './systemHandlers';

/**
 * すべてのIPCハンドラーを登録
 */
export function registerAllIpcHandlers(mainWindow: BrowserWindow): void {
  // 設定関連
  registerConfigHandlers();
  
  // ダイアログ・フォルダ関連（mainWindowが必要）
  registerDialogHandlers(mainWindow);
  
  // 画像編集関連
  registerCursorHandlers();
  registerHitCircleHandlers();
  
  // サウンド関連
  registerHitsoundHandlers();
  
  // システム関連
  registerSkinIniHandlers();
  registerUpdateHandlers(mainWindow);
  registerStartupHandlers();
}

// 個別エクスポート
export { registerConfigHandlers } from './configHandlers';
export { registerCursorHandlers } from './cursorHandlers';
export { registerHitCircleHandlers } from './hitcircleHandlers';
export { registerHitsoundHandlers } from './hitsoundHandlers';
export { registerDialogHandlers } from './dialogHandlers';
export {
  registerSkinIniHandlers,
  registerUpdateHandlers,
  registerStartupHandlers,
} from './systemHandlers';
