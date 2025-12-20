/**
 * Seed Service - デフォルトプリセットのシード処理
 * 
 * アプリ初回起動時やアップデート時にデフォルトプリセットをコピーする
 * ユーザーが追加したプリセットは削除しない（マージ方式）
 */
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { getCursorService } from './cursor';
import { getHitCircleService } from './hitcircle';

// シードデータのバージョン（アップデート時に変更）
const SEED_VERSION = '1.0.0';

interface SeedConfig {
  version: string;
  seededPresets: {
    cursor: string[];
    cursortrail: string[];
    hitcircle: string[];
    overlay: string[];
    default: string[];
    hitsounds: string[];
  };
}

class SeedService {
  private userDataPath: string;
  private seedConfigPath: string;
  private assetsPath: string;

  constructor() {
    this.userDataPath = app.getPath('userData');
    this.seedConfigPath = path.join(this.userDataPath, 'seed-config.json');
    
    // アセットパスの設定（パッケージ済みかどうかで切り替え）
    if (app.isPackaged) {
      this.assetsPath = path.join(process.resourcesPath, 'assets', 'seeds');
    } else {
      // 開発環境: app.getAppPath() はプロジェクトルートを返す
      this.assetsPath = path.join(app.getAppPath(), 'assets', 'seeds');
    }
  }

