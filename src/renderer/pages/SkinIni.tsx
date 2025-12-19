import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Button,
  Toggle,
} from '../components/ui';
import {
  SkinIni,
  DEFAULT_SKIN_INI,
  parseSkinIni,
  generateSkinIni,
  rgbStringToHex,
  hexToRgbString,
} from '../types';
import './SkinIni.css';

/**
 * SkinIni: skin.ini 編集専用ページ
 * current skin の skin.ini を編集
 * 
 * 編集項目:
 * - CursorRotate
 * - CursorTrailRotate
 * - CursorExpand
 * - Combo Colours (1-5)
 * - Slider Border
 * - Slider Track
 */
export default function SkinIniPage() {
  const [skinIni, setSkinIni] = useState<SkinIni>(DEFAULT_SKIN_INI);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 初回起動時にskin.iniを読み込み
  useEffect(() => {
    loadSkinIni();
  }, []);

  const loadSkinIni = async () => {
    setIsLoading(true);
    try {
      // 実際にはElectron IPCでファイルを読み込む
      // ここではデモ用にlocalStorageから読み込み
      const saved = localStorage.getItem('currentSkinIni');
      if (saved) {
        const parsed = parseSkinIni(saved);
        setSkinIni({
          general: { ...DEFAULT_SKIN_INI.general, ...parsed.general },
          colours: { ...DEFAULT_SKIN_INI.colours, ...parsed.colours },
          fonts: { ...DEFAULT_SKIN_INI.fonts, ...parsed.fonts },
        });
      }
    } catch (e) {
      console.error('Failed to load skin.ini:', e);
    }
    setIsLoading(false);
  };

  const handleApply = async () => {
    setIsLoading(true);
    try {
      const content = generateSkinIni(skinIni);
      // 実際にはElectron IPCでファイルを書き込む
      localStorage.setItem('currentSkinIni', content);
      setLastSaved(new Date());
      
      // Show success feedback
      alert('skin.ini has been applied successfully!');
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

  const updateGeneral = <K extends keyof SkinIni['general']>(
    key: K,
    value: SkinIni['general'][K]
  ) => {
    setSkinIni((prev) => ({
      ...prev,
      general: { ...prev.general, [key]: value },
    }));
  };

  const updateColour = <K extends keyof SkinIni['colours']>(
    key: K,
    value: string
  ) => {
    setSkinIni((prev) => ({
      ...prev,
      colours: { ...prev.colours, [key]: value },
    }));
  };

  return (
    <div className="skinini-page page">
      {/* Cursor Settings */}
      <Card>
        <CardHeader>
          <CardTitle>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 8 }}>
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
              <path d="M13 13l6 6" />
            </svg>
            Cursor Settings
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="skinini-toggles">
            <Toggle
              label="Cursor Rotate"
              checked={skinIni.general.cursorRotate}
              onChange={(v) => updateGeneral('cursorRotate', v)}
            />
            <Toggle
              label="Cursor Trail Rotate"
              checked={skinIni.general.cursorTrailRotate}
              onChange={(v) => updateGeneral('cursorTrailRotate', v)}
            />
            <Toggle
              label="Cursor Expand"
              checked={skinIni.general.cursorExpand}
              onChange={(v) => updateGeneral('cursorExpand', v)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Combo Colours */}
      <Card>
        <CardHeader>
          <CardTitle>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 8 }}>
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            Combo Colours
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="skinini-colours">
            {(['combo1', 'combo2', 'combo3', 'combo4', 'combo5'] as const).map((key, i) => (
              <ColourInput
                key={key}
                label={`Combo ${i + 1}`}
                value={skinIni.colours[key]}
                onChange={(v) => updateColour(key, v)}
              />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Slider Colours */}
      <Card>
        <CardHeader>
          <CardTitle>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 8 }}>
              <path d="M12 2v20M2 12h20" />
            </svg>
            Slider Colours
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="skinini-colours skinini-colours--slider">
            <ColourInput
              label="Slider Border"
              value={skinIni.colours.sliderBorder}
              onChange={(v) => updateColour('sliderBorder', v)}
            />
            <ColourInput
              label="Slider Track"
              value={skinIni.colours.sliderTrackOverride}
              onChange={(v) => updateColour('sliderTrackOverride', v)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Floating Action Buttons */}
      <div className="skinini-floating-actions">
        {lastSaved && (
          <span className="skinini-floating-actions__saved">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}
        <Button onClick={handleReload} disabled={isLoading}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, marginRight: 6 }}>
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          Reload
        </Button>
        <Button variant="primary" onClick={handleApply} disabled={isLoading}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, marginRight: 6 }}>
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Apply
        </Button>
      </div>
    </div>
  );
}

/**
 * ColourInput: カラー入力コンポーネント
 */
function ColourInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const hexValue = rgbStringToHex(value);

  const handleChange = (hex: string) => {
    onChange(hexToRgbString(hex));
  };

  return (
    <div className="colour-input">
      <input
        type="color"
        className="colour-input__color"
        value={hexValue}
        onChange={(e) => handleChange(e.target.value)}
      />
      <div className="colour-input__info">
        <span className="colour-input__label">{label}</span>
        <span className="colour-input__value">{value}</span>
      </div>
    </div>
  );
}
