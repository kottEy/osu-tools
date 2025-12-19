import React from 'react';
import { Card, CardHeader, CardBody, CardTitle } from '../../../ui';
import { ColourInput } from '../ColourInput';
import type { SkinColours } from '../../../../types';
import './SliderColoursSection.css';

export interface SliderColoursSectionProps {
  colours: SkinColours;
  onUpdate: <K extends keyof SkinColours>(key: K, value: string) => void;
}

/**
 * SliderColoursSection: Slider Border / Track カラー設定
 */
export function SliderColoursSection({ colours, onUpdate }: SliderColoursSectionProps) {
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
            <path d="M12 2v20M2 12h20" />
          </svg>
          Slider Colours
        </CardTitle>
      </CardHeader>
      <CardBody>
        <div className="slider-colours-grid">
          <ColourInput
            label="Slider Border"
            value={colours.sliderBorder}
            onChange={(v) => onUpdate('sliderBorder', v)}
            variant="horizontal"
          />
          <ColourInput
            label="Slider Track"
            value={colours.sliderTrackOverride}
            onChange={(v) => onUpdate('sliderTrackOverride', v)}
            variant="horizontal"
          />
        </div>
      </CardBody>
    </Card>
  );
}
