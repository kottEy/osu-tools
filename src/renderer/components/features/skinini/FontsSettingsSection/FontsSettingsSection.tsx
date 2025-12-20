import React from 'react';
import { Card, CardHeader, CardBody, CardTitle } from '../../../ui';
import type { SkinFonts } from '../../../../types';
import './FontsSettingsSection.css';

export interface FontsSettingsSectionProps {
  fonts: SkinFonts;
  onUpdate: <K extends keyof SkinFonts>(key: K, value: SkinFonts[K]) => void;
}

/**
 * FontsSettingsSection: Fonts関連の設定（HitCircleOverlapなど）
 */
export function FontsSettingsSection({ fonts, onUpdate }: FontsSettingsSectionProps) {
  const handleOverlapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      onUpdate('hitCircleOverlap', value);
    }
  };

  const handleIncrement = () => {
    onUpdate('hitCircleOverlap', (fonts.hitCircleOverlap ?? 0) + 1);
  };

  const handleDecrement = () => {
    onUpdate('hitCircleOverlap', (fonts.hitCircleOverlap ?? 0) - 1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ width: 18, height: 18, marginRight: 8 }}
          >
            <rect x="3" y="3" width="7" height="18" rx="1" />
            <rect x="14" y="3" width="7" height="18" rx="1" />
          </svg>
          Fonts Settings
        </CardTitle>
      </CardHeader>
      <CardBody>
        <div className="fonts-settings">
          <div className="fonts-setting-row">
            <span className="fonts-setting-row__label">HitCircle Overlap</span>
            <div className="fonts-setting-row__control">
              <button
                type="button"
                className="fonts-number-btn"
                onClick={handleDecrement}
                aria-label="Decrease overlap"
                title="Decrease"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                  <path d="M5 12h14" />
                </svg>
              </button>

              <input
                type="number"
                className="fonts-setting-row__input"
                value={fonts.hitCircleOverlap}
                onChange={handleOverlapChange}
              />

              <button
                type="button"
                className="fonts-number-btn"
                onClick={handleIncrement}
                aria-label="Increase overlap"
                title="Increase"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
