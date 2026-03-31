import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Text, Image as KonvaImage, Line, Group, Circle } from "react-konva";

const MAX_WIDTH = 500;
const MAX_HEIGHT = 500;
const SNAP_THRESHOLD = 15;

function useImage(url) {
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = url;

    img.onload = () => setImage(img);
  }, [url]);

  return image;
}

const MemeCanvas = forwardRef(({ templateUrl, texts, setTexts, topTextStyle, bottomTextStyle }, ref) => {
  const stageRef = useRef(null);
  const image = useImage(templateUrl);

  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 });
  const [animatedSize, setAnimatedSize] = useState({ width: 500, height: 500 });
  
  const [showGuides, setShowGuides] = useState(true);
  const [guides, setGuides] = useState({ vertical: null, horizontal: null });
  const [hoveredTextId, setHoveredTextId] = useState(null);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const textRefs = useRef({});

  // Update canvas size when image loads
  useEffect(() => {
    if (image) {
      const originalWidth = image.width;
      const originalHeight = image.height;
      
      const ratio = Math.min(MAX_WIDTH / originalWidth, MAX_HEIGHT / originalHeight);
      const scaledWidth = originalWidth * ratio;
      const scaledHeight = originalHeight * ratio;
      
      const oldHeight = canvasSize.height;
      setCanvasSize({ width: scaledWidth, height: scaledHeight });
      
      // Proportional scaling for all text positions
      if (oldHeight > 0) {
        setTexts(prev => prev.map(t => ({
          ...t,
          y: t.y * (scaledHeight / oldHeight)
        })));
      }
    }
  }, [image]);

  // Handle Dimension Animation
  useEffect(() => {
    const duration = 400;
    const startTime = performance.now();
    const startSize = { ...animatedSize };
    const endSize = { ...canvasSize };

    let animationFrame;

    function animate(time) {
      const t = Math.min((time - startTime) / duration, 1);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      setAnimatedSize({
        width: startSize.width + (endSize.width - startSize.width) * ease,
        height: startSize.height + (endSize.height - startSize.height) * ease
      });

      if (t < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    }

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [canvasSize]);

  // Expose pixel-perfect download
  useImperativeHandle(ref, () => ({
    downloadAsImage: async () => {
      if (!stageRef.current) return;
      const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = 'knownow-meme.png';
      link.href = uri;
      link.click();
    },
    getMemeDataURL: async () => {
      if (!stageRef.current) return null;
      return stageRef.current.toDataURL({ pixelRatio: 2 });
    }
  }));

  function handleDragMove(e, id) {
    const node = e.target;
    let x = node.x();
    let y = node.y();

    let newGuides = { vertical: null, horizontal: null };
    const centerX = animatedSize.width / 2;
    const centerY = animatedSize.height / 2;

    if (showGuides) {
      // Vertical center snap
      if (Math.abs(x - 0) < SNAP_THRESHOLD) {
        x = 0;
        newGuides.vertical = animatedSize.width / 2; 
      }

      // Horizontal center/top/bottom snap
      if (Math.abs(y - centerY) < SNAP_THRESHOLD) {
        y = centerY;
        newGuides.horizontal = centerY;
      }
      if (Math.abs(y - animatedSize.height * 0.1) < SNAP_THRESHOLD) {
        y = animatedSize.height * 0.1;
        newGuides.horizontal = animatedSize.height * 0.1;
      }
      if (Math.abs(y - animatedSize.height * 0.85) < SNAP_THRESHOLD) {
        y = animatedSize.height * 0.85;
        newGuides.horizontal = animatedSize.height * 0.85;
      }
    }

    node.position({ x, y });
    setGuides(newGuides);
  }

  function handleDragEnd(id, e) {
    setTexts(prev => prev.map(t => t.id === id ? { ...t, x: e.target.x(), y: e.target.y() } : t));
    setGuides({ vertical: null, horizontal: null });
  }

  const deleteText = (id) => {
    setTexts(prev => prev.filter(t => t.id !== id));
    setHoveredTextId(null);
  };

  const mapStyleToKonva = (style) => {
    return {
      fontFamily: style.fontFamily || "'Impact', sans-serif",
      fontSize: parseInt(style.fontSize) || 28,
      fill: style.color || '#ffffff',
      fontStyle: style.bold !== false ? 'bold' : 'normal',
      align: style.align || 'center',
      stroke: style.stroke ? (style.strokeColor || '#000000') : null,
      strokeWidth: style.stroke ? (style.strokeWidth || 2) : 0,
    };
  };

  const topKonvaStyle = mapStyleToKonva(topTextStyle);
  const bottomKonvaStyle = mapStyleToKonva(bottomTextStyle);

  const getTrashPos = (id) => {
    const node = textRefs.current[id]?.current;
    if (!node || !stageRef.current) return { x: 0, y: 0 };
    
    // Get node base position relative to stage
    // Since width is set to canvasWidth, node is centered by the canvas
    const box = node.getClientRect({ relativeTo: stageRef.current });
    const textWidth = node.getTextWidth();
    const align = node.align();
    
    // Calculate exact X based on alignment
    let iconX;
    if (align === 'center') {
      iconX = box.x + (box.width / 2) + (textWidth / 2) + 14;
    } else if (align === 'right') {
      iconX = box.x + box.width + 12;
    } else { // left
      iconX = box.x + textWidth + 14;
    }
    
    let iconY = box.y + (box.height / 2);
    
    // Edge Case: Prevent icon from going outside canvas right edge
    const canvasWidth = animatedSize.width;
    if (iconX > canvasWidth - 25) {
      // If we're on the right side, flip the icon to the left side of the text
      if (align === 'center') {
        iconX = box.x + (box.width / 2) - (textWidth / 2) - 14;
      } else {
        iconX = box.x - 28;
      }
    }
    
    // Edge Case: Prevent going outside top/bottom
    if (iconY < 15) iconY = 15;
    if (iconY > animatedSize.height - 15) iconY = animatedSize.height - 15;

    return { x: iconX, y: iconY };
  };

  const handleDoubleClick = (e, id) => {
    const textNode = e.target;
    const stage = textNode.getStage();
    const layer = textNode.getLayer();
    const container = stage.container();
    const stageBox = container.getBoundingClientRect();
    const textPosition = textNode.getAbsolutePosition();

    setEditingTextId(id);

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const initialText = textNode.text();
    textarea.value = initialText === 'TOP TEXT' || initialText === 'BOTTOM TEXT' || initialText === 'TEXT' ? '' : initialText;
    
    // Position
    textarea.style.position = 'absolute';
    textarea.style.top = `${stageBox.top + textPosition.y}px`;
    textarea.style.left = `${stageBox.left + textPosition.x}px`;
    textarea.style.width = `${textNode.width() * (stageBox.width / animatedSize.width)}px`;
    textarea.style.height = `${textNode.height() * (stageBox.height / animatedSize.height) + 20}px`;
    
    // Style sync
    textarea.style.fontSize = `${textNode.fontSize() * (stageBox.width / animatedSize.width)}px`;
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.textAlign = textNode.align();
    textarea.style.color = textNode.fill();
    textarea.style.lineHeight = textNode.lineHeight();
    textarea.style.fontStyle = textNode.fontStyle();
    textarea.style.fontWeight = textNode.fontStyle() === 'bold' ? 'bold' : 'normal';
    
    // Reset defaults
    textarea.style.border = 'none';
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'transparent';
    textarea.style.whiteSpace = 'pre-wrap';
    textarea.style.zIndex = '1000';
    textarea.style.transformOrigin = 'top left';

    textarea.focus({ preventScroll: true });

    function removeTextarea(save = true) {
      if (textarea.parentNode) {
        if (save) {
          const newText = textarea.value.trim();
          setTexts(prev => prev.map(t => t.id === id ? { ...t, text: newText } : t));
        }
        window.removeEventListener('click', handleOutsideClick);
        textarea.parentNode.removeChild(textarea);
        setEditingTextId(null);
        layer.batchDraw();
      }
    }

    function handleOutsideClick(event) {
      if (event.target !== textarea) {
        removeTextarea();
      }
    }

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        removeTextarea();
      }
      if (e.key === 'Escape') {
        removeTextarea(false);
      }
    });

    textarea.addEventListener('blur', () => {
      removeTextarea();
    });

    // Handle stage scaling
    setTimeout(() => {
        window.addEventListener('click', handleOutsideClick);
    }, 0);
  };

  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        // The Stage is designed for 500px width.
        // If container is smaller, we scale down.
        const newScale = Math.min(width / animatedSize.width, 1);
        setScale(newScale);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [animatedSize.width]);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center">
      <div style={{
        width: `${animatedSize.width * scale}px`,
        height: `${animatedSize.height * scale}px`,
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          width: `${animatedSize.width}px`, height: `${animatedSize.height}px`,
          transformOrigin: 'top left', 
          transform: `scale(${scale})`,
          opacity: image ? 1 : 0, 
          transition: 'opacity 0.3s'
        }}>
          <Stage 
            width={animatedSize.width} 
            height={animatedSize.height} 
            ref={stageRef}
            onMouseEnter={(e) => {
              const container = e.target.getStage().container();
              container.style.cursor = 'default';
            }}
            onClick={() => setSelectedTextId(null)}
            onTap={() => setSelectedTextId(null)}
          >
            <Layer>
              {image && <KonvaImage image={image} width={animatedSize.width} height={animatedSize.height} />}

              {showGuides && guides.vertical !== null && <Line points={[guides.vertical, 0, guides.vertical, animatedSize.height]} stroke="white" strokeWidth={1} opacity={0.3} />}
              {showGuides && guides.horizontal !== null && <Line points={[0, guides.horizontal, animatedSize.width, guides.horizontal]} stroke="white" strokeWidth={1} opacity={0.3} />}

              {texts.map((t) => {
                const style = t.type === 'bottom' ? bottomKonvaStyle : topKonvaStyle;
                const isHovered = hoveredTextId === t.id;
                const isSelected = selectedTextId === t.id;
                const showTrash = isHovered || isSelected;
                
                if (!textRefs.current[t.id]) textRefs.current[t.id] = React.createRef();

                return (
                  <Group key={t.id}>
                    <Text
                      ref={textRefs.current[t.id]}
                      text={t.text || (t.type === 'top' ? 'TOP TEXT' : t.type === 'single' ? 'TEXT' : 'BOTTOM TEXT')}
                      x={t.x}
                      y={t.y}
                      width={animatedSize.width}
                      draggable={editingTextId !== t.id}
                      visible={editingTextId !== t.id}
                      onDragMove={(e) => handleDragMove(e, t.id)}
                      onDragEnd={(e) => handleDragEnd(t.id, e)}
                      onMouseEnter={(e) => {
                        if (editingTextId === t.id) return;
                        setHoveredTextId(t.id);
                        const container = e.target.getStage().container();
                        container.style.cursor = 'move';
                      }}
                      onMouseLeave={(e) => {
                        setHoveredTextId(null);
                        const container = e.target.getStage().container();
                        container.style.cursor = 'default';
                      }}
                      onClick={(e) => {
                        e.cancelBubble = true;
                        setSelectedTextId(t.id);
                      }}
                      onTap={(e) => {
                        e.cancelBubble = true;
                        setSelectedTextId(t.id);
                      }}
                      onDblClick={(e) => handleDoubleClick(e, t.id)}
                      onDblTap={(e) => handleDoubleClick(e, t.id)}
                      shadowColor={isHovered ? "white" : "transparent"}
                      shadowBlur={10}
                      shadowOpacity={0.4}
                      {...style}
                    />
                    {showTrash && editingTextId !== t.id && (
                      <Group 
                        {...getTrashPos(t.id)}
                        onClick={() => deleteText(t.id)}
                        onTap={() => deleteText(t.id)}
                        onMouseEnter={(e) => {
                          const container = e.target.getStage().container();
                          container.style.cursor = 'pointer';
                          setHoveredTextId(t.id);
                        }}
                        onMouseLeave={(e) => {
                          const container = e.target.getStage().container();
                          container.style.cursor = 'default';
                        }}
                        // Smooth micro-animation props
                        scaleX={isHovered ? 1.05 : 1}
                        scaleY={isHovered ? 1.05 : 1}
                        opacity={1}
                      >
                        <Circle 
                          radius={11} 
                          fill="#111827" 
                          opacity={0.9} 
                          shadowBlur={5} 
                          shadowColor="black" 
                          shadowOpacity={0.2} 
                        />
                        <Text 
                          text="🗑" 
                          fontSize={11} 
                          fill="white" 
                          offsetX={6} 
                          offsetY={6} 
                          align="center"
                        />
                      </Group>
                    )}
                  </Group>
                );
              })}
            </Layer>
          </Stage>
        </div>
        <ScaleObserver canvasWidth={animatedSize.width} />
      </div>

      <div className="mt-4 w-full flex items-center justify-between px-2">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-widest text-gray-400 select-none">
          <input type="checkbox" checked={showGuides} onChange={(e) => setShowGuides(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
          Guides
        </label>
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Double-click to edit · Drag to snap · Use 🗑 to remove</span>
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




