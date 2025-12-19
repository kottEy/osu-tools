/**
 * SetupModal - 初回セットアップモーダル
 * osu!フォルダの設定を促す
 */
import React, { useState } from 'react';
import './SetupModal.css';

interface SetupModalProps {
  isOpen: boolean;
  onComplete: (osuPath: string) => void;
}

export default function SetupModal({ isOpen, onComplete }: SetupModalProps) {
  const [path, setPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleBrowse = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('dialog:selectFolder', {
        title: 'osu!フォルダを選択',
      }) as { success: boolean; path?: string; canceled?: boolean };

      if (result.success && result.path) {
        setPath(result.path);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to open dialog:', err);
    }
  };

  const handleSubmit = async () => {
    if (!path) {
      setError('osu!フォルダを選択してください');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const result = await window.electron.ipcRenderer.invoke('config:setOsuFolder', path) as {
        success: boolean;
        error?: string;
        currentSkin?: string;
      };

      if (result.success) {
        onComplete(path);
      } else {
        setError(result.error || 'フォルダの検証に失敗しました');
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error('Failed to set osu folder:', err);
    } finally {
      setIsValidating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="setup-modal-overlay">
      <div className="setup-modal">
        <div className="setup-modal__header">
          <h2 className="setup-modal__title">
            <span className="setup-modal__icon">🎮</span>
            osu! Skin Tool へようこそ
          </h2>
        </div>

        <div className="setup-modal__body">
          <p className="setup-modal__description">
            スキンの編集を始めるには、osu! がインストールされているフォルダを選択してください。
          </p>

          <div className="setup-modal__input-group">
            <label className="setup-modal__label">osu! フォルダ</label>
            <div className="setup-modal__input-row">
              <input
                type="text"
                className="setup-modal__input"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="C:\Users\...\AppData\Local\osu!"
                disabled={isValidating}
              />
              <button
                className="setup-modal__browse-btn"
                onClick={handleBrowse}
                disabled={isValidating}
              >
                参照
              </button>
            </div>
            <p className="setup-modal__hint">
              通常は <code>C:\Users\[ユーザー名]\AppData\Local\osu!</code> にあります
            </p>
          </div>

          {error && (
            <div className="setup-modal__error">
              <span className="setup-modal__error-icon">⚠️</span>
              {error}
            </div>
          )}
        </div>

        <div className="setup-modal__footer">
          <button
            className="setup-modal__submit-btn"
            onClick={handleSubmit}
            disabled={isValidating || !path}
          >
            {isValidating ? '検証中...' : '設定を完了'}
          </button>
        </div>
      </div>
    </div>
  );
}
