/**
 * MediaCarouselSection - カルーセル付きメディアセクション
 * 
 * Cursor/HitCircleで共通利用できるカルーセル+アップローダーのコンポーネント
 */
import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Carousel,
  CarouselRow,
  CarouselItem,
  IconButton,
  getVisible,
  Uploader,
  ControlsRow,
  ControlsRowRight,
  TrashButton,
  Toggle,
  Button,
} from '../../ui';
import { useCarousel, useFileUpload, type SlideDirection } from '../../../hooks';
import type { MediaItem } from '../../../types';
import './MediaCarouselSection.css';

export interface MediaCarouselSectionProps {
  /** セクションのタイトル */
  title: string;
  /** カードのアイコンタイプ */
  iconType?: 'default' | 'accent';
  /** メディアアイテム一覧 */
  items: MediaItem[];
  /** 選択中のインデックス */
  selectedIndex: number;
  /** アニメーション中フラグ */
  isAnimating: boolean;
  /** スライド方向 */
  slideDirection: SlideDirection;
  /** 前へ移動 */
  onPrev: () => void;
  /** 次へ移動 */
  onNext: () => void;
  /** ファイル追加 */
  onAdd: (file: File) => Promise<void>;
  /** 削除 */
  onDelete: (index: number) => void;
  /** 適用 */
  onApply: () => void;
  /** Current Skin保存 */
  onSaveCurrentSkin?: () => void;
  /** Current Skin判定 */
  isCurrentSkin: boolean;
  /** Current Skinが存在するか */
  hasCurrentSkin: boolean;
  /** 保存済みフラグ */
  hasSaved?: boolean;
  /** @2x有効フラグ */
  use2x: boolean;
  /** @2x変更 */
  onUse2xChange: (value: boolean) => void;
  /** 適用中フラグ */
  isApplying: boolean;
  /** 保存中フラグ */
  isSaving?: boolean;
  /** ドロップゾーンテキスト */
  dropzoneText?: string;
  /** 追加のトグル */
  additionalToggles?: Array<{
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }>;
  /** 許可されるファイルタイプ */
  acceptedFileTypes?: string;
  /** 追加のコントロール要素 */
  additionalControls?: React.ReactNode;
}

/**
 * カルーセル付きのメディアセクションコンポーネント
 */
export function MediaCarouselSection({
  title,
  iconType,
  items,
  selectedIndex,
  isAnimating,
  slideDirection,
  onPrev,
  onNext,
  onAdd,
  onDelete,
  onApply,
  onSaveCurrentSkin,
  isCurrentSkin,
  hasCurrentSkin,
  hasSaved = false,
  use2x,
  onUse2xChange,
  isApplying,
  isSaving = false,
  dropzoneText = 'Drop image or click to add (PNG only)',
  additionalToggles = [],
  acceptedFileTypes = 'image/png',
  additionalControls,
}: MediaCarouselSectionProps): React.ReactElement {
  const {
    inputRef,
    isDragActive,
    openFileDialog,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileChange,
    handleDragEnter,
  } = useFileUpload({
    acceptedTypes: [acceptedFileTypes],
    onFileSelected: onAdd,
  });

  const currentItem = items[selectedIndex];
  const hasPreview = Boolean(currentItem?.preview);

  return (
    <Card>
      <CardHeader>
        <CardTitle icon={iconType}>{title}</CardTitle>
      </CardHeader>
      <CardBody>
        <CarouselRow>
          <IconButton
            direction="prev"
            onClick={onPrev}
            disabled={isAnimating}
          />
          <Carousel isAnimating={isAnimating}>
            {getVisible(items, selectedIndex).map((it) => (
              <CarouselItem
                key={it.id + it.position}
                item={it}
                position={it.position}
                isAnimating={isAnimating}
                slideDirection={slideDirection}
                showLabel={true}
                currentIndex={selectedIndex}
                totalItems={items.length}
                isCurrentSkin={
                  it.name?.includes('Current Skin') && it.position === 'center'
                }
                hasCurrentSkin={hasCurrentSkin}
              />
            ))}
          </Carousel>
          <IconButton
            direction="next"
            onClick={onNext}
            disabled={isAnimating}
          />
        </CarouselRow>

        <Uploader
          onDrop={handleDrop}
          onClick={openFileDialog}
          isDragActive={isDragActive}
          dropzoneText={dropzoneText}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptedFileTypes}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <ControlsRow>
            {!isCurrentSkin && (
              <TrashButton
                onClick={() => onDelete(selectedIndex)}
                title={`Remove selected ${title.toLowerCase()}`}
              />
            )}
            <ControlsRowRight>
              {isCurrentSkin && !hasSaved && onSaveCurrentSkin && (
                <Button
                  variant="default"
                  onClick={onSaveCurrentSkin}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save to App'}
                </Button>
              )}
              <Toggle
                label="@2x"
                checked={use2x}
                onChange={onUse2xChange}
                labelPosition="right"
                size="sm"
              />
              {additionalToggles.map((toggle) => (
                <Toggle
                  key={toggle.label}
                  label={toggle.label}
                  checked={toggle.checked}
                  onChange={toggle.onChange}
                  labelPosition="right"
                  size="sm"
                />
              ))}
              {additionalControls}
              <Button
                variant="primary"
                onClick={onApply}
                disabled={isApplying || !hasPreview}
              >
                {isApplying ? 'Applying...' : 'Apply'}
              </Button>
            </ControlsRowRight>
          </ControlsRow>
        </Uploader>
      </CardBody>
    </Card>
  );
}

export default MediaCarouselSection;
