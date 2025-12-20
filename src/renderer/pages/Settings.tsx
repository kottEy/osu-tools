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
  const [version, setVersion] = useState<string>('v1.0.3');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const config = await window.electron.ipcRenderer.invoke('config:get') as any;
      if (config.osuFolder) {
        setOsuPath(config.osuFolder);
        setPathStatus('valid');
      }
      setVersion(config.version || 'v1.0.0');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handlePathChange = (value: string) => {
    setOsuPath(value);
    setPathStatus('idle');
  };

  const handleBrowse = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('dialog:selectFolder', {
        title: 'osu!フォルダを選択',
        defaultPath: osuPath || undefined,
      }) as { success: boolean; path?: string; canceled?: boolean };

      if (result.success && result.path) {
        setOsuPath(result.path);
        await validateAndSavePath(result.path);
      }
    } catch (error) {
      console.error('Failed to browse folder:', error);
    }
  };

  const validateAndSavePath = async (path: string) => {
    setIsLoading(true);
    try {
      const result = await window.electron.ipcRenderer.invoke('config:setOsuFolder', path) as {
        success: boolean;
        error?: string;
        currentSkin?: string;
      };

      if (result.success) {
        setPathStatus('valid');
      } else {
        setPathStatus('invalid');
        if (result.error) {
          window.alert(result.error);
        }
      }
    } catch (error) {
      console.error('Failed to validate path:', error);
      setPathStatus('invalid');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePath = async () => {
    await validateAndSavePath(osuPath);
  };

  const handleCheckUpdate = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('update:check') as {
        hasUpdate: boolean;
        currentVersion: string;
        latestVersion?: string;
      };

      if (result.hasUpdate) {
        const shouldUpdate = window.confirm(
          `新しいバージョン ${result.latestVersion} が利用可能です。\n更新しますか？`
        );
        if (shouldUpdate) {
          await window.electron.ipcRenderer.invoke('update:download');
        }
      } else {
        window.alert('最新バージョンを使用しています');
      }
    } catch (error) {
      console.error('Failed to check update:', error);
      window.alert('アップデートの確認に失敗しました');
    }
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
              disabled={isLoading}
            />
            <Button onClick={handleBrowse} disabled={isLoading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, marginRight: 6 }}>
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              </svg>
              Browse
            </Button>
            <Button variant="primary" onClick={handleSavePath} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
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
              <span className="about-item__value about-item__value--accent">{version}</span>
            </div>
            <div className="about-item about-item--full">
              <span className="about-item__label">Description</span>
              <span className="about-item__value">A powerful tool for customizing osu! skins with ease</span>
            </div>
          </div>
          <div className="about-actions">
            <Button onClick={handleCheckUpdate}>
              Check for Updates
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
