/**
 * UpdateModal - Update Notification Modal
 * Premium, Apple-inspired design matching the project's design system
 */
import React, { useState, useEffect } from 'react';
import { Button } from '../../ui';
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const unsubProgress = window.electron.ipcRenderer.on('update:download-progress', (data: any) => {
      setDownloadProgress(data.percent || 0);
    });

    const unsubDownloaded = window.electron.ipcRenderer.on('update:downloaded', () => {
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
    <div className={`update-modal-overlay ${isVisible ? 'update-modal-overlay--visible' : ''}`}>
      {/* Ambient glow effects */}
      <div className="update-modal__ambient-glow update-modal__ambient-glow--1" />
      <div className="update-modal__ambient-glow update-modal__ambient-glow--2" />

      <div className={`update-modal ${isVisible ? 'update-modal--visible' : ''}`}>
        {/* Glass morphism highlight */}
        <div className="update-modal__highlight" />

        {/* Header */}
        <div className="update-modal__header">
          <div className="update-modal__icon-wrapper">
            <div className="update-modal__icon-glow" />
            <span className="update-modal__icon">↑</span>
          </div>
          <div className="update-modal__header-text">
            <h2 className="update-modal__title">Update Available</h2>
            <p className="update-modal__subtitle">New version ready to install</p>
          </div>
        </div>

        <div className="update-modal__body">
          {/* Version comparison */}
          <div className="update-modal__version-card">
            <div className="update-modal__version">
              <span className="update-modal__version-label">Current</span>
              <span className="update-modal__version-value">{currentVersion}</span>
            </div>
            <div className="update-modal__version-arrow">
              <span className="update-modal__arrow-icon">→</span>
            </div>
            <div className="update-modal__version update-modal__version--new">
              <span className="update-modal__version-label">Latest</span>
              <span className="update-modal__version-value">{latestVersion}</span>
            </div>
          </div>

          {/* Release notes */}
          {releaseNotes && (
            <div className="update-modal__notes">
              <div className="update-modal__notes-header">
                <span className="update-modal__dot" />
                <span className="update-modal__notes-title">What's New</span>
              </div>
              <div className="update-modal__notes-content">{releaseNotes}</div>
            </div>
          )}

          {/* Download progress */}
          {isDownloading && (
            <div className="update-modal__progress">
              <div className="update-modal__progress-header">
                <span className="update-modal__progress-label">Downloading update...</span>
                <span className="update-modal__progress-percent">{Math.round(downloadProgress)}%</span>
              </div>
              <div className="update-modal__progress-bar">
                <div
                  className="update-modal__progress-fill"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="update-modal__footer">
          {!isDownloading ? (
            <>
              <div className="update-modal__footer-secondary">
                <Button
                  onClick={handleIgnore}
                  className="update-modal__btn-ignore"
                >
                  Don't remind me
                </Button>
                <Button
                  onClick={onLater}
                  className="update-modal__btn-later"
                >
                  Later
                </Button>
              </div>
              <Button
                variant="primary"
                onClick={handleUpdate}
                className="update-modal__btn-update"
              >
                Update Now
                <span className="update-modal__btn-arrow">→</span>
              </Button>
            </>
          ) : (
            <div className="update-modal__downloading-hint">
              <span className="update-modal__spinner" />
              Please wait while downloading...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
