import React, { useState, useEffect, useRef } from 'react';
import BackgroundBlobs from './components/BackgroundBlobs';
import MemeCanvas from './components/MemeCanvas';
import FontSelector from './components/FontSelector';
import { ColorPalette } from './components/ColorPalette';
import { templates as TEMPLATES } from './data/templates';

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

const getSituationEmoji = (s) => {
  const l = (s || '').toLowerCase();
  if (l.includes('exam')) return '📝';
  if (l.includes('deadline')) return '🚨';
  if (l.includes('assignment')) return '📓';
  if (l.includes('last_minute')) return '🏃';
  if (l.includes('confusion')) return '😵‍💫';
  if (l.includes('comparison')) return '🆚';
  if (l.includes('expectation')) return '🤯';
  if (l.includes('decision')) return '🤔';
  if (l.includes('failure')) return '💀';
  if (l.includes('success')) return '🏆';
  if (l.includes('waiting')) return '⏳';
  if (l.includes('announcement')) return '📢';
  if (l.includes('attendance')) return '🙋';
  if (l.includes('procrastination')) return '🛌';
  if (l.includes('group_work')) return '👥';
  return '📍';
};

const situationSynonyms = {
  exam: ["exam","test","midsem","final","quiz"],
  deadline: ["deadline","due","submission","last date"],
  assignment: ["assignment","homework","record"],
  last_minute: ["last minute","night before","final hour"],
  confusion: ["confused","dont understand","unclear"],
  comparison: ["vs","compare","better","worse"],
  expectation_vs_reality: ["expectation","reality"],
  decision: ["choose","option","either","decision"],
  failure: ["fail","arrear","backlog"],
  success: ["pass","top","cleared"],
  waiting: ["waiting","delay","long time"],
  announcement: ["announcement","circular","notice"],
  attendance: ["attendance","present","absent"],
  procrastination: ["later","tomorrow","delay work"],
  group_work: ["group","team","project"]
};

const toneSynonyms = {
  relatable: ["relatable","real life"],
  sarcastic: ["sarcastic","mocking"],
  dramatic: ["dramatic","intense"],
  exaggerated: ["over","too much","extreme"],
  confusion: ["confused"],
  reaction: ["reaction","shock","surprised"],
  success: ["success","win"],
  failure: ["failure","loss"],
  stress: ["stress","panic","pressure"],
  realization: ["realization","suddenly"]
};

function normalizeValue(input, map, fallback) {
  if (!input) return fallback;
  const value = input.toLowerCase();
  for (const key in map) {
    if (value === key || map[key].some(keyword => value.includes(keyword))) {
      return key;
    }
  }
  return fallback;
}

function normalizeAIOutput(aiOutput) {
  return {
    tone: normalizeValue(aiOutput.tone, toneSynonyms, "relatable"),
    situation: normalizeValue(aiOutput.situation, situationSynonyms, "announcement")
  };
}

function scoreTemplate(template, tone, situation) {
  let score = 0;
  // Situation match (PRIMARY - 5 points)
  if (template.situations?.includes(situation)) {
    score += 5;
  }
  // Tone match (SECONDARY - 2 points)
  if (template.tones?.includes(tone)) {
    score += 2;
  }
  return score;
}

function generateReason(template, tone, situation, score) {
  const situationMatch = template.situations?.includes(situation);
  const toneMatch = template.tones?.includes(tone);
  const cleanSit = situation.replace(/_/g, ' ');

  if (score >= 7) {
    return `🔥 Best match: ${cleanSit} + ${tone}`;
  }
  if (situationMatch && toneMatch) {
    return `🔥 Matches ${cleanSit} + ${tone}`;
  }
  if (situationMatch) {
    return `👍 Matches ${cleanSit}`;
  }
  if (toneMatch) {
    return `✨ Matches ${tone}`;
  }
  return "✨ Related template";
}

function weightedRandomSelection(candidates, count = 4) {
  const selected = [];
  const pool = [...candidates];

  while (selected.length < count && pool.length > 0) {
    const totalWeight = pool.reduce((sum, item) => sum + item.score, 0);
    if (totalWeight === 0) break;

    let random = Math.random() * totalWeight;

    for (let i = 0; i < pool.length; i++) {
      random -= pool[i].score;
      if (random <= 0) {
        // Keep the whole candidate (template, score, reason)
        selected.push(pool[i]);
        pool.splice(i, 1);
        break;
      }
    }
  }

  return selected;
}

