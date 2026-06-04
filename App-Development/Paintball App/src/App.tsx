import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, 
  Droplet, 
  AlertCircle, 
  ChevronRight, 
  CheckCircle2, 
  MessageSquare,
  BookOpen,
  Search,
  X,
  ExternalLink,
  ChevronLeft,
  BrainCircuit,
  PlayCircle,
  ShoppingCart,
  Copy,
  History,
  Trash2,
  Star,
  Video,
  Layers,
  Info,
  Repeat,
  WifiOff
} from 'lucide-react';
import { MARKERS, GENERAL_TIPS } from './data/markerData';
import { Marker, DiagnosticResult, HistoryEntry } from './types';
import { diagnoseLeak } from './services/ai';
import { getMarkerYoutubePresentation } from './utils/youtubeUtils';
import { buildAnsgearPartsSearchUrl, formatPartsShoppingList } from './lib/partsSearch';

export default function App() {
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [userSymptom, setUserSymptom] = useState('');
  const [userCause, setUserCause] = useState('');
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [copiedParts, setCopiedParts] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosticResult | null>(null);
  const [view, setView] = useState<'home' | 'selector' | 'diagnostic' | 'tips' | 'history'>('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewMarker, setPreviewMarker] = useState<Marker | null>(null);
  const [partsListCopied, setPartsListCopied] = useState(false);
  const partsListCopiedTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>([]);
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const saved = localStorage.getItem('pocket_tech_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedSeriesGroup, setSelectedSeriesGroup] = useState<string | null>(null);
  const [commonSymptomsOpen, setCommonSymptomsOpen] = useState(false);

  const markerYoutube = useMemo(
    () => (selectedMarker ? getMarkerYoutubePresentation(selectedMarker) : null),
    [selectedMarker]
  );

  const partsShoppingList = useMemo(() => {
    if (!diagnosis || !selectedMarker) return '';
    return formatPartsShoppingList(selectedMarker, diagnosis);
  }, [diagnosis, selectedMarker]);

  const partsShopUrl = useMemo(() => {
    if (!diagnosis || !selectedMarker) return 'https://www.ansgear.com';
    return buildAnsgearPartsSearchUrl(selectedMarker, diagnosis);
  }, [diagnosis, selectedMarker]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (partsListCopiedTimeoutRef.current !== null) {
        window.clearTimeout(partsListCopiedTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    localStorage.setItem('pocket_tech_history', JSON.stringify(history));
  }, [history]);

  const handleDiagnose = async (followUpArg?: string | React.MouseEvent | React.KeyboardEvent) => {
    if (!selectedMarker || !userSymptom) return;
    
    if (!isOnline) {
      alert("You appear to be offline. Diagnostics require an internet connection to access the AI expert.");
      return;
    }

    setIsDiagnosing(true);
    const followUpText = typeof followUpArg === 'string' ? followUpArg : '';
    const effectiveSymptom = followUpText && followUpText.length > 0
      ? `${userSymptom} -- FOLLOW UP: Users says it didn't work and adds: ${followUpText}`
      : userSymptom;

    try {
      const result = await diagnoseLeak(selectedMarker.name, effectiveSymptom, userCause);
      setDiagnosis(result);
      setCheckedSteps(new Array(result.steps.length).fill(false));
      setFollowUpQuery('');
      setIsRefreshing(false);

      // Save to history
      const historyId = Math.random().toString(36).substr(2, 9);
      const newEntry: HistoryEntry = {
        id: historyId,
        timestamp: Date.now(),
        markerId: selectedMarker.id,
        markerName: selectedMarker.name,
        brand: selectedMarker.brand,
        userSymptom: userSymptom,
        userCause: userCause,
        diagnosis: result,
      };
      setHistory(prev => [newEntry, ...prev].slice(0, 50)); // Keep last 50
      setCurrentHistoryId(historyId);
    } catch (e) {
      // Error handling is done by the API fallback
    } finally {
      setIsDiagnosing(false);
    }
  };

  const deleteHistoryEntry = (id: string) => {
    setHistory(prev => prev.filter(e => e.id !== id));
  };

  const clearHistory = () => {
    if (confirm('Clear all troubleshooting history?')) {
      setHistory([]);
    }
  };

  const viewHistoryEntry = (entry: HistoryEntry) => {
    const marker = MARKERS.find(m => m.id === entry.markerId);
    if (marker) {
      setSelectedMarker(marker);
      setUserSymptom(entry.userSymptom);
      setUserCause(entry.userCause);
      setDiagnosis(entry.diagnosis);
      setCheckedSteps(new Array(entry.diagnosis.steps.length).fill(false));
      setCurrentHistoryId(entry.id);
      setView('diagnostic');
    }
  };

  const toggleStep = (index: number) => {
    const newChecked = [...checkedSteps];
    newChecked[index] = !newChecked[index];
    setCheckedSteps(newChecked);
  };

  const copyPart = (index: number, isMainButton: boolean = false) => {
    if (!diagnosis) return;
    const o = diagnosis.recommendedOrings[index];
    const isGasket = o.size.toUpperCase().includes('N/A') || 
                    o.size.toUpperCase().includes('GASKET') || 
                    o.name.toUpperCase().includes('GASKET');
    
    const text = isGasket ? 'Solenoid Gasket' : o.size;
    
    navigator.clipboard.writeText(text).then(() => {
      if (isMainButton) {
        setCopiedParts(true);
        setTimeout(() => setCopiedParts(false), 2000);
      } else {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      }
      window.open("https://www.ansgear.com", "_blank", "noopener,noreferrer");
    });
  };

  const handleOrderParts = () => {
    if (!diagnosis) return;
    
    if (diagnosis.recommendedOrings.length === 1) {
      copyPart(0, true);
    } else {
      window.open("https://www.ansgear.com", "_blank", "noopener,noreferrer");
    }
  };

  const submitFeedback = async (rating: number, feedback?: string) => {
    if (!currentHistoryId || !diagnosis || !selectedMarker) return;

    setHistory(prev => prev.map(entry =>
      entry.id === currentHistoryId
        ? { ...entry, rating, feedback: feedback || entry.feedback }
        : entry
    ));

    const API_URL = ((import.meta as any).env?.VITE_API_URL as string | undefined) || "http://localhost:3001";

    try {
      await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markerName: selectedMarker.name,
          symptom: userSymptom,
          diagnosis: diagnosis.diagnosis,
          rating,
          feedback: feedback || '',
        }),
      });
    } catch (error) {
      console.error('Failed to send feedback to server:', error);
    }
  };

  const getStepIcon = (step: string) => {
    const s = step.toLowerCase();
    if (s.includes('lube') || s.includes('grease') || s.includes('oil')) return <Droplet className="w-4 h-4 pe-accent-text" />;
    if (s.includes('o-ring') || s.includes('oring') || s.includes('seal')) return <div className="w-3 h-3 rounded-full border-2 border-[var(--pe-accent)]" />;
    if (s.includes('screw') || s.includes('bolt') || s.includes('wrench') || s.includes('tool')) return <Wrench className="w-4 h-4 pe-accent-text" />;
    if (s.includes('check') || s.includes('inspect') || s.includes('verify')) return <Search className="w-4 h-4 pe-accent-text" />;
    if (s.includes('warning') || s.includes('caution') || s.includes('danger')) return <AlertCircle className="w-4 h-4 text-rose-500" />;
    return <ChevronRight className="w-4 h-4 pe-accent-text opacity-30" />;
  };

  const brands = Array.from(new Set(MARKERS.map(m => m.brand))).sort();
  
  const filteredMarkers = MARKERS.filter(m => {
    const matchesSearch = !searchTerm || 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = !selectedBrand || m.brand === selectedBrand;
    const matchesSeries = !selectedSeriesGroup || m.seriesGroup === selectedSeriesGroup;
    return matchesSearch && matchesBrand && matchesSeries;
  });

  const seriesInBrand = selectedBrand 
    ? Array.from(new Set(MARKERS.filter(m => m.brand === selectedBrand).map(m => m.seriesGroup))).sort()
    : [];

  const reset = () => {
    setDiagnosis(null);
    setCurrentHistoryId(null);
    setUserSymptom('');
    setUserCause('');
    setSearchTerm('');
    setCheckedSteps([]);
    setFollowUpQuery('');
    setFeedbackInput('');
    setIsRefreshing(false);
    setSelectedBrand(null);
    setSelectedSeriesGroup(null);
    if (partsListCopiedTimeoutRef.current !== null) {
      window.clearTimeout(partsListCopiedTimeoutRef.current);
      partsListCopiedTimeoutRef.current = null;
    }
    setPartsListCopied(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] selection:bg-[var(--pe-accent)]/30 font-sans p-4 md:p-10 flex flex-col overflow-x-hidden">
      <header className="border-b border-[var(--border-dim)] pb-6 mb-8 md:pb-10 md:mb-12 flex justify-between items-end relative z-10">
        <div 
          className="cursor-pointer group select-none" 
          onClick={() => { setView('home'); setSelectedMarker(null); reset(); }}
        >
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
            POCKET <span className="pe-accent-text">TECH</span>
          </h1>
          <p className="text-xs md:text-xs tracking-[0.2em] uppercase mt-2 text-slate-500 font-bold">AI-Powered Diagnostics</p>
        </div>
        <div className="flex flex-col items-end gap-3 z-20">
          {!isOnline && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wide"
            >
              <WifiOff className="w-3.5 h-3.5" />
              Offline Mode
            </motion.div>
          )}
          <div className="text-right hidden sm:flex flex-col items-end">
            <div className="flex gap-4">
            <button 
              onClick={() => setView('history')}
              className="text-xs font-bold uppercase pe-accent-text hover:bg-[var(--pe-accent)] hover:text-black transition-all px-4 py-2 border border-[var(--pe-accent)] flex items-center gap-2 rounded-md"
            >
              <History className="w-3 h-3" /> History
            </button>
            <button 
              onClick={() => setView('tips')}
              className="text-xs font-bold uppercase text-slate-400 hover:text-white transition-all px-4 py-2 border border-[var(--border-dim)] flex items-center gap-2 rounded-md"
            >
              <BookOpen className="w-3 h-3" /> Tips
            </button>
          </div>
          <div className="text-2xl md:text-3xl font-light tracking-wide uppercase text-slate-400">
            {selectedMarker ? selectedMarker.name : 'System Ready'}
          </div>
        </div>
      </div>
    </header>

      <main className="flex-grow flex flex-col relative z-10 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-grow flex flex-col items-center justify-center text-center space-y-16 py-20"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-[var(--pe-accent)]/5 blur-[120px] rounded-full"></div>
                <h2 className="text-6xl md:text-8xl font-black mb-8 uppercase tracking-tight relative leading-[0.85]">
                  POCKET <br /> <span className="pe-accent-text">TECH</span>
                </h2>
              </div>
              <p className="text-slate-400 text-sm md:text-lg tracking-[0.15em] uppercase max-w-xl mx-auto leading-relaxed">
                Precision diagnostic engine for high-performance paintball marker maintenance.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <button 
                  onClick={() => setView('selector')}
                  className="px-16 py-6 bg-[var(--pe-accent)] text-slate-950 font-black uppercase text-sm tracking-[0.4em] hover:brightness-110 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(56,189,248,0.2)] rounded-lg"
                >
                  START DIAGNOSIS
                </button>
                {history.length > 0 && (
                  <button 
                    onClick={() => setView('history')}
                    className="px-10 py-6 border border-[var(--border-md)] text-white font-black uppercase text-sm tracking-[0.3em] hover:bg-white hover:text-black transition-all hover:scale-105 active:scale-95 flex items-center gap-4 rounded-lg"
                  >
                    <History className="w-5 h-5 pe-accent-text" />
                    RECORDS
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {view === 'selector' && (
            <motion.div 
              key="selector"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="sticky top-0 z-40 bg-[#0B0E14]/95 backdrop-blur-md -mx-4 px-4 py-4 md:static md:bg-transparent md:p-0 md:m-0 space-y-6 border-b border-[#1E293B] md:border-none">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-xs uppercase tracking-wide pe-accent-text font-bold mb-2 hidden md:block">Asset Selection</h2>
                    <p className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white">CHOOSE MODEL</p>
                  </div>
                  <div className="flex-grow max-w-md relative">
                    <input 
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Filter hardware..."
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-dim)] p-4 md:p-5 text-sm font-mono focus:border-[var(--pe-accent)] outline-none uppercase placeholder:opacity-30 rounded-lg"
                    />
                    <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
                  </div>
                </div>

                {/* Navigation Pills */}
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => { setSelectedBrand(null); setSelectedSeriesGroup(null); }}
                      className={`px-3 md:px-4 py-2 text-xs font-black uppercase tracking-wide border transition-all rounded-md ${!selectedBrand ? 'bg-[var(--pe-accent)] text-slate-950 border-[var(--pe-accent)]' : 'bg-[var(--bg-card)] text-white border-[var(--border-dim)] hover:border-[var(--pe-accent)]/50'}`}
                    >
                      All Brands
                    </button>
                    {brands.map(brand => (
                      <button 
                        key={brand}
                        onClick={() => { setSelectedBrand(brand); setSelectedSeriesGroup(null); }}
                        className={`px-3 md:px-4 py-2 text-xs font-black uppercase tracking-wide border transition-all rounded-md ${selectedBrand === brand ? 'bg-[var(--pe-accent)] text-slate-950 border-[var(--pe-accent)]' : 'bg-[var(--bg-card)] text-white border-[var(--border-dim)] hover:border-[var(--pe-accent)]/50'}`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>

                  {selectedBrand && seriesInBrand.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border-dim)]">
                      <button 
                        onClick={() => setSelectedSeriesGroup(null)}
                        className={`px-3 py-1 text-xs font-bold uppercase border transition-all rounded ${!selectedSeriesGroup ? 'pe-accent-text border-[var(--pe-accent)]' : 'text-slate-500 border-transparent hover:text-white'}`}
                      >
                        All {selectedBrand}
                      </button>
                      {seriesInBrand.map(series => (
                        <button 
                          key={series}
                          onClick={() => setSelectedSeriesGroup(series)}
                          className={`px-3 py-1 text-xs font-bold uppercase border transition-all rounded ${selectedSeriesGroup === series ? 'pe-accent-text border-[var(--pe-accent)]' : 'text-slate-500 border-transparent hover:text-white'}`}
                        >
                          {series}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {filteredMarkers.length > 0 ? (
                <div className="space-y-16">
                  {Array.from(new Set(filteredMarkers.map(m => m.brand))).sort().map(brand => (
                    <div key={brand} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <h2 className="text-xl font-black uppercase tracking-tight pe-accent-text">{brand}</h2>
                        <div className="flex-grow h-px bg-[var(--border-dim)]"></div>
                      </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredMarkers
                          .filter(m => m.brand === brand)
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((marker) => (
                          <div key={marker.id} className="relative group">
                            <button 
                              onClick={() => { setSelectedMarker(marker); setView('diagnostic'); }}
                              className="w-full border border-[var(--border-dim)] p-5 md:p-8 text-left bg-[var(--bg-card)] hover:border-[var(--pe-accent)] hover:bg-[var(--bg-surface)] transition-all relative overflow-hidden rounded-xl"
                            >
                              <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4 md:mb-6">
                                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight">{marker.name}</h3>
                                </div>
                                <div className="flex justify-between items-end">
                                  <span className={`text-xs font-black uppercase tracking-wide px-2 py-0.5 rounded-md ${marker.category === 'Modern' ? 'bg-[var(--pe-accent)] text-black' : 'bg-slate-700 text-white'}`}>
                                    {marker.category}
                                  </span>
                                  <p className="text-xs uppercase font-bold tracking-[0.1em] opacity-40 group-hover:opacity-100 transition-opacity">
                                    {marker.series}
                                  </p>
                                </div>
                              </div>
                            </button>
                            {marker.boltImageUrl && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewMarker(marker);
                                }}
                                className="absolute top-4 right-4 z-20 p-2 bg-black/50 text-[var(--pe-accent)] hover:bg-[var(--pe-accent)] hover:text-black transition-all border border-[var(--pe-accent)]/20 rounded-lg"
                                title="Scanner Preview"
                              >
                                <Layers className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center border border-dashed border-[var(--border-dim)] bg-[var(--bg-card)]/50 rounded-xl space-y-6">
                  <AlertCircle className="w-12 h-12 text-slate-800 mx-auto" />
                  <div className="space-y-2">
                    <p className="text-xl font-black uppercase tracking-wide text-slate-600">No Match Found</p>
                    <p className="text-xs text-slate-500 font-mono uppercase tracking-[0.2em]">Adjust filters for hardware identification</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedBrand(null);
                      setSelectedSeriesGroup(null);
                    }} 
                    className="px-6 py-3 bg-[var(--pe-accent)] text-black text-xs font-black uppercase tracking-wide hover:brightness-110 transition-all rounded-lg"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
              
              <div className="pt-10 flex justify-center">
                <button 
                  onClick={() => setView('home')} 
                  className="text-xs uppercase tracking-wide font-bold opacity-30 hover:opacity-100 transition-opacity flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {(view === 'diagnostic' && selectedMarker) && (
            <motion.div 
              key="diagnostic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-12 gap-4 md:gap-10 flex-grow"
            >
              <div className="col-span-12 md:col-span-4 flex flex-col space-y-4 md:space-y-6">
                <div className="border-l-4 border-[var(--pe-accent)] pl-6 py-8 bg-[var(--bg-card)] rounded-r-lg">
                  <h3 className="text-xs uppercase tracking-wide font-bold text-slate-500 mb-2">Subject Hardware</h3>
                  <p className="text-3xl md:text-4xl font-black uppercase">{selectedMarker.name}</p>
                </div>

                {!diagnosis ? (
                  <div className="space-y-8 flex flex-grow flex-col bg-[var(--bg-card)] p-6 md:p-10 border border-[var(--border-dim)] rounded-xl">
                    <div className="space-y-4">
                      <label className="text-xs uppercase tracking-wide text-slate-400 font-bold block">Symptom Description</label>
                      <textarea
                        value={userSymptom}
                        onChange={(e) => setUserSymptom(e.target.value)}
                        placeholder="Detail the failure..."
                        className="w-full bg-black/20 border border-[var(--border-dim)] p-5 text-sm font-mono focus:border-[var(--pe-accent)] outline-none min-h-[150px] transition-all placeholder:opacity-20 uppercase leading-relaxed resize-none rounded-lg"
                      />
                    </div>

                    {selectedMarker.commonSymptoms.length > 0 && (
                      <div className="space-y-2 relative">
                        <label className="text-xs uppercase tracking-wide text-slate-400 font-bold block">Common Symptoms</label>
                        <button
                          onClick={() => setCommonSymptomsOpen(!commonSymptomsOpen)}
                          className="w-full text-left p-4 text-xs font-bold uppercase tracking-tight border border-[var(--border-dim)] bg-black/20 hover:bg-black/40 hover:border-[var(--pe-accent)]/50 transition-all rounded-lg flex items-center justify-between"
                        >
                          <span>Select from common symptoms...</span>
                          <ChevronRight className={`w-4 h-4 transition-transform ${commonSymptomsOpen ? 'rotate-90' : ''}`} />
                        </button>
                        {commonSymptomsOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--pe-accent)]/30 rounded-lg overflow-hidden shadow-lg z-10 max-h-64 overflow-y-auto">
                            {selectedMarker.commonSymptoms.map((s, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setUserSymptom(s.description);
                                  setCommonSymptomsOpen(false);
                                }}
                                className={`w-full text-left p-4 text-xs font-bold uppercase tracking-tight border-b border-[var(--border-dim)] last:border-b-0 transition-all ${userSymptom === s.description ? 'bg-[var(--pe-accent)] text-black' : 'hover:bg-black/40'}`}
                              >
                                {s.description}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-4">
                      <label className="text-xs uppercase tracking-wide text-slate-400 font-bold block">Operational Context</label>
                      <input 
                        type="text"
                        value={userCause}
                        onChange={(e) => setUserCause(e.target.value)}
                        placeholder="e.g. Dry Firing"
                        className="w-full bg-black/20 border border-[var(--border-dim)] p-5 text-sm font-mono focus:border-[var(--pe-accent)] outline-none transition-all placeholder:opacity-20 uppercase rounded-lg"
                      />
                    </div>

                    <button
                      disabled={!userSymptom || isDiagnosing || !isOnline}
                      onClick={handleDiagnose}
                      className={`w-full py-6 bg-[var(--text-main)] text-slate-950 font-black uppercase text-sm tracking-[0.3em] transition-all disabled:opacity-20 disabled:cursor-not-allowed group flex items-center justify-center gap-4 mt-auto rounded-xl ${isOnline ? 'hover:bg-[var(--pe-accent)]' : 'bg-slate-800 text-slate-500'}`}
                    >
                      {isDiagnosing && (
                        <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      )}
                      {isDiagnosing ? 'SCANNING...' : (!isOnline ? 'NETWORK OFFLINE' : 'IDENTIFY FAULT')}
                      {!isDiagnosing && isOnline && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-dim)] p-8 space-y-6 rounded-xl">
                      <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wide border-b border-[var(--border-dim)] pb-4">Presets</h4>
                      <div className="space-y-3">
                        {selectedMarker.commonSymptoms.map((s, i) => (
                          <button 
                            key={i} 
                            onClick={() => setUserSymptom(s.description)}
                            className="w-full text-left p-4 text-xs font-bold uppercase tracking-tight border border-[var(--border-dim)] hover:border-[var(--pe-accent)] hover:text-[var(--pe-accent)] transition-all bg-black/20 rounded-lg"
                          >
                            {s.description}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={reset} className="w-full py-5 border border-[var(--border-dim)] text-slate-400 uppercase font-black tracking-wide text-xs hover:border-[var(--pe-accent)] hover:text-[var(--pe-accent)] transition-all rounded-xl">
                       Eject Selection
                    </button>
                  </div>
                )}
              </div>

              <div className="col-span-12 md:col-span-8 bg-[var(--bg-card)] border border-[var(--border-dim)] flex flex-col relative overflow-hidden transition-all shadow-2xl rounded-xl">
                {isDiagnosing && (
                  <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex items-center justify-center">
                    <div className="text-center space-y-8">
                      <div className="relative">
                        <div className="w-32 h-32 border-4 border-slate-800 border-t-[var(--pe-accent)] rounded-full animate-spin mx-auto"></div>
                        <Wrench className="w-12 h-12 pe-accent-text absolute inset-0 m-auto animate-pulse" />
                      </div>
                      <p className="text-lg font-mono tracking-[0.5em] pe-accent-text animate-pulse">ANALYZING SCHEMATIC</p>
                    </div>
                  </div>
                )}

                {diagnosis ? (
                  <div className="flex-grow flex flex-col min-h-0">
                    <div className="flex-grow p-4 md:p-12 lg:p-16 overflow-y-auto space-y-12 md:space-y-20">
                      {selectedMarker.boltImageUrl && (
                        <div className="w-full bg-[var(--bg-main)] border border-[var(--border-dim)] rounded-xl overflow-hidden group">
                          <div className="p-4 bg-black/20 border-b border-[var(--border-dim)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Layers className="w-4 h-4 pe-accent-text" />
                              <span className="text-xs font-bold uppercase pe-accent-text tracking-wide">Internal Components</span>
                            </div>
                          </div>
                          <div className="relative cursor-zoom-in overflow-hidden bg-black/10 flex items-center justify-center min-h-[150px] md:min-h-[350px]">
                            <img 
                              src={selectedMarker.boltImageUrl} 
                              alt={`${selectedMarker.name} Internals`}
                              referrerPolicy="no-referrer"
                              className="max-w-full max-h-[500px] object-contain transition-all duration-700 group-hover:scale-110 p-8"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-6 max-w-2xl">
                        <h4 className="text-xs uppercase font-bold pe-accent-text tracking-wide">Fault Detection</h4>
                        <p className="text-2xl md:text-5xl font-black leading-tight text-white tracking-tight">
                          {diagnosis.diagnosis}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      {diagnosis.recommendedOrings.map((o, i) => {
                        const isGasket = o.size.toUpperCase().includes('N/A') ||
                                        o.size.toUpperCase().includes('GASKET') ||
                                        o.name.toUpperCase().includes('GASKET');
                        return (
                          <div key={i} className="border border-[var(--border-dim)] p-8 bg-[var(--bg-main)] hover:border-[var(--pe-accent)] transition-all group relative rounded-xl">
                            <div className="absolute top-4 right-4 text-xs font-bold uppercase text-slate-500">Component</div>
                            <div className="mb-6">
                              <span className="text-4xl md:text-5xl font-black pe-accent-text">
                                {isGasket ? 'Solenoid Gasket' : o.size}
                              </span>
                              <p className="text-xs font-bold text-slate-500 mt-1 uppercase">Qty: {o.quantity}</p>
                            </div>
                            <h5 className="text-xl font-black uppercase text-white mb-2">
                              {isGasket ? '' : o.name}
                            </h5>
                            <div className="h-[1px] bg-[var(--border-dim)] w-full mb-4"></div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs uppercase font-bold pe-accent-text tracking-wide">Zone: {o.location}</p>
                              <button 
                                onClick={(e) => { e.stopPropagation(); copyPart(i); }}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors group/copy"
                                title="Copy part & search"
                              >
                                {copiedIndex === i ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4 text-slate-500 group-hover/copy:text-white" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-10 pt-16 border-t border-[var(--border-dim)]">
                      <div className="flex flex-wrap gap-4">
                        <a 
                          href={diagnosis.manualUrl || selectedMarker.manualUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-3 px-8 py-5 border border-white/20 text-white font-black uppercase text-xs tracking-wide hover:bg-white/5 transition-all rounded-lg"
                        >
                          <BookOpen className="w-5 h-5 pe-accent-text" /> View Manual
                        </a>
                        <button 
                          onClick={handleOrderParts}
                          className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-3 px-8 py-5 bg-white text-black font-black uppercase text-xs tracking-wide hover:bg-slate-200 transition-all rounded-lg"
                        >
                          {copiedParts ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-green-600" /> Copied to Clipboard
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-5 h-5" /> Order Parts
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex justify-between items-end">
                        <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wide">Maintenance Steps</h4>
                        <span className="text-xs font-mono font-bold pe-accent-text">
                          {checkedSteps.filter(s => s).length} / {diagnosis.steps.length} RESOLVED
                        </span>
                      </div>
                      
                      <div className="grid gap-4">
                        {diagnosis.steps.map((step, i) => (
                          <div 
                            key={i} 
                            onClick={() => toggleStep(i)}
                            className={`flex gap-6 p-6 md:p-8 transition-all border rounded-xl cursor-pointer group ${checkedSteps[i] ? 'bg-sky-500/5 border-sky-500/30' : 'bg-[var(--bg-main)] border-[var(--border-dim)] hover:border-slate-700'}`}
                          >
                            <div className={`flex-shrink-0 w-12 h-12 border-2 rounded-full flex items-center justify-center transition-all ${checkedSteps[i] ? 'bg-sky-400 border-sky-400 text-slate-950' : 'border-slate-800 text-slate-600 group-hover:border-sky-400 group-hover:text-sky-400'}`}>
                              {checkedSteps[i] ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-lg font-black">{i + 1}</span>}
                            </div>
                            <div className="space-y-2 py-1">
                              <p className={`text-base md:text-lg font-medium leading-relaxed transition-all ${checkedSteps[i] ? 'line-through opacity-20' : 'text-slate-200'}`}>
                                {step}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                      {/* Follow-up Section & Tech Tip */}
                      <div className="pt-20 border-t border-[var(--border-dim)] space-y-12">
                        <div className="bg-[var(--bg-card)] p-8 md:p-12 rounded-xl border border-[var(--border-dim)] space-y-10">
                          <div className="bg-[var(--pe-accent)]/5 border border-[var(--pe-accent)]/20 p-8 rounded-xl flex flex-col md:flex-row items-center gap-8">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-[var(--pe-accent)] rounded-xl flex items-center justify-center flex-shrink-0 rotate-3 shadow-[0_0_30px_var(--pe-accent-glow)]">
                              <BrainCircuit className="w-10 h-10 text-slate-950" />
                            </div>
                            <div>
                              <span className="text-xs uppercase pe-accent-text font-black tracking-wide mb-2 block">MASTER TECH VERIFICATION</span>
                              <p className="text-xl md:text-2xl font-medium italic text-white leading-tight">"{diagnosis.techTip}"</p>
                            </div>
                          </div>

                          <div className="space-y-8 pt-4">
                            <div className="mt-8 space-y-4">
                              <div className="flex min-w-0 flex-wrap gap-4">
                                <a
                                  href={markerYoutube?.mode === 'embed' ? markerYoutube.watchUrl : markerYoutube?.openUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex min-w-0 flex-1 basis-full items-center justify-center gap-3 whitespace-normal bg-[#FF0000] px-6 py-5 text-center text-xs font-black uppercase tracking-wide text-white shadow-lg transition-all hover:scale-105 sm:basis-[calc(50%-0.5rem)] sm:px-8 sm:tracking-wide"
                                >
                                  <PlayCircle className="h-5 w-5" />
                                  {markerYoutube?.mode === 'embed'
                                    ? 'Watch tutorial on YouTube'
                                    : markerYoutube?.label ?? 'Search repair guides'}
                                </a>

                                <a
                                  href={partsShopUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex min-w-0 flex-1 basis-full items-center justify-center gap-3 whitespace-normal bg-white px-6 py-5 text-center text-xs font-black uppercase tracking-wide text-black shadow-lg transition-all hover:scale-105 sm:basis-[calc(50%-0.5rem)] sm:px-8 sm:tracking-wide"
                                >
                                  <ShoppingCart className="h-5 w-5" />
                                  Find parts on ANSgear
                                </a>
                              </div>
                            </div>

                            <div className="space-y-2 border-t border-[var(--border-dim)] pt-8">
                              <h4 className="text-lg font-black uppercase tracking-tight text-white">Still having issues?</h4>
                              <p className="text-sm text-slate-400">Provide more details for a refined diagnosis.</p>
                            </div>

                            <textarea
                              value={followUpQuery}
                              onChange={(e) => setFollowUpQuery(e.target.value)}
                              disabled={!isOnline}
                              placeholder={isOnline ? "Detail any remaining performance issues..." : "Network unavailable - Refined diagnostics disabled"}
                              className={`w-full bg-black/40 border border-[var(--border-dim)] p-6 text-white text-base focus:border-[var(--pe-accent)]/40 outline-none min-h-[120px] rounded-xl transition-all ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />

                            <button
                              onClick={() => handleDiagnose(followUpQuery || "The previous steps were followed but the issue persists. Please provide a different solution.")}
                              disabled={!isOnline}
                              className={`w-full py-5 bg-[var(--pe-accent)] text-slate-950 font-black uppercase text-xs tracking-wide transition-all rounded-lg flex items-center justify-center gap-3 shadow-lg ${!isOnline ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:brightness-110'}`}
                            >
                              <Repeat className="w-4 h-4" />
                              {!isOnline ? 'Offline' : 'Try different diagnosis'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[var(--bg-main)] border-t border-[var(--border-dim)] flex flex-col gap-6 p-6 md:p-10 flex-shrink-0">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <a
                          href={diagnosis.manualUrl || selectedMarker.manualUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:pe-accent-text flex items-center gap-2 text-xs font-bold uppercase tracking-wide"
                        >
                          📖 Hardware Manual <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <button
                          onClick={reset}
                          className="flex-1 px-6 py-3 border border-[var(--border-dim)] text-white font-bold uppercase text-xs tracking-wide hover:bg-white hover:text-black transition-all rounded-lg"
                        >
                          Close Case
                        </button>
                        <button
                          onClick={() => setView('history')}
                          className="flex-1 px-6 py-3 bg-[var(--pe-accent)] text-slate-950 font-black uppercase text-xs tracking-wide hover:brightness-110 transition-all flex items-center justify-center gap-2 rounded-lg"
                        >
                          Save to History <ChevronRight className="w-3 h-4" />
                        </button>
                      </div>
                    </div>

                    {currentHistoryId && (
                      <div className="p-8 md:p-20 border-t border-[var(--border-dim)] bg-[var(--bg-main)]">
                        <div className="max-w-4xl mx-auto bg-[var(--bg-card)] p-8 md:p-12 rounded-xl border border-[var(--pe-accent)]/5">
                          <h4 className="text-2xl font-black uppercase tracking-tight text-white underline decoration-[var(--pe-accent)]/40 underline-offset-8 mb-8">Share Your Outcome</h4>
                          <div className="hs-form-frame" data-region="na2" data-form-id="0b37c22a-bab7-49f9-a514-cdaed3cb67d4" data-portal-id="242667089"></div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center p-20 text-center">
                    <div className="w-32 h-32 bg-[var(--bg-card)] rounded-full flex items-center justify-center mb-8 border border-[var(--border-dim)]">
                      <Wrench className="w-16 h-16 opacity-10" />
                    </div>
                    <p className="text-sm font-semibold tracking-wide uppercase opacity-60">Select marker to begin</p>
                    <div className="mt-12 flex space-x-2">
                      <div className="h-1 w-4 bg-[var(--border-dim)]"></div>
                      <div className="h-1 w-8 bg-[var(--border-dim)]"></div>
                      <div className="h-1 w-20 bg-[var(--pe-accent)]"></div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[var(--border-dim)]">
                <div className="space-y-1">
                  <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight">CASE <span className="pe-accent-text">LOGS</span></h2>
                  <p className="text-xs uppercase tracking-[0.4em] font-bold text-slate-500">Historical Maintenance Records</p>
                </div>
                <div className="flex gap-4">
                  {history.length > 0 && (
                    <button 
                      onClick={clearHistory}
                      className="px-6 py-3 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wide rounded-xl"
                    >
                      Purge History
                    </button>
                  )}
                  <button onClick={() => setView('home')} className="p-3 border border-[var(--border-dim)] hover:bg-white hover:text-black transition-all rounded-xl">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {history.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {history.map((entry) => (
                    <div 
                      key={entry.id}
                      className="p-6 md:p-10 border border-[var(--border-dim)] bg-[var(--bg-card)] hover:border-[var(--pe-accent)]/50 transition-all group relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 rounded-xl"
                    >
                      <div className="space-y-3 w-full">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono pe-accent-text font-bold uppercase tracking-wide">
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </span>
                          <span className="text-xs font-bold uppercase bg-[var(--pe-accent)] text-slate-950 px-3 py-1 rounded-md">
                            {entry.brand}
                          </span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">{entry.markerName}</h3>
                        <p className="text-sm text-slate-400 font-medium italic border-l-2 border-[var(--border-dim)] pl-4">"{entry.userSymptom}"</p>
                        {entry.rating && (
                          <div className="flex gap-1 pt-3">
                            <div className="bg-black/30 px-3 py-1.5 rounded-lg flex gap-1 items-center border border-white/5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={`w-3 h-3 ${s <= entry.rating! ? 'pe-accent-text fill-current' : 'text-slate-800'}`} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <button 
                          onClick={() => viewHistoryEntry(entry)}
                          className="flex-grow md:flex-grow-0 px-8 py-4 bg-[var(--pe-accent)] text-slate-950 font-black uppercase text-xs tracking-wide hover:brightness-110 transition-all flex items-center justify-center gap-3 rounded-xl"
                        >
                          Review Scan
                        </button>
                        <button 
                          onClick={() => deleteHistoryEntry(entry.id)}
                          className="p-4 border border-[var(--border-dim)] text-slate-500 hover:text-red-500 hover:border-red-500 transition-all rounded-xl"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-40 text-center border-2 border-dashed border-[var(--border-dim)] bg-[var(--bg-card)]/30 rounded-xl">
                  <History className="w-20 h-20 mx-auto mb-8 opacity-5" />
                  <p className="text-2xl font-black uppercase tracking-tight text-white/20">Archive Empty</p>
                  <p className="text-xs text-slate-600 mt-2 uppercase tracking-[0.3em] font-bold">No previous diagnostic sessions identified</p>
                  <button onClick={() => setView('selector')} className="mt-12 px-10 py-5 bg-[var(--pe-accent)] text-slate-950 text-xs font-black uppercase tracking-wide hover:brightness-110 transition-all rounded-xl">Initialize New Scan</button>
                </div>
              )}
            </motion.div>
          )}

          {view === 'tips' && (
            <motion.div 
              key="tips"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-16"
            >
              <div className="flex items-center gap-10">
                <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tight">FIELD <span className="pe-accent-text">MANUAL</span></h2>
                <div className="flex-grow h-px bg-[var(--border-dim)]"></div>
                <button onClick={() => setView('home')} className="p-4 border border-[var(--border-dim)] hover:bg-white hover:text-black transition-all rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {GENERAL_TIPS.map((tip, i) => (
                  <div key={i} className="p-10 border border-[var(--border-dim)] bg-[var(--bg-card)] group hover:border-[var(--pe-accent)]/40 transition-all relative rounded-xl overflow-hidden">
                    <div className="absolute -top-4 -right-2 text-8xl font-black text-white/[0.03] select-none">{i+1}</div>
                    <p className="text-xl md:text-2xl leading-snug font-medium text-slate-300 relative z-10 italic">"{tip}"</p>
                  </div>
                ))}
              </div>

              <div className="bg-[#B91C1C] p-10 md:p-16 rounded-xl shadow-[0_40px_100px_rgba(185,28,28,0.2)]">
                <div className="flex flex-col md:flex-row gap-12 items-center md:items-start text-center md:text-left">
                  <div className="w-24 h-24 bg-white/10 rounded-xl flex items-center justify-center animate-pulse">
                    <AlertCircle className="w-12 h-12 text-white" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white mb-4">CRITICAL SAFETY PROTOCOL</h3>
                    <p className="text-lg md:text-xl font-bold uppercase tracking-wide leading-relaxed text-white opacity-95">
                      High-pressure gas systems are active. Always exhaust secondary air chambers before maintenance. Eject paintballs and remove air supplies completely.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {previewMarker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setPreviewMarker(null)}
              className="absolute inset-0 bg-black/98 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative bg-[var(--bg-main)] border border-[var(--pe-accent)]/10 w-full h-full md:h-auto md:max-w-6xl overflow-hidden shadow-[0_0_120px_rgba(0,0,0,1)] flex flex-col md:rounded-xl"
            >
              <div className="p-6 md:p-10 border-b border-[var(--border-dim)] flex justify-between items-center bg-[var(--bg-card)] flex-shrink-0">
                <div className="space-y-1">
                  <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white">{previewMarker.name}</h3>
                  <p className="text-xs uppercase tracking-[0.5em] font-bold pe-accent-text">Component Schematic Preview</p>
                </div>
                <button 
                  onClick={() => setPreviewMarker(null)}
                  className="w-12 h-12 bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black transition-all flex items-center justify-center rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-grow p-4 md:p-20 flex items-center justify-center bg-black/20 overflow-auto">
                <img 
                  src={previewMarker.boltImageUrl} 
                  alt={`${previewMarker.name} Internals`}
                  className="max-w-full max-h-[70vh] object-contain transition-all hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-8 md:p-12 bg-[var(--bg-card)] border-t border-[var(--border-dim)] flex flex-col md:flex-row gap-6 justify-between items-center flex-shrink-0">
                <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
                  <p className="text-xs pe-accent-text uppercase tracking-[0.3em] font-black">SCAN STATUS: OPTIMAL</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Technical Asset Documentation // Proprietary Asset</p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedMarker(previewMarker);
                    setPreviewMarker(null);
                    setView('diagnostic');
                  }}
                  className="w-full md:w-auto px-12 py-5 bg-[var(--pe-accent)] text-slate-950 font-black uppercase text-xs tracking-[0.2em] hover:brightness-110 transition-all rounded-xl shadow-2xl"
                >
                  Execute Scan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      <footer className="mt-16 pt-10 border-t border-[var(--border-dim)] flex flex-col md:flex-row justify-between items-center text-xs font-mono opacity-40 uppercase tracking-[0.3em] relative z-10 pb-10">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></div>
          Status: Diagnostic core active // {selectedMarker ? selectedMarker.series : 'NATIVE'} Support
        </div>
        <div className="flex space-x-12 mt-6 md:mt-0">
          <span>Pocket Tech Companion v3.1.0</span>
          <button onClick={() => setView('tips')} className="hover:pe-accent-text transition-colors border-b border-transparent hover:border-current">Logic Guidelines</button>
        </div>
      </footer>
    </div>
  );
}
