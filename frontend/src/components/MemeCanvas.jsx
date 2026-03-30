import React, { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import html2canvas from 'html2canvas';

// Fixed canvas dimensions — single source of truth
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

// Snap positions in pixels
const SNAP_ZONES_Y = [CANVAS_HEIGHT * 0.10, CANVAS_HEIGHT * 0.50, CANVAS_HEIGHT * 0.85];
const SNAP_X = CANVAS_WIDTH / 2;
const SNAP_PX = 12;

const MemeCanvas = forwardRef(({ templateUrl, topText, bottomText, onTopTextChange, onBottomTextChange, topTextStyle, bottomTextStyle }, ref) => {
  const captureRef = useRef(null);

  // Pixel positions (default: centered top and bottom)
  const [topPos, setTopPos] = useState({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT * 0.10 });
  const [bottomPos, setBottomPos] = useState({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT * 0.85 });

  const [dragging, setDragging] = useState(null);
  const [editing, setEditing] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [snapGuide, setSnapGuide] = useState(null);
  const rafRef = useRef(null);
  const pendingPos = useRef(null);

  // Reset positions on template change
  useEffect(() => {
    setTopPos({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT * 0.10 });
    setBottomPos({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT * 0.85 });
  }, [templateUrl]);

  // Expose pixel-perfect download
  useImperativeHandle(ref, () => ({
    downloadAsImage: async () => {
      if (!captureRef.current) return;

      await document.fonts.ready;

      // Hide UI-only elements
      const hints = captureRef.current.querySelectorAll('[data-hint]');
      const rings = captureRef.current.querySelectorAll('[data-ring]');
      hints.forEach(el => { el.style.display = 'none'; });
      rings.forEach(el => {
        el.dataset.prevBg = el.style.background || '';
        el.dataset.prevBoxShadow = el.style.boxShadow || '';
        el.style.background = 'transparent';
        el.style.boxShadow = 'none';
      });

      try {
        const canvas = await html2canvas(captureRef.current, {
          useCORS: true,
          scale: 2,
          backgroundColor: null,
          logging: false,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
        });
        const link = document.createElement('a');
        link.download = 'knownow-meme.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      } finally {
        hints.forEach(el => { el.style.display = ''; });
        rings.forEach(el => {
          el.style.background = el.dataset.prevBg || '';
          el.style.boxShadow = el.dataset.prevBoxShadow || '';
          delete el.dataset.prevBg;
          delete el.dataset.prevBoxShadow;
        });
      }
    }
  }));

  // --- Drag handlers (pixel-based) ---
  const handleMouseDown = useCallback((which, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!captureRef.current) return;
    const rect = captureRef.current.getBoundingClientRect();
    const scale = CANVAS_WIDTH / rect.width; // handle visual scaling
    const currentPos = which === 'top' ? topPos : bottomPos;
    setDragOffset({
      x: (e.clientX - rect.left) * scale - currentPos.x,
      y: (e.clientY - rect.top) * scale - currentPos.y,
    });
    setDragging(which);
    setSnapGuide(null);
  }, [topPos, bottomPos]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !captureRef.current) return;
    const rect = captureRef.current.getBoundingClientRect();
    const scale = CANVAS_WIDTH / rect.width;

    let newX = (e.clientX - rect.left) * scale - dragOffset.x;
    let newY = (e.clientY - rect.top) * scale - dragOffset.y;

    // Clamp
    newX = Math.max(20, Math.min(CANVAS_WIDTH - 20, newX));
    newY = Math.max(20, Math.min(CANVAS_HEIGHT - 20, newY));

    // Snap
    let guide = null;
    if (Math.abs(newX - SNAP_X) < SNAP_PX) {
      newX = SNAP_X;
      guide = { xPx: SNAP_X };
    }
    for (const snapY of SNAP_ZONES_Y) {
      if (Math.abs(newY - snapY) < SNAP_PX) {
        newY = snapY;
        guide = { ...(guide || {}), yPx: snapY };
        break;
      }
    }
    setSnapGuide(guide);

    pendingPos.current = { x: newX, y: newY };
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        if (pendingPos.current) {
          const pos = pendingPos.current;
          if (dragging === 'top') setTopPos(pos);
          else setBottomPos(pos);
        }
        rafRef.current = null;
      });
    }
  }, [dragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (pendingPos.current && dragging) {
      const pos = pendingPos.current;
      if (dragging === 'top') setTopPos(pos);
      else setBottomPos(pos);
      pendingPos.current = null;
    }
    setDragging(null);
    setSnapGuide(null);
  }, [dragging]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // --- Pure inline style builder (px only, no transforms) ---
  const buildStyle = (ts) => ({
    fontFamily: ts.fontFamily || "'Impact', 'Arial Black', sans-serif",
    fontSize: `${ts.fontSize || 28}px`,
    color: ts.color || '#FFFFFF',
    fontWeight: ts.bold !== false ? '900' : '400',
    textAlign: 'center',
    WebkitTextStroke: ts.stroke === true
      ? (ts.color === '#FFFFFF' ? '2px #000' : '1.5px rgba(0,0,0,0.6)')
      : '0px transparent',
    textShadow: ts.stroke === true
      ? '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)'
      : 'none',
    textTransform: 'uppercase',
    lineHeight: '1.15',
    letterSpacing: '0.5px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    userSelect: 'none',
  });

  // Text width in px (80% of canvas)
  const TEXT_WIDTH = CANVAS_WIDTH * 0.80;

  // --- Render text overlay (pure px, no transforms) ---
  const renderTextOverlay = (which, pos, text, onChange, elemStyle) => {
    const isEditing = editing === which;
    const isDragging = dragging === which;
    const computedStyle = buildStyle(elemStyle);

    return (
      <div
        key={which}
        style={{
          position: 'absolute',
          left: `${pos.x - TEXT_WIDTH / 2}px`,
          top: `${pos.y}px`,
          width: `${TEXT_WIDTH}px`,
          zIndex: isDragging ? 20 : 10,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={(e) => handleMouseDown(which, e)}
        onDoubleClick={(e) => { e.stopPropagation(); setEditing(which); }}
      >
        <div
          data-ring="true"
          style={{
            position: 'relative',
            padding: '4px 12px',
            borderRadius: '8px',
            background: isEditing ? 'rgba(0,0,0,0.2)' : isDragging ? 'rgba(0,0,0,0.1)' : 'transparent',
            boxShadow: isEditing
              ? '0 0 0 2px rgba(168,85,247,0.8), 0 0 0 4px rgba(168,85,247,0.2)'
              : isDragging
                ? '0 0 0 2px rgba(96,165,250,0.6)'
                : 'none',
            transition: 'box-shadow 0.15s ease, background 0.15s ease',
          }}
        >
          {isEditing ? (
            <textarea
              autoFocus
              value={text}
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => setEditing(null)}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditing(null); }}
              rows={2}
              style={{
                ...computedStyle,
                cursor: 'text',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: '100%',
                resize: 'none',
              }}
            />
          ) : (
            <span style={{ ...computedStyle, display: 'block' }}>
              {text || (which === 'top' ? 'TOP TEXT' : 'BOTTOM TEXT')}
            </span>
          )}
        </div>
        {!isDragging && !isEditing && (
          <div data-hint="true" style={{
            textAlign: 'center', fontSize: '8px', color: 'rgba(255,255,255,0.35)',
            marginTop: '4px', pointerEvents: 'none', fontWeight: 500,
          }}>
            drag · double-click to edit
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      {/* Scaling wrapper — visually fits the panel, but internal canvas is fixed size */}
      <div style={{
        width: '100%',
        maxWidth: `${CANVAS_WIDTH}px`,
        position: 'relative',
        aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.3)',
      }}>
        {/* The capture target — exactly CANVAS_WIDTH x CANVAS_HEIGHT */}
        <div
          ref={captureRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            transformOrigin: 'top left',
            // Scale to fit the wrapper width
            transform: 'scale(var(--canvas-scale, 1))',
          }}
          onClick={() => { if (!dragging) setEditing(null); }}
        >
          {templateUrl && (
            <img
              src={templateUrl}
              alt="Meme template"
              style={{
                position: 'absolute', inset: 0,
                width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px`,
                objectFit: 'contain', pointerEvents: 'none',
              }}
              draggable={false}
              crossOrigin="anonymous"
            />
          )}

          {!templateUrl && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 500 }}>Select a template to begin</p>
            </div>
          )}

          {renderTextOverlay('top', topPos, topText, onTopTextChange, topTextStyle)}
          {renderTextOverlay('bottom', bottomPos, bottomText, onBottomTextChange, bottomTextStyle)}
        </div>

        {/* Scale observer — sets the CSS variable for visual scaling */}
        <ScaleObserver canvasWidth={CANVAS_WIDTH} />

        {/* Snap guides (visual only, outside capture) */}
        {dragging && snapGuide && (
          <>
            {snapGuide.xPx !== undefined && (
              <div style={{
                position: 'absolute', top: 0, bottom: 0, width: '1px', zIndex: 30, pointerEvents: 'none',
                left: `${(snapGuide.xPx / CANVAS_WIDTH) * 100}%`,
                background: 'linear-gradient(to bottom, transparent, rgba(168,85,247,0.6), transparent)',
                boxShadow: '0 0 6px rgba(168,85,247,0.4)',
              }} />
            )}
            {snapGuide.yPx !== undefined && (
              <div style={{
                position: 'absolute', left: 0, right: 0, height: '1px', zIndex: 30, pointerEvents: 'none',
                top: `${(snapGuide.yPx / CANVAS_HEIGHT) * 100}%`,
                background: 'linear-gradient(to right, transparent, rgba(168,85,247,0.6), transparent)',
                boxShadow: '0 0 6px rgba(168,85,247,0.4)',
              }} />
            )}
          </>
        )}
      </div>
    </div>
  );
});

// Observer component that measures the wrapper and sets the scale CSS variable
function ScaleObserver({ canvasWidth }) {
  const observerRef = useRef(null);

  useEffect(() => {
    const wrapper = observerRef.current?.parentElement;
    if (!wrapper) return;

    const update = () => {
      const scale = wrapper.offsetWidth / canvasWidth;
      wrapper.style.setProperty('--canvas-scale', scale.toString());
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [canvasWidth]);

  return <div ref={observerRef} style={{ display: 'none' }} />;
}

MemeCanvas.displayName = 'MemeCanvas';

export default MemeCanvas;
