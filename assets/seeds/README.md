# Seeds Directory

このディレクトリにはアプリにバンドルされるデフォルトプリセットが含まれます。

## ディレクトリ構造

```
seeds/
├── cursor/              # カーソル画像 (.png)
├── cursortrail/         # カーソルトレイル画像 (.png)
├── hitcircle/           # ヒットサークル画像 (.png)
├── overlay/             # ヒットサークルオーバーレイ画像 (.png)
├── default/             # デフォルト数字プリセット
│   ├── default-preset1/ # default-0.png ~ default-9.png
│   └── default-preset2/
└── hitsounds/           # ヒットサウンドプリセット
    ├── default-preset1/ # drum-hitclap.wav, normal-hitnormal.wav など
    └── default-preset2/
```

## ファイル命名規則

### 画像ファイル (cursor, cursortrail, hitcircle, overlay)
- PNG形式のみ対応
- ファイル名は自由（例: `default.png`, `colorful.png`）

### デフォルト数字 (default/)
- `default-0.png` ~ `default-9.png` という命名規則
- PNG形式のみ

### ヒットサウンド (hitsounds/)
- `{type}-{sound}.{ext}` という命名規則
- type: `drum`, `normal`, `soft`
- sound: `hitclap`, `hitfinish`, `hitnormal`, `hitsoft`, `hitwhistle`, `sliderslide`, `slidertick`, `sliderwhistle`
- ext: `wav`, `mp3`, `ogg`
- 例: `drum-hitclap.wav`, `normal-hitnormal.mp3`

## アップデート時の動作

- シードサービスはバージョン管理されており、新しいバージョンがリリースされると自動的に新しいプリセットがコピーされます
- **ユーザーが追加したプリセットは削除されません**（マージ方式）
- 既存のファイルは上書きされません