function getSmartTemplates(aiOutput, templates) {
  const normalized = normalizeAIOutput(aiOutput);
  const { tone, situation } = normalized;

  const filtered = templates.filter(t => ["single", "double"].includes(t.text_type));
  const scored = filtered.map(template => {
    const score = scoreTemplate(template, tone, situation);
    return {
      template,
      score,
      reason: generateReason(template, tone, situation, score)
    };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  if (scored.length > 0 && scored[0].score === 0) {
    const fallbackIds = ['181913649', '87743020', '112126428', '188390779'];
    const fallbacks = templates.filter(t => fallbackIds.includes(t.id));
    return fallbacks.sort(() => Math.random() - 0.5).slice(0, 4).map(t => ({
      template: t,
      score: 0,
      reason: "✨ Classic fallback"
    }));
  }

  const topCandidates = scored.slice(0, 8);
  return weightedRandomSelection(topCandidates, 4);
}

// Removed old COLORS definition

const Spinner = ({ text }) => (
  <span className="flex items-center space-x-2 justify-center">
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
    <span>{text}</span>
  </span>
);

// --- Image Preloading ---
const imageCache = {};
const RECENT_KEY = "recentTemplates";

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    if (imageCache[url]) {
      resolve(imageCache[url]);
      return;
    }
    const img = new Image();
    img.src = url;
    img.onload = () => {
      imageCache[url] = img;
      resolve(img);
    };
    img.onerror = reject;
  });
}

function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

const TemplateImage = ({ template, isSelected, onClick, reason }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    preloadImage(template.url)
      .then(() => { if (isMounted) setLoaded(true); })
      .catch(() => { if (isMounted) setError(true); });
    return () => { isMounted = false; };
  }, [template.url]);

  return (
    <div className="flex flex-col gap-2">
      <button onClick={onClick}
        className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all duration-200 group focus:outline-none ${
          isSelected
            ? 'border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.35)] scale-[1.04]'
            : 'border-transparent hover:border-purple-400/40'
        }`}>
        {!loaded && !error && (
          <div className="absolute inset-0 bg-gray-200/50 dark:bg-white/5 animate-pulse" />
        )}
        <img
          src={error ? 'https://dummyimage.com/400x400/333/fff&text=Error' : template.url}
          alt={template.name}
          loading="eager"
          className={`w-full h-full object-cover transition-opacity duration-200 group-hover:scale-110 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          draggable={false}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <p className="text-[9px] text-white font-bold truncate transition-opacity duration-200">{template.name}</p>
        </div>
      </button>
      {reason && (
        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 px-1 leading-tight animate-fade-in line-clamp-1" title={reason}>
          {reason}
        </p>
      )}
    </div>
  );
};

function ComingSoonModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white/70 dark:bg-[#0B0F19]/90 backdrop-blur-xl border border-gray-200/50 dark:border-white/[0.06] rounded-3xl p-6 shadow-2xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
            <span className="text-3xl">🚀</span>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-black bg-gradient-to-r from-purple-600 to-blue-500 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">AI Meme Generator</h2>
            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-600 bg-amber-500/20 border border-amber-500/30 rounded-full">Coming Soon</span>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Generate memes instantly using AI-generated images from text input. No templates required.
          </p>

          <div className="w-full bg-white/50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/[0.05] rounded-xl p-4 text-left space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center text-[10px]">🧠</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">AI understands context automatically</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center text-[10px]">🎨</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Generates unique meme images</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center text-[10px]">⚡</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Fully automated meme creation</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center text-[10px]">📈</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Higher engagement potential</span>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-6 px-4">
            This feature requires high compute resources and will be available in future updates.
          </p>

          <button 
            onClick={() => alert('Thanks for your interest! We will notify you when this feature is ready.')}
            className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-sm hover:-translate-y-0.5 active:scale-[0.98] transition-all shadow-lg"
          >
            Notify Me
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──

function App() {
  const [view, setView] = useState('home'); // 'home' | 'custom' | 'instant'
  const [isDark, setIsDark] = useState(true);
  const [inputText, setInputText] = useState('');
  const [context, setContext] = useState('');
  const [tone, setTone] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('181913649');
  const [captions, setCaptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null); // null | 'limit' | 'general'
  const [instantResult, setInstantResult] = useState(null);
  const [textType, setTextType] = useState('double'); // 'single' | 'double'
  const [texts, setTexts] = useState([
    { id: 1, text: '', x: 0, y: 50, type: 'top' },
    { id: 2, text: '', x: 0, y: 425, type: 'bottom' }
  ]);
  const [suggestedTemplates, setSuggestedTemplates] = useState([]);
  const [recentTemplates, setRecentTemplates] = useState([]);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const memeCanvasRef = useRef(null);

  const handleSelectTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    try {
      const existing = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
      const filtered = existing.filter(t => t.id !== template.id);
      const updated = [template, ...filtered].slice(0, 6);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      setRecentTemplates(updated);
    } catch (err) {
      console.warn("Failed to save recent template", err);
    }
  };

  const clearRecentTemplates = () => {
    localStorage.removeItem(RECENT_KEY);
    setRecentTemplates([]);
  };

  // Preload Top templates on app mount
  useEffect(() => {
    const defaultTemplates = TEMPLATES.slice(0, 8);
    defaultTemplates.forEach(t => preloadImage(t.url));
  }, []);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // Fix unwanted automatic scroll on page load
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // Preload suggested templates when generated
  useEffect(() => {
    if (!suggestedTemplates.length) return;
    suggestedTemplates.forEach(t => preloadImage(t.url));
  }, [suggestedTemplates]);

  // Load recent templates on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
      setRecentTemplates(stored);
    } catch {
      setRecentTemplates([]);
    }
  }, []);

  // Preload recent templates when updated
  useEffect(() => {
    recentTemplates.forEach(t => preloadImage(t.url));
  }, [recentTemplates]);

  // Priority load selected template
  useEffect(() => {
    const active = TEMPLATES.find(t => t.id === selectedTemplate);
    if (active) preloadImage(active.url);
  }, [selectedTemplate]);

  // Independent text style state
  const [activeTextTarget, setActiveTextTarget] = useState('top'); // 'top' | 'bottom'
  const [isStyleExpanded, setIsStyleExpanded] = useState(false); // Mobile accordion
  const defaultStyle = { fontFamily: 'impact', fontSize: 28, color: '#ffffff', strokeColor: '#000000', strokeWidth: 1, bold: false, align: 'center', stroke: true };
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
    setLoading(true); setError(null); setErrorType(null);
    const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    try {
      const res = await fetch(`${backendURL}/generate-caption`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, textType: activeTemplate.text_type || 'double' }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'TOKEN_LIMIT_EXCEEDED') {
          setErrorType('limit');
          throw new Error('AI Usage Limit Reached');
        }
        throw new Error(data.error || 'Caption generation failed');
      }
      const caps = data.captions || [];
      const detectedType = data.textType || 'double';
      setTextType(detectedType);
      setCaptions(caps);
      setContext(data.context || '');

      if (caps.length > 0) {
        const first = caps[0];
        if (detectedType === 'single') {
          setTexts([{ id: Date.now(), text: first.text || '', x: 0, y: 225, type: 'single' }]);
        } else {
          setTexts([
            { id: Date.now(), text: first.topText || '', x: 0, y: 50, type: 'top' },
            { id: Date.now() + 1, text: first.bottomText || '', x: 0, y: 425, type: 'bottom' }
          ]);
        }
        setTone(first.tone || '');
        setSuggestedTemplates(getSmartTemplates(first, TEMPLATES));
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const exportMeme = async () => {
    if (!texts.some(t => t.text)) return;
    if (!memeCanvasRef.current) return;
    setLoading(true); setError(null);
    try {
      await memeCanvasRef.current.downloadAsImage();
    } catch (err) { setError(err.message || 'Export failed'); }
    finally { setLoading(false); }
  };

  const shareToWhatsApp = async () => {
    if (!texts.some(t => t.text)) return;
    if (!memeCanvasRef.current) return;
    setLoading(true); setError(null);
    try {
      const dataUrl = await memeCanvasRef.current.getMemeDataURL();
      if (!dataUrl) throw new Error('Failed to capture meme for sharing');
      const blob = dataURLtoBlob(dataUrl);

      if (navigator.share) {
        const file = new File([blob], "knownow-meme.png", { type: "image/png" });
        await navigator.share({
          files: [file],
          title: "KnowNow Meme",
          text: "Check this meme!"
        });
      } else {
        await memeCanvasRef.current.downloadAsImage();
        alert("Download complete. Please share manually on WhatsApp.");
        window.open(`https://wa.me/?text=${encodeURIComponent("Check this meme!")}`, '_blank');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Share failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Smart Meme Mode ──
  const selectBestTemplate = (aiOutput) => {
    const top = getSmartTemplates(aiOutput, TEMPLATES);
    return top.length > 0 ? top[0].template : TEMPLATES[0];
  };

  const instantMeme = async () => {
    if (!inputText.trim()) { setError('Paste an academic message first.'); return; }
    setLoading(true); setError(null); setErrorType(null); setInstantResult(null);
    const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    try {
      // Step 1: Generate caption
      const capRes = await fetch(`${backendURL}/generate-caption`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, textType: 'double' }),
      });
      const capData = await capRes.json();
      if (!capRes.ok) {
        if (capData.error === 'TOKEN_LIMIT_EXCEEDED') {
          setErrorType('limit');
          throw new Error('AI Usage Limit Reached');
        }
        throw new Error(capData.error || 'Caption generation failed');
      }

      const caps = capData.captions || [];
      if (!caps.length) throw new Error('No captions generated');
      const bestCap = caps[0];
      const detectedTone = bestCap.tone || '';

      // Step 2: Select best template based on situation + tone
      const bestTemplate = selectBestTemplate(bestCap);

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
      if (capData.textType === 'single') {
        setTexts([{ id: Date.now(), text: top, x: 0, y: 225, type: 'single' }]);
      } else {
        setTexts([
          { id: Date.now(), text: top, x: 0, y: 50, type: 'top' },
          { id: Date.now() + 1, text: bottom, x: 0, y: 425, type: 'bottom' }
        ]);
      }
      setTone(detectedTone);
      setContext(capData.context || '');
      setCaptions(caps);
      handleSelectTemplate(bestTemplate.id);
      setInstantResult({ memeUrl: memeData.memeUrl, tone: detectedTone, situation: bestCap.situation, templateName: bestTemplate.name });

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] font-sans text-gray-800 dark:text-gray-100 transition-colors duration-300 overflow-x-hidden pb-[env(safe-area-inset-bottom)]">
      <BackgroundBlobs />
      <ComingSoonModal isOpen={showGeneratorModal} onClose={() => setShowGeneratorModal(false)} />

      {/* ── Header ── */}
      <header className="fixed top-0 inset-x-0 h-14 backdrop-blur-2xl bg-white/60 dark:bg-[#0B0F19]/70 border-b border-gray-200/40 dark:border-white/[0.06] z-50 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('home')} className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
            <h1 className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-purple-600 to-blue-500 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">KnowNow</h1>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 hidden xs:inline">AI Meme Editor</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          {view !== 'home' && (
            <button onClick={() => setView('home')} className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/40 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-white transition-colors">
              ← Back
            </button>
          )}
          <button 
            onClick={() => setShowGeneratorModal(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border border-purple-500/20 text-purple-600 dark:text-purple-400 transition-colors flex items-center gap-1.5"
          >
            <span>🚀</span> <span className="hidden xs:inline">AI Generator</span>
          </button>
          <button onClick={toggleTheme} className="text-xs font-bold p-1.5 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* ── Landing Page ── */}
      {view === 'home' && (
        <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-fade-in">
          <section className="text-center mb-16">
            <div className="inline-block p-2 px-4 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-widest mb-6 animate-fade-in-up">
              Beta Release v2.0
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-900 dark:text-white mb-6 leading-tight">
              KnowNow – <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">Meme-to-Knowledge</span> Converter
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Transform boring academic updates into engaging, shareable memes using AI. Choose a journey and start your engagement leap.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mode 1: Custom */}
            <div className="group relative bg-white/40 dark:bg-white/[0.02] backdrop-blur-2xl rounded-3xl border border-gray-200 dark:border-white/[0.06] p-8 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.03] hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 active:scale-[0.98]">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-3xl mb-6 group-hover:rotate-12 transition-transform">🎨</div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Customizable Editor</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Full control over your meme. Generate AI captions and customize every detail from fonts to layout.
              </p>
              <ul className="text-[10px] space-y-2 mb-8 text-left w-full text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider">
                <li className="flex items-center gap-2"><span className="text-purple-500">✓</span> Editable Text & Styles</li>
                <li className="flex items-center gap-2"><span className="text-purple-500">✓</span> Template Library</li>
                <li className="flex items-center gap-2"><span className="text-purple-500">✓</span> Advanced Snapping</li>
              </ul>
              <button 
                onClick={() => setView('custom')}
                className="mt-auto w-full py-3 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-widest hover:bg-purple-600 dark:hover:bg-purple-400 hover:text-white transition-colors"
              >
                Start Editing
              </button>
            </div>

            {/* Mode 2: Instant */}
            <div className="group relative bg-white/40 dark:bg-white/[0.02] backdrop-blur-2xl rounded-3xl border border-gray-200 dark:border-white/[0.06] p-8 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.03] hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 active:scale-[0.98]">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-3xl mb-6 group-hover:-rotate-12 transition-transform">⚡</div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Instant Generation</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Let AI do the heavy lifting. Paste text and get a professionally matched meme in seconds.
              </p>
              <ul className="text-[10px] space-y-2 mb-8 text-left w-full text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wider">
                <li className="flex items-center gap-2"><span className="text-amber-500">✓</span> One-Click Generation</li>
                <li className="flex items-center gap-2"><span className="text-amber-500">✓</span> Auto-Template Selection</li>
                <li className="flex items-center gap-2"><span className="text-amber-500">✓</span> Zero Configuration</li>
              </ul>
              <button 
                onClick={() => setView('instant')}
                className="mt-auto w-full py-3 rounded-2xl bg-amber-500 text-white font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
              >
                Launch Magic
              </button>
            </div>

            {/* Mode 3: AI IMAGE */}
            <div className="group relative bg-white/20 dark:bg-white/[0.01] backdrop-blur-2xl rounded-3xl border border-gray-200/50 dark:border-white/[0.03] p-8 flex flex-col items-center text-center opacity-80 cursor-not-allowed">
              <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[8px] font-black uppercase text-blue-500">Coming Soon</div>
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-3xl mb-6">🤖</div>
              <h3 className="text-xl font-black text-gray-400 dark:text-gray-500 mb-3 tracking-tight">AI Meme Image</h3>
              <p className="text-xs text-gray-400 dark:text-gray-600 mb-6 leading-relaxed">
                The ultimate frontier. AI generates unique images specifically for your text. No more templates.
              </p>
              <ul className="text-[10px] space-y-2 mb-8 text-left w-full text-gray-400 dark:text-gray-600 font-bold uppercase tracking-wider">
                <li className="flex items-center gap-2"><span>-</span> Unique AI Visuals</li>
                <li className="flex items-center gap-2"><span>-</span> Text-to-Meme</li>
                <li className="flex items-center gap-2"><span>-</span> Multi-Modal AI</li>
              </ul>
              <button 
                onClick={() => setShowGeneratorModal(true)}
                className="mt-auto w-full py-3 rounded-2xl border border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-600 font-black text-xs uppercase tracking-widest"
              >
                Preview Mode
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ── Instant Mode UI ── */}
      {view === 'instant' && (
        <main className="pt-24 pb-20 px-4 sm:px-6 max-w-4xl mx-auto animate-fade-in flex flex-col items-center">
          <div className="w-full text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 leading-tight">Instant Meme Magic ✨</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Paste your update and we'll handle the rest perfectly.</p>
          </div>

          <div className="w-full bg-white/50 dark:bg-white/[0.03] backdrop-blur-2xl rounded-[32px] border border-gray-200/50 dark:border-white/[0.06] p-8 shadow-2xl shadow-purple-500/5">
            {!instantResult ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">The Boring Update</label>
                    <textarea
                      rows="4"
                      className="w-full bg-white/70 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-base sm:text-sm resize-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none"
                      placeholder="E.g. We have decided to postpone the final exams to next month due to upcoming holidays..."
                      value={inputText}
                      onChange={(e) => { setInputText(e.target.value); setError(null); setErrorType(null); }}
                    />
                </div>
                <button
                  onClick={instantMeme}
                  disabled={loading || !inputText.trim() || errorType === 'limit'}
                  className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-xl flex items-center justify-center gap-2 mb-3 active:scale-[0.98] ${
                    (loading || errorType === 'limit')
                      ? 'bg-gray-200 dark:bg-white/10 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-amber-500/40 hover:-translate-y-0.5 shadow-amber-500/20'
                  }`}
                >
                  {loading ? <Spinner text="Brewing Magic..." /> : errorType === 'limit' ? '⚠️ Limit Reached' : 'Generate My Meme Now 🪄'}
                </button>

                {errorType === 'limit' && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 animate-fade-in-up mb-4">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xl">⚠️</span>
                      <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">AI Limit Reached</h3>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed ml-8">
                      Our servers are currently overwhelmed by Gen-Z energy. We’ve reached our AI usage limit for now. Service will resume shortly.
                      <br /><span className="font-bold">✨ Pro tip: Try again in a few minutes!</span>
                    </p>
                    <button 
                      onClick={() => { setError(null); setErrorType(null); }}
                      className="mt-3 ml-8 text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Dismiss & Retry
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-8 animate-fade-in">
                <div className="w-full max-w-md relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-[40px] opacity-20 blur-2xl group-hover:opacity-30 transition-opacity" />
                  <img src={instantResult.memeUrl} alt="Result" className="relative w-full rounded-3xl border-4 border-white dark:border-white/10 shadow-2xl" />
                </div>
                
                <div className="text-center flex flex-col items-center gap-2">
                   <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">"{instantResult.templateName}"</h3>
                   <div className="flex gap-2">
                     <span className="text-[9px] font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 uppercase tracking-widest">
                       {getToneEmoji(instantResult.tone)} {instantResult.tone}
                     </span>
                     {instantResult.situation && (
                       <span className="text-[9px] font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-widest">
                         {getSituationEmoji(instantResult.situation)} {instantResult.situation.replace(/_/g, ' ')}
                       </span>
                     )}
                   </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                  <button onClick={exportMeme} className="py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-xs uppercase transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10">Download</button>
                  <button onClick={instantMeme} className="py-4 rounded-xl bg-amber-500 text-white font-bold text-xs uppercase transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/10">Retry ✨</button>
                  <button onClick={() => setView('custom')} className="py-4 rounded-xl bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs uppercase transition-all hover:scale-105 active:scale-95">Edit 🎨</button>
                  <button onClick={() => { setInstantResult(null); setInputText(''); }} className="py-4 rounded-xl bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs uppercase transition-all hover:scale-105 active:scale-95">New ⊕</button>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ── Custom Mode Editor ── */}
      {view === 'custom' && (
        <>
          {/* ── Main Layout ── */}
          <main className="pt-20 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 min-h-screen relative z-10">

        {/* ═══ LEFT PANEL ═══ */}
        <div className="w-full lg:w-[55%] space-y-5 overflow-y-auto pr-1">

          {errorType === 'limit' ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 animate-fade-in-up mb-2">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xl">⚠️</span>
                <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">AI Limit Reached</h3>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed ml-8">
                We’ve reached our AI usage limit for now. Service will resume shortly.
                <br /><span className="font-bold">✨ Pro tip: Try again in a few minutes!</span>
              </p>
              <button 
                onClick={() => { setError(null); setErrorType(null); }}
                className="mt-3 ml-8 text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 hover:underline"
              >
                Dismiss & Retry
              </button>
            </div>
          ) : error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm font-medium flex items-center gap-2 animate-fade-in">
              <span className="shrink-0">⚠️</span> {error}
            </div>
          )}

          {/* Section 1: Input */}
          <section className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-white/[0.06] p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">Input</h2>
            <textarea
              rows="3"
              className="w-full bg-white/70 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-base sm:text-sm resize-none placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all"
              placeholder="Paste your boring academic update here..."
              value={inputText}
              onChange={(e) => { setInputText(e.target.value); setError(null); setErrorType(null); }}
            />
            <div className="mt-3 flex gap-3">
              <button
                onClick={generateCaption}
                disabled={loading || errorType === 'limit'}
                className={`w-full py-3 rounded-xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                  (loading || errorType === 'limit')
                    ? 'bg-gray-200 dark:bg-white/10 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5'
                }`}
              >
                {loading ? <Spinner text="Brewing Captions..." /> : errorType === 'limit' ? '⚠️ Limit Reached' : 'Generate AI Captions ✨'}
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
                  const isActive = (textType === 'single' ? texts[0]?.text === cap.text : (texts[0]?.text === cap.topText && texts[1]?.text === cap.bottomText));
                  return (
                    <button
                      key={i}
                    onClick={() => {
                      setTone(cap.tone);
                      if (textType === 'single') {
                        setTexts([{ id: Date.now(), text: cap.text || '', x: 0, y: 225, type: 'single' }]);
                      } else {
                        setTexts([
                          { id: Date.now(), text: cap.topText || '', x: 0, y: 50, type: 'top' },
                          { id: Date.now() + 1, text: cap.bottomText || '', x: 0, y: 425, type: 'bottom' }
                        ]);
                      }
                    }}
                      className={`snap-start shrink-0 w-56 p-3.5 rounded-xl border text-left flex flex-col gap-2 transition-all duration-200 outline-none ${
                        isActive
                          ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                          : 'bg-white/40 dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.06] hover:border-purple-400/50 hover:-translate-y-0.5'
                      }`}
                    >
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">"{capTop}"</p>
                      {capBottom && <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">"{capBottom}"</p>}
                      <div className="mt-auto flex flex-wrap gap-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded w-fit">
                          {getToneEmoji(cap.tone)} {cap.tone}
                        </span>
                        {cap.situation && (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded w-fit">
                            {getSituationEmoji(cap.situation)} {cap.situation.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Section 2.5: Recommended Templates */}
          {suggestedTemplates.length > 0 && (
            <section className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-white/[0.06] p-5 shadow-sm animate-fade-in">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                <span>✨ Templates selected based on tone + smart variation</span>
              </h2>
              <div className="flex sm:grid sm:grid-cols-4 gap-3 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 snap-x scrollbar-thin">
                {suggestedTemplates.map((item, i) => (
                  <div key={item.template.id + i} className="snap-start shrink-0 w-32 sm:w-auto">
                    <TemplateImage 
                      template={item.template} 
                      reason={item.reason}
                      isSelected={selectedTemplate === item.template.id} 
                      onClick={() => handleSelectTemplate(item.template.id)} 
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Text Controls */}
          <section className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-white/[0.06] p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">Text Controls</h2>
            <div className="space-y-4">

              {/* Text inputs */}
              <div className={`grid gap-3 ${textType === 'double' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {texts.map((t, idx) => (
                  <div key={t.id}>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                      {textType === 'single' ? 'Text' : t.type === 'top' ? 'Top Text' : 'Bottom Text'}
                    </label>
                    <textarea 
                      rows="2" 
                      value={t.text} 
                      onChange={(e) => setTexts(prev => prev.map(item => item.id === t.id ? { ...item, text: e.target.value } : item))} 
                      onFocus={() => setActiveTextTarget(t.type === 'top' || t.type === 'single' ? 'top' : 'bottom')}
                      className="w-full bg-white/70 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-base sm:text-sm focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all outline-none resize-none" 
                    />
                  </div>
                ))}
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

              {/* Mobile Style Accordion Toggle */}
              <button 
                type="button"
                onClick={() => setIsStyleExpanded(!isStyleExpanded)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/10 lg:hidden group active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎨</span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">Appearance & Styling</span>
                </div>
                <span className={`text-[10px] text-purple-400 transition-transform duration-300 ${isStyleExpanded ? 'rotate-180' : ''}`}>▼</span>
              </button>

              <div className={`${isStyleExpanded ? 'space-y-4' : 'hidden md:space-y-4 lg:block space-y-4'}`}>
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

              {/* Size & Formatting Row */}
              <div className="flex items-end gap-3 flex-wrap">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Size — {activeStyle.fontSize}px</label>
                  <input type="range" min="16" max="48" value={activeStyle.fontSize} onChange={(e) => updateActiveStyle('fontSize', +e.target.value)}
                    className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-white/10 accent-purple-500 cursor-pointer" />
                </div>
                <button onClick={() => updateActiveStyle('bold', !activeStyle.bold)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-black border transition-all ${activeStyle.bold ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400' : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500'}`}>
                  B
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

              {/* Text Color */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Text Color</label>
                <ColorPalette selected={activeStyle.color} onSelect={(c) => updateActiveStyle('color', c)} />
              </div>

              {/* Stroke Control Header */}
              <div className="flex items-center justify-between border-t border-gray-200/50 dark:border-white/[0.05] pt-4 mt-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Stroke Controls</label>
                <button onClick={() => updateActiveStyle('stroke', !activeStyle.stroke)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border transition-all ${activeStyle.stroke ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                  {activeStyle.stroke ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Stroke Properties */}
              {activeStyle.stroke && (
                <div className="space-y-4 animate-fade-in-up">
                  <div className="flex items-center gap-3">
                    <label className="w-16 text-[10px] font-bold uppercase tracking-widest text-gray-400">Width: {activeStyle.strokeWidth || 2}</label>
                    <input type="range" min="0" max="8" step="1" value={activeStyle.strokeWidth !== undefined ? activeStyle.strokeWidth : 2} onChange={(e) => updateActiveStyle('strokeWidth', +e.target.value)}
                      className="flex-1 h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-white/10 accent-purple-500 cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Stroke Color</label>
                    <ColorPalette selected={activeStyle.strokeColor || '#000000'} onSelect={(c) => updateActiveStyle('strokeColor', c)} />
                  </div>
                </div>
              )}
              </div>
            </div>
          </section>

          {/* Section 3.5: Recently Used */}
          {recentTemplates.length > 0 && (
            <section className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-white/[0.06] p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">🕘 Recently Used</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">Recent</span>
                </div>
                <button 
                  onClick={clearRecentTemplates}
                  title="Clear history"
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-thin">
                {recentTemplates.map((tmpl) => (
                  <div key={tmpl.id} className="snap-start shrink-0 w-28 sm:w-32">
                    <TemplateImage 
                      template={tmpl} 
                      isSelected={selectedTemplate === tmpl.id} 
                      onClick={() => handleSelectTemplate(tmpl.id)} 
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 4: Templates */}
          <section className="bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-white/[0.06] p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">Templates</h2>
            <div className="flex sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 snap-x scrollbar-thin">
              {(showAllTemplates ? TEMPLATES : TEMPLATES.slice(0, 12)).map(tmpl => (
                <div key={tmpl.id} className="snap-start shrink-0 w-32 sm:w-auto">
                  <TemplateImage 
                    template={tmpl} 
                    isSelected={selectedTemplate === tmpl.id} 
                    onClick={() => handleSelectTemplate(tmpl.id)} 
                  />
                </div>
              ))}
            </div>
            {TEMPLATES.length > 12 && (
              <button
                onClick={() => setShowAllTemplates(!showAllTemplates)}
                className="w-full mt-4 py-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-widest border border-purple-500/20 hover:bg-purple-500/20 transition-all active:scale-[0.98]"
              >
                {showAllTemplates ? 'Show Less' : `See More (${TEMPLATES.length - 12} Hidden)`}
              </button>
            )}
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
                texts={texts}
                setTexts={setTexts}
                topTextStyle={topTextStyle}
                bottomTextStyle={bottomTextStyle}
              />

              {/* Actions */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={exportMeme}
                  disabled={loading || !texts.some(t => t.text)}
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
                  onClick={shareToWhatsApp}
                  disabled={loading || !texts.some(t => t.text)}
                  className="py-3 rounded-xl bg-[#25D366]/10 text-[#25D366] font-bold text-sm border border-[#25D366]/20 hover:bg-[#25D366]/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-sm"
                >
                  📤 Share
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(texts.map(t => t.text).join('\n'))}
                  className="py-3 rounded-xl bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy Text
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
        </>
      )}
    </div>
  );
}

export default App;
