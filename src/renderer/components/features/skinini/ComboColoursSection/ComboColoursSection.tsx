import React from 'react';
import { Card, CardHeader, CardBody, CardTitle, Button } from '../../../ui';
import { ColourInput } from '../ColourInput';
import type { SkinColours } from '../../../../types';
import './ComboColoursSection.css';

export interface ComboColoursSectionProps {
  /** Current combo colour values */
  colours: SkinColours;
  /** Number of active combo colours (0-8) */
  count: number;
  /** Update a specific combo colour */
  onColourChange: (index: number, value: string) => void;
  /** Add a new combo colour */
  onAdd: () => void;
  /** Remove a combo colour at index */
  onRemove: (index: number) => void;
}

const MAX_COMBO_COLOURS = 8;

/**
 * ComboColoursSection: Combo Colours (0〜8個) の管理セクション
 */
export function ComboColoursSection({
  colours,
  count,
  onColourChange,
  onAdd,
  onRemove,
}: ComboColoursSectionProps) {
  const comboKeys = [
    'combo1', 'combo2', 'combo3', 'combo4',
    'combo5', 'combo6', 'combo7', 'combo8',
  ] as const;

  return (
    <Card>
      <CardHeader className="combo-colours-header">
        <CardTitle>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ width: 18, height: 18, marginRight: 8 }}
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
          </svg>
          Combo Colours
          <span className="combo-colours-header__count">
            {count} / {MAX_COMBO_COLOURS}
          </span>
        </CardTitle>
        <div className="combo-colours-header__actions">
          <Button
            onClick={onAdd}
            disabled={count >= MAX_COMBO_COLOURS}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ width: 14, height: 14, marginRight: 4 }}
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {count === 0 ? (
          <div className="combo-colours-empty">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="combo-colours-empty__icon"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p className="combo-colours-empty__text">
              No combo colours defined.
            </p>
            <Button onClick={onAdd} variant="primary">
              Add First Colour
            </Button>
          </div>
        ) : (
          <div className="combo-colours-grid">
            {Array.from({ length: count }).map((_, i) => {
              const key = comboKeys[i];
              const value = colours[key] || '255,255,255';
              return (
                <ColourInput
                  key={key}
                  label={`Combo ${i + 1}`}
                  value={value}
                  onChange={(v) => onColourChange(i, v)}
                  onRemove={() => onRemove(i)}
                />
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
