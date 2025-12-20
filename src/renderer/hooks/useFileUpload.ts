/**
 * useFileUpload - ファイルアップロード処理のカスタムフック
 * 
 * ドラッグ&ドロップ、ファイル選択、Base64変換などの共通操作を提供
 */
import { useState, useCallback, useRef } from 'react';

interface UseFileUploadOptions {
  /** 許可されるMIMEタイプ（例: 'image/png'） */
  acceptedTypes?: string[];
  /** エラーメッセージ */
  errorMessage?: string;
  /** ファイル処理コールバック */
  onFileSelected?: (file: File) => Promise<void> | void;
}

interface UseFileUploadReturn {
  /** ファイル入力要素のRef */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** ドラッグ中フラグ */
  isDragActive: boolean;
  /** ファイル入力をクリック */
  openFileDialog: () => void;
  /** ドロップハンドラー */
  handleDrop: (e: React.DragEvent) => void;
  /** ドラッグオーバーハンドラー */
  handleDragOver: (e: React.DragEvent) => void;
  /** ドラッグリーブハンドラー */
  handleDragLeave: (e: React.DragEvent) => void;
  /** ファイル変更ハンドラー */
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** ドラッグエンターハンドラー */
  handleDragEnter: (e: React.DragEvent) => void;
}

/**
 * ファイルをBase64文字列に変換
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * ファイルアップロード機能を提供するフック
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    acceptedTypes = ['image/png'],
    errorMessage = 'PNG形式のみ対応しています',
    onFileSelected,
  } = options;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const validateFile = useCallback((file: File): boolean => {
    if (acceptedTypes.length === 0) return true;
    return acceptedTypes.some((type) => file.type.includes(type.replace('image/', '').replace('audio/', '')));
  }, [acceptedTypes]);

  const processFile = useCallback(async (file: File) => {
    if (!validateFile(file)) {
      window.alert(errorMessage);
      return;
    }

    if (onFileSelected) {
      await onFileSelected(file);
    }
  }, [validateFile, errorMessage, onFileSelected]);

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // 同じファイルを再選択可能にする
    e.currentTarget.value = '';
  }, [processFile]);

  return {
    inputRef,
    isDragActive,
    openFileDialog,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileChange,
    handleDragEnter,
  };
}
