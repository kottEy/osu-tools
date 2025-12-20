/**
 * Services Index - すべてのサービスをエクスポート
 */

// Base Services
export {
  BaseImageService,
  type ImagePreset,
  type ApplyResult,
  type SaveResult,
  type SkinPathResult,
} from './baseImageService';

// Config & Folder Services
export { getConfigService, type AppConfig } from './config';
export {
  getOsuFolderService,
  type OsuFolderValidationResult,
  type SkinValidationResult,
} from './osuFolder';

// Image Services
export { getImageService, type ImageSaveResult, type ImageResizeOptions } from './image';
export { getCursorService, type CursorPreset } from './cursor';
export {
  getHitCircleService,
  type HitCirclePreset,
  type NumberPreset as HitCircleNumberPreset,
} from './hitcircle';

// Sound Services
export {
  getHitsoundService,
  type HitsoundPreset,
  type HitsoundFile,
  type HitsoundType,
  type HitsoundSound,
} from './hitsound';

// Other Services
export {
  getSkinIniService,
  type SkinIni,
  type SkinGeneral,
  type SkinColours,
  type SkinFonts,
} from './skinIni';
export { getUpdateService, type UpdateInfo } from './update';
export { getSeedService } from './seed';
