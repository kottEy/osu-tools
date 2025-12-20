/**
 * IPC Handlers - メインプロセスとレンダラープロセス間の通信
 * 
 * 各機能別のハンドラーは ipcHandlers/ ディレクトリに分割されています。
 * このファイルは後方互換性のためのエントリーポイントです。
 */
import { BrowserWindow } from 'electron';
import { registerAllIpcHandlers } from './ipcHandlers/index';

/**
 * すべてのIPCハンドラーを登録
 * 
 * @param mainWindow - メインウィンドウインスタンス
 */
export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  registerAllIpcHandlers(mainWindow);
}

// 個別ハンドラーの再エクスポート
export * from './ipcHandlers/index';
