import React, { useState } from 'react';
import './cursor.css';

type MediaItem = { id: number; name: string; preview: string };

// Demo data - replace with actual data loading logic
const demoCursors: MediaItem[] = [
  { id: 1, name: 'cursor-1', preview: '/pink-circle-cursor.jpg' },
  
];

const demoTrails: MediaItem[] = [
  { id: 1, name: 'cursortrail-1', preview: '/pink-trail-effect.jpg' },

];

function getVisible(items: MediaItem[], index: number) {
  const total = items.length;
  const prev = (index - 1 + total) % total;
  const next = (index + 1) % total;
  return [
    { ...items[prev], position: 'prev' },
    { ...items[index], position: 'center' },
    { ...items[next], position: 'next' },
  ];
}

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
  const [cursorSlideDir, setCursorSlideDir] = useState<'left' | 'right'>('right');
  const [trailSlideDir, setTrailSlideDir] = useState<'left' | 'right'>('right');

  const prev = (arr: any[], idx: number, set: (v: number) => void, setDir: (d: 'left' | 'right') => void, isAnimating: boolean, setAnimating: (v: boolean) => void) => {
    if (isAnimating) return;
    setAnimating(true);
    setDir('right');
    set((idx - 1 + arr.length) % arr.length);
    setTimeout(() => setAnimating(false), 300);
  };
  const next = (arr: any[], idx: number, set: (v: number) => void, setDir: (d: 'left' | 'right') => void, isAnimating: boolean, setAnimating: (v: boolean) => void) => {
    if (isAnimating) return;
    setAnimating(true);
    setDir('left');
    set((idx + 1) % arr.length);
    setTimeout(() => setAnimating(false), 300);
  };

  const handleAddCursor = (file?: File) => {
    if (!file) return;
    const newItem: MediaItem = { id: cursors.length + 1, name: file.name || `cursor-${cursors.length + 1}`, preview: URL.createObjectURL(file) };
    setCursors((s) => [...s, newItem]);
  };
  const handleAddTrail = (file?: File) => {
    if (!file) return;
    const newItem: MediaItem = { id: trails.length + 1, name: file.name || `trail-${trails.length + 1}`, preview: URL.createObjectURL(file) };
    setTrails((s) => [...s, newItem]);
  };

  const onCursorDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setCursorDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) handleAddCursor(file);
  };

  const onTrailDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setTrailDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) handleAddTrail(file);
  };

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const trailInputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className="cursor-editor grid two-col page">
      <section className="card">
        <header className="card-header">
          <h3 className="card-title"><span className="dot" /> Cursor</h3>
        </header>
        <div className="card-body">
          <div className="carousel-row">
            <button className="icon-btn" onClick={() => prev(cursors, selectedCursor, setSelectedCursor, setCursorSlideDir, isAnimatingCursor, setIsAnimatingCursor)} aria-label="prev">◀</button>
            <div className="carousel">
              {getVisible(cursors, selectedCursor).map((it) => (
                <div key={it.id + it.position} className={`carousel-item ${it.position} ${isAnimatingCursor ? `slide-${cursorSlideDir}` : ''}`}>
                  <img src={it.preview} alt={it.name} />
                  {it.position === 'center' && <div className="item-label">({selectedCursor + 1}/{cursors.length})</div>}
                </div>
              ))}
            </div>
            <button className="icon-btn" onClick={() => next(cursors, selectedCursor, setSelectedCursor, setCursorSlideDir, isAnimatingCursor, setIsAnimatingCursor)} aria-label="next">▶</button>
          </div>

          <div className="row-between">
            <button
              className="trash-btn"
              title="Remove selected cursor"
              onClick={() => {
                if (cursors.length <= 1) {
                  window.alert('At least one cursor is required. Cannot delete the last image.');
                  return;
                }
                if (!window.confirm('Remove selected cursor?')) return;
                const idx = selectedCursor;
                try {
                  const url = cursors[idx]?.preview;
                  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
                } catch (e) {
                  // ignore
                }
                setCursors((s) => s.filter((_, i) => i !== idx));
                const newIndex = Math.max(0, Math.min(selectedCursor, cursors.length - 2));
                setSelectedCursor(newIndex);
              }}
            >
              🗑️
            </button>
            <div className="controls-right">
              <label className="checkbox">
                <input type="checkbox" checked={cursor2x} onChange={(e) => setCursor2x(e.target.checked)} />
                <span>@2x</span>
              </label>
              <button className="btn primary" onClick={() => console.log('Apply cursor', cursors[selectedCursor], { cursor2x })}>Apply</button>
            </div>
          </div>

          <div className="uploader">
            <div
              className={`dropzone ${cursorDragActive ? 'active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setCursorDragActive(true); }}
              onDragLeave={() => setCursorDragActive(false)}
              onDrop={onCursorDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="dropzone-text">Drop cursor image or click to add</div>
            </div>
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
          </div>
        </div>
      </section>

      <section className="card">
        <header className="card-header">
          <h3 className="card-title"><span className="dot accent" /> Cursor Trail</h3>
        </header>
        <div className="card-body">
          <div className="carousel-row">
            <button className="icon-btn" onClick={() => prev(trails, selectedTrail, setSelectedTrail, setTrailSlideDir, isAnimatingTrail, setIsAnimatingTrail)} aria-label="prev-trail">◀</button>
            <div className="carousel">
              {getVisible(trails, selectedTrail).map((it) => (
                <div key={it.id + it.position} className={`carousel-item ${it.position} ${isAnimatingTrail ? `slide-${trailSlideDir}` : ''}`}>
                  <img src={it.preview} alt={it.name} />
                  {it.position === 'center' && <div className="item-label">({selectedTrail + 1}/{trails.length})</div>}
                </div>
              ))}
            </div>
            <button className="icon-btn" onClick={() => next(trails, selectedTrail, setSelectedTrail, setTrailSlideDir, isAnimatingTrail, setIsAnimatingTrail)} aria-label="next-trail">▶</button>
          </div>

          <div className="row-between">
            <button
              className="trash-btn"
              title="Remove selected trail"
              onClick={() => {
                if (trails.length <= 1) {
                  window.alert('At least one trail image is required. Cannot delete the last image.');
                  return;
                }
                if (!window.confirm('Remove selected trail?')) return;
                const idx = selectedTrail;
                try {
                  const url = trails[idx]?.preview;
                  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
                } catch (e) {
                  // ignore
                }
                setTrails((s) => s.filter((_, i) => i !== idx));
                const newIndex = Math.max(0, Math.min(selectedTrail, trails.length - 2));
                setSelectedTrail(newIndex);
              }}
            >
              🗑️
            </button>
            <div className="controls-right">
              <label className="checkbox">
                <input type="checkbox" checked={trail2x} onChange={(e) => setTrail2x(e.target.checked)} />
                <span>@2x</span>
              </label>
              <label className="checkbox">
                <input type="checkbox" checked={useCursorMiddle} onChange={(e) => setUseCursorMiddle(e.target.checked)} />
                <span>cursormiddle</span>
              </label>
              <button className="btn primary" onClick={() => console.log('Apply trail', trails[selectedTrail], { trail2x, useCursorMiddle })}>Apply</button>
            </div>
          </div>

          <div className="uploader">
            <div
              className={`dropzone ${trailDragActive ? 'active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setTrailDragActive(true); }}
              onDragLeave={() => setTrailDragActive(false)}
              onDrop={onTrailDrop}
              onClick={() => trailInputRef.current?.click()}
            >
              <div className="dropzone-text">Drop trail image or click to add</div>
            </div>
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
          </div>
        </div>
      </section>
    </div>
  );
}
