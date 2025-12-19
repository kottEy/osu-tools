import { useState, useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { Header, Sidebar } from './components/layout';
import { SetupModal } from './components/common/SetupModal';
import { UpdateModal } from './components/common/UpdateModal';
import Cursor from './pages/Cursor';
import HitCircle from './pages/HitCircle';
import HitSounds from './pages/HitSounds';
import SkinIniPage from './pages/SkinIni';
import Settings from './pages/Settings';

interface AppConfig {
  osuFolder: string;
  currentSkin: string;
  version: string;
  updatePreferences: {
    ignoreUpdates: boolean;
  };
  lazerMode: boolean;
  lazerSkinPath: string;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [currentSkin, setCurrentSkin] = useState('');
  const [lazerMode, setLazerMode] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    currentVersion: string;
    latestVersion: string;
    releaseNotes?: string;
  } | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    // アップデート通知をリッスン
    const unsubscribe = window.electron.ipcRenderer.on('update:available-on-startup', (data: any) => {
      setUpdateInfo({
        currentVersion: data.currentVersion,
        latestVersion: data.latestVersion,
        releaseNotes: data.releaseNotes,
      });
      setShowUpdate(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const initializeApp = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('app:startup') as {
        config: AppConfig;
        needsSetup: boolean;
        isValidOsuFolder: boolean;
      };

      setConfig(result.config);
      setCurrentSkin(result.config.currentSkin || '');
      setLazerMode(result.config.lazerMode || false);

      if (result.needsSetup || !result.isValidOsuFolder) {
        setShowSetup(true);
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setShowSetup(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupComplete = async (osuPath: string) => {
    setShowSetup(false);
    // 設定をリロード
    const newConfig = await window.electron.ipcRenderer.invoke('config:get') as AppConfig;
    setConfig(newConfig);
    setCurrentSkin(newConfig.currentSkin || '');
    setLazerMode(newConfig.lazerMode || false);
  };

  const handleRefreshSkin = async () => {
    try {
      // Current Skinキャッシュをクリア
      await window.electron.ipcRenderer.invoke('hitsound:clearCurrentSkinCache');
      await window.electron.ipcRenderer.invoke('hitcircle:clearCurrentSkinNumbersCache');
      
      const result = await window.electron.ipcRenderer.invoke('config:refreshCurrentSkin') as {
        success: boolean;
        currentSkin?: string;
      };
      if (result.success && result.currentSkin) {
        setCurrentSkin(result.currentSkin);
      }
    } catch (error) {
      console.error('Failed to refresh skin:', error);
    }
  };

  const handleSelectSkin = async () => {
    try {
      // Current Skinキャッシュをクリア
      await window.electron.ipcRenderer.invoke('hitsound:clearCurrentSkinCache');
      await window.electron.ipcRenderer.invoke('hitcircle:clearCurrentSkinNumbersCache');
      
      const result = await window.electron.ipcRenderer.invoke(
        lazerMode ? 'osu:selectLazerSkinFolder' : 'osu:selectSkinFolder'
      ) as {
        success: boolean;
        currentSkin?: string;
        error?: string;
      };
      if (result.success && result.currentSkin) {
        setCurrentSkin(result.currentSkin);
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error('Failed to select skin:', error);
    }
  };

  const handleLazerModeChange = async (enabled: boolean) => {
    try {
      await window.electron.ipcRenderer.invoke('config:setLazerMode', enabled);
      setLazerMode(enabled);
      
      // lazerモード切り替え時にcurrentSkinを更新
      const result = await window.electron.ipcRenderer.invoke('config:get') as AppConfig;
      setCurrentSkin(result.currentSkin || '');
    } catch (error) {
      console.error('Failed to change lazer mode:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
        <span>読み込み中...</span>
      </div>
    );
  }

  return (
    <>
      <SetupModal
        isOpen={showSetup}
        onComplete={handleSetupComplete}
      />
      
      {updateInfo && (
        <UpdateModal
          isOpen={showUpdate}
          currentVersion={updateInfo.currentVersion}
          latestVersion={updateInfo.latestVersion}
          releaseNotes={updateInfo.releaseNotes}
          onUpdate={() => setShowUpdate(false)}
          onIgnore={() => setShowUpdate(false)}
          onLater={() => setShowUpdate(false)}
        />
      )}

      <Router>
        <div className="app-container">
          <Sidebar />
          <div className="main-area">
            <Header
              currentSkin={currentSkin}
              onRefresh={handleRefreshSkin}
              onSelectSkin={handleSelectSkin}
              lazerMode={lazerMode}
              onLazerModeChange={handleLazerModeChange}
            />
            <main className="content">
              <Routes>
                <Route path="/" element={<Cursor currentSkin={currentSkin} />} />
                <Route path="/cursor" element={<Cursor currentSkin={currentSkin} />} />
                <Route path="/hitcircle" element={<HitCircle currentSkin={currentSkin} />} />
                <Route path="/hitsounds" element={<HitSounds currentSkin={currentSkin} />} />
                <Route path="/skinini" element={<SkinIniPage currentSkin={currentSkin} />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </>
  );
}
