import React, { useState, useEffect, useRef } from 'react';
import BackgroundBlobs from './components/BackgroundBlobs';
import MemeCanvas from './components/MemeCanvas';
import FontSelector from './components/FontSelector';

// ── Helpers ──

const getContextEmoji = (ctx) => {
  const c = (ctx || '').toLowerCase();
  if (c.includes('exam') || c.includes('test')) return '📘';
  if (c.includes('deadline') || c.includes('time')) return '⏰';
  if (c.includes('event') || c.includes('party')) return '🎉';
  if (c.includes('class') || c.includes('school')) return '🏫';
  return '💡';
};
const getToneEmoji = (t) => {
  const l = (t || '').toLowerCase();
  if (l.includes('stress')) return '😰';
  if (l.includes('dramatic')) return '🎭';
  if (l.includes('sarcastic')) return '😏';
  if (l.includes('exaggerated')) return '🤯';
  if (l.includes('relatable')) return '😌';
  return '✨';
};

const TEMPLATES = [
  { id: '181913649', name: 'Drake', url: 'https://i.imgflip.com/30b1gx.jpg', tone: 'sarcastic/relatable', textType: 'double' },
  { id: '112126428', name: 'Distracted BF', url: 'https://i.imgflip.com/1ur9b0.jpg', tone: 'sarcastic/dramatic', textType: 'double' },
  { id: '87743020', name: 'Two Buttons', url: 'https://i.imgflip.com/1g8my4.jpg', tone: 'exaggerated/stress', textType: 'single' },
  { id: '188390779', name: 'Woman Yelling at Cat', url: 'https://i.imgflip.com/345v97.jpg', tone: 'reaction/funny', textType: 'double' },
];

const COLORS = [
  { label: 'White', value: '#FFFFFF' },
  { label: 'Black', value: '#000000' },
  { label: 'Yellow', value: '#FFD700' },
  { label: 'Red', value: '#FF3B30' },
];

const Spinner = ({ text }) => (
  <span className="flex items-center space-x-2 justify-center">
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
    <span>{text}</span>
  </span>
);

// ── Main App ──

