import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Carousel,
  CarouselRow,
  CarouselItem,
  IconButton,
  getVisible,
  Uploader,
  ControlsRow,
  ControlsRowRight,
  TrashButton,
  Toggle,
  Button,
} from '../components/ui';
import { NumberPresetCard } from '../components/features/numbers';
import type { MediaItem, NumberPreset } from '../types';
import { createEmptyNumberPreset } from '../types';
import './HitCircle.css';

// Demo data
const demoHitCircles: MediaItem[] = [
  { id: 1, name: 'hitcircle-1', preview: '/pink-circle-osu.jpg' },
];

const demoOverlays: MediaItem[] = [
  { id: 1, name: 'overlay-1', preview: '/circle-overlay-ring.jpg' },
];

export default function HitCircle() {
  const [hitcircles, setHitcircles] = useState<MediaItem[]>(demoHitCircles);
  const [overlays, setOverlays] = useState<MediaItem[]>(demoOverlays);
  const [hitcircles2x, setHitcircles2x] = useState(false);
  const [overlays2x, setOverlays2x] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState(0);
  const [selectedOverlay, setSelectedOverlay] = useState(0);
  const [isAnimatingCircle, setIsAnimatingCircle] = useState(false);
  const [isAnimatingOverlay, setIsAnimatingOverlay] = useState(false);
  const [circleSlideDir, setCircleSlideDir] = useState<'left' | 'right' | null>(null);
  const [overlaySlideDir, setOverlaySlideDir] = useState<'left' | 'right' | null>(null);
  const [use2x, setUse2x] = useState(false);

  // Number Preset State
  const [numberPresets, setNumberPresets] = useState<NumberPreset[]>([
    createEmptyNumberPreset('Default Numbers'),
  ]);
  const [expandedPresets, setExpandedPresets] = useState<Set<string>>(new Set());
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  // Format: 'presetId-default-N' or null
  const [selectedPreviewKey, setSelectedPreviewKey] = useState<string | null>(null);

  const fileRefCircle = React.useRef<HTMLInputElement | null>(null);
  const fileRefOverlay = React.useRef<HTMLInputElement | null>(null);

  // Get the preview number image from selected key
  const getPreviewNumberImage = () => {
    if (!selectedPreviewKey) return null;
    // Parse 'presetId-default-N'
    const parts = selectedPreviewKey.split('-default-');
    if (parts.length !== 2) return null;
    const presetId = parts[0];
    const numberKey = `default-${parts[1]}`;
    const preset = numberPresets.find((p) => p.id === presetId);
    return preset?.numbers[numberKey] || null;
  };

  // Get the display number (0-9) from selected key
  const getPreviewDisplayNumber = () => {
    if (!selectedPreviewKey) return '1'; // default
    const parts = selectedPreviewKey.split('-default-');
    if (parts.length !== 2) return '1';
    return parts[1];
  };

  // Navigation handlers
  const handlePrevCircle = () => {
    if (isAnimatingCircle) return;
    setCircleSlideDir('right');
    setIsAnimatingCircle(true);
    setSelectedCircle((s) => (s === 0 ? hitcircles.length - 1 : s - 1));
    setTimeout(() => setIsAnimatingCircle(false), 300);
  };

  const handleNextCircle = () => {
    if (isAnimatingCircle) return;
    setCircleSlideDir('left');
    setIsAnimatingCircle(true);
    setSelectedCircle((s) => (s === hitcircles.length - 1 ? 0 : s + 1));
    setTimeout(() => setIsAnimatingCircle(false), 300);
  };

  const handlePrevOverlay = () => {
    if (isAnimatingOverlay) return;
    setOverlaySlideDir('right');
    setIsAnimatingOverlay(true);
    setSelectedOverlay((s) => (s === 0 ? overlays.length - 1 : s - 1));
    setTimeout(() => setIsAnimatingOverlay(false), 300);
  };

  const handleNextOverlay = () => {
    if (isAnimatingOverlay) return;
    setOverlaySlideDir('left');
    setIsAnimatingOverlay(true);
    setSelectedOverlay((s) => (s === overlays.length - 1 ? 0 : s + 1));
    setTimeout(() => setIsAnimatingOverlay(false), 300);
  };

  // File handlers
  const handleAddHitcircle = (file?: File) => {
    if (!file) return;
    const item: MediaItem = {
      id: hitcircles.length + 1,
      name: file.name || `hitcircle-${hitcircles.length + 1}`,
      preview: URL.createObjectURL(file),
    };
    setHitcircles((s) => [...s, item]);
  };

  const handleAddOverlay = (file?: File) => {
    if (!file) return;
    const item: MediaItem = {
      id: overlays.length + 1,
      name: file.name || `overlay-${overlays.length + 1}`,
      preview: URL.createObjectURL(file),
    };
    setOverlays((s) => [...s, item]);
  };

  const handleDropCircle = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type.startsWith('image/')) handleAddHitcircle(f);
  };

  const handleDropOverlay = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type.startsWith('image/')) handleAddOverlay(f);
  };

  const handleDeleteCircle = (index: number) => {
    if (hitcircles.length <= 1) {
      window.alert('At least one hit circle is required.');
      return;
    }
    if (!window.confirm('Remove selected hit circle?')) return;

    try {
      const url = hitcircles[index]?.preview;
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    } catch (e) { /* ignore */ }

    setHitcircles((s) => s.filter((_, i) => i !== index));
    setSelectedCircle(Math.max(0, Math.min(selectedCircle, hitcircles.length - 2)));
  };

  const handleDeleteOverlay = (index: number) => {
    if (overlays.length <= 1) {
      window.alert('At least one overlay is required.');
      return;
    }
    if (!window.confirm('Remove selected overlay?')) return;

    try {
      const url = overlays[index]?.preview;
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    } catch (e) { /* ignore */ }

    setOverlays((s) => s.filter((_, i) => i !== index));
    setSelectedOverlay(Math.max(0, Math.min(selectedOverlay, overlays.length - 2)));
  };

  // Number Preset handlers
  const handleAddPreset = () => {
    const newPreset = createEmptyNumberPreset(`Number Preset ${numberPresets.length + 1}`);
    setNumberPresets((prev) => [...prev, newPreset]);
    setExpandedPresets((prev) => new Set(prev).add(newPreset.id));
  };

  const handleToggleExpand = (id: string) => {
    setExpandedPresets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStartEditing = (preset: NumberPreset) => {
    setEditingPresetId(preset.id);
    setEditingName(preset.name);
  };

  const handleSaveName = (id: string, name: string) => {
    setNumberPresets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    );
    setEditingPresetId(null);
  };

  const handleDeletePreset = (id: string) => {
    if (numberPresets.length <= 1) {
      window.alert('At least one preset is required.');
      return;
    }
    if (!window.confirm('Delete this preset?')) return;
    setNumberPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const handleApplyPreset = (preset: NumberPreset) => {
    console.log('Apply number preset:', preset);
    // Apply logic here
  };

  const handleImageUpload = (presetId: string, numberKey: string, file: File) => {
    const url = URL.createObjectURL(file);
    setNumberPresets((prev) =>
      prev.map((p) =>
        p.id === presetId
          ? { ...p, numbers: { ...p.numbers, [numberKey]: url } }
          : p
      )
    );
  };

  const handleImageRemove = (presetId: string, numberKey: string) => {
    // Clear preview if the removed image was being previewed
    const removedKey = `${presetId}-${numberKey}`;
    if (selectedPreviewKey === removedKey) {
      setSelectedPreviewKey(null);
    }
    setNumberPresets((prev) =>
      prev.map((p) =>
        p.id === presetId
          ? { ...p, numbers: { ...p.numbers, [numberKey]: null } }
          : p
      )
    );
  };

  const handleSelectForPreview = (presetId: string, numberKey: string) => {
    const key = `${presetId}-${numberKey}`;
    // Toggle selection: if already selected, deselect
    if (selectedPreviewKey === key) {
      setSelectedPreviewKey(null);
    } else {
      setSelectedPreviewKey(key);
    }
  };

  const previewNumberImage = getPreviewNumberImage();
  const displayNumber = getPreviewDisplayNumber();

  return (
    <div className="hitcircle-editor page">
      {/* Preview Section */}
      <div className="layout-top">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardBody className="preview-area">
            <div className="preview-combined">
              <img
                src={hitcircles[selectedCircle]?.preview}
                alt="hitcircle"
                className="preview-base"
              />
              <img
                src={overlays[selectedOverlay]?.preview}
                alt="overlay"
                className="preview-overlay"
              />
              {previewNumberImage ? (
                <img
                  src={previewNumberImage}
                  alt="number"
                  className="preview-number-image"
                />
              ) : (
                <div className="preview-number">{displayNumber}</div>
              )}
            </div>
            <ControlsRowRight>
              <Toggle label="@2x" checked={use2x} onChange={setUse2x} labelPosition="right" size="sm" />
              <Button
                variant="primary"
                onClick={() =>
                  console.log('Apply all', {
                    hitcircle: hitcircles[selectedCircle],
                    overlay: overlays[selectedOverlay],
                  }, { use2x })
                }
              >
                Apply All
              </Button>
            </ControlsRowRight>
          </CardBody>
        </Card>
      </div>

      {/* Hit Circle and Overlay Sections */}
      <div className="layout-bottom">
        {/* Hit Circle Section */}
        <Card>
          <CardHeader>
            <CardTitle>Hit Circle</CardTitle>
          </CardHeader>
          <CardBody>
            <CarouselRow>
              <IconButton direction="prev" onClick={handlePrevCircle} disabled={isAnimatingCircle} />
              <Carousel isAnimating={isAnimatingCircle}>
                {getVisible(hitcircles, selectedCircle).map((it) => (
                  <CarouselItem
                    key={it.id + it.position}
                    item={it}
                    position={it.position}
                    isAnimating={isAnimatingCircle}
                    slideDirection={circleSlideDir}
                    showLabel={true}
                    currentIndex={selectedCircle}
                    totalItems={hitcircles.length}
                  />
                ))}
              </Carousel>
              <IconButton direction="next" onClick={handleNextCircle} disabled={isAnimatingCircle} />
            </CarouselRow>

            <Uploader
              onDrop={handleDropCircle}
              onClick={() => fileRefCircle.current?.click()}
              dropzoneText="Drop hit circle image or click to add"
            >
              <input
                ref={fileRefCircle}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAddHitcircle(f);
                  e.currentTarget.value = '';
                }}
              />
              <ControlsRow>
                <TrashButton onClick={() => handleDeleteCircle(selectedCircle)} title="Remove selected hit circle" />
                <ControlsRowRight>
                  <Toggle label="@2x" checked={hitcircles2x} onChange={setHitcircles2x} labelPosition="right" size="sm" />
                  <Button variant="primary" onClick={() => console.log('Apply hitcircle', hitcircles[selectedCircle], { hitcircles2x })}>
                    Apply
                  </Button>
                </ControlsRowRight>
              </ControlsRow>
            </Uploader>
          </CardBody>
        </Card>

        {/* Overlay Section */}
        <Card>
          <CardHeader>
            <CardTitle>Hit Circle Overlay</CardTitle>
          </CardHeader>
          <CardBody>
            <CarouselRow>
              <IconButton direction="prev" onClick={handlePrevOverlay} disabled={isAnimatingOverlay} />
              <Carousel isAnimating={isAnimatingOverlay}>
                {getVisible(overlays, selectedOverlay).map((it) => (
                  <CarouselItem
                    key={it.id + it.position}
                    item={it}
                    position={it.position}
                    isAnimating={isAnimatingOverlay}
                    slideDirection={overlaySlideDir}
                    showLabel={true}
                    currentIndex={selectedOverlay}
                    totalItems={overlays.length}
                  />
                ))}
              </Carousel>
              <IconButton direction="next" onClick={handleNextOverlay} disabled={isAnimatingOverlay} />
            </CarouselRow>

            <Uploader
              onDrop={handleDropOverlay}
              onClick={() => fileRefOverlay.current?.click()}
              dropzoneText="Drop overlay image or click to add"
            >
              <input
                ref={fileRefOverlay}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAddOverlay(f);
                  e.currentTarget.value = '';
                }}
              />
              <ControlsRow>
                <TrashButton onClick={() => handleDeleteOverlay(selectedOverlay)} title="Remove selected overlay" />
                <ControlsRowRight>
                  <Toggle label="@2x" checked={overlays2x} onChange={setOverlays2x} labelPosition="right" size="sm" />
                  <Button variant="primary" onClick={() => console.log('Apply overlay', overlays[selectedOverlay], { overlays2x })}>
                    Apply
                  </Button>
                </ControlsRowRight>
              </ControlsRow>
            </Uploader>
          </CardBody>
        </Card>
      </div>

      {/* Number Presets Section */}
      <div className="layout-numbers">
        <div className="numbers-header">
          <h3 className="numbers-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            Default Numbers
          </h3>
          <Button onClick={handleAddPreset}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, marginRight: 6 }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Preset
          </Button>
        </div>

        <div className="numbers-list">
          {numberPresets.map((preset) => (
            <NumberPresetCard
              key={preset.id}
              preset={preset}
              isExpanded={expandedPresets.has(preset.id)}
              selectedPreviewKey={selectedPreviewKey}
              onToggleExpand={() => handleToggleExpand(preset.id)}
              onStartEditing={() => handleStartEditing(preset)}
              onSaveName={(name) => handleSaveName(preset.id, name)}
              onCancelEditing={() => setEditingPresetId(null)}
              onDelete={() => handleDeletePreset(preset.id)}
              onApply={() => handleApplyPreset(preset)}
              onImageUpload={(key, file) => handleImageUpload(preset.id, key, file)}
              onImageRemove={(key) => handleImageRemove(preset.id, key)}
              onSelectForPreview={(pId, key) => handleSelectForPreview(pId, key)}
              isEditing={editingPresetId === preset.id}
              editingName={editingName}
              onEditingNameChange={setEditingName}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
