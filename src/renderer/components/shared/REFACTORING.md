# リファクタリング概要

## 実施内容

このリファクタリングでは、`Cursor.tsx` と `HitCircle.tsx` ページの以下を改善しました：

### 1. 共通コンポーネント化

#### 新規作成コンポーネント

**`src/renderer/components/shared/Card.tsx`**

- `Card` - 統一されたカードレイアウト
- `CardHeader` - ヘッダー部分
- `CardBody` - 本体部分
- `CardTitle` - タイトル（アイコン付き）

**`src/renderer/components/shared/Carousel.tsx`**

- `Carousel` - アイテムを表示するコンテナ
- `CarouselRow` - 矢印ボタン＋カルーセルを配置
- `CarouselItem` - 個別のアイテム表示
- `IconButton` - ナビゲーションボタン
- `getVisible()` - 前・現在・次のアイテムを取得するユーティリティ関数
- `MediaItem` 型の統一

**`src/renderer/components/shared/Uploader.tsx`**

- `Uploader` - ドラッグ&ドロップ対応のアップロードエリア
- `UploaderControls` - コントロール領域
- `UploaderControlsRight` - 右側コントロール
- `TrashButton` - 削除ボタン
- `Checkbox` - ラベル付きチェックボックス
- `Button` - 汎用ボタン

### 2. コンポーネント専用スタイルシート

**`src/renderer/components/shared/Card.css`**

- Card レイアウトの基本スタイル
- CardHeader、CardBody、CardTitle のスタイル
- Indicator dot のスタイル

**`src/renderer/components/shared/Carousel.css`**

- Carousel コンテナとアイテムのスタイル
- スライドアニメーション
- ナビゲーションボタン（IconButton）
- 位置ベースのスケーリング（prev/center/next）

**`src/renderer/components/shared/Uploader.css`**

- Uploader コンテナとドラッグ&ドロップゾーン
- ボタンスタイル（Button、TrashButton）
- チェックボックス（Checkbox）
- フォームコントロール

### 3. ページ固有スタイルの最適化

**`cursor.css`**

- ページレイアウト（2列グリッド）
- レスポンシブ設定

**`hitcircle.css`**

- ページレイアウト（フレックス＋グリッド）
- プレビューエリアのスタイル
- レスポンシブ設定

### 4. コード品質改善

#### Cursor.tsx の改善

- 冗長な `prev/next` ユーティリティ関数を削除
- 明確な関数名を使用（`handlePrevCursor`, `handleNextCursor` など）
- JSDoc コメント追加で関数の目的を明確化
- 共有コンポーネントの使用で可読性向上

#### HitCircle.tsx の改善

- 同様のコンポーネント化とドキュメント化
- 関数の目的ごとのコメント追加

## ファイル構造

```
src/renderer/
├── components/
│   └── shared/
│       ├── Card.tsx              (新規)
│       ├── Card.css              (新規)
│       ├── Carousel.tsx          (新規)
│       ├── Carousel.css          (新規)
│       ├── Uploader.tsx          (新規)
│       ├── Uploader.css          (新規)
│       └── REFACTORING.md        (このファイル)
└── pages/
    ├── Cursor.tsx               (更新)
    ├── cursor.css               (更新)
    ├── HitCircle.tsx            (更新)
    └── hitcircle.css            (更新)
```

## メリット

✅ **DRY 原則の適用** - 重複コードを削除
✅ **再利用性向上** - 新しいページでのコンポーネント再利用が容易
✅ **保守性向上** - コンポーネントと CSS が対応関係で管理される
✅ **可読性向上** - JSDoc コメントと命名規則を統一
✅ **スケーラビリティ向上** - CSS を追加する際にコンポーネントごとに管理できる
✅ **スケーラビリティ** - 新機能追加時の工数削減

## 使用方法

### Card コンポーネント

```tsx
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
} from '../components/shared/Card';

<Card>
  <CardHeader>
    <CardTitle icon="accent">Title</CardTitle>
  </CardHeader>
  <CardBody>Content here</CardBody>
</Card>;
```

### Carousel コンポーネント

```tsx
import {
  Carousel,
  CarouselRow,
  CarouselItem,
  IconButton,
  getVisible,
} from '../components/shared/Carousel';

<CarouselRow>
  <IconButton direction="prev" onClick={handlePrev} />
  <Carousel>
    {getVisible(items, selectedIndex).map((item) => (
      <CarouselItem
        key={item.id + item.position}
        item={item}
        position={item.position}
        isAnimating={isAnimating}
        slideDirection={slideDir}
        showLabel={true}
        currentIndex={selectedIndex}
        totalItems={items.length}
      />
    ))}
  </Carousel>
  <IconButton direction="next" onClick={handleNext} />
</CarouselRow>;
```

### Uploader コンポーネント

```tsx
import {
  Uploader,
  UploaderControls,
  TrashButton,
  Checkbox,
  Button,
} from '../components/shared/Uploader';

<Uploader
  onDrop={handleDrop}
  onClick={handleClick}
  isDragActive={isDragActive}
  dropzoneText="Drop image or click to add"
>
  <UploaderControls>
    <TrashButton onClick={handleDelete} />
    <div>
      <Checkbox label="@2x" checked={is2x} onChange={setIs2x} />
      <Button variant="primary">Apply</Button>
    </div>
  </UploaderControls>
</Uploader>;
```

## 今後の拡張案

- `HitSounds.tsx` ページでも同じコンポーネントを使用可能
- `Settings.tsx` で共通ボタン/チェックボックスを統一
- 共有コンポーネントライブラリの構築
