import React, { useState } from 'react';
import './hitcircle.css';

type MediaItem = { id: number; name: string; preview: string };

const demoHitCircles: MediaItem[] = [
  { id: 1, name: 'hitcircle-1', preview: '/pink-circle-osu.jpg' },
  { id: 2, name: 'hitcircle-2', preview: '/blue-circle-osu.jpg' },
  { id: 3, name: 'hitcircle-3', preview: '/white-circle-osu.jpg' },
];

const demoOverlays: MediaItem[] = [
  { id: 1, name: 'overlay-1', preview: '/circle-overlay-ring.jpg' },
  { id: 2, name: 'overlay-2', preview: '/circle-overlay-glow.jpg' },
  { id: 3, name: 'overlay-3', preview: '/circle-overlay-simple.jpg' },
];

// Default presets removed — handled outside this editor

function getVisible(items: MediaItem[], index: number): Array<MediaItem & { position: 'prev' | 'center' | 'next' }> {
  const total = items.length;
  const prev = (index - 1 + total) % total;
  const next = (index + 1) % total;
  return [
    { ...items[prev], position: 'prev' },
    { ...items[index], position: 'center' },
    { ...items[next], position: 'next' },
  ];
}

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

  const fileRefCircle = React.useRef<HTMLInputElement | null>(null);
  const fileRefOverlay = React.useRef<HTMLInputElement | null>(null);

  const prevCircle = () => {
    if (isAnimatingCircle) return;
    setCircleSlideDir('right');
    setIsAnimatingCircle(true);
    setSelectedCircle((s) => (s === 0 ? hitcircles.length - 1 : s - 1));
    setTimeout(() => setIsAnimatingCircle(false), 300);
  };
  const nextCircle = () => {
    if (isAnimatingCircle) return;
    setCircleSlideDir('left');
    setIsAnimatingCircle(true);
    setSelectedCircle((s) => (s === hitcircles.length - 1 ? 0 : s + 1));
    setTimeout(() => setIsAnimatingCircle(false), 300);
  };

  const prevOverlay = () => {
    if (isAnimatingOverlay) return;
    setOverlaySlideDir('right');
    setIsAnimatingOverlay(true);
    setSelectedOverlay((s) => (s === 0 ? overlays.length - 1 : s - 1));
    setTimeout(() => setIsAnimatingOverlay(false), 300);
  };
  const nextOverlay = () => {
    if (isAnimatingOverlay) return;
    setOverlaySlideDir('left');
    setIsAnimatingOverlay(true);
    setSelectedOverlay((s) => (s === overlays.length - 1 ? 0 : s + 1));
    setTimeout(() => setIsAnimatingOverlay(false), 300);
  };

  const addHitcircle = (file?: File) => {
    if (!file) return;
    const item = { id: hitcircles.length + 1, name: file.name || `hitcircle-${hitcircles.length + 1}`, preview: URL.createObjectURL(file) };
    setHitcircles((s) => [...s, item]);
  };
  const addOverlay = (file?: File) => {
    if (!file) return;
    const item = { id: overlays.length + 1, name: file.name || `overlay-${overlays.length + 1}`, preview: URL.createObjectURL(file) };
    setOverlays((s) => [...s, item]);
  };

  const onDropCircle = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type.startsWith('image/')) addHitcircle(f);
  };
  const onDropOverlay = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type.startsWith('image/')) addOverlay(f);
  };

  // use the top-level `getVisible` helper

  return (
    <div className="hitcircle-editor page">
      <div className="layout-top">
        <section className="card preview-card">
          <div className="card-body preview-area">
            <div className="preview-combined">
              <img src={hitcircles[selectedCircle]?.preview} alt="hitcircle" className="preview-base" />
              <img src={overlays[selectedOverlay]?.preview} alt="overlay" className="preview-overlay" />
              <div className="preview-number">1</div>
            </div>
            <div className="preview-controls">
              <label className="checkbox">
                <input type="checkbox" checked={use2x} onChange={(e) => setUse2x(e.target.checked)} />
                <span>@2x</span>
              </label>
              <button className="btn primary" onClick={() => console.log('Apply hitcircle, hitcircle overlay', { hitcircle: hitcircles[selectedCircle], overlay: overlays[selectedOverlay] }, { use2x })}>Apply</button>
            </div>
          </div>
        </section>
      </div>

      <div className="layout-bottom">
        <section className="card">
          <header className="card-header"><h3 className="card-title">Hit Circle</h3></header>
          <div className="card-body">
            <div className="carousel-row">
              <button className="icon-btn" onClick={prevCircle} aria-label="prev">◀</button>
              <div className="carousel">
                {getVisible(hitcircles, selectedCircle).map((it) => (
                  <div key={it.id + it.position} className={`carousel-item ${it.position} ${circleSlideDir ? `slide-${circleSlideDir}` : ''}`}>
                    <img src={it.preview} alt={it.name} />
                    {it.position === 'center' && <div className="item-label">({selectedCircle + 1}/{hitcircles.length})</div>}
                  </div>
                ))}
              </div>
              <button className="icon-btn" onClick={nextCircle} aria-label="next">▶</button>
            </div>

            <div className="uploader">
              <div className="uploader-controls">
                <button
                  className="trash-btn"
                  title="Remove selected hit circle"
                  onClick={() => {
                    if (hitcircles.length <= 1) {
                      window.alert('At least one hit circle is required.');
                      return;
                    }
                    if (!window.confirm('Remove selected hit circle?')) return;
                    const idx = selectedCircle;
                    try {
                      const url = hitcircles[idx]?.preview;
                      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
                    } catch (e) {
                      // ignore
                    }
                    setHitcircles((s) => s.filter((_, i) => i !== idx));
                    const newIndex = Math.max(0, Math.min(selectedCircle, hitcircles.length - 2));
                    setSelectedCircle(newIndex);
                  }}
                >
                  🗑️
                </button>
                <div className="uploader-controls-right">
                  <label className="checkbox">
                      <input type="checkbox" checked={hitcircles2x} onChange={(e) => setHitcircles2x(e.target.checked)} />
                      <span>@2x</span>
                  </label>
                  <button className="btn primary" onClick={() => console.log('Apply hitcircle', { hitcircle: hitcircles[selectedCircle] }, { hitcircles2x })}>Apply</button>
                </div>
              </div>
              <div className="dropzone" onDragOver={(e) => e.preventDefault()} onDrop={onDropCircle} onClick={() => fileRefCircle.current?.click()}>
                Drop hit circle image or click to add
              </div>
              <input ref={fileRefCircle} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) addHitcircle(f); e.currentTarget.value = ''; }} />
            </div>
          </div>
        </section>

        <section className="card">
          <header className="card-header"><h3 className="card-title">Hit Circle Overlay</h3></header>
          <div className="card-body">
            <div className="carousel-row">
              <button className="icon-btn" onClick={prevOverlay} aria-label="prev-overlay">◀</button>
              <div className="carousel">
                {getVisible(overlays, selectedOverlay).map((it) => (
                  <div key={it.id + it.position} className={`carousel-item ${it.position} ${overlaySlideDir ? `slide-${overlaySlideDir}` : ''}`}>
                    <img src={it.preview} alt={it.name} />
                    {it.position === 'center' && <div className="item-label">({selectedOverlay + 1}/{overlays.length})</div>}
                  </div>
                ))}
              </div>
              <button className="icon-btn" onClick={nextOverlay} aria-label="next-overlay">▶</button>
            </div>

            <div className="uploader">
              <div className="uploader-controls">
                <button
                  className="trash-btn"
                  title="Remove selected overlay"
                  onClick={() => {
                    if (overlays.length <= 1) {
                      window.alert('At least one overlay is required.');
                      return;
                    }
                    if (!window.confirm('Remove selected overlay?')) return;
                    const idx = selectedOverlay;
                    try {
                      const url = overlays[idx]?.preview;
                      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
                    } catch (e) {
                      // ignore
                    }
                    setOverlays((s) => s.filter((_, i) => i !== idx));
                    const newIndex = Math.max(0, Math.min(selectedOverlay, overlays.length - 2));
                    setSelectedOverlay(newIndex);
                  }}
                >
                  🗑️
                </button>
                <div className="uploader-controls-right">
                  <label className="checkbox">
                      <input type="checkbox" checked={overlays2x} onChange={(e) => setOverlays2x(e.target.checked)} />
                      <span>@2x</span>
                  </label>
                  <button className="btn primary" onClick={() => console.log('Apply hitcircle overlay', { overlay: overlays[selectedOverlay] }, { overlays2x })}>Apply</button>
                </div>
              </div>
              <div className="dropzone" onDragOver={(e) => e.preventDefault()} onDrop={onDropOverlay} onClick={() => fileRefOverlay.current?.click()}>
                Drop overlay image or click to add
              </div>
              <input ref={fileRefOverlay} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) addOverlay(f); e.currentTarget.value = ''; }} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}