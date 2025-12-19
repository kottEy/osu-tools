import React from 'react';
import { Card, CardHeader, CardBody, CardTitle, Toggle } from '../../../ui';
import type { SkinIni } from '../../../../types';

export interface CursorSettingsSectionProps {
  skinIni: SkinIni;
  onUpdate: <K extends keyof SkinIni['general']>(key: K, value: SkinIni['general'][K]) => void;
}

/**
 * CursorSettingsSection: Cursor関連のトグル設定
 */
export function CursorSettingsSection({ skinIni, onUpdate }: CursorSettingsSectionProps) {
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
            onChange={(v) => onUpdate('cursorRotate', v)}
          />
          <Toggle
            label="Cursor Trail Rotate"
            checked={skinIni.general.cursorTrailRotate}
            onChange={(v) => onUpdate('cursorTrailRotate', v)}
          />
          <Toggle
            label="Cursor Expand"
            checked={skinIni.general.cursorExpand}
            onChange={(v) => onUpdate('cursorExpand', v)}
          />
        </div>
      </CardBody>
    </Card>
  );
}
