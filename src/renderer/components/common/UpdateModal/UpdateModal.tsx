/**
 * UpdateModal - アップデート通知モーダル
 */
import React, { useState } from 'react';
import './UpdateModal.css';

interface UpdateModalProps {
  isOpen: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes?: string;
  onUpdate: () => void;
  onIgnore: () => void;
  onLater: () => void;
}

export default function UpdateModal({
  isOpen,
  currentVersion,
  latestVersion,
  releaseNotes,
  onUpdate,
  onIgnore,
  onLater,
}: UpdateModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  React.useEffect(() => {
    if (!isOpen) return;

    const unsubProgress = window.electron.ipcRenderer.on('update:download-progress', (data: any) => {
      setDownloadProgress(data.percent || 0);
    });

    const unsubDownloaded = window.electron.ipcRenderer.on('update:downloaded', () => {
      // ダウンロード完了後、インストール
      window.electron.ipcRenderer.invoke('update:install');
    });

    return () => {
      unsubProgress();
      unsubDownloaded();
    };
  }, [isOpen]);

  const handleUpdate = async () => {
    setIsDownloading(true);
    try {
      await window.electron.ipcRenderer.invoke('update:download');
    } catch (error) {
      console.error('Failed to download update:', error);
      setIsDownloading(false);
    }
  };

  const handleIgnore = async () => {
    await window.electron.ipcRenderer.invoke('update:ignore');
    onIgnore();
  };

  if (!isOpen) return null;

  return (
    <div className="update-modal-overlay">
      <div className="update-modal">
        <div className="update-modal__header">
          <h2 className="update-modal__title">
            <span className="update-modal__icon">🎉</span>
            新しいバージョンが利用可能です！
          </h2>
        </div>

        <div className="update-modal__body">
          <div className="update-modal__version-info">
            <div className="update-modal__version">
              <span className="update-modal__version-label">現在のバージョン</span>
              <span className="update-modal__version-value">{currentVersion}</span>
            </div>
            <span className="update-modal__arrow">→</span>
            <div className="update-modal__version">
              <span className="update-modal__version-label">新しいバージョン</span>
              <span className="update-modal__version-value update-modal__version-value--new">
                {latestVersion}
              </span>
            </div>
          </div>

          {releaseNotes && (
            <div className="update-modal__notes">
              <h3 className="update-modal__notes-title">更新内容</h3>
              <div className="update-modal__notes-content">{releaseNotes}</div>
            </div>
          )}

          {isDownloading && (
            <div className="update-modal__progress">
              <div className="update-modal__progress-bar">
                <div
                  className="update-modal__progress-fill"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <span className="update-modal__progress-text">
                ダウンロード中... {Math.round(downloadProgress)}%
              </span>
            </div>
          )}
        </div>

        <div className="update-modal__footer">
          {!isDownloading && (
            <>
              <button
                className="update-modal__btn update-modal__btn--secondary"
                onClick={handleIgnore}
              >
                二度と表示しない
              </button>
              <button
                className="update-modal__btn update-modal__btn--secondary"
                onClick={onLater}
              >
                また今度
              </button>
              <button
                className="update-modal__btn update-modal__btn--primary"
                onClick={handleUpdate}
              >
                今すぐ更新
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
