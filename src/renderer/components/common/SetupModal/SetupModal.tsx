/**
 * SetupModal - Initial Setup Modal
 * Prompts user to configure osu! folder
 * Premium, Apple-inspired design
 */
import React, { useState, useEffect } from 'react';
import { Button } from '../../ui';
import './SetupModal.css';

interface SetupModalProps {
  isOpen: boolean;
  onComplete: (osuPath: string) => void;
}

export default function SetupModal({ isOpen, onComplete }: SetupModalProps) {
  const [path, setPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger entrance animation
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleBrowse = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('dialog:selectFolder', {
        title: 'Select osu! Folder',
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
      setError('Please select your osu! folder');
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
        setError(result.error || 'Failed to validate folder');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Failed to set osu folder:', err);
    } finally {
      setIsValidating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`setup-modal-overlay ${isVisible ? 'setup-modal-overlay--visible' : ''}`}>
      {/* Ambient glow effects */}
      <div className="setup-modal__ambient-glow setup-modal__ambient-glow--1" />
      <div className="setup-modal__ambient-glow setup-modal__ambient-glow--2" />
      
      <div className={`setup-modal ${isVisible ? 'setup-modal--visible' : ''}`}>
        {/* Glass morphism highlight */}
        <div className="setup-modal__highlight" />
        
        {/* Header with sidebar-style logo */}
        <div className="setup-modal__header">
          <div className="setup-modal__logo">st!</div>
          <div className="setup-modal__header-text">
            <h2 className="setup-modal__title">osu! Skin Editor</h2>
            <p className="setup-modal__subtitle">Skin Customizer</p>
          </div>
        </div>

        <div className="setup-modal__body">
          <p className="setup-modal__description">
            To start editing skins, please select the folder where <span className="setup-modal__highlight-text">osu!</span> is installed.
          </p>

          <div className="setup-modal__input-group">
            <label className="setup-modal__label">
              <span className="setup-modal__dot"></span>
              osu! Folder
            </label>
            <div className="setup-modal__input-row">
              <div className="setup-modal__input-wrapper">
                <input
                  type="text"
                  className="setup-modal__input"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="Select folder..."
                  disabled={isValidating}
                />
                {path && (
                  <span className="setup-modal__input-check">✓</span>
                )}
              </div>
              <Button
                onClick={handleBrowse}
                disabled={isValidating}
                className="setup-modal__browse-btn"
              >
                Browse
              </Button>
            </div>
            <p className="setup-modal__hint">
              <span className="setup-modal__dot setup-modal__dot--small"></span>
              Usually located at <code>C:\Users\[Username]\AppData\Local\osu!</code>
            </p>
          </div>

          {error && (
            <div className="setup-modal__error">
              <span className="setup-modal__error-icon">!</span>
              <span className="setup-modal__error-text">{error}</span>
            </div>
          )}
        </div>

        <div className="setup-modal__footer">
          <div className="setup-modal__footer-hint">
            {path ? 'Ready to go' : 'Please select a folder'}
          </div>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isValidating || !path}
            className={`setup-modal__submit-btn ${isValidating ? 'setup-modal__submit-btn--loading' : ''}`}
          >
            {isValidating ? (
              <>
                <span className="setup-modal__spinner" />
                Validating...
              </>
            ) : (
              <>
                Get Started
                <span className="setup-modal__submit-arrow">→</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
