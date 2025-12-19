/**
 * Services Index - すべてのサービスをエクスポート
 */

export { getConfigService, type AppConfig } from './config';
export {
  getOsuFolderService,
  type OsuFolderValidationResult,
  type SkinValidationResult,
} from './osuFolder';
export { getImageService, type ImageSaveResult, type ImageResizeOptions } from './image';
export { getCursorService, type CursorPreset, type ApplyResult } from './cursor';
export {
  getHitCircleService,
  type HitCirclePreset,
  type NumberPreset as HitCircleNumberPreset,
} from './hitcircle';
export {
  getHitsoundService,
  type HitsoundPreset,
  type HitsoundFile,
  type HitsoundType,
  type HitsoundSound,
} from './hitsound';
export {
  getSkinIniService,
  type SkinIni,
  type SkinGeneral,
  type SkinColours,
  type SkinFonts,
} from './skinIni';
export { getUpdateService, type UpdateInfo } from './update';
