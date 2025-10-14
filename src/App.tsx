import { easeInOut } from "framer-motion";
import { useState, useEffect, useRef, useMemo } from "react";
// L'errore è risolto qui, 'Play' è ora utilizzato:
import { Play, Pause, SkipForward, RotateCcw, ChevronDown, ChevronUp, Plus, Minus, Volume2, Info, RefreshCcw } from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';

type PhaseKey = 'A' | 'B' | 'C' | 'D';

type PhaseStyle = {
  name: string;
  color: string;
  textColor: string;
  accent: string;
  globalBarColor: string; // Aggiunto per la barra di progressione globale
};

type PhaseDurations = Record<PhaseKey, number>;

type PhasePercentages = Record<PhaseKey, number>;

const phaseOrder: PhaseKey[] = ['A', 'B', 'C', 'D'];

const phaseStyles: Record<PhaseKey, PhaseStyle> = {
  A: { name: 'Attenzione', color: 'from-[#4d6bb3] to-[#345997]', textColor: 'text-[#98b5f5]', accent: '#5f8dff', globalBarColor: '#537abf' }, 
  B: { name: 'Base', color: 'from-[#d8a343] to-[#b9852c]', textColor: 'text-[#f4d48a]', accent: '#f1b54f', globalBarColor: '#d6a855' }, 
  C: { name: 'Challenge', color: 'from-[#d46c4a] to-[#b55133]', textColor: 'text-[#ffb08a]', accent: '#ff865c', globalBarColor: '#e07659' }, 
  D: { name: 'Destinazione', color: 'from-[#3a9d7a] to-[#2a7c5f]', textColor: 'text-[#9de7c6]', accent: '#5dda9d', globalBarColor: '#47b089' } 
};

const defaultPhaseDurations: PhaseDurations = {
  A: 3,
  B: 3,
  C: 3,
  D: 3
};

const defaultPhasePercentages: PhasePercentages = {
  A: 70,
  B: 85,
  C: 105,
  D: 100
};

const calculateTotalTime = (durations: PhaseDurations) =>
  phaseOrder.reduce((acc, phase) => acc + durations[phase] * 60, 0);

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  const value = sanitized.length === 3
    ? sanitized.split('').map(ch => ch + ch).join('')
    : sanitized;
  const numeric = parseInt(value, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeInOut } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: easeInOut } }
};

const staggerParent = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08
    }
  }
};

const pillVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeInOut } }
};