  /**
   * シード設定を読み込む
   */
  private loadSeedConfig(): SeedConfig | null {
    try {
      if (fs.existsSync(this.seedConfigPath)) {
        const data = fs.readFileSync(this.seedConfigPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load seed config:', error);
    }
    return null;
  }

  /**
   * シード設定を保存
   */
  private saveSeedConfig(config: SeedConfig): void {
    try {
      const dir = path.dirname(this.seedConfigPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.seedConfigPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save seed config:', error);
    }
  }

  /**
   * シードが必要かどうかを判定
   */
  needsSeeding(): boolean {
    const config = this.loadSeedConfig();
    if (!config) {
      return true; // 初回起動
    }
    return config.version !== SEED_VERSION; // バージョンが異なる場合はシードが必要
  }

  /**
   * フォルダ内のファイルを再帰的にコピー
   */
  private copyDirectory(src: string, dest: string): void {
    if (!fs.existsSync(src)) {
      return;
    }

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        // 既存ファイルは上書きしない（ユーザーデータ保護）
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  }

  /**
   * 画像系プリセット（cursor, cursortrail, hitcircle, hitcircleoverlay）をシード
   * 各サービスのadd*メソッドを使用して命名規則に従ったファイル名で保存
   */
  private async seedImagePresets(
    category: 'cursor' | 'cursortrail' | 'hitcircle' | 'hitcircleoverlay',
  ): Promise<string[]> {
    const seededPresets: string[] = [];
    const seedPath = path.join(this.assetsPath, category);

    if (!fs.existsSync(seedPath)) {
      console.log(`Seed path not found: ${seedPath}`);
      return seededPresets;
    }

    // シードフォルダ内のPNGファイルをリスト
    const files = fs.readdirSync(seedPath).filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return ext === '.png';
    });

    // カテゴリに応じたサービスとメソッドを取得
    const cursorService = getCursorService();
    const hitcircleService = getHitCircleService();

    for (const file of files) {
      const srcPath = path.join(seedPath, file);
      
      try {
        const imageBuffer = fs.readFileSync(srcPath);
        let result: { success: boolean; savedName?: string; error?: string };

        // カテゴリに応じたaddメソッドを呼び出し
        switch (category) {
          case 'cursor':
            result = await cursorService.addCursor(imageBuffer, '', 'cursor');
            break;
          case 'cursortrail':
            result = await cursorService.addCursorTrail(imageBuffer, '', 'cursortrail');
            break;
          case 'hitcircle':
            result = await hitcircleService.addHitCircle(imageBuffer, '', 'hitcircle');
            break;
          case 'hitcircleoverlay':
            result = await hitcircleService.addHitCircleOverlay(imageBuffer, '', 'hitcircleoverlay');
            break;
        }

        if (result.success && result.savedName) {
          seededPresets.push(result.savedName);
          console.log(`Seeded: ${category}/${result.savedName}`);
        } else if (!result.success) {
          console.error(`Failed to seed ${category}/${file}: ${result.error}`);
        }
      } catch (error) {
        console.error(`Failed to seed ${category}/${file}:`, error);
      }
    }

    return seededPresets;
  }

  /**
   * デフォルト数字プリセットをシード
   */
  private seedDefaultNumberPresets(): string[] {
    const seededPresets: string[] = [];
    const seedPath = path.join(this.assetsPath, 'default');
    const targetBasePath = path.join(this.userDataPath, 'images', 'default');

    if (!fs.existsSync(seedPath)) {
      console.log(`Seed path not found: ${seedPath}`);
      return seededPresets;
    }

    // サブフォルダ（default-preset1, default-preset2, ...）をコピー
    const presetFolders = fs.readdirSync(seedPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const presetName of presetFolders) {
      const srcPresetPath = path.join(seedPath, presetName);
      const destPresetPath = path.join(targetBasePath, presetName);

      // 既存のプリセットフォルダがなければコピー
      if (!fs.existsSync(destPresetPath)) {
        this.copyDirectory(srcPresetPath, destPresetPath);
        seededPresets.push(presetName);
        console.log(`Seeded default number preset: ${presetName}`);
      } else {
        // フォルダは存在するが、ファイルがなければコピー
        const srcFiles = fs.readdirSync(srcPresetPath);
        for (const file of srcFiles) {
          const srcFilePath = path.join(srcPresetPath, file);
          const destFilePath = path.join(destPresetPath, file);
          if (!fs.existsSync(destFilePath) && fs.statSync(srcFilePath).isFile()) {
            fs.copyFileSync(srcFilePath, destFilePath);
          }
        }
      }
    }

    return seededPresets;
  }

  /**
   * ヒットサウンドプリセットをシード
   */
  private seedHitsoundPresets(): string[] {
    const seededPresets: string[] = [];
    const seedPath = path.join(this.assetsPath, 'hitsounds');
    const targetBasePath = path.join(this.userDataPath, 'sounds', 'hitsounds');

    if (!fs.existsSync(seedPath)) {
      console.log(`Seed path not found: ${seedPath}`);
      return seededPresets;
    }

    // サブフォルダ（default-preset1, default-preset2, ...）をコピー
    const presetFolders = fs.readdirSync(seedPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const presetName of presetFolders) {
      const srcPresetPath = path.join(seedPath, presetName);
      const destPresetPath = path.join(targetBasePath, presetName);

      // 既存のプリセットフォルダがなければコピー
      if (!fs.existsSync(destPresetPath)) {
        this.copyDirectory(srcPresetPath, destPresetPath);
        seededPresets.push(presetName);
        console.log(`Seeded hitsound preset: ${presetName}`);
      } else {
        // フォルダは存在するが、ファイルがなければコピー
        const srcFiles = fs.readdirSync(srcPresetPath);
        for (const file of srcFiles) {
          const srcFilePath = path.join(srcPresetPath, file);
          const destFilePath = path.join(destPresetPath, file);
          if (!fs.existsSync(destFilePath) && fs.statSync(srcFilePath).isFile()) {
            fs.copyFileSync(srcFilePath, destFilePath);
          }
        }
      }
    }

    return seededPresets;
  }

  /**
   * 全てのシード処理を実行
   */
  async runSeeding(): Promise<void> {
    console.log('Starting seed process...');
    console.log(`Assets path: ${this.assetsPath}`);

    const config: SeedConfig = {
      version: SEED_VERSION,
      seededPresets: {
        cursor: [],
        cursortrail: [],
        hitcircle: [],
        overlay: [],
        default: [],
        hitsounds: [],
      },
    };

    // 画像系プリセットをシード（サービスのadd*メソッドを使用）
    config.seededPresets.cursor = await this.seedImagePresets('cursor');
    config.seededPresets.cursortrail = await this.seedImagePresets('cursortrail');
    config.seededPresets.hitcircle = await this.seedImagePresets('hitcircle');
    config.seededPresets.overlay = await this.seedImagePresets('hitcircleoverlay');

    // デフォルト数字プリセットをシード
    config.seededPresets.default = this.seedDefaultNumberPresets();

    // ヒットサウンドプリセットをシード
    config.seededPresets.hitsounds = this.seedHitsoundPresets();

    // シード設定を保存
    this.saveSeedConfig(config);

    console.log('Seed process completed.');
    console.log('Seeded presets:', config.seededPresets);
  }

  /**
   * 初期化（アプリ起動時に呼び出し）
   */
  async initialize(): Promise<void> {
    if (this.needsSeeding()) {
      await this.runSeeding();
    } else {
      console.log('Seeding not required (already up to date)');
    }
  }

  /**
   * シードバージョンを取得
   */
  getSeedVersion(): string {
    return SEED_VERSION;
  }

  /**
   * 現在のシード設定を取得
   */
  getSeedConfig(): SeedConfig | null {
    return this.loadSeedConfig();
  }
}

// シングルトンインスタンス
let seedServiceInstance: SeedService | null = null;

export function getSeedService(): SeedService {
  if (!seedServiceInstance) {
    seedServiceInstance = new SeedService();
  }
  return seedServiceInstance;
}

export default SeedService;
