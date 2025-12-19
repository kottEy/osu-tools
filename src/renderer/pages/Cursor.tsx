import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
} from '../components/shared/Card';
import {
  Carousel,
  CarouselRow,
  CarouselItem,
  IconButton,
  getVisible,
  type MediaItem,
} from '../components/shared/Carousel';
import {
  Uploader,
  ControlsRow,
  ControlsRowRight,
  TrashButton,
  Checkbox,
  Button,
} from '../components/shared/Uploader';
import './cursor.css';

// Demo data - replace with actual data loading logic
const demoCursors: MediaItem[] = [
  { id: 1, name: 'cursor-1', preview: '/pink-circle-cursor.jpg' },
];

const demoTrails: MediaItem[] = [
  { id: 1, name: 'cursortrail-1', preview: '/pink-trail-effect.jpg' },
];

export default function Cursor() {
  const [cursors, setCursors] = useState<MediaItem[]>(demoCursors);
  const [trails, setTrails] = useState<MediaItem[]>(demoTrails);
  const [selectedCursor, setSelectedCursor] = useState(0);
  const [selectedTrail, setSelectedTrail] = useState(0);
  const [isAnimatingCursor, setIsAnimatingCursor] = useState(false);
  const [isAnimatingTrail, setIsAnimatingTrail] = useState(false);
  const [cursor2x, setCursor2x] = useState(false);
  const [trail2x, setTrail2x] = useState(false);
  const [useCursorMiddle, setUseCursorMiddle] = useState(false);
  const [cursorDragActive, setCursorDragActive] = useState(false);
  const [trailDragActive, setTrailDragActive] = useState(false);
  const [cursorSlideDir, setCursorSlideDir] = useState<'left' | 'right'>(
    'right',
  );
  const [trailSlideDir, setTrailSlideDir] = useState<'left' | 'right'>('right');

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const trailInputRef = React.useRef<HTMLInputElement | null>(null);

  /**
   * Navigate to previous item with animation
   */
  const handlePrevCursor = () => {
    if (isAnimatingCursor) return;
    setIsAnimatingCursor(true);
    setCursorSlideDir('right');
    setSelectedCursor((idx) => (idx - 1 + cursors.length) % cursors.length);
    setTimeout(() => setIsAnimatingCursor(false), 300);
  };

  /**
   * Navigate to next item with animation
   */
  const handleNextCursor = () => {
    if (isAnimatingCursor) return;
    setIsAnimatingCursor(true);
    setCursorSlideDir('left');
    setSelectedCursor((idx) => (idx + 1) % cursors.length);
    setTimeout(() => setIsAnimatingCursor(false), 300);
  };

  const handlePrevTrail = () => {
    if (isAnimatingTrail) return;
    setIsAnimatingTrail(true);
    setTrailSlideDir('right');
    setSelectedTrail((idx) => (idx - 1 + trails.length) % trails.length);
    setTimeout(() => setIsAnimatingTrail(false), 300);
  };

  const handleNextTrail = () => {
    if (isAnimatingTrail) return;
    setIsAnimatingTrail(true);
    setTrailSlideDir('left');
    setSelectedTrail((idx) => (idx + 1) % trails.length);
    setTimeout(() => setIsAnimatingTrail(false), 300);
  };

  /**
   * Add new cursor from file
   */
  const handleAddCursor = (file?: File) => {
    if (!file) return;
    const newItem: MediaItem = {
      id: cursors.length + 1,
      name: file.name || `cursor-${cursors.length + 1}`,
      preview: URL.createObjectURL(file),
    };
    setCursors((s) => [...s, newItem]);
  };

  /**
   * Add new trail from file
   */
  const handleAddTrail = (file?: File) => {
    if (!file) return;
    const newItem: MediaItem = {
      id: trails.length + 1,
      name: file.name || `trail-${trails.length + 1}`,
      preview: URL.createObjectURL(file),
    };
    setTrails((s) => [...s, newItem]);
  };

  /**
   * Handle cursor drop event
   */
  const onCursorDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setCursorDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) handleAddCursor(file);
  };

  /**
   * Handle trail drop event
   */
  const onTrailDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setTrailDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) handleAddTrail(file);
  };

  /**
   * Delete cursor at specified index
   */
  const handleDeleteCursor = (index: number) => {
    if (cursors.length <= 1) {
      window.alert(
        'At least one cursor is required. Cannot delete the last image.',
      );
      return;
    }
    if (!window.confirm('Remove selected cursor?')) return;

    try {
      const url = cursors[index]?.preview;
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    } catch (e) {
      // ignore
    }

    setCursors((s) => s.filter((_, i) => i !== index));
    const newIndex = Math.max(0, Math.min(selectedCursor, cursors.length - 2));
    setSelectedCursor(newIndex);
  };

  /**
   * Delete trail at specified index
   */
  const handleDeleteTrail = (index: number) => {
    if (trails.length <= 1) {
      window.alert(
        'At least one trail image is required. Cannot delete the last image.',
      );
      return;
    }
    if (!window.confirm('Remove selected trail?')) return;

    try {
      const url = trails[index]?.preview;
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    } catch (e) {
      // ignore
    }

    setTrails((s) => s.filter((_, i) => i !== index));
    const newIndex = Math.max(0, Math.min(selectedTrail, trails.length - 2));
    setSelectedTrail(newIndex);
  };

  return (
    <div className="cursor-editor grid two-col page">
      {/* Cursor Section */}
      <Card>
        <CardHeader>
          <CardTitle icon="default">Cursor</CardTitle>
        </CardHeader>
        <CardBody>
          <CarouselRow>
            <IconButton
              direction="prev"
              onClick={handlePrevCursor}
              disabled={isAnimatingCursor}
            />
            <Carousel isAnimating={isAnimatingCursor}>
              {getVisible(cursors, selectedCursor).map((it) => (
                <CarouselItem
                  key={it.id + it.position}
                  item={it}
                  position={it.position}
                  isAnimating={isAnimatingCursor}
                  slideDirection={cursorSlideDir}
                  showLabel={true}
                  currentIndex={selectedCursor}
                  totalItems={cursors.length}
                />
              ))}
            </Carousel>
            <IconButton
              direction="next"
              onClick={handleNextCursor}
              disabled={isAnimatingCursor}
            />
          </CarouselRow>

          <Uploader
            onDrop={onCursorDrop}
            onClick={() => fileInputRef.current?.click()}
            isDragActive={cursorDragActive}
            dropzoneText="Drop cursor image or click to add"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAddCursor(f);
                e.currentTarget.value = '';
              }}
            />
            <ControlsRow>
              <TrashButton
                onClick={() => handleDeleteCursor(selectedCursor)}
                title="Remove selected cursor"
              />
              <ControlsRowRight>
                <Checkbox
                  label="@2x"
                  checked={cursor2x}
                  onChange={(checked) => setCursor2x(checked)}
                />
                <Button
                  variant="primary"
                  onClick={() =>
                    console.log('Apply cursor', cursors[selectedCursor], {
                      cursor2x,
                    })
                  }
                >
                  Apply
                </Button>
              </ControlsRowRight>
            </ControlsRow>
          </Uploader>
        </CardBody>
      </Card>

      {/* Cursor Trail Section */}
      <Card>
        <CardHeader>
          <CardTitle icon="accent">Cursor Trail</CardTitle>
        </CardHeader>
        <CardBody>
          <CarouselRow>
            <IconButton
              direction="prev"
              onClick={handlePrevTrail}
              disabled={isAnimatingTrail}
            />
            <Carousel isAnimating={isAnimatingTrail}>
              {getVisible(trails, selectedTrail).map((it) => (
                <CarouselItem
                  key={it.id + it.position}
                  item={it}
                  position={it.position}
                  isAnimating={isAnimatingTrail}
                  slideDirection={trailSlideDir}
                  showLabel={true}
                  currentIndex={selectedTrail}
                  totalItems={trails.length}
                />
              ))}
            </Carousel>
            <IconButton
              direction="next"
              onClick={handleNextTrail}
              disabled={isAnimatingTrail}
            />
          </CarouselRow>

          <Uploader
            onDrop={onTrailDrop}
            onClick={() => trailInputRef.current?.click()}
            isDragActive={trailDragActive}
            dropzoneText="Drop trail image or click to add"
          >
            <input
              ref={trailInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAddTrail(f);
                e.currentTarget.value = '';
              }}
            />
            <ControlsRow>
              <TrashButton
                onClick={() => handleDeleteTrail(selectedTrail)}
                title="Remove selected trail"
              />
              <ControlsRowRight>
                <Checkbox
                  label="@2x"
                  checked={trail2x}
                  onChange={(checked) => setTrail2x(checked)}
                />
                <Checkbox
                  label="cursormiddle"
                  checked={useCursorMiddle}
                  onChange={(checked) => setUseCursorMiddle(checked)}
                />
                <Button
                  variant="primary"
                  onClick={() =>
                    console.log('Apply trail', trails[selectedTrail], {
                      trail2x,
                      useCursorMiddle,
                    })
                  }
                >
                  Apply
                </Button>
              </ControlsRowRight>
            </ControlsRow>
          </Uploader>
        </CardBody>
      </Card>
    </div>
  );
}
