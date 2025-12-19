import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Button,
} from '../components/ui';
import './Settings.css';

/**
 * Settings: アプリケーション設定ページ
 * - osu!フォルダパス設定
 */
export default function Settings() {
  const [osuPath, setOsuPath] = useState<string>('');
  const [pathStatus, setPathStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // 初回起動時にデフォルトパスを設定
  useEffect(() => {
    const savedPath = localStorage.getItem('osuPath');
    if (savedPath) {
      setOsuPath(savedPath);
      setPathStatus('valid');
    }
  }, []);

  const handlePathChange = (value: string) => {
    setOsuPath(value);
    setPathStatus('idle');
  };

  const handleBrowse = async () => {
    // Electron's dialog would be called here via IPC
    const path = window.prompt('Enter osu! folder path:', osuPath);
    if (path) {
      setOsuPath(path);
      validatePath(path);
    }
  };

  const validatePath = (path: string) => {
    // 実際にはElectron IPCでパスの検証を行う
    if (path.includes('osu!') || path.includes('osu')) {
      setPathStatus('valid');
      localStorage.setItem('osuPath', path);
    } else {
      setPathStatus('invalid');
    }
  };

  const handleSavePath = () => {
    validatePath(osuPath);
  };

  const getDefaultPath = () => {
    return 'C:\\Users\\[Username]\\AppData\\Local\\osu!';
  };

  return (
    <div className="settings-page page">
      {/* osu! Path Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 8 }}>
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
            osu! Folder
          </CardTitle>
        </CardHeader>
        <CardBody>
          <p className="settings-description">
            Set the path to your osu! installation folder to enable skin file operations.
          </p>

          <div className="path-input-group">
            <input
              type="text"
              className={`path-input ${pathStatus === 'valid' ? 'path-input--valid' : ''} ${pathStatus === 'invalid' ? 'path-input--invalid' : ''}`}
              value={osuPath}
              onChange={(e) => handlePathChange(e.target.value)}
              placeholder={getDefaultPath()}
            />
            <Button onClick={handleBrowse}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, marginRight: 6 }}>
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              </svg>
              Browse
            </Button>
            <Button variant="primary" onClick={handleSavePath}>
              Save
            </Button>
          </div>

          {pathStatus === 'valid' && (
            <div className="path-status path-status--success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Valid osu! folder detected
            </div>
          )}

          {pathStatus === 'invalid' && (
            <div className="path-status path-status--error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Could not find osu! installation at this path
            </div>
          )}

          <div className="path-hint">
            <span className="path-hint__label">Default location:</span>
            <code className="path-hint__code">{getDefaultPath()}</code>
          </div>
        </CardBody>
      </Card>

      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 8 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            About
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="about-info">
            <div className="about-item">
              <span className="about-item__label">Application</span>
              <span className="about-item__value">osu! Skin Tool</span>
            </div>
            <div className="about-item">
              <span className="about-item__label">Version</span>
              <span className="about-item__value about-item__value--accent">v1.0.0</span>
            </div>
            <div className="about-item about-item--full">
              <span className="about-item__label">Description</span>
              <span className="about-item__value">A powerful tool for customizing osu! skins with ease</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
