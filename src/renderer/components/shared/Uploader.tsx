import React, { ReactNode } from 'react';
import './Uploader.css';

interface UploaderProps {
  children?: ReactNode;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  isDragActive?: boolean;
  dropzoneText?: string;
}

interface UploaderControlsProps {
  children: ReactNode;
}

interface TrashButtonProps {
  onClick: () => void;
  title?: string;
}

/**
 * Uploader: ファイルアップロードコンテナ
 * ドラッグ&ドロップとクリックでのアップロードをサポート
 * 注: UploaderControls、UploaderControlsRight、TrashButton、Checkbox、Button は独立して使用可能
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
        className={`dropzone ${isDragActive ? 'active' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={onClick}
      >
        <div className="dropzone-text">{dropzoneText}</div>
      </div>
      {children}
    </div>
  );
}

/**
 * ControlsRow: コントロール領域（左右配置）
 * ゴミ箱ボタンとコントロール類を配置
 * 注: ControlsRowRight と組み合わせて使用することが推奨される
 */
export function ControlsRow({ children }: UploaderControlsProps) {
  return <div className="controls-row">{children}</div>;
}

/**
 * ControlsRowRight: コントロール領域の右側グループ
 * 注: Uploader の外でも独立して使用可能
 */
export function ControlsRowRight({ children }: { children: ReactNode }) {
  return <div className="controls-row-right">{children}</div>;
}

/**
 * TrashButton: アイテム削除ボタン
 * 注: Uploader の外でも独立して使用可能
 */
export function TrashButton({ onClick, title }: TrashButtonProps) {
  return (
    <button className="trash-btn" onClick={onClick} title={title}>
      🗑️
    </button>
  );
}

/**
 * Checkbox: ラベル付きチェックボックス
 * 注: Uploader の外でも独立して使用可能
 */
interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <label className="checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

/**
 * Button: 汎用ボタンコンポーネント
 * 注: Uploader の外でも独立して使用可能
 */
interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary';
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  variant = 'default',
  disabled = false,
}: ButtonProps) {
  const className = `btn ${variant === 'primary' ? 'primary' : ''}`;
  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
