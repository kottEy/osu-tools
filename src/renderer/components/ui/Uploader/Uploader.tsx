import React, { ReactNode } from 'react';
import './Uploader.css';

interface UploaderProps {
  children?: ReactNode;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  isDragActive?: boolean;
  dropzoneText?: string;
}

interface ControlsRowProps {
  children: ReactNode;
}

interface TrashButtonProps {
  onClick: () => void;
  title?: string;
}

/**
 * Uploader: ファイルアップロードコンテナ
 * ドラッグ&ドロップとクリックでのアップロードをサポート
 */
export function Uploader({
  children,
  onDrop,
  onClick,
  isDragActive = false,
  dropzoneText = 'Drop image or click to add',
}: UploaderProps) {
  return (
    <div className="uploader">
      <div
        className={`dropzone ${isDragActive ? 'dropzone--active' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={onClick}
      >
        <div className="dropzone__text">{dropzoneText}</div>
      </div>
      {children}
    </div>
  );
}

/**
 * ControlsRow: コントロール領域（左右配置）
 * ゴミ箱ボタンとコントロール類を配置
 */
export function ControlsRow({ children }: ControlsRowProps) {
  return <div className="controls-row">{children}</div>;
}

/**
 * ControlsRowRight: コントロール領域の右側グループ
 */
export function ControlsRowRight({ children }: { children: ReactNode }) {
  return <div className="controls-row__right">{children}</div>;
}

/**
 * TrashButton: アイテム削除ボタン
 */
export function TrashButton({ onClick, title }: TrashButtonProps) {
  return (
    <button className="trash-btn" onClick={onClick} title={title}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    </button>
  );
}
