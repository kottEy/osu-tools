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
  const [version, setVersion] = useState<string>('v1.0.0');
  const [isLoading, setIsLoading] = useState(false);
  
  // Update states
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'downloading' | 'downloaded' | 'error' | 'no-update'>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [latestVersion, setLatestVersion] = useState<string>('');

  useEffect(() => {
    loadSettings();
    
    // Update event listeners
    const unsubProgress = window.electron.ipcRenderer.on('update:download-progress', (data: any) => {
      setDownloadProgress(data.percent || 0);
    });

    const unsubDownloaded = window.electron.ipcRenderer.on('update:downloaded', () => {
      setUpdateStatus('downloaded');
    });

    const unsubError = window.electron.ipcRenderer.on('update:error', (data: any) => {
      console.error('Update error:', data?.message);
      setUpdateStatus('error');
    });

    return () => {
      unsubProgress();
      unsubDownloaded();
      unsubError();
    };
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
    setUpdateStatus('checking');
    try {
      const result = await window.electron.ipcRenderer.invoke('update:check') as {
        hasUpdate: boolean;
        currentVersion: string;
        latestVersion?: string;
      };

      if (result.hasUpdate) {
        setLatestVersion(result.latestVersion || '');
        const shouldUpdate = window.confirm(
          `新しいバージョン ${result.latestVersion} が利用可能です。\n更新しますか？`
        );
        if (shouldUpdate) {
          setUpdateStatus('downloading');
          setDownloadProgress(0);
          await window.electron.ipcRenderer.invoke('update:download');
        } else {
          setUpdateStatus('idle');
        }
      } else {
        setUpdateStatus('no-update');
        setTimeout(() => setUpdateStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Failed to check update:', error);
      setUpdateStatus('error');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    }
  };

  const handleInstallUpdate = async () => {
    await window.electron.ipcRenderer.invoke('update:install');
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
            {updateStatus === 'idle' && (
              <Button onClick={handleCheckUpdate}>
                Check for Updates
              </Button>
            )}
            
            {updateStatus === 'checking' && (
              <div className="update-status">
                <span className="update-spinner" />
                <span>Checking for updates...</span>
              </div>
            )}
            
            {updateStatus === 'downloading' && (
              <div className="update-status update-status--downloading">
                <div className="update-progress-info">
                  <span className="update-spinner" />
                  <span>Downloading update... {Math.round(downloadProgress)}%</span>
                </div>
                <div className="update-progress-bar">
                  <div 
                    className="update-progress-fill" 
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            {updateStatus === 'downloaded' && (
              <div className="update-status update-status--success">
                <div className="update-downloaded-message">
                  <span className="update-check-icon">✓</span>
                  <span>Update downloaded! Ready to install.</span>
                </div>
                <Button variant="primary" onClick={handleInstallUpdate}>
                  Restart & Install
                </Button>
              </div>
            )}
            
            {updateStatus === 'no-update' && (
              <div className="update-status update-status--info">
                <span className="update-check-icon">✓</span>
                <span>You're using the latest version</span>
              </div>
            )}
            
            {updateStatus === 'error' && (
              <div className="update-status update-status--error">
                <span>Failed to check for updates</span>
                <Button onClick={handleCheckUpdate}>
                  Retry
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Licenses Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 8 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Open Source Licenses
          </CardTitle>
        </CardHeader>
        <CardBody>
          <p className="settings-description">
            This application is built using the following open source software:
          </p>
          <div className="license-list">
            <div className="license-item">
              <div className="license-item__header">
                <span className="license-item__name">Electron</span>
                <span className="license-item__badge">MIT License</span>
              </div>
              <p className="license-item__description">
                Build cross-platform desktop apps with JavaScript, HTML, and CSS.
              </p>
              <a 
                href="https://github.com/electron/electron/blob/main/LICENSE" 
                className="license-item__link"
                onClick={(e) => {
                  e.preventDefault();
                  window.electron.ipcRenderer.invoke('shell:openExternal', 'https://github.com/electron/electron/blob/main/LICENSE');
                }}
              >
                View License →
              </a>
            </div>
            <div className="license-item">
              <div className="license-item__header">
                <span className="license-item__name">Electron React Boilerplate</span>
                <span className="license-item__badge">MIT License</span>
              </div>
              <p className="license-item__description">
                A Foundation for Scalable Cross-Platform Apps with Electron and React.
              </p>
              <a 
                href="https://github.com/electron-react-boilerplate/electron-react-boilerplate/blob/main/LICENSE" 
                className="license-item__link"
                onClick={(e) => {
                  e.preventDefault();
                  window.electron.ipcRenderer.invoke('shell:openExternal', 'https://github.com/electron-react-boilerplate/electron-react-boilerplate/blob/main/LICENSE');
                }}
              >
                View License →
              </a>
            </div>
          </div>
          <div className="license-notice">
            <p>
              MIT License permits reuse within proprietary software provided that all copies include the MIT License terms.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
