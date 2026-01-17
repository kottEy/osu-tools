import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../components/ui';
import {
  CursorSettingsSection,
  ComboColoursSection,
  SliderColoursSection,
  FontsSettingsSection,
} from '../components/features/skinini';
import {
  SkinIni,
  SkinColours,
  SkinFonts,
  DEFAULT_SKIN_INI,
} from '../types';
import './SkinIni.css';

interface SkinIniPageProps {
  currentSkin?: string;
}

/**
 * SkinIniPage: skin.ini 編集専用ページ
 * 
 * 編集項目:
 * - Cursor Settings (Rotate, TrailRotate, Expand)
 * - Combo Colours (0-8個、追加/削除可能)
 * - Slider Colours (Border, Track)
 */
export default function SkinIniPage({ currentSkin }: SkinIniPageProps) {
  const [skinIni, setSkinIni] = useState<SkinIni>(DEFAULT_SKIN_INI);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [comboCount, setComboCount] = useState<number>(0);
  const prevSkinRef = useRef<string | undefined>(undefined);

  // 初回起動時とcurrentSkin変更時にskin.iniを読み込み
  useEffect(() => {
    loadSkinIni();
  }, []);

  // currentSkinが変更された時に自動で再読み込み
  useEffect(() => {
    if (prevSkinRef.current !== undefined && prevSkinRef.current !== currentSkin) {
      console.log('Current skin changed:', prevSkinRef.current, '->', currentSkin);
      loadSkinIni();
    }
    prevSkinRef.current = currentSkin;
  }, [currentSkin]);

  const loadSkinIni = async () => {
    setIsLoading(true);
    try {
      const result = await window.electron.ipcRenderer.invoke('skinini:read') as {
        success: boolean;
        data?: SkinIni;
        error?: string;
      };
      console.log('Loaded skin.ini result:', result);
      if (result.success && result.data) {
        const loaded = result.data;
        const next: SkinIni = {
          general: { ...DEFAULT_SKIN_INI.general, ...loaded.general },
          colours: { ...DEFAULT_SKIN_INI.colours, ...loaded.colours },
          fonts: { ...DEFAULT_SKIN_INI.fonts, ...loaded.fonts },
          catchTheBeat: loaded.catchTheBeat || { unknownSettings: {} },
          mania: loaded.mania || [],
        };
        setSkinIni(next);

        // Determine current combo count based on non-empty Combo1..Combo8
        const count = countActiveComboColours(next.colours);
        setComboCount(count);
      } else {
        console.error('Failed to load skin.ini:', result.error);
        // デフォルト値にリセット
        setSkinIni(DEFAULT_SKIN_INI);
        setComboCount(5);
      }
    } catch (e) {
      console.error('Failed to load skin.ini:', e);
      setSkinIni(DEFAULT_SKIN_INI);
      setComboCount(5);
    }
    setIsLoading(false);
  };

  const countActiveComboColours = (colours: SkinColours): number => {
    let count = 0;
    for (let i = 1; i <= 8; i++) {
      const key = `combo${i}` as keyof SkinColours;
      const val = colours[key];
      if (typeof val === 'string' && val.trim() !== '') {
        count = i; // Track highest non-empty combo
      }
    }
    return count;
  };

  const handleApply = async () => {
    setIsLoading(true);
    try {
      const result = await window.electron.ipcRenderer.invoke('skinini:save', skinIni) as {
        success: boolean;
        error?: string;
      };
      if (result.success) {
        setLastSaved(new Date());
        alert('skin.ini has been applied successfully!');
      } else {
        alert(`Failed to apply skin.ini: ${result.error}`);
      }
    } catch (e) {
      console.error('Failed to save skin.ini:', e);
      alert('Failed to apply skin.ini');
    }
    setIsLoading(false);
  };

  const handleReload = () => {
    if (confirm('Reload skin.ini? Any unsaved changes will be lost.')) {
      loadSkinIni();
    }
  };

  // General settings updater
  const updateGeneral = useCallback(<K extends keyof SkinIni['general']>(
    key: K,
    value: SkinIni['general'][K]
  ) => {
    setSkinIni((prev) => ({
      ...prev,
      general: { ...prev.general, [key]: value },
    }));
  }, []);

  // Colour updater
  const updateColour = useCallback(<K extends keyof SkinColours>(
    key: K,
    value: string
  ) => {
    setSkinIni((prev) => ({
      ...prev,
      colours: { ...prev.colours, [key]: value },
    }));
  }, []);

  // Fonts updater
  const updateFonts = useCallback(<K extends keyof SkinFonts>(
    key: K,
    value: SkinFonts[K]
  ) => {
    setSkinIni((prev) => ({
      ...prev,
      fonts: { ...prev.fonts, [key]: value },
    }));
  }, []);

  // Combo colour handlers
  const handleComboColourChange = useCallback((index: number, value: string) => {
    const key = `combo${index + 1}` as keyof SkinColours;
    updateColour(key, value);
  }, [updateColour]);

  const handleAddComboColour = useCallback(() => {
    if (comboCount >= 8) return;
    const nextCount = comboCount + 1;
    setComboCount(nextCount);
    
    // Initialize with white if empty
    const key = `combo${nextCount}` as 'combo1' | 'combo2' | 'combo3' | 'combo4' | 'combo5' | 'combo6' | 'combo7' | 'combo8';
    const currentValue = skinIni.colours[key];
    if (!currentValue || currentValue.trim() === '') {
      updateColour(key, '255,255,255');
    }
  }, [comboCount, skinIni.colours, updateColour]);

  const handleRemoveComboColour = useCallback((index: number) => {
    if (comboCount <= 0) return;
    if (!confirm(`Remove Combo ${index + 1}?`)) return;

    // Shift remaining colours down
    const comboKeys = ['combo1', 'combo2', 'combo3', 'combo4', 'combo5', 'combo6', 'combo7', 'combo8'] as const;
    const values = comboKeys.map((k) => skinIni.colours[k]);
    
    // Remove at index and shift
    for (let i = index; i < comboCount - 1; i++) {
      values[i] = values[i + 1];
    }
    values[comboCount - 1] = '';

    // Apply all shifted values
    setSkinIni((prev) => ({
      ...prev,
      colours: {
        ...prev.colours,
        combo1: values[0],
        combo2: values[1],
        combo3: values[2],
        combo4: values[3],
        combo5: values[4],
        combo6: values[5],
        combo7: values[6],
        combo8: values[7],
      },
    }));
    setComboCount(comboCount - 1);
  }, [comboCount, skinIni.colours]);

  if (isLoading) {
    return <div className="skinini-page page loading">skin.ini を読み込み中...</div>;
  }

  return (
    <div className="skinini-page page">
      <CursorSettingsSection
        skinIni={skinIni}
        onUpdate={updateGeneral}
      />

      <FontsSettingsSection
        fonts={skinIni.fonts}
        onUpdate={updateFonts}
      />

      <ComboColoursSection
        colours={skinIni.colours}
        count={comboCount}
        onColourChange={handleComboColourChange}
        onAdd={handleAddComboColour}
        onRemove={handleRemoveComboColour}
      />

      <SliderColoursSection
        colours={skinIni.colours}
        onUpdate={updateColour}
      />

      {/* Floating Action Buttons */}
      <div className="skinini-floating-actions">
        {lastSaved && (
          <span className="skinini-floating-actions__saved">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}
        <Button onClick={handleReload} disabled={isLoading}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ width: 16, height: 16, marginRight: 6 }}
          >
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          Reload
        </Button>
        <Button variant="primary" onClick={handleApply} disabled={isLoading}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ width: 16, height: 16, marginRight: 6 }}
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Apply
        </Button>
      </div>
    </div>
  );
}