function App() {
  const [isDark, setIsDark] = useState(true);
  const [inputText, setInputText] = useState('');
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [context, setContext] = useState('');
  const [tone, setTone] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('181913649');
  const [captions, setCaptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [instantResult, setInstantResult] = useState(null);
  const memeCanvasRef = useRef(null);

  // Independent text style state
  const [activeTextTarget, setActiveTextTarget] = useState('top'); // 'top' | 'bottom'
  const defaultStyle = { fontFamily: 'impact', fontSize: 28, color: '#FFFFFF', bold: true, align: 'center', stroke: true };
  const [topStyle, setTopStyle] = useState({ ...defaultStyle });
  const [bottomStyle, setBottomStyle] = useState({ ...defaultStyle });
  const [previewFont, setPreviewFont] = useState(null); // hover preview

  const activeStyle = activeTextTarget === 'top' ? topStyle : bottomStyle;
  const setActiveStyle = activeTextTarget === 'top' ? setTopStyle : setBottomStyle;
  const updateActiveStyle = (key, value) => setActiveStyle(prev => ({ ...prev, [key]: value }));

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const dark = saved === 'dark' || (!saved && prefersDark);
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const activeTemplate = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];

  const generateCaption = async () => {
    if (!inputText.trim()) { setError('Paste an academic message first.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch('http://localhost:5000/generate-caption', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, textType: activeTemplate.textType || 'double' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Caption generation failed');
      const caps = data.captions || [];
      const isSingle = data.textType === 'single';
      setCaptions(caps);
      setContext(data.context || '');
      if (caps.length > 0) {
        if (isSingle) {
          setTopText(caps[0].text || '');
          setBottomText('');
        } else {
          setTopText(caps[0].topText || '');
          setBottomText(caps[0].bottomText || '');
        }
        setTone(caps[0].tone || '');
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const exportMeme = async () => {
    if (!topText && !bottomText) return;
    if (!memeCanvasRef.current) return;
    setLoading(true); setError(null);
    try {
      await memeCanvasRef.current.downloadAsImage();
    } catch (err) { setError(err.message || 'Export failed'); }
    finally { setLoading(false); }
  };

  // ── Smart Meme Mode ──
  const selectBestTemplate = (detectedTone) => {
    const lowerTone = (detectedTone || '').toLowerCase();
    const matched = TEMPLATES.filter(t => t.tone.toLowerCase().includes(lowerTone));
    if (matched.length > 0) return matched[Math.floor(Math.random() * matched.length)];
    // Fallback: find relatable or first
    return TEMPLATES.find(t => t.tone.includes('relatable')) || TEMPLATES[0];
  };

  const instantMeme = async () => {
    if (!inputText.trim()) { setError('Paste an academic message first.'); return; }
    setLoading(true); setError(null); setInstantResult(null);
    try {
      // Step 1: Generate caption
      const capRes = await fetch('http://localhost:5000/generate-caption', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, textType: 'double' }),
      });
      const capData = await capRes.json();
      if (!capRes.ok) throw new Error(capData.error || 'Caption generation failed');

      const caps = capData.captions || [];
      if (!caps.length) throw new Error('No captions generated');
      const bestCap = caps[0];
      const detectedTone = bestCap.tone || '';

      // Step 2: Select best template based on tone
      const bestTemplate = selectBestTemplate(detectedTone);

      // Step 3: Generate meme image
      const top = bestCap.topText || bestCap.text || '';
      const bottom = bestCap.bottomText || '';
      const memeRes = await fetch('http://localhost:5000/generate-meme', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topText: top, bottomText: bottom, templateId: bestTemplate.id }),
      });
      const memeData = await memeRes.json();
      if (!memeRes.ok) throw new Error(memeData.error || 'Meme generation failed');

      // Apply results to editor state
      setTopText(top);
      setBottomText(bottom);
      setTone(detectedTone);
      setContext(capData.context || '');
      setCaptions(caps);
      setSelectedTemplate(bestTemplate.id);
      setInstantResult({ memeUrl: memeData.memeUrl, tone: detectedTone, templateName: bestTemplate.name });

    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const resolveFont = (id) => (FontSelector.FONTS.find(f => f.id === id) || FontSelector.FONTS[0]).family;

  // Apply hover preview font only to the active target's style
  const applyPreview = (style, target) => {
    const effectiveFont = (previewFont && activeTextTarget === target) ? previewFont : style.fontFamily;
    return { ...style, fontFamily: resolveFont(effectiveFont) };
  };
  const topTextStyle = applyPreview(topStyle, 'top');
  const bottomTextStyle = applyPreview(bottomStyle, 'bottom');

  // ── Render ──
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] font-sans text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <BackgroundBlobs />

      {/* ── Header ── */}
      <header className="fixed top-0 inset-x-0 h-14 backdrop-blur-2xl bg-white/60 dark:bg-[#0B0F19]/70 border-b border-gray-200/40 dark:border-white/[0.06] z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-purple-600 to-blue-500 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">KnowNow</h1>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 hidden sm:inline">AI Meme Editor</span>
        </div>
        <button onClick={toggleTheme} className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      {/* ── Main Layout ── */}
      <main className="pt-20 pb-10 px-4 lg:px-6 max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-6 min-h-screen relative z-10">

        {/* ═══ LEFT PANEL ═══ */}
        <div className="w-full lg:w-[55%] space-y-5 overflow-y-auto pr-1">

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm font-medium flex items-center gap-2 animate-fade-in">
              <span className="shrink-0">⚠️</span> {error}
            </div>
          )}

          {/* Section 1: Input */}
          <section className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-white/[0.06] p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">Input</h2>
            <textarea
              rows="3"
              className="w-full bg-white/70 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm resize-none placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all"
              placeholder="Paste your boring academic update here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="mt-3 flex gap-3">
              <button
                onClick={generateCaption}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading && !instantResult ? <Spinner text="Generating..." /> : 'Generate Captions ✨'}
              </button>
              <button
                onClick={instantMeme}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading && instantResult === null && !captions.length ? <Spinner text="Magic..." /> : '⚡ Instant Meme'}
              </button>
            </div>

            {/* Instant Result Banner */}
            {instantResult && (
              <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-fade-in">
                <img src={instantResult.memeUrl} alt="Instant meme" className="w-16 h-16 rounded-lg object-cover border border-white/10 shadow-sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400">✨ AI selected "{instantResult.templateName}" based on tone: {instantResult.tone}</p>
                  <a href={instantResult.memeUrl} download="knownow-instant.jpg" target="_blank" rel="noreferrer"
                    className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline mt-1 inline-block">Download ↓</a>
                </div>
                <button onClick={() => setInstantResult(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm">✕</button>
              </div>
            )}
          </section>

          {/* Section 2: Caption Options */}
          {captions.length > 0 && (
            <section className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-white/[0.06] p-5 shadow-sm animate-fade-in">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">AI Captions</h2>
                {context && (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {getContextEmoji(context)} {context}
                  </span>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-thin">
                {captions.map((cap, i) => {
                  const isSingleCap = !!cap.text;
                  const capTop = isSingleCap ? cap.text : cap.topText;
                  const capBottom = isSingleCap ? '' : cap.bottomText;
                  const isActive = topText === capTop && bottomText === capBottom;
                  return (
                    <button
                      key={i}
                      onClick={() => { setTopText(capTop); setBottomText(capBottom); setTone(cap.tone); }}
                      className={`snap-start shrink-0 w-56 p-3.5 rounded-xl border text-left flex flex-col gap-2 transition-all duration-200 outline-none ${
                        isActive
                          ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                          : 'bg-white/40 dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.06] hover:border-purple-400/50 hover:-translate-y-0.5'
                      }`}
                    >
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">"{capTop}"</p>
                      {capBottom && <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">"{capBottom}"</p>}
                      <span className="mt-auto text-[9px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded w-fit">
                        {getToneEmoji(cap.tone)} {cap.tone}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Section 3: Text Controls */}
          <section className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-white/[0.06] p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">Text Controls</h2>
            <div className="space-y-4">

              {/* Text inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Top Text</label>
                  <textarea rows="2" value={topText} onChange={(e) => setTopText(e.target.value)} onFocus={() => setActiveTextTarget('top')}
                    className="w-full bg-white/70 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Bottom Text</label>
                  <textarea rows="2" value={bottomText} onChange={(e) => setBottomText(e.target.value)} onFocus={() => setActiveTextTarget('bottom')}
                    className="w-full bg-white/70 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all outline-none resize-none" />
                </div>
              </div>

              {/* Target toggle */}
              <div className="flex rounded-xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
                {['top', 'bottom'].map(target => (
                  <button key={target} onClick={() => setActiveTextTarget(target)}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                      activeTextTarget === target
                        ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/40 dark:hover:bg-white/[0.03]'
                    }`}>
                    {target === 'top' ? '▲ Top Text' : '▼ Bottom Text'}
                  </button>
                ))}
              </div>

              {/* Style Presets */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Quick Presets</label>
                <div className="flex gap-2">
                  {[
                    { label: '🎯 Classic', style: { fontFamily: 'impact', fontSize: 32, color: '#FFFFFF', bold: true, align: 'center', stroke: true } },
                    { label: '✨ Modern', style: { fontFamily: 'montserrat', fontSize: 24, color: '#FFFFFF', bold: true, align: 'center', stroke: false } },
                    { label: '🔥 Bold Drama', style: { fontFamily: 'bebas', fontSize: 36, color: '#FFD700', bold: true, align: 'center', stroke: true } },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => setActiveStyle(prev => ({ ...prev, ...preset.style }))}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.03] text-gray-600 dark:text-gray-300 hover:border-purple-400/50 hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 hover:-translate-y-0.5 active:scale-95 transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Font Size — {activeStyle.fontSize}px</label>
                <input type="range" min="16" max="48" value={activeStyle.fontSize} onChange={(e) => updateActiveStyle('fontSize', +e.target.value)}
                  className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-white/10 accent-purple-500 cursor-pointer" />
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Font</label>
                <FontSelector
                  selected={activeStyle.fontFamily}
                  onSelect={(id) => { setPreviewFont(null); updateActiveStyle('fontFamily', id); }}
                  onHover={(id) => setPreviewFont(id)}
                  onHoverEnd={() => setPreviewFont(null)}
                />
              </div>

              {/* Color + Bold + Align row */}
              <div className="flex items-end gap-4 flex-wrap">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Color</label>
                  <div className="flex gap-2">
                    {COLORS.map(c => (
                      <button key={c.value} onClick={() => updateActiveStyle('color', c.value)} title={c.label}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${activeStyle.color === c.value ? 'border-purple-500 scale-110 shadow-lg' : 'border-gray-300 dark:border-white/20 hover:scale-105'}`}
                        style={{ backgroundColor: c.value }} />
                    ))}
                  </div>
                </div>
                <button onClick={() => updateActiveStyle('bold', !activeStyle.bold)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-black border transition-all ${activeStyle.bold ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400' : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500'}`}>
                  B
                </button>
                <button onClick={() => updateActiveStyle('stroke', !activeStyle.stroke)}
                  title="Text stroke"
                  className={`px-3 py-1.5 rounded-lg text-sm font-black border transition-all ${activeStyle.stroke ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400' : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500'}`}>
                  S
                </button>
                <div className="flex rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
                  {['left', 'center', 'right'].map(a => (
                    <button key={a} onClick={() => updateActiveStyle('align', a)}
                      className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${activeStyle.align === a ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                      {a === 'left' ? '◧' : a === 'center' ? '⬒' : '◨'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Templates */}
          <section className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-white/[0.06] p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">Templates</h2>
            <div className="grid grid-cols-4 gap-3">
              {TEMPLATES.map(tmpl => (
                <button key={tmpl.id} onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all duration-200 group focus:outline-none ${
                    selectedTemplate === tmpl.id
                      ? 'border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.35)] scale-[1.04]'
                      : 'border-transparent hover:border-purple-400/40'
                  }`}>
                  <img src={tmpl.url} alt={tmpl.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" draggable={false} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-[9px] text-white font-bold truncate">{tmpl.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* ═══ RIGHT PANEL: LIVE CANVAS ═══ */}
        <div className="w-full lg:w-[45%] lg:sticky lg:top-20 h-fit">
          <div className="relative group">
            {/* Ambient glow */}
            <div className={`absolute -inset-px rounded-[26px] blur-xl transition-opacity duration-700 pointer-events-none ${
              instantResult ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 opacity-60' : 'bg-gradient-to-br from-purple-500/30 to-blue-500/30 opacity-0 group-hover:opacity-100'
            }`} />

            <div className="relative bg-white/50 dark:bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-gray-200/50 dark:border-white/[0.06] shadow-2xl dark:shadow-purple-500/5 p-5 flex flex-col">

              {/* Canvas Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Canvas</h2>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                {tone && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/20">
                    {getToneEmoji(tone)} {tone}
                  </span>
                )}
              </div>

              {/* AI Generated Banner */}
              {instantResult && (
                <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 animate-fade-in">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        ✨ AI generated this meme — feel free to edit and customize!
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Template: <span className="font-semibold">{instantResult.templateName}</span> · Tone: <span className="font-semibold">{instantResult.tone}</span>
                      </p>
                    </div>
                    <button onClick={() => setInstantResult(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs shrink-0 mt-0.5">✕</button>
                  </div>
                </div>
              )}

              {/* The Canvas */}
              <MemeCanvas
                ref={memeCanvasRef}
                templateUrl={activeTemplate?.url}
                topText={topText}
                bottomText={bottomText}
                onTopTextChange={(v) => { setTopText(v); }}
                onBottomTextChange={(v) => { setBottomText(v); }}
                topTextStyle={topTextStyle}
                bottomTextStyle={bottomTextStyle}
              />

              {/* Actions */}
              <div className={`mt-5 grid gap-3 ${instantResult ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <button
                  onClick={exportMeme}
                  disabled={loading || (!topText && !bottomText)}
                  className="py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-sm hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg"
                >
                  {loading && captions.length ? <Spinner text="Exporting..." /> : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Export
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(`${topText}\n${bottomText}`)}
                  className="py-3 rounded-xl bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy
                </button>
                {instantResult && (
                  <button
                    onClick={instantMeme}
                    disabled={loading}
                    className="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                  >
                    {loading ? <Spinner text="..." /> : '🔄 Redo'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;
