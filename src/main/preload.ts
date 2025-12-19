/* eslint-disable no-unused-vars */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// IPC チャンネル定義
export type Channels =
  // Config
  | 'config:get'
  | 'config:getOsuFolder'
  | 'config:setOsuFolder'
  | 'config:getCurrentSkin'
  | 'config:refreshCurrentSkin'
  | 'config:setLazerMode'
  | 'config:getVersion'
  // osu! Folder
  | 'osu:validateFolder'
  | 'osu:getSkinList'
  | 'osu:selectSkinFolder'
  | 'osu:selectLazerSkinFolder'
  | 'osu:openSkinsFolder'
  // Dialog
  | 'dialog:selectFolder'
  | 'dialog:selectFile'
  // Cursor
  | 'cursor:getList'
  | 'cursor:getTrailList'
  | 'cursor:add'
  | 'cursor:addTrail'
  | 'cursor:apply'
  | 'cursor:applyTrail'
  | 'cursor:getCurrentSkin'
  | 'cursor:delete'
  | 'cursor:deleteTrail'
  | 'cursor:saveCurrentSkinCursor'
  | 'cursor:saveCurrentSkinTrail'
  // HitCircle
  | 'hitcircle:getList'
  | 'hitcircle:getOverlayList'
  | 'hitcircle:add'
  | 'hitcircle:addOverlay'
  | 'hitcircle:apply'
  | 'hitcircle:applyOverlay'
  | 'hitcircle:applyAll'
  | 'hitcircle:getCurrentSkin'
  | 'hitcircle:delete'
  | 'hitcircle:deleteOverlay'
  | 'hitcircle:getNumberPresets'
  | 'hitcircle:createNumberPreset'
  | 'hitcircle:addNumberToPreset'
  | 'hitcircle:deleteNumberPreset'
  | 'hitcircle:removeNumberFromPreset'
  | 'hitcircle:renameNumberPreset'
  | 'hitcircle:applyNumberPreset'
  | 'hitcircle:updateNumberPresetImage'
  | 'hitcircle:getCurrentSkinDefaultNumbers'
  | 'hitcircle:clearCurrentSkinNumbersCache'
  | 'hitcircle:applyCurrentSkinNumbersCache'
  | 'hitcircle:saveCurrentSkinHitCircle'
  | 'hitcircle:saveCurrentSkinOverlay'
  | 'hitcircle:saveCurrentSkinNumbersAsPreset'
  // Hitsound
  | 'hitsound:getPresets'
  | 'hitsound:createPreset'
  | 'hitsound:addToPreset'
  | 'hitsound:removeFromPreset'
  | 'hitsound:deletePreset'
  | 'hitsound:renamePreset'
  | 'hitsound:applyPreset'
  | 'hitsound:apply'
  | 'hitsound:getBase64'
  | 'hitsound:getCurrentSkin'
  | 'hitsound:getCurrentSkinBase64'
  | 'hitsound:saveCurrentSkinAsPreset'
  | 'hitsound:clearCurrentSkinCache'
  | 'hitsound:applyCurrentSkinCache'
  // SkinIni
  | 'skinini:read'
  | 'skinini:save'
  // Update
  | 'update:check'
  | 'update:download'
  | 'update:install'
  | 'update:ignore'
  | 'update:enableNotifications'
  | 'update:checking'
  | 'update:available'
  | 'update:not-available'
  | 'update:download-progress'
  | 'update:downloaded'
  | 'update:error'
  | 'update:available-on-startup'
  // App
  | 'app:startup';

const electronHandler = {
  ipcRenderer: {
    // 同期メッセージ送信
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    // イベントリスナー登録
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    // 一度だけのイベントリスナー
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    // 非同期呼び出し（handle/invoke パターン）
    invoke(channel: Channels, ...args: unknown[]): Promise<unknown> {
      return ipcRenderer.invoke(channel, ...args);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
