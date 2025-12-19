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
import './hitcircle.css';

// Demo data - replace with actual data loading logic
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
  const [circleSlideDir, setCircleSlideDir] = useState<'left' | 'right' | null>(
    null,
  );
  const [overlaySlideDir, setOverlaySlideDir] = useState<
    'left' | 'right' | null
  >(null);
  const [use2x, setUse2x] = useState(false);

  const fileRefCircle = React.useRef<HTMLInputElement | null>(null);
  const fileRefOverlay = React.useRef<HTMLInputElement | null>(null);

  /**
   * Navigate to previous hit circle with animation
   */
  const handlePrevCircle = () => {
    if (isAnimatingCircle) return;
    setCircleSlideDir('right');
    setIsAnimatingCircle(true);
    setSelectedCircle((s) => (s === 0 ? hitcircles.length - 1 : s - 1));
    setTimeout(() => setIsAnimatingCircle(false), 300);
  };

  /**
   * Navigate to next hit circle with animation
   */
  const handleNextCircle = () => {
    if (isAnimatingCircle) return;
    setCircleSlideDir('left');
    setIsAnimatingCircle(true);
    setSelectedCircle((s) => (s === hitcircles.length - 1 ? 0 : s + 1));
    setTimeout(() => setIsAnimatingCircle(false), 300);
  };

  /**
   * Navigate to previous overlay with animation
   */
  const handlePrevOverlay = () => {
    if (isAnimatingOverlay) return;
    setOverlaySlideDir('right');
    setIsAnimatingOverlay(true);
    setSelectedOverlay((s) => (s === 0 ? overlays.length - 1 : s - 1));
    setTimeout(() => setIsAnimatingOverlay(false), 300);
  };

  /**
   * Navigate to next overlay with animation
   */
  const handleNextOverlay = () => {
    if (isAnimatingOverlay) return;
    setOverlaySlideDir('left');
    setIsAnimatingOverlay(true);
    setSelectedOverlay((s) => (s === overlays.length - 1 ? 0 : s + 1));
    setTimeout(() => setIsAnimatingOverlay(false), 300);
  };

  /**
   * Add new hit circle from file
   */
  const handleAddHitcircle = (file?: File) => {
    if (!file) return;
    const item: MediaItem = {
      id: hitcircles.length + 1,
      name: file.name || `hitcircle-${hitcircles.length + 1}`,
      preview: URL.createObjectURL(file),
    };
    setHitcircles((s) => [...s, item]);
  };

  /**
   * Add new overlay from file
   */
  const handleAddOverlay = (file?: File) => {
    if (!file) return;
    const item: MediaItem = {
      id: overlays.length + 1,
      name: file.name || `overlay-${overlays.length + 1}`,
      preview: URL.createObjectURL(file),
    };
    setOverlays((s) => [...s, item]);
  };

  /**
   * Handle hit circle drop event
   */
  const handleDropCircle = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type.startsWith('image/')) handleAddHitcircle(f);
  };

  /**
   * Handle overlay drop event
   */
  const handleDropOverlay = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type.startsWith('image/')) handleAddOverlay(f);
  };

  /**
   * Delete hit circle at specified index
   */
  const handleDeleteCircle = (index: number) => {
    if (hitcircles.length <= 1) {
      window.alert('At least one hit circle is required.');
      return;
    }
    if (!window.confirm('Remove selected hit circle?')) return;

    try {
      const url = hitcircles[index]?.preview;
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    } catch (e) {
      // ignore
    }

    setHitcircles((s) => s.filter((_, i) => i !== index));
    const newIndex = Math.max(
      0,
      Math.min(selectedCircle, hitcircles.length - 2),
    );
    setSelectedCircle(newIndex);
  };

  /**
   * Delete overlay at specified index
   */
  const handleDeleteOverlay = (index: number) => {
    if (overlays.length <= 1) {
      window.alert('At least one overlay is required.');
      return;
    }
    if (!window.confirm('Remove selected overlay?')) return;

    try {
      const url = overlays[index]?.preview;
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    } catch (e) {
      // ignore
    }

    setOverlays((s) => s.filter((_, i) => i !== index));
    const newIndex = Math.max(
      0,
      Math.min(selectedOverlay, overlays.length - 2),
    );
    setSelectedOverlay(newIndex);
  };

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
              <div className="preview-number">1</div>
            </div>
            <ControlsRowRight>
              <Checkbox label="@2x" checked={use2x} onChange={setUse2x} />
              <Button
                variant="primary"
                onClick={() =>
                  console.log(
                    'Apply hitcircle, hitcircle overlay',
                    {
                      hitcircle: hitcircles[selectedCircle],
                      overlay: overlays[selectedOverlay],
                    },
                    { use2x },
                  )
                }
              >
                Apply
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
              <IconButton
                direction="prev"
                onClick={handlePrevCircle}
                disabled={isAnimatingCircle}
              />
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
              <IconButton
                direction="next"
                onClick={handleNextCircle}
                disabled={isAnimatingCircle}
              />
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
                <TrashButton
                  onClick={() => handleDeleteCircle(selectedCircle)}
                  title="Remove selected hit circle"
                />
                <ControlsRowRight>
                  <Checkbox
                    label="@2x"
                    checked={hitcircles2x}
                    onChange={setHitcircles2x}
                  />
                  <Button
                    variant="primary"
                    onClick={() =>
                      console.log(
                        'Apply hitcircle',
                        {
                          hitcircle: hitcircles[selectedCircle],
                        },
                        { hitcircles2x },
                      )
                    }
                  >
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
              <IconButton
                direction="prev"
                onClick={handlePrevOverlay}
                disabled={isAnimatingOverlay}
              />
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
              <IconButton
                direction="next"
                onClick={handleNextOverlay}
                disabled={isAnimatingOverlay}
              />
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
                <TrashButton
                  onClick={() => handleDeleteOverlay(selectedOverlay)}
                  title="Remove selected overlay"
                />
                <ControlsRowRight>
                  <Checkbox
                    label="@2x"
                    checked={overlays2x}
                    onChange={setOverlays2x}
                  />
                  <Button
                    variant="primary"
                    onClick={() =>
                      console.log(
                        'Apply hitcircle overlay',
                        {
                          overlay: overlays[selectedOverlay],
                        },
                        { overlays2x },
                      )
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
    </div>
  );
}