const ABCDMetronome = () => {
  const [targetBPM, setTargetBPM] = useState(100);
  const [subdivision, setSubdivision] = useState<'quarter' | 'eighth' | 'triplet' | 'sixteenth'>('quarter');
  const [phaseDurations, setPhaseDurations] = useState<PhaseDurations>(() => ({ ...defaultPhaseDurations }));
  const [phasePercentages, setPhasePercentages] = useState<PhasePercentages>(() => ({ ...defaultPhasePercentages }));
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<PhaseKey>('A');
  const [timeRemaining, setTimeRemaining] = useState(defaultPhaseDurations.A * 60);
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(calculateTotalTime(defaultPhaseDurations));
  const [isInBreak, setIsInBreak] = useState(false);
  const [countdownBeat, setCountdownBeat] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false); 
  const [beatFlash, setBeatFlash] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.85);

  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentNoteRef = useRef(0);
  const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const globalIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  
  // RIFERIMENTO PER LA FASE SUCCESSIVA AL BREAK (FIX LOGICA)
  const nextPhaseOnBreakEndRef = useRef<PhaseKey>('A'); 
  
  // ** STATO E REF PER FISSARE LE DIMENSIONI **
  const metronomeContentRef = useRef<HTMLDivElement>(null);
  const [contentDimensions, setContentDimensions] = useState<{ width: string, height: string } | null>(null);
  // ** FINE STATO **


  const subdivisions = {
    quarter: { name: '♩ 1/4', beats: 1 },
    eighth: { name: '♪♪ 1/8', beats: 2 },
    triplet: { name: '♪♪♪ Triplet', sup: '3', beats: 3 },
    sixteenth: { name: '♬♬ 1/16', beats: 4 }
  } as const;

  const getPhasePercentage = (phase: PhaseKey) => phasePercentages[phase] / 100;

  const getCurrentBPM = () => {
    // FIX: Durante il break, il BPM del metronomo dovrebbe basarsi sulla fase successiva.
    // Usiamo nextPhaseOnBreakEndRef.current se siamo in break, altrimenti currentPhase.
    const phase = isInBreak ? nextPhaseOnBreakEndRef.current : currentPhase;
    return Math.round(targetBPM * getPhasePercentage(phase));
  };
  
  const ensureAudioContext = () => {
    if (typeof window === 'undefined') { return false; }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') { return true; }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

    if (!AudioContextClass) {
      setAudioError(prev => prev ?? 'Audio non supportato dal browser; il timer funzionerà senza suoni.');
      audioContextRef.current = null;
      return false;
    }

    try {
      audioContextRef.current = new AudioContextClass();
      if (audioContextRef.current && !masterGainRef.current) {
        masterGainRef.current = audioContextRef.current.createGain();
        masterGainRef.current.connect(audioContextRef.current.destination);
        masterGainRef.current.gain.value = volume;
      }
      setAudioError(null);
      return true;
    } catch (error) {
      console.error('AudioContext initialization failed', error);
      setAudioError(prev => prev ?? "Impossibile inizializzare l'audio. Consenti l'accesso o ricarica la pagina.");
      audioContextRef.current = null;
      return false;
    }
  };

  const resumeAudioContext = () => {
    if (!audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current
        .resume()
        .then(() => setAudioError(null))
        .catch(error => {
          console.error('AudioContext resume failed', error);
          setAudioError("Per abilitare i suoni interagisci con la pagina (es. premi Start) e consenti l'audio.");
        });
    }
  };

  const playCountSound = (count: number, duration: number) => { 
    if (!ensureAudioContext()) {
      return;
    }

    resumeAudioContext();

    const ctx = audioContextRef.current;
    if (!ctx || !masterGainRef.current) return;

    const now = ctx.currentTime;

    const frequencies: Record<number, number> = {
      1: 880,
      2: 1046,
      3: 1174,
      4: 1318
    };

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(masterGainRef.current);

    osc.frequency.value = frequencies[count] || 880;
    osc.type = 'sine';

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + Math.min(duration / 1000, 0.3));

    osc.start(now);
    osc.stop(now + Math.min(duration / 1000, 0.3));
  };

  const playTickSound = () => { 
    if (!ensureAudioContext()) {
      return;
    }

    resumeAudioContext();

    const ctx = audioContextRef.current;
    if (!ctx || !masterGainRef.current) return;

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(masterGainRef.current);

    osc.frequency.value = 700;
    osc.type = 'triangle';

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc.start(now);
    osc.stop(now + 0.06);
  };
  
  const scheduleNote = (time: number, isAccent: boolean) => { 
    if (!audioContextRef.current || !masterGainRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(masterGainRef.current);
    osc.frequency.value = isAccent ? 1200 : 800;
    gainNode.gain.value = isAccent ? 0.3 : 0.15;
    osc.start(time);
    osc.stop(time + 0.05);
    const delay = (time - ctx.currentTime) * 1000;
    setTimeout(() => {
      setBeatFlash(true);
      setTimeout(() => setBeatFlash(false), 50);
    }, delay);
  };
  
  const scheduler = () => {
    if (!audioContextRef.current) { return; }
    const lookahead = 0.1;
    const scheduleAheadTime = 0.2;
    // FIX: Chiamiamo getCurrentBPM() qui, che si basa su nextPhaseOnBreakEndRef.current se in break.
    const currentBPM = getCurrentBPM();
    const secondsPerNote = 60.0 / (currentBPM * subdivisions[subdivision].beats);
    
    while (audioContextRef.current && nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
      const beatsPerBar = subdivisions[subdivision].beats;
      const isAccent = currentNoteRef.current % beatsPerBar === 0;
      scheduleNote(nextNoteTimeRef.current, isAccent);
      nextNoteTimeRef.current += secondsPerNote;
      currentNoteRef.current++;
    }
    timerIdRef.current = setTimeout(scheduler, lookahead * 1000);
  };
  
  const stopMetronome = () => { if (timerIdRef.current) { clearTimeout(timerIdRef.current); timerIdRef.current = null; } };
  
  const startMetronome = () => {
    if (!ensureAudioContext()) { return; }
    resumeAudioContext();
    const ctx = audioContextRef.current;
    if (!ctx) { return; }
    if (!masterGainRef.current) {
      masterGainRef.current = ctx.createGain();
      masterGainRef.current.connect(ctx.destination);
      masterGainRef.current.gain.value = volume;
    }
    currentNoteRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime;
    scheduler();
  };
  

  const calculateRemainingTime = (fromPhase: PhaseKey) => {
    const currentIndex = phaseOrder.indexOf(fromPhase);
    let total = 0;
    for (let i = currentIndex; i < phaseOrder.length; i++) {
      total += phaseDurations[phaseOrder[i]] * 60;
    }
    return total;
  };

  // FIX: startBreak accetta la *prossima* fase che deve partire DOPO il break.
  const startBreak = (phaseToStartAfterBreak: PhaseKey) => {
    // 1. Pulizia e setup del break
    countdownTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    countdownTimeoutsRef.current = [];

    // Imposta il riferimento per la fase successiva
    nextPhaseOnBreakEndRef.current = phaseToStartAfterBreak;

    setIsInBreak(true);
    setIsPaused(false); 
    setCountdownBeat(0);
    
    // Aggiorna il tempo totale rimanente
    setTotalTimeRemaining(calculateRemainingTime(phaseToStartAfterBreak));

    // Il metronomo (e il countdown) usano il BPM della fase successiva
    const nextBPM = Math.round(targetBPM * getPhasePercentage(phaseToStartAfterBreak));
    const halfNoteDuration = (60 / nextBPM) * 2 * 1000;
    const quarterNoteDuration = (60 / nextBPM) * 1000;
    
    // 2. Scheduler del Countdown (4 beats totali - 2 lenti, 4 veloci)
    const t1 = setTimeout(() => { playCountSound(1, halfNoteDuration); setCountdownBeat(1); }, 0);
    const tick1 = setTimeout(() => { playTickSound(); }, quarterNoteDuration);
    const t2 = setTimeout(() => { playCountSound(2, halfNoteDuration); setCountdownBeat(2); }, halfNoteDuration);
    const tick2 = setTimeout(() => { playTickSound(); }, halfNoteDuration + quarterNoteDuration);
    
    const t3 = setTimeout(() => { playCountSound(1, quarterNoteDuration); setCountdownBeat(3); }, halfNoteDuration * 2);
    const t4 = setTimeout(() => { playCountSound(2, quarterNoteDuration); setCountdownBeat(4); }, halfNoteDuration * 2 + quarterNoteDuration);
    const t5 = setTimeout(() => { playCountSound(3, quarterNoteDuration); setCountdownBeat(5); }, halfNoteDuration * 2 + quarterNoteDuration * 2);
    const t6 = setTimeout(() => { playCountSound(4, quarterNoteDuration); setCountdownBeat(6); }, halfNoteDuration * 2 + quarterNoteDuration * 3);

    // 3. Fine del break e passaggio alla fase.
    const t7 = setTimeout(() => {
      setIsInBreak(false);
      setCountdownBeat(0);
      setCurrentPhase(phaseToStartAfterBreak); // Usa la fase impostata nel ref/parametro
      setTimeRemaining(phaseDurations[phaseToStartAfterBreak] * 60);
      // Il metronomo ripartirà automaticamente grazie all'useEffect.
    }, halfNoteDuration * 2 + quarterNoteDuration * 4);

    countdownTimeoutsRef.current = [t1, tick1, t2, tick2, t3, t4, t5, t6, t7];
  };


  const goToNextPhase = (manual = false) => {
    // Se stiamo già in un break, annulliamo i timeout e partiamo con il break per la fase successiva
    countdownTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    countdownTimeoutsRef.current = [];
    stopMetronome();
    if (intervalIdRef.current) { clearInterval(intervalIdRef.current); intervalIdRef.current = null; }

    const phaseToTransitionFrom = isInBreak ? nextPhaseOnBreakEndRef.current : currentPhase;
    const currentIndex = phaseOrder.indexOf(phaseToTransitionFrom);

    if (currentIndex < phaseOrder.length - 1) {
      // Prossima fase nella sequenza
      const nextPhase = phaseOrder[currentIndex + 1];
      startBreak(nextPhase);
    } else if (manual) {
      // Ultima fase, saltata, si comporta come un reset
      setTotalTimeRemaining(0);
      setIsRunning(false);
      setCurrentPhase('A');
      setTimeRemaining(phaseDurations['A'] * 60);
    }
  };


  // FUNZIONE RIPETI FASE CORRENTE (FIX LOGICA)
  const handleRestartPhase = () => {
    if (!isRunning || isInBreak) return;

    // 1. Ferma i metronomi/timer correnti
    stopMetronome();
    if (intervalIdRef.current) { clearInterval(intervalIdRef.current); intervalIdRef.current = null; }
    if (globalIntervalRef.current) { clearInterval(globalIntervalRef.current); globalIntervalRef.current = null; }
    
    // 2. Calcola il tempo trascorso nella fase attuale (da sottrarre al totale)
    const phaseDurationSeconds = phaseDurations[currentPhase] * 60;
    const timeElapsedInPhase = phaseDurationSeconds - timeRemaining;
    
    // 3. Resetta il tempo totale globale (aggiungendo il tempo 'perso' indietro)
    // Questo mantiene il conteggio globale corretto per la barra di progressione.
    setTotalTimeRemaining(prevTotal => prevTotal + timeElapsedInPhase);

    // 4. Riavvia la fase corrente tramite il break
    // Il break farà il countdown e imposterà 'currentPhase' come fase successiva
    startBreak(currentPhase);
  };
  // FINE FUNZIONE RIPETI FASE


  useEffect(() => {
    let shouldRestartBreak = false;
    
    // Logica per riprendere un break in pausa
    if (isRunning && !isPaused && isInBreak && countdownTimeoutsRef.current.length === 0) {
        shouldRestartBreak = true;
    }
    
    if (isRunning && !isPaused && !isInBreak) {
      if (globalIntervalRef.current) { clearInterval(globalIntervalRef.current); }
      globalIntervalRef.current = setInterval(() => {
        setTotalTimeRemaining(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      startMetronome(); 
      
      if (intervalIdRef.current) { clearInterval(intervalIdRef.current); }
      intervalIdRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            stopMetronome();
            if (intervalIdRef.current) { clearInterval(intervalIdRef.current); intervalIdRef.current = null; }

            const currentIndex = phaseOrder.indexOf(currentPhase);

            if (currentIndex < phaseOrder.length - 1) {
              const nextPhase = phaseOrder[currentIndex + 1];
              startBreak(nextPhase); // Passa la fase successiva
            } else {
              // Fine del ciclo
              setIsRunning(false);
              setCurrentPhase('A');
              setTimeRemaining(phaseDurations['A'] * 60);
              setTotalTimeRemaining(0);
            }
            // Non resettare il tempo qui, verrà resettato in startBreak per la fase successiva
            return 0; // Il timer si fermerà, il prossimo valore verrà impostato da startBreak
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      stopMetronome();
      if (intervalIdRef.current) { clearInterval(intervalIdRef.current); intervalIdRef.current = null; }
      if (globalIntervalRef.current) { clearInterval(globalIntervalRef.current); globalIntervalRef.current = null; }
      
      // Quando in pausa, interrompi tutti i timeout del countdown
      countdownTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      countdownTimeoutsRef.current = [];
    }
    
    // Se c'è un break in pausa che deve riprendere
    if (shouldRestartBreak) {
        const nextPhase = nextPhaseOnBreakEndRef.current; 
        
        if (nextPhase !== 'A' || currentPhase !== 'D') {
            startBreak(nextPhase);
        } else {
            // Se D è finita e il break finale è stato messo in pausa, termina il ciclo
            setIsRunning(false);
            setCurrentPhase('A');
            setTimeRemaining(phaseDurations['A'] * 60);
            setTotalTimeRemaining(0);
        }
    }

    return () => {
      stopMetronome();
      if (intervalIdRef.current) { clearInterval(intervalIdRef.current); intervalIdRef.current = null; }
      if (globalIntervalRef.current) { clearInterval(globalIntervalRef.current); globalIntervalRef.current = null; }
      countdownTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      countdownTimeoutsRef.current = [];
    };
    // Dipendenze aggiornate per includere il nuovo ref
  }, [isRunning, isPaused, isInBreak, currentPhase, phaseDurations, subdivision, targetBPM, phasePercentages]); 

  useEffect(() => {
    return () => {
      countdownTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  useEffect(() => {
    if (!isRunning) {
      setTotalTimeRemaining(calculateTotalTime(phaseDurations));
      setTimeRemaining(phaseDurations[currentPhase] * 60);
    }
  }, [phaseDurations, currentPhase, isRunning]);

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
  }, [volume]);
  
  // ** EFFECT PER CATTURARE LE DIMENSIONI (mantenuto il fix) **
  useEffect(() => {
    if (!isInBreak && metronomeContentRef.current) {
        const { offsetWidth, offsetHeight } = metronomeContentRef.current;
        setContentDimensions({
            width: offsetWidth + 'px',
            height: offsetHeight + 'px',
        });
    } else if (!isRunning && !contentDimensions) {
        if (metronomeContentRef.current) {
            setContentDimensions({
                width: metronomeContentRef.current.offsetWidth + 'px',
                height: metronomeContentRef.current.offsetHeight + 'px',
            });
        }
    }
  }, [isInBreak, currentPhase]);
  // ** FINE EFFECT **

  const handleStartStop = () => {
    if (isRunning) {
      setIsPaused(!isPaused);
    } else {
      ensureAudioContext();
      resumeAudioContext();
      setTotalTimeRemaining(calculateTotalTime(phaseDurations));
      setIsRunning(true);
      setIsPaused(false);
      // FIX: Al primo start, parte il break che farà iniziare la fase 'A'
      startBreak('A'); 
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === ' ') {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.getAttribute('contenteditable') === 'true')) {
        return; 
      }
      
      event.preventDefault();

      handleStartStop();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRunning, isPaused, isInBreak, phaseDurations]);

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentPhase('A');
    setTimeRemaining(phaseDurations['A'] * 60);
    setTotalTimeRemaining(calculateTotalTime(phaseDurations));
    setIsInBreak(false);
    nextPhaseOnBreakEndRef.current = 'A'; // Resetta anche il riferimento
    stopMetronome();
    countdownTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    countdownTimeoutsRef.current = [];
  };

  const handleResetDefaults = () => {
    if (isRunning && !isPaused) return; 
    setPhaseDurations({ ...defaultPhaseDurations });
    setPhasePercentages({ ...defaultPhasePercentages });
    setTargetBPM(100);
    setSubdivision('quarter');
    setCurrentPhase('A');
    setTotalTimeRemaining(calculateTotalTime(defaultPhaseDurations));
    setTimeRemaining(defaultPhaseDurations['A'] * 60);
    nextPhaseOnBreakEndRef.current = 'A';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.max(seconds % 60, 0);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustBPM = (delta: number) => {
    setTargetBPM(prev => Math.max(40, Math.min(240, prev + delta)));
  };

  const updatePhaseDuration = (phase: PhaseKey, duration: number) => {
    setPhaseDurations(prev => {
      const updated = { ...prev, [phase]: duration };
      if (!isRunning) {
        setTotalTimeRemaining(calculateTotalTime(updated));
        if (phase === currentPhase) {
          setTimeRemaining(duration * 60);
        }
      }
      return updated;
    });
  };

  const updatePhasePercentage = (phase: PhaseKey, value: number) => {
    if (phase === 'D') return;
    setPhasePercentages(prev => ({ ...prev, [phase]: value, D: 100 }));
  };
  
  // Logica Barra di Progressione Globale
  const totalDuration = calculateTotalTime(phaseDurations);
  const totalElapsed = totalDuration - totalTimeRemaining;
  // La progressione è calcolata in modo inverso per la barra di progressione.
  const currentProgressWidth = isRunning && totalDuration > 0 ? (totalElapsed / totalDuration) * 100 : 0;
  
  const gradientStops = useMemo(() => {
    if (totalDuration === 0) return '';
    let cumulativePercentage = 0;
    return phaseOrder.map(key => {
      const phaseDurationPerc = (phaseDurations[key] * 60 / totalDuration) * 100;
      const phaseColor = phaseStyles[key].globalBarColor;
      const start = cumulativePercentage;
      cumulativePercentage += phaseDurationPerc;
      return `${phaseColor} ${start}%, ${phaseColor} ${cumulativePercentage}%`;
    }).join(', ');
  }, [phaseDurations, totalDuration]);

  // Nuova funzione per creare il glow multi-colore
  const getGlobalResetGlow = () => {
    const colors = phaseOrder.map(key => hexToRgba(phaseStyles[key].accent, 0.45));
    return `0 0 10px ${colors[0]}, 0 0 10px ${colors[1]}, 0 0 10px ${colors[2]}, 0 0 10px ${colors[3]}`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0d0e] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(156,176,196,0.12),_transparent_62%)]" />
      <div className="pointer-events-none absolute -bottom-32 left-[12%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,_rgba(96,129,118,0.18),_transparent_68%)] blur-3xl" />
      <div className="pointer-events-none absolute -top-48 right-[-10%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,_rgba(71,85,105,0.16),_transparent_70%)] blur-3xl" />
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-12 sm:px-10">
        <motion.header
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-5 text-center lg:text-left"
        >
          <h1 className="text-4xl font-light leading-tight text-neutral-100 sm:text-5xl lg:text-[3.35rem]">
            <span className="font-semibold text-[#88a7d0]">A</span>
            <span className="font-semibold text-[#c2b68a]">B</span>
            <span className="font-semibold text-[#d9a88a]">C</span>
            <span className="font-semibold text-[#8ab7aa]">D</span>
            <span className="pl-2 font-light text-neutral-300">method</span>
          </h1>
          <p className="max-w-xl text-sm text-neutral-500 lg:text-base">
            prodotto da Batterista Online
          </p>
        </motion.header>
        
        <motion.div 
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="relative mt-8 h-1.5 w-full overflow-hidden rounded-full bg-white/5 shadow-inner"
        >
            <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-linear"
                style={{
                    width: `${currentProgressWidth}%`,
                    background: `linear-gradient(to right, ${gradientStops})`,
                }}
            />
        </motion.div>

        {/* CONTENITORE PRINCIPALE (GESTISCE L'ORDINE MOBILE E IL LAYOUT DESKTOP COMPATTO) */}
        <motion.div
            className="mt-14 flex flex-col gap-8 lg:flex-row lg:justify-between" 
            variants={staggerParent}
            initial="hidden"
            animate="visible"
        >
            {/* COLONNA DI SINISTRA (lg:w-7/12 - Metronomo, Controlli) */}
            <div className="flex flex-col gap-8 lg:w-7/12"> 
                
                {/* 1. SEZIONE METRONOMO: order-1 (Mobile/Desktop) */}
                <motion.section
                    variants={scaleIn}
                    className="order-1 lg:order-1 relative overflow-hidden rounded-[32px] border border-white/8 bg-white/5 p-8 shadow-[0_32px_70px_rgba(8,10,12,0.35)] backdrop-blur-xl"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_rgba(17,19,22,0.6))] opacity-90" />
                    <div className="relative z-10 space-y-12">
                        {/* Pills - VISIBILE SEMPRE */}
                        <motion.div
                            variants={staggerParent}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-2 gap-3 justify-items-center sm:grid-cols-4" 
                        >
                            {phaseOrder.map(key => (
                                <motion.div
                                key={key}
                                variants={pillVariant}
                                className={`group flex items-center justify-center w-full gap-0.5 rounded-full border border-white/5 px-3.5 py-1.5 text-sm transition ${
                                    currentPhase === key
                                    ? `bg-gradient-to-r ${phaseStyles[key].color} text-white font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.25)]`
                                    : 'bg-white/5 text-neutral-300 hover:text-white'
                                }`}
                                >
                                <span className="font-bold" style={{ color: currentPhase === key ? 'white' : phaseStyles[key].accent }}>
                                    {key}
                                </span>
                                <span className={`font-light transition ${currentPhase === key ? 'text-white/80' : 'text-neutral-400'}`}>
                                    {phaseStyles[key].name.substring(1)}
                                </span>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* FIX: Wrapper Relative per stabilizzare le dimensioni */}
                        <div className="relative" style={contentDimensions ?? {}}>
                            <AnimatePresence mode="wait">
                                {isInBreak ? (
                                <motion.div
                                    key="break"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.65, ease: 'easeOut' }}
                                    // Utilizza absolute inset-0 per riempire lo spazio fissato dal genitore
                                    className="rounded-[24px] border border-white/10 bg-white/5 px-10 py-16 text-center shadow-inner backdrop-blur w-full flex flex-col justify-center absolute inset-0"
                                >
                                    <span className="text-xs uppercase tracking-[0.36em] text-neutral-500">
                                        {/* Il nome della fase successiva è in nextPhaseOnBreakEndRef */}
                                        Preparazione per la sezione {nextPhaseOnBreakEndRef.current}
                                    </span>
                                    <div className="mt-6 text-[5.5rem] font-bold text-[#8ab7aa]">
                                    {countdownBeat > 0 ? (countdownBeat <= 2 ? countdownBeat : countdownBeat - 2) : '...'}
                                    </div>
                                    <p className="text-neutral-400">
                                    {countdownBeat <= 2 ? 'One... Two...' : 'One, Two, Ready, Go!'}
                                    </p>
                                </motion.div>
                                ) : (
                                <motion.div 
                                    key="active" 
                                    className="w-full" 
                                    ref={metronomeContentRef} // Aggiunge il ref per la misurazione
                                > 
                                    <div className="grid gap-8 lg:grid-cols-[minmax(0,260px)_1fr] lg:items-center">
                                    <div className="relative mx-auto flex h-64 w-64 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),rgba(12,13,14,0.82))] shadow-[0_32px_70px_rgba(10,12,14,0.6)]">
                                        <div
                                        className="absolute inset-0 rounded-full border-[10px] transition-all duration-200"
                                        style={{
                                            borderColor: beatFlash ? phaseStyles[currentPhase].accent : 'rgba(255,255,255,0.12)',
                                            boxShadow: beatFlash
                                            ? `0 0 70px ${phaseStyles[currentPhase].accent}66, inset 0 0 35px ${phaseStyles[currentPhase].accent}33`
                                            : 'inset 0 0 28px rgba(0,0,0,0.4)'
                                        }}
                                        />
                                        <div className="relative text-center">
                                        <div className="text-[4.85rem] font-semibold" style={{ color: phaseStyles[currentPhase].accent }}>{getCurrentBPM()}</div>
                                        <div className="text-sm uppercase tracking-[0.4em] text-neutral-400">BPM</div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 text-left">
                                        <div>
                                        <span className="text-xs uppercase tracking-[0.4em] text-neutral-500">Sezione attuale</span>
                                        <h2 className={`mt-3 text-3xl font-semibold ${phaseStyles[currentPhase].textColor}`}>
                                            {currentPhase} • {phaseStyles[currentPhase].name}
                                        </h2>
                                        <p className="mt-2 text-sm text-neutral-400">
                                            {subdivisions[subdivision].name} • Target {targetBPM} BPM • Durata {phaseDurations[currentPhase]} min
                                        </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
                                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-neutral-400">
                                            Tempo totale • {formatTime(totalTimeRemaining)}
                                        </span>
                                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-neutral-400">
                                            {phasePercentages[currentPhase]}% della velocità target
                                        </span>
                                        </div>

                                        <div>
                                        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-neutral-500">
                                            <span>Progressione sezione</span>
                                            <span>{formatTime(timeRemaining)}</span>
                                        </div>
                                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
                                            <div
                                            className={`h-full rounded-full bg-gradient-to-r ${phaseStyles[currentPhase].color}`}
                                            style={{ width: `${(timeRemaining / (phaseDurations[currentPhase] * 60)) * 100}%` }}
                                            />
                                        </div>
                                        </div>
                                    </div>
                                    </div>
                                </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.section>
                
                {/* 3. CONTROLLI: order-2 (Mobile) / lg:order-2 (Desktop) */}
                <motion.div
                    variants={scaleIn}
                    className="order-2 lg:order-2 space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(5,7,9,0.4)] backdrop-blur"
                >
                    <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.35em] text-neutral-500">Controlli</span>
                    <span className="text-[10px] uppercase tracking-[0.35em] text-neutral-600">live</span>
                    </div>
                    <div className="flex items-center gap-4"> 
                    
                    {/* Pulsante Reset Globale - NUOVO GLOW ABCD */}
                    <button
                        onClick={handleReset}
                        className="group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-neutral-300 transition hover:border-white/30 hover:text-white disabled:opacity-40"
                        title="Reset (ricomincia da A)"
                        style={{ boxShadow: `0 0 25px ${hexToRgba(phaseStyles[currentPhase].accent, 0.0)}`, transition: 'box-shadow 0.3s ease-in-out' }} 
                        // Il glow ABCD è applicato al hover o se disattivato
                        onMouseOver={(e) => {
                            if (!isRunning || isPaused) {
                                e.currentTarget.style.boxShadow = getGlobalResetGlow();
                            }
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.boxShadow = `0 0 25px ${hexToRgba(phaseStyles[currentPhase].accent, 0.0)}`;
                        }}
                    >
                        <span className="absolute inset-0 translate-y-full bg-gradient-to-br from-white/15 to-transparent transition duration-300 group-hover:translate-y-0" />
                        <RotateCcw size={22} className="relative" />
                    </button>

                    {/* Pulsante Reset Fase Corrente - GLOW COLORE CORRENTE */}
                    <button
                        onClick={handleRestartPhase}
                        disabled={!isRunning || isInBreak}
                        className="group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-neutral-300 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        title={`Ripeti la sezione ${currentPhase}`}
                        // Applicazione condizionale del glow
                        style={{ boxShadow: isRunning && !isInBreak ? `0 0 25px ${hexToRgba(phaseStyles[currentPhase].accent, 0.45)}` : 'none', transition: 'box-shadow 0.3s ease-in-out' }}
                    >
                        <span className="absolute inset-0 translate-y-full bg-gradient-to-br from-white/15 to-transparent transition duration-300 group-hover:translate-y-0" />
                        <RefreshCcw size={22} className="relative" />
                    </button>

                    {/* Pulsante Play/Pausa */}
                    <button
                        onClick={handleStartStop}
                        className={`group relative flex flex-1 items-center justify-center gap-3 overflow-hidden rounded-2xl px-10 py-4 text-lg font-semibold transition shadow-[0_18px_40px_rgba(7,24,19,0.4)] ${
                        isRunning && !isPaused
                            ? 'border border-red-500/20 bg-gradient-to-r from-[#734848] to-[#5a3535] text-red-50'
                            : 'border border-emerald-400/20 bg-gradient-to-r from-[#3e5c55] to-[#2e4741] text-emerald-50'
                        }`}
                    >
                        {/* LOGICA ICONA CORRETTA */}
                        {isRunning && !isPaused 
                            ? <Pause size={24} className="relative" /> 
                            : <Play size={24} className="relative" />}
                        {/* LOGICA TESTO */}
                        <span className="relative">{isRunning && !isPaused ? 'Pausa' : isPaused ? 'Riprendi' : 'Start'}</span>
                    </button>

                    {/* Pulsante Skip Forward */}
                    <button
                        onClick={() => goToNextPhase(true)}
                        disabled={!isRunning || isInBreak || currentPhase === 'D'}
                        className="group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-neutral-300 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        title="Sezione successiva"
                    >
                        <span className="absolute inset-0 translate-y-full bg-gradient-to-br from-white/15 to-transparent transition duration-300 group-hover:translate-y-0" />
                        <SkipForward size={22} className="relative" />
                    </button>
                    </div>
                    
                    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                    <Volume2 size={16} className="text-neutral-400" />
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="flex-1 accent-[#3e5c55] [--tw-ring-color:transparent]"
                    />
                    <span className="w-10 text-right text-xs text-neutral-400">{Math.round(volume * 100)}%</span>
                    </div>
                </motion.div>
                
            </div>
            
            {/* COLONNA DI DESTRA (lg:w-5/12 - Tempo, Overview, Settings, Info) */}
            <div className="flex flex-col gap-8 lg:w-5/12"> 
                
                {/* 2. TEMPO COMPLESSIVO: order-3 (Mobile) / lg:order-1 (Desktop) */}
                <motion.div
                    variants={scaleIn}
                    className="order-3 lg:order-1 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(6,8,10,0.35)] backdrop-blur"
                >
                    <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xs uppercase tracking-[0.35em] text-neutral-500">Tempo complessivo</span>
                        <div className="mt-2 text-3xl font-semibold text-neutral-100">{formatTime(totalTimeRemaining)}</div>
                    </div>
                    {/* Formattazione del tempo su due righe */}
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-center">
                        <span style={{ color: phaseStyles[currentPhase].accent, fontWeight: 'bold' }}>
                            {`Sezione ${currentPhase}:`}
                        </span>
                        <div className="text-neutral-400 mt-0.5 font-normal tracking-normal text-sm">
                            {`${phaseDurations[currentPhase]} minuti`}
                        </div>
                    </div>
                    </div>
                    {audioError && (
                    <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/5 px-4 py-3 text-xs text-red-300">
                        {audioError}
                    </div>
                    )}
                </motion.div>

                {/* 4. PROFILO FASI -> OVERVIEW SEZIONI: order-4 (Mobile) / lg:order-2 (Desktop) */}
                <motion.div
                    variants={scaleIn}
                    className="order-4 lg:order-2 space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(5,7,9,0.4)] backdrop-blur"
                >
                    <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.35em] text-neutral-500">Overview Sezioni</span> 
                    <span className="text-[10px] uppercase tracking-[0.35em] text-neutral-600">overview</span>
                    </div>
                    <div className="space-y-5">
                    {phaseOrder.map(key => (
                        <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between text-sm font-semibold text-neutral-200">
                            <span>{key} • {phaseStyles[key].name}</span>
                            <span className="text-neutral-400">{Math.round(targetBPM * getPhasePercentage(key))} BPM</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-neutral-500">
                            <span>{phaseDurations[key]} min</span>
                            <span>{phasePercentages[key]}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5 relative">
                            <div
                            className={`h-full rounded-full bg-gradient-to-r ${phaseStyles[key].color}`}
                            style={{ width: `${Math.min(phasePercentages[key], 100) / 150 * 100}%` }}
                            />
                            {phasePercentages[key] > 100 && (
                            <div
                                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-orange-500 to-red-600"
                                style={{ 
                                width: `${((phasePercentages[key] - 100) / 150) * 100}%`,
                                marginLeft: `${(100 / 150) * 100}%`
                                }}
                            />
                            )}
                        </div>
                        </div>
                    ))}
                    </div>
                </motion.div>
                
                {/* 5. SETTINGS: order-5 (Mobile) / lg:order-3 (Desktop) */}
                <motion.div
                    variants={scaleIn}
                    className="order-5 lg:order-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(5,7,9,0.4)] backdrop-blur"
                >
                    {/* Pulsante a tutta larghezza */}
                    <button
                    onClick={() => {
                        setShowSettings(!showSettings);
                        setShowInstructions(false); 
                    }}
                    className="flex w-full items-center justify-between text-sm font-semibold text-neutral-300 transition hover:text-white"
                    >
                    <span>Settings</span>
                    {showSettings ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    <AnimatePresence initial={false}>
                    {showSettings && (
                        <motion.div
                        key="settings-panel"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="mt-6 space-y-8 text-neutral-200"
                        >
                        
                        <div>
                            <label className="mb-3 block text-xs uppercase tracking-[0.35em] text-neutral-500">BPM Target</label>
                            <div className="flex items-center gap-4">
                            <button
                                onClick={() => adjustBPM(-1)}
                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-neutral-300 transition hover:border-white/30 hover:text-white disabled:opacity-40"
                                disabled={isRunning && !isPaused}
                            >
                                <Minus size={18} />
                            </button>
                            <input
                                type="range"
                                value={targetBPM}
                                onChange={(e) => setTargetBPM(Number(e.target.value))}
                                className="flex-1 accent-[#3e5c55] [--tw-ring-color:transparent]"
                                min="40"
                                max="240"
                                disabled={isRunning && !isPaused}
                            />
                            <button
                                onClick={() => adjustBPM(1)}
                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-neutral-300 transition hover:border-white/30 hover:text-white disabled:opacity-40"
                                disabled={isRunning && !isPaused}
                            >
                                <Plus size={18} />
                            </button>
                            <div className="w-16 text-right text-2xl font-semibold text-neutral-100">{targetBPM}</div>
                            </div>
                        </div>

                        <div>
                            <label className="mb-3 block text-xs uppercase tracking-[0.35em] text-neutral-500">Suddivisione</label>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {Object.entries(subdivisions).map(([key, value]) => (
                                <button
                                key={key}
                                onClick={() => setSubdivision(key as typeof subdivision)}
                                disabled={isRunning && !isPaused}
                                className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                                    subdivision === key
                                    ? 'border-white/20 bg-white/10 text-white'
                                    : 'border-white/5 bg-transparent text-neutral-400 hover:border-white/20 hover:text-neutral-100'
                                } ${isRunning && !isPaused ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                {value.name}
                                </button>
                            ))}
                            </div>
                        </div>

                        <div>
                            <label className="mb-3 block text-xs uppercase tracking-[0.35em] text-neutral-500">Durata sezioni (minuti)</label>
                            <div className="space-y-4">
                            {phaseOrder.map(key => (
                                <div key={key}>
                                <div className={`mb-2 text-xs font-semibold uppercase tracking-[0.35em] ${phaseStyles[key].textColor}`}>
                                    {key} • {phaseStyles[key].name}
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                    {[1, 2, 3, 4, 5].map(mins => (
                                    <button
                                        key={mins}
                                        onClick={() => updatePhaseDuration(key, mins)}
                                        disabled={isRunning && !isPaused}
                                        className={`rounded-xl border py-2 text-sm font-semibold transition ${
                                        phaseDurations[key] === mins
                                            ? `border-white/20 bg-gradient-to-r ${phaseStyles[key].color} text-white`
                                            : 'border-white/5 bg-transparent text-neutral-400 hover:border-white/20 hover:text-neutral-100'
                                        } ${isRunning && !isPaused ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                        {mins}
                                    </button>
                                    ))}
                                </div>
                                </div>
                            ))}
                            </div>
                        </div>

                        <div>
                            <label className="mb-3 block text-xs uppercase tracking-[0.35em] text-neutral-500">Percentuali velocità</label>
                            <div className="grid gap-5 md:grid-cols-2">
                            {phaseOrder.map(key => (
                                <div key={key} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400">
                                    <span className={phaseStyles[key].textColor}>{key}</span>
                                    <span>{phasePercentages[key]}%</span>
                                </div>
                                {key === 'D' ? (
                                    <p className="text-[11px] text-neutral-500">Fissata a 100% per mantenere il target definitivo.</p>
                                ) : (
                                    <input
                                    type="range"
                                    min="50"
                                    max="150"
                                    step="1"
                                    value={phasePercentages[key]}
                                    onChange={(e) => updatePhasePercentage(key, Number(e.target.value))}
                                    className="w-full accent-[#3e5c55] [--tw-ring-color:transparent]"
                                    disabled={isRunning && !isPaused}
                                    />
                                )}
                                <div className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">
                                    {Math.round(targetBPM * getPhasePercentage(key))} BPM previsti
                                </div>
                                </div>
                            ))}
                            </div>
                        </div>

                        {/* Pulsante Reset alleggerito nello stile e nel testo */}
                        <div className="border-t border-white/10 pt-5 space-y-3">
                            <button
                                onClick={handleResetDefaults}
                                disabled={isRunning && !isPaused} 
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-sm font-semibold text-neutral-400 transition hover:border-white/20 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Ripristina durate e percentuali di default"
                            >
                                <RefreshCcw size={16} className="text-neutral-500" />
                                Ripristina Defaults
                            </button>
                            <div className="text-center text-[11px] uppercase tracking-[0.3em] text-neutral-500">
                                {isRunning && !isPaused ? 'Impossibile modificare le impostazioni durante la riproduzione' : 'Tutte le modifiche (BPM, durate, percentuali) verranno riportate ai valori iniziali.'}
                            </div>
                        </div>
                        
                        <div className="border-t border-white/10 pt-5 text-center text-[11px] uppercase tracking-[0.3em] text-neutral-500">
                            Preview BPM per sezione aggiornata in tempo reale
                        </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </motion.div>

                {/* 6. INFO & ISTRUZIONI: order-6 (Mobile) / lg:order-4 (Desktop) */}
                <motion.div
                    variants={scaleIn}
                    className="order-6 lg:order-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(5,7,9,0.4)] backdrop-blur"
                >
                    <button
                    onClick={() => {
                        setShowInstructions(!showInstructions);
                        setShowSettings(false); 
                    }}
                    className="flex w-full items-center justify-between text-sm font-semibold text-neutral-300 transition hover:text-white"
                    >
                    <span className="flex items-center gap-2"><Info size={16} /> Info & Istruzioni</span>
                    {showInstructions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    <AnimatePresence initial={false}>
                    {showInstructions && (
                        <motion.div
                        key="instructions-panel"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="mt-6 space-y-6 text-neutral-300"
                        >
                        
                        <div className="space-y-3">
                            <h4 className="text-lg font-semibold text-neutral-200">ABCD method = Attenzione, Base, Challenge, Destinazione.</h4>
                            <p className="text-base text-neutral-400">
                            Un metodo semplice per studiare in modo più efficace, anche solo 12 minuti al giorno. Ogni sessione ti fa passare da lentezza e precisione, fino alla velocità target, in modo logico e progressivo. È lo stesso principio dell’allenamento sportivo: alternare concentrazione, sforzo e recupero per costruire stabilità.
                            </p>
                        </div>
                        
                        <div className="border-t border-white/10 pt-4 space-y-3">
                            <h4 className="text-lg font-semibold text-neutral-200">Funzionamento</h4>
                            <p className="text-base text-neutral-400">
                            Quando premi Play, il metronomo suonerà per i minuti impostati alla velocità della sezione attiva. Alla fine di ogni fase sentirai un countdown e il timer passerà automaticamente alla sezione successiva.
                            Di default, ogni sezione dura 3 minuti con le velocità: A 70%, B 85%, C 105%, D 100%.
                            </p>
                        </div>

                        <div className="border-t border-white/10 pt-4 space-y-3">
                            <h4 className="text-lg font-semibold text-neutral-200">Struttura Default</h4>
                            <p className="text-base text-neutral-400 mb-2">4 fasi da 3 minuti ciascuna:</p>
                            <ul className="list-none space-y-1 pl-0 text-base text-neutral-400">
                            <li><span className="font-semibold text-neutral-200">A – 70%</span> controllo e meccanica</li>
                            <li><span className="font-semibold text-neutral-200">B – 85%</span> stabilità e suono</li>
                            <li><span className="font-semibold text-neutral-200">C – 105%</span> sfida e resistenza</li>
                            <li><span className="font-semibold text-neutral-200">D – 100%</span> naturalezza e obiettivo</li>
                            </ul>
                        </div>

                        <div className="border-t border-white/10 pt-4 space-y-3">
                            <h4 className="text-lg font-semibold text-neutral-200">Personalizzazione</h4>
                            <p className="text-base text-neutral-400">
                            Puoi modificare durate e velocità come vuoi cliccando la sezione **"Settings"**: qui puoi decidere il BPM target (quello a cui vuoi arrivare), la durata di ogni sezione (da 1 a 5 minuti) e la percentuale di BPM per ogni sezione in base al BPM Target (la percentuale della sezione D (Destinazione) non è modificabile perchè è ovviamente pari al 100%).
                            </p>
                        </div>

                        </motion.div>
                    )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </motion.div>

        <motion.footer
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-16 flex flex-col gap-2 text-center text-[11px] uppercase tracking-[0.3em] text-neutral-600 lg:flex-row lg:items-center lg:justify-between"
        >
          <span>Copyright © Batterista Online - Tutti i diritti riservati - www.batterista.online</span>
          <span className="text-neutral-500">ABCD method versione 1.7</span>
        </motion.footer>
      </div>
    </div>
  );
};

export default ABCDMetronome;
