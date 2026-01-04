import { easeInOut } from "framer-motion";
import { useState, useEffect, useRef, useMemo } from "react";
// AGGIUNTA DI 'Target' per il pulsante Focus
import { Play, Pause, SkipForward, RotateCcw, ChevronDown, ChevronUp, Plus, Minus, Volume2, Info, RefreshCcw, Target, Download } from 'lucide-react'; 
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
const INTER_PHASE_PAUSE_SECONDS = 5;

const translations = {
  it: {
    attention: 'Attenzione',
    base: 'Base',
    challenge: 'Challenge',
    destination: 'Destinazione',
    producedBy: 'prodotto da',
    preparationFor: 'Preparazione per la sezione',
    oneTwoText: 'One... Two...',
    readyGoText: 'One, Two, Ready, Go!',
    currentSection: 'Sezione attuale',
    targetBpm: 'Target',
    duration: 'Durata',
    minutes: 'min',
    totalTime: 'Tempo totale',
    ofTargetSpeed: 'della velocità target',
    focusActive: 'FOCUS ATTIVO • TIMER FREEZE',
    sectionProgress: 'Progressione sezione',
    pauseBetweenSections: 'Pausa tra le sezioni',
    prepareNext: 'Preparati per la sezione successiva...',
    controls: 'Controlli',
    producedByLink: 'Batterista Online',
goToSite: 'Vai al sito Batterista Online',
allRightsReserved: 'Tutti i diritti riservati',
website: 'www.batterista.online',
    live: 'live',
    pause: 'Pausa',
    start: 'Start',
    resetTooltip: 'Reset (ricomincia da A)',
    repeatTooltip: 'Ripeti la sezione',
    focusTooltip: 'Attiva Focus (Ferma Timer Sezione)',
    resumeTooltip: 'Riprendi Timer (Focus Attivo)',
    nextTooltip: 'Sezione successiva',
    overallTime: 'Tempo complessivo',
    sectionLabel: 'Sezione',
    overviewSections: 'Overview Sezioni',
    overview: 'overview',
    settings: 'Settings',
    bpmTarget: 'BPM Target',
    subdivision: 'Suddivisione',
    sectionDuration: 'Durata sezioni (minuti)',
    speedPercentages: 'Percentuali velocità',
    fixedAt100: 'Fissata a 100% per mantenere il target definitivo.',
    expectedBpm: 'BPM previsti',
    resetDefaults: 'Ripristina Defaults',
    cannotModify: 'Impossibile modificare le impostazioni durante la riproduzione',
    allChanges: 'Tutte le modifiche (BPM, durate, percentuali) verranno riportate ai valori iniziali.',
    previewUpdated: 'Preview BPM per sezione aggiornata in tempo reale',
    infoInstructions: 'Info & Istruzioni',
    methodTitle: 'ABCD method = Attenzione, Base, Challenge, Destinazione.',
    methodDesc: 'Un metodo semplice per studiare in modo più efficace, anche solo 12 minuti al giorno. Ogni sessione ti fa passare da lentezza e precisione, fino alla velocità target, in modo logico e progressivo. È lo stesso principio dell\'allenamento sportivo: alternare concentrazione, sforzo e recupero per costruire stabilità.',
    howItWorks: 'Funzionamento',
    howItWorksDesc: 'Quando premi Play, il metronomo suonerà per i minuti impostati alla velocità della sezione attiva. Alla fine di ogni fase sentirai un countdown e il timer passerà automaticamente alla sezione successiva. Di default, ogni sezione dura 3 minuti con le velocità: A 70%, B 85%, C 105%, D 100%.',
    defaultStructure: 'Struttura Default',
    defaultStructureDesc: '4 fasi da 3 minuti ciascuna:',
    phaseA: 'controllo e meccanica',
    phaseB: 'stabilità e suono',
    phaseC: 'sfida e resistenza',
    phaseD: 'naturalezza e obiettivo',
    focusControl: 'Controllo Focus (Novità)',
    focusControlDesc: 'Il pulsante Focus ti permette di mettere in pausa il timer della fase corrente. Il metronomo continuerà a suonare al BPM attuale, permettendoti di esercitarti finché non sei pronto a ripartire. Premi di nuovo il pulsante per far riprendere il timer da dove si era interrotto.',
    customization: 'Personalizzazione',
    customizationDesc: 'Puoi modificare durate e velocità come vuoi cliccando la sezione "Settings": qui puoi decidere il BPM target (quello a cui vuoi arrivare), la durata di ogni sezione (da 1 a 5 minuti) e la percentuale di BPM per ogni sezione in base al BPM Target (la percentuale della sezione D (Destinazione) non è modificabile perché è ovviamente pari al 100%).',
    goToWebsite: 'Vai al sito Batterista Online',
    copyright: 'Copyright © Batterista Online - Tutti i diritti riservati -',
    version: 'ABCD method versione 1.8',
    supportApp: 'Aiutami a mantenere questa Applicazione sempre gratuita:',
buyMeCoffee: 'offrimi un caffè',
installApp: 'Installa ABCD come App',
installPrompt: 'Installa questa app sul tuo dispositivo per un accesso rapido!',
    audioNotSupported: 'Audio non supportato dal browser; il timer funzionerà senza suoni.',
    audioFailed: "Impossibile inizializzare l'audio. Consenti l'accesso o ricarica la pagina.",
    audioEnable: "Per abilitare i suoni interagisci con la pagina (es. premi Start) e consenti l'audio.",
    pauseLabel: 'PAUSA',
simpleMode: 'Modalità Semplice',
advancedMode: 'Modalità ABCD',
simpleModeDesc: 'Metronomo classico',
advancedModeDesc: 'Allenamento progressivo'
  },
  en: {
    attention: 'Attention',
    base: 'Base',
    challenge: 'Challenge',
    destination: 'Destination',
    producedBy: 'produced by',
    preparationFor: 'Get ready for section',
    oneTwoText: 'One... Two...',
    readyGoText: 'One, Two, Ready, Go!',
    currentSection: 'Current Section',
    targetBpm: 'Target',
    duration: 'Duration',
    minutes: 'min',
    totalTime: 'Total Time',
    ofTargetSpeed: 'of target speed',
    focusActive: 'FOCUS ACTIVE • TIMER FREEZE',
    sectionProgress: 'Section Progress',
    pauseBetweenSections: 'Pause between sections',
    prepareNext: 'Get ready for the next section...',
    controls: 'Controls',
    producedByLink: 'Batterista Online',
goToSite: 'Go to Batterista Online website',
allRightsReserved: 'All rights reserved',
website: 'www.batterista.online',
    live: 'live',
    pause: 'Pause',
    start: 'Start',
    resetTooltip: 'Reset (restart from A)',
    repeatTooltip: 'Repeat section',
    focusTooltip: 'Activate Focus (Freeze Section Timer)',
    resumeTooltip: 'Resume Timer (Focus Active)',
    nextTooltip: 'Next section',
    overallTime: 'Overall Time',
    sectionLabel: 'Section',
    overviewSections: 'Sections Overview',
    overview: 'overview',
    settings: 'Settings',
    bpmTarget: 'Target BPM',
    subdivision: 'Subdivision',
    sectionDuration: 'Section Duration (minutes)',
    speedPercentages: 'Speed Percentages',
    fixedAt100: 'Fixed at 100% to maintain the final target.',
    expectedBpm: 'Expected BPM',
    resetDefaults: 'Reset Defaults',
    cannotModify: 'Cannot modify settings while playing',
    allChanges: 'All changes (BPM, durations, percentages) will be reset to initial values.',
    previewUpdated: 'BPM preview per section updated in real time',
    infoInstructions: 'Info & Instructions',
    methodTitle: 'ABCD method = Attention, Base, Challenge, Destination.',
    methodDesc: 'A simple method to study more effectively, even just 12 minutes a day. Each session takes you from slowness and precision to target speed in a logical and progressive way. It\'s the same principle as sports training: alternating concentration, effort and recovery to build stability.',
    howItWorks: 'How It Works',
    howItWorksDesc: 'When you press Play, the metronome will sound for the set minutes at the speed of the active section. At the end of each phase you will hear a countdown and the timer will automatically move to the next section. By default, each section lasts 3 minutes with speeds: A 70%, B 85%, C 105%, D 100%.',
    defaultStructure: 'Default Structure',
    defaultStructureDesc: '4 phases of 3 minutes each:',
    phaseA: 'control and mechanics',
    phaseB: 'stability and sound',
    phaseC: 'challenge and endurance',
    phaseD: 'naturalness and goal',
    focusControl: 'Focus Control (New)',
    focusControlDesc: 'The Focus button allows you to pause the current phase timer. The metronome will continue to play at the current BPM, allowing you to practice until you\'re ready to restart. Press the button again to resume the timer from where it stopped.',
    customization: 'Customization',
    customizationDesc: 'You can modify durations and speeds as you like by clicking the "Settings" section: here you can set the target BPM (the one you want to reach), the duration of each section (from 1 to 5 minutes) and the BPM percentage for each section based on the Target BPM (the percentage of section D (Destination) is not modifiable because it is obviously equal to 100%).',
    goToWebsite: 'Go to Batterista Online website',
    copyright: 'Copyright © Batterista Online - All rights reserved -',
    version: 'ABCD method version 1.8',
    supportApp: 'Help me keep this App always free:',
buyMeCoffee: 'buy me a coffee',
installApp: 'Install ABCD as App',
installPrompt: 'Install this app on your device for quick access!',
    audioNotSupported: 'Audio not supported by browser; the timer will work without sounds.',
    audioFailed: "Unable to initialize audio. Allow access or reload the page.",
    audioEnable: "To enable sounds interact with the page (e.g. press Start) and allow audio.",
    pauseLabel: 'PAUSE',
simpleMode: 'Simple Mode',
advancedMode: 'ABCD Mode',
simpleModeDesc: 'Classic metronome',
advancedModeDesc: 'Progressive training'
  }
};

const getPhaseStyles = (lang: 'it' | 'en'): Record<PhaseKey, PhaseStyle> => ({
  A: { name: translations[lang].attention, color: 'from-[#4d6bb3] to-[#345997]', textColor: 'text-[#98b5f5]', accent: '#5f8dff', globalBarColor: '#537abf' }, 
  B: { name: translations[lang].base, color: 'from-[#d8a343] to-[#b9852c]', textColor: 'text-[#f4d48a]', accent: '#f1b54f', globalBarColor: '#d6a855' }, 
  C: { name: translations[lang].challenge, color: 'from-[#d46c4a] to-[#b55133]', textColor: 'text-[#ffb08a]', accent: '#ff865c', globalBarColor: '#e07659' }, 
  D: { name: translations[lang].destination, color: 'from-[#3a9d7a] to-[#2a7c5f]', textColor: 'text-[#9de7c6]', accent: '#5dda9d', globalBarColor: '#47b089' } 
});

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
  const [isFocused, setIsFocused] = useState(false); // AGGIUNTO: Stato per il Focus/Freeze
  const [currentPhase, setCurrentPhase] = useState<PhaseKey>('A');
  const [timeRemaining, setTimeRemaining] = useState(defaultPhaseDurations.A * 60);
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(calculateTotalTime(defaultPhaseDurations));
  const [isInBreak, setIsInBreak] = useState(false);
  const [isInInterPhasePause, setIsInInterPhasePause] = useState(false);
  const [interPhasePauseRemaining, setInterPhasePauseRemaining] = useState(0);
  const [countdownBeat, setCountdownBeat] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false); 
  const [beatFlash, setBeatFlash] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.85);
  const [language, setLanguage] = useState<'it' | 'en'>('it');
const [bgPhaseColor, setBgPhaseColor] = useState<PhaseKey>('A');
const [simpleMode, setSimpleMode] = useState(false);
  const t = translations[language];
  const phaseStyles = getPhaseStyles(language);

  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentNoteRef = useRef(0);
  const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const globalIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  
const [simpleColorIndex, setSimpleColorIndex] = useState(0);

  // RIFERIMENTO PER LA FASE SUCCESSIVA AL BREAK (FIX LOGICA)
  const nextPhaseOnBreakEndRef = useRef<PhaseKey>('A'); 
  // Aggiungi questo ref in cima al componente (dopo gli altri useRef, circa linea 115):
const breakStartedRef = useRef(false);
const phaseEndHandledRef = useRef(false);
// Dopo gli altri useRef (circa linea 115):
const interPauseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // ** STATO E REF PER FISSARE LE DIMENSIONI **
  const metronomeContentRef = useRef<HTMLDivElement>(null);
  const [contentDimensions, setContentDimensions] = useState<{ width: string, height: string } | null>(null);
  // ** FINE STATO **
const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
const [showInstallButton, setShowInstallButton] = useState(false);

  const subdivisions = {
    quarter: { name: '♩ 1/4', beats: 1 },
    eighth: { name: '♪♪ 1/8', beats: 2 },
    triplet: { name: '♪♪♪ Triplet', sup: '3', beats: 3 },
    sixteenth: { name: '♬♬ 1/16', beats: 4 }
  } as const;

  const getPhasePercentage = (phase: PhaseKey) => phasePercentages[phase] / 100;

  const getCurrentBPM = () => {
    if (simpleMode) return targetBPM;
    const phase = isInBreak ? nextPhaseOnBreakEndRef.current : currentPhase;
    return Math.round(targetBPM * getPhasePercentage(phase));
};
  
const getSimpleModeStyle = () => {
  const phase = phaseOrder[simpleColorIndex];
  return phaseStyles[phase];
};

  const ensureAudioContext = () => {
    if (typeof window === 'undefined') { return false; }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') { return true; }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

    if (!AudioContextClass) {
      setAudioError(prev => prev ?? translations[language].audioNotSupported);
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
      setAudioError(prev => prev ?? translations[language].audioFailed);
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
          setAudioError(translations[language].audioEnable);
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
    gainNode.connect(masterGainRef.current!);

    osc.frequency.value = frequencies[count] || 880;
    osc.type = 'sine';

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + Math.min(duration / 1000, 0.3));

    osc.start(now);
    osc.stop(now + Math.min(duration / 1000, 0.3));
  };
  
  // AGGIUNTO: Funzione per il suono di avviso dei 10 secondi
  const playWarningSound = () => {
    if (!ensureAudioContext()) return;
    resumeAudioContext();

    const ctx = audioContextRef.current;
    if (!ctx || !masterGainRef.current) return;

    const now = ctx.currentTime;
    const frequencies = [660, 784, 988]; // Mi, Sol, Si
    const duration = 0.1;
    const delay = 0.1; // Ritardo tra i beep

    frequencies.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(masterGainRef.current!);

        osc.frequency.value = freq;

        const startTime = now + index * delay;
        const endTime = startTime + duration;

        // Envelope veloce
        gainNode.gain.setValueAtTime(0.0, startTime);
        gainNode.gain.linearRampToValueAtTime(1.0, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.start(startTime);
        osc.stop(endTime);
    });
  };
const playEndOfPhaseSound = () => {
  if (!ensureAudioContext()) return;
  resumeAudioContext();

  const ctx = audioContextRef.current;
  if (!ctx || !masterGainRef.current) return;

  const now = ctx.currentTime;
  const frequencies = [880, 1046, 1318, 1046, 880]; // Sequenza ascendente-discendente
  const duration = 0.15;
  const delay = 0.18;

  frequencies.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(masterGainRef.current!);

    osc.frequency.value = freq;
    osc.type = 'sine';

    const startTime = now + index * delay;
    const endTime = startTime + duration;

    gainNode.gain.setValueAtTime(0.0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

    osc.start(startTime);
    osc.stop(endTime);
  });
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
    gainNode.connect(masterGainRef.current!);

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
    gainNode.connect(masterGainRef.current!);
    osc.frequency.value = isAccent ? 1200 : 800;
    gainNode.gain.value = isAccent ? 0.3 : 0.15;
    osc.start(time);
    osc.stop(time + 0.05);
    const delay = Math.max(0, (time - ctx.currentTime) * 1000);
    setTimeout(() => {
      setBeatFlash(prev => prev + 1); // Incrementa invece di toggle
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
  setIsFocused(false);
  
  breakStartedRef.current = true; // ← AGGIUNGI QUESTO
  phaseEndHandledRef.current = false;
  
  // Imposta il riferimento per la fase successiva
  nextPhaseOnBreakEndRef.current = phaseToStartAfterBreak;
setBgPhaseColor(phaseToStartAfterBreak);

  setIsInBreak(true);
  setIsPaused(false); 
  setCountdownBeat(0);
  
  // Aggiorna il tempo totale rimanente
  setTotalTimeRemaining(calculateRemainingTime(phaseToStartAfterBreak));

  // Il metronomo (e il countdown) usano il BPM della fase successiva
  const nextBPM = Math.round(targetBPM * getPhasePercentage(phaseToStartAfterBreak));
  const halfNoteDuration = (60 / nextBPM) * 2 * 1000;
  const quarterNoteDuration = (60 / nextBPM) * 1000;
  
  // 2. Scheduler del Countdown
  const t1 = setTimeout(() => {
    playCountSound(1, halfNoteDuration);
    setCountdownBeat(1);
  }, 0);
  
  const tick1 = setTimeout(() => {
    playTickSound();
  }, quarterNoteDuration);
  
  const t2 = setTimeout(() => {
    playCountSound(2, halfNoteDuration);
    setCountdownBeat(2);
  }, halfNoteDuration);
  
  const tick2 = setTimeout(() => {
    playTickSound();
  }, halfNoteDuration + quarterNoteDuration);
  
  const t3 = setTimeout(() => {
    playCountSound(1, quarterNoteDuration);
    setCountdownBeat(3);
  }, halfNoteDuration * 2);
  
  const t4 = setTimeout(() => {
    playCountSound(2, quarterNoteDuration);
    setCountdownBeat(4);
  }, halfNoteDuration * 2 + quarterNoteDuration);
  
  const t5 = setTimeout(() => {
    playCountSound(3, quarterNoteDuration);
    setCountdownBeat(5);
  }, halfNoteDuration * 2 + quarterNoteDuration * 2);
  
  const t6 = setTimeout(() => {
    playCountSound(4, quarterNoteDuration);
    setCountdownBeat(6);
  }, halfNoteDuration * 2 + quarterNoteDuration * 3);

  // 3. Fine del break e passaggio alla fase.
  const t7 = setTimeout(() => {
  setIsInBreak(false);
  setCountdownBeat(0);
  setCurrentPhase(phaseToStartAfterBreak);
  setTimeRemaining(phaseDurations[phaseToStartAfterBreak] * 60);
  breakStartedRef.current = false; // ← AGGIUNGI QUESTO
  phaseEndHandledRef.current = false;
}, halfNoteDuration * 2 + quarterNoteDuration * 4);

  countdownTimeoutsRef.current = [t1, tick1, t2, tick2, t3, t4, t5, t6, t7];
};


  const goToNextPhase = (manual = false) => {
  // Pulizia completa
  countdownTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
  countdownTimeoutsRef.current = [];
  stopMetronome();
  if (intervalIdRef.current) { clearInterval(intervalIdRef.current); intervalIdRef.current = null; }
  if (globalIntervalRef.current) { clearInterval(globalIntervalRef.current); globalIntervalRef.current = null; }
  
  // Quando si salta una fase, si esce anche dal focus
  setIsFocused(false);
  setIsInInterPhasePause(false); // Reset pausa inter-fase

  const currentIndex = phaseOrder.indexOf(currentPhase);

  if (currentIndex < phaseOrder.length - 1) {
    // Prossima fase nella sequenza
    const nextPhase = phaseOrder[currentIndex + 1];
    
    // IMPORTANTE: Aggiorna subito nextPhaseOnBreakEndRef per evitare che l'useEffect richiami la fase sbagliata
    nextPhaseOnBreakEndRef.current = nextPhase;
    
    setIsInBreak(true); // Imposta break PRIMA di chiamare startBreak
    setCurrentPhase(nextPhase); // Aggiorna anche currentPhase subito
    setTimeRemaining(phaseDurations[nextPhase] * 60); // Imposta il tempo della nuova fase
    
    setTimeout(() => {
      startBreak(nextPhase);
    }, 50);
  } else if (manual) {
    // Ultima fase, saltata, si comporta come un reset
    setTotalTimeRemaining(0);
    setIsRunning(false);
    setIsInBreak(false);
    setCurrentPhase('A');
    setTimeRemaining(phaseDurations['A'] * 60);
    nextPhaseOnBreakEndRef.current = 'A';
  }
};

// Ciclo colori in Simple Mode
useEffect(() => {
  if (simpleMode && isRunning && !isPaused) {
    const colorInterval = setInterval(() => {
      setSimpleColorIndex(prev => (prev + 1) % 4);
    }, 4000); // Cambia colore ogni 4 secondi
    
    return () => clearInterval(colorInterval);
  }
}, [simpleMode, isRunning, isPaused]);

  // FUNZIONE RIPETI FASE CORRENTE (FIX LOGICA)
  const handleRestartPhase = () => {
  if (!isRunning || isInBreak || isFocused) return;

  // 1. Ferma i metronomi/timer correnti
  stopMetronome();
  if (intervalIdRef.current) { clearInterval(intervalIdRef.current); intervalIdRef.current = null; }
  if (globalIntervalRef.current) { clearInterval(globalIntervalRef.current); globalIntervalRef.current = null; }
  
  // 2. Calcola il tempo trascorso nella fase attuale
  const phaseDurationSeconds = phaseDurations[currentPhase] * 60;
  const timeElapsedInPhase = phaseDurationSeconds - timeRemaining;
  
  // 3. Resetta il tempo totale globale
  setTotalTimeRemaining(prevTotal => prevTotal + timeElapsedInPhase);

  // 4. Riavvia la fase corrente tramite il break
  setIsInBreak(true); // Imposta break PRIMA di chiamare startBreak
  setTimeout(() => {
    startBreak(currentPhase);
  }, 50);
};
  // FINE FUNZIONE RIPETI FASE
useEffect(() => {
  const handler = (e: any) => {
    e.preventDefault();
    setDeferredPrompt(e);
    setShowInstallButton(true);
  };
  
  window.addEventListener('beforeinstallprompt', handler);
  
  return () => window.removeEventListener('beforeinstallprompt', handler);
}, []);
  // AGGIUNTO: Funzione per il Focus/Freeze
  const handleFocusToggle = () => {
    if (!isRunning || isPaused || isInBreak) return;
    setIsFocused(prev => !prev);
  };
  // FINE FUNZIONE FOCUS/FREEZE


  // INIZIO: LOGICA AGGIORNATA DEI TIMER E METRONOMO
useEffect(() => {
  // MODALITÀ SEMPLICE - solo metronomo
  if (simpleMode) {
    if (isRunning && !isPaused) {
      startMetronome();
    } else {
      stopMetronome();
    }
    return () => {
      stopMetronome();
    };
  }
  
  // MODALITÀ AVANZATA - codice originale
  // 1. --- Metronome Control ---
  if (isRunning && !isPaused && !isInBreak && !isInInterPhasePause) {
    startMetronome();
  } else {
    stopMetronome();
  }

  // 2. --- Phase and Global Timer Control (SI FERMA se focused) ---
  if (isRunning && !isPaused && !isInBreak && !isFocused) {
    
    // Avvia Timer Globale (tempo totale rimanente)
    if (globalIntervalRef.current) { clearInterval(globalIntervalRef.current); }
    globalIntervalRef.current = setInterval(() => {
      setTotalTimeRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Avvia Timer di Fase (tempo rimanente nella fase corrente)
    if (intervalIdRef.current) { clearInterval(intervalIdRef.current); }
    intervalIdRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        
        // --- LOGICA AVVISO 10 SECONDI (SOUND) ---
        if (prev === 11 || prev === 10) {
           playWarningSound();
        }
        // --- FINE LOGICA AVVISO ---

       if (prev <= 1) {
  // Usa il flag per evitare doppia esecuzione
  if (!phaseEndHandledRef.current) {
    phaseEndHandledRef.current = true;
    
    stopMetronome();
    
    // Suona il suono di fine sezione
    playEndOfPhaseSound();
    const currentIndex = phaseOrder.indexOf(currentPhase);
    
    if (currentIndex < phaseOrder.length - 1) {
      // Attiva solo la pausa, il timer sarà gestito dall'useEffect
      setIsInInterPhasePause(true);
      setInterPhasePauseRemaining(INTER_PHASE_PAUSE_SECONDS);
    } else {
      // Fine del ciclo
      setIsRunning(false);
      setCurrentPhase('A');
      setTimeRemaining(phaseDurations['A'] * 60);
      setTotalTimeRemaining(0);
    }
  }
  return 0; 
}
return prev - 1;
      });
    }, 1000);
  } else {
    // Ferma Timer di Fase e Globale quando pausato, in break, o FOCUSED
    if (intervalIdRef.current) { clearInterval(intervalIdRef.current); intervalIdRef.current = null; }
    if (globalIntervalRef.current) { clearInterval(globalIntervalRef.current); globalIntervalRef.current = null; }
  }

  // Riprendi il break se era in pausa
if (isRunning && !isPaused && isInBreak && countdownTimeoutsRef.current.length === 0 && !breakStartedRef.current) {
  const phaseToStart = nextPhaseOnBreakEndRef.current;
  setTimeout(() => {
    startBreak(phaseToStart);
  }, 50);
}

  return () => {
  stopMetronome();
  if (intervalIdRef.current) { clearInterval(intervalIdRef.current); intervalIdRef.current = null; }
  if (globalIntervalRef.current) { clearInterval(globalIntervalRef.current); globalIntervalRef.current = null; }
  if (interPauseIntervalRef.current) { clearInterval(interPauseIntervalRef.current); interPauseIntervalRef.current = null; } // ← AGGIUNGI
  // countdownTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
  // countdownTimeoutsRef.current = [];
};
}, [isRunning, isPaused, isInBreak, isInInterPhasePause, currentPhase, phaseDurations, subdivision, targetBPM, phasePercentages, isFocused, simpleMode]);
// FINE: LOGICA AGGIORNATA DEI TIMER E METRONOMO


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
  
  // Gestione timer pausa inter-fase
useEffect(() => {
  if (isRunning && !isPaused && isInInterPhasePause) {
    const pauseInterval = setInterval(() => {
      setInterPhasePauseRemaining(prev => {
        if (prev <= 1) {
          clearInterval(pauseInterval);
          setTimeout(() => {
            setIsInInterPhasePause(false);
            const currentIndex = phaseOrder.indexOf(currentPhase);
            const nextPhase = phaseOrder[currentIndex + 1];
            startBreak(nextPhase);
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(pauseInterval);
  }
}, [isRunning, isPaused, isInInterPhasePause, currentPhase]);
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
  // MODALITÀ SEMPLICE
  if (simpleMode) {
    if (isRunning) {
      setIsPaused(!isPaused);
    } else {
      ensureAudioContext();
      resumeAudioContext();
      // Reset degli stati ABCD per sicurezza
      setIsInBreak(false); 
      setIsInInterPhasePause(false);
      setCountdownBeat(0);
      
      setIsRunning(true);
      setIsPaused(false);
    }
    return; // <--- Importante: usciamo subito qui
  }
  
  // MODALITÀ AVANZATA (ABCD) - Resto del codice invariato
  if (isInBreak && countdownTimeoutsRef.current.length > 0) {
    return;
  }
  
  if (isRunning) {
    setIsPaused(!isPaused);
    setIsFocused(false);
    
    if (!isPaused && isInBreak) {
      breakStartedRef.current = false;
    }
  } else {
    ensureAudioContext();
    resumeAudioContext();
    setIsPaused(false);
    setIsFocused(false);
    setIsInInterPhasePause(false);
    setTotalTimeRemaining(calculateTotalTime(phaseDurations));
    
    setIsInBreak(true);
    setIsRunning(true);
    
    setTimeout(() => {
      startBreak('A');
    }, 50);
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
  // Aggiungi simpleMode qui sotto:
}, [isRunning, isPaused, isInBreak, phaseDurations, simpleMode]);
  
  useEffect(() => {
  document.documentElement.style.colorScheme = 'dark';
}, []);

  const handleReset = () => {
  // MODALITÀ SEMPLICE - reset minimale
  if (simpleMode) {
    stopMetronome();
    setIsRunning(false);
    setIsPaused(false);
    return;
  }
  
  // MODALITÀ AVANZATA - reset completo
  stopMetronome();
  countdownTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
  countdownTimeoutsRef.current = [];
  if (intervalIdRef.current) { clearInterval(intervalIdRef.current); intervalIdRef.current = null; }
  if (globalIntervalRef.current) { clearInterval(globalIntervalRef.current); globalIntervalRef.current = null; }
  
  // Reset completo di tutti gli stati
  setIsRunning(false);
  setIsPaused(false);
  setIsFocused(false);
  setIsInBreak(false);
  setIsInInterPhasePause(false);
  setCountdownBeat(0);
  setCurrentPhase('A');
  setTimeRemaining(phaseDurations['A'] * 60);
  setTotalTimeRemaining(calculateTotalTime(phaseDurations));
  nextPhaseOnBreakEndRef.current = 'A';
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
    setIsInBreak(false);
  setIsInInterPhasePause(false);
  setCountdownBeat(0);
  };

const handlePhaseClick = (targetPhase: PhaseKey) => {
  // Se non è in esecuzione, avvia dalla fase cliccata
  if (!isRunning) {
    ensureAudioContext();
    resumeAudioContext();
    setIsPaused(false);
    setIsFocused(false);
    setIsInInterPhasePause(false);
    setTotalTimeRemaining(calculateTotalTime(phaseDurations));
    setCurrentPhase(targetPhase);
    setTimeRemaining(phaseDurations[targetPhase] * 60);
    nextPhaseOnBreakEndRef.current = targetPhase;
    
    setIsInBreak(true);
    setIsRunning(true);
    
    setTimeout(() => {
      startBreak(targetPhase);
    }, 50);
    return;
  }
  
  // Se è in esecuzione, salta alla fase cliccata
  if (isInBreak || isFocused || isPaused) return;
  
  stopMetronome();
  if (intervalIdRef.current) { clearInterval(intervalIdRef.current); intervalIdRef.current = null; }
  if (globalIntervalRef.current) { clearInterval(globalIntervalRef.current); globalIntervalRef.current = null; }
  countdownTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
  countdownTimeoutsRef.current = [];
  
  setIsInInterPhasePause(false);
  nextPhaseOnBreakEndRef.current = targetPhase;
  
  setIsInBreak(true);
  setTimeout(() => {
    startBreak(targetPhase);
  }, 50);
};

// Carica settaggi da URL al mount
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const urlBpm = params.get('bpm');
  const urlSub = params.get('sub');
  const urlDurations = params.get('dur');
  const urlPercentages = params.get('perc');
  const urlLang = params.get('lang');
  
  if (urlBpm) setTargetBPM(Number(urlBpm));
  if (urlSub && ['quarter', 'eighth', 'triplet', 'sixteenth'].includes(urlSub)) {
    setSubdivision(urlSub as typeof subdivision);
  }
  if (urlDurations) {
    const [a, b, c, d] = urlDurations.split(',').map(Number);
    if (a && b && c && d) setPhaseDurations({ A: a, B: b, C: c, D: d });
  }
  if (urlPercentages) {
    const [a, b, c] = urlPercentages.split(',').map(Number);
    if (a && b && c) setPhasePercentages({ A: a, B: b, C: c, D: 100 });
  }
  if (urlLang && (urlLang === 'it' || urlLang === 'en')) {
    setLanguage(urlLang);
  }
}, []);

// Aggiorna URL quando cambiano i settaggi
useEffect(() => {
  if (!isRunning) {
    const params = new URLSearchParams();
    params.set('bpm', targetBPM.toString());
    params.set('sub', subdivision);
    params.set('dur', `${phaseDurations.A},${phaseDurations.B},${phaseDurations.C},${phaseDurations.D}`);
    params.set('perc', `${phasePercentages.A},${phasePercentages.B},${phasePercentages.C}`);
    params.set('lang', language);
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }
}, [targetBPM, subdivision, phaseDurations, phasePercentages, language, isRunning]);

const handleInstallClick = async () => {
  if (!deferredPrompt) return;
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    setShowInstallButton(false);
  }
  
  setDeferredPrompt(null);
};
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.max(seconds % 60, 0);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Flag per la logica di avviso visivo
  const isTimeWarning = !isInBreak && isRunning && timeRemaining <= 10 && !isFocused;

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
    const colors = phaseOrder.map(key => hexToRgba(phaseStyles[key].accent, 0.15));
  return `
    
    0 0 20px ${colors[0]}, /* Ombra A (es. in alto a sx) */
    0 0 20px ${colors[1]}, /* Ombra B (es. in alto a dx) */
    0 0 20px ${colors[2]}, /* Ombra C (es. in basso a sx) */
    0 0 20px ${colors[3]}  /* Ombra D (es. in basso a dx) */
  `;
};

  return (
<div className="relative min-h-screen overflow-hidden overflow-x-hidden max-w-full w-full text-white flex justify-center" style={{ colorScheme: 'dark' }}>
  {/* Background animato per fase */}
  <motion.div
    key={bgPhaseColor}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1.5, ease: "easeInOut" }}
    className="absolute inset-0 bg-[#0b0d0e]"
    style={{
      background: !simpleMode && isRunning 
        ? `radial-gradient(circle at center, ${hexToRgba(phaseStyles[bgPhaseColor].accent, 0.08)} 0%, #0b0d0e 60%)`
        : '#0b0d0e'
    }}
  />


      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(156,176,196,0.12),_transparent_62%)]" />
      <div className="pointer-events-none absolute -bottom-32 left-[12%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,_rgba(96,129,118,0.18),_transparent_68%)] blur-3xl" />
      <div className="pointer-events-none absolute -top-48 right-[-10%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,_rgba(71,85,105,0.16),_transparent_70%)] blur-3xl" />
<div className={`relative z-10 mx-auto ${simpleMode ? 'w-[95%]' : 'w-[85%]'} sm:w-full max-w-full sm:max-w-6xl ${simpleMode ? 'px-4' : 'px-8'} sm:px-8 pb-8 pt-2 sm:pb-16 sm:pt-10 scale-[1.00] origin-center sm:scale-100`}>

        <motion.header
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-5 text-center lg:text-left"
        >
          <h1 className="text-5xl font-light leading-tight text-neutral-100 sm:text-5xl lg:text-5xl xl:text-[3.35rem]">
            <span className="font-semibold text-[#88a7d0]">A</span>
            <span className="font-semibold text-[#c2b68a]">B</span>
            <span className="font-semibold text-[#d9a88a]">C</span>
            <span className="font-semibold text-[#8ab7aa]">D</span>
            <span className="pl-2 font-light text-neutral-300">method</span>
          </h1>
          <p className="max-w-xl text-sm text-neutral-500 lg:text-base">
            {t.producedBy} <a href="https://batterista.online">Batterista Online</a>
          </p>
          <div className="mt-3 flex w-full items-center justify-end gap-3">
  <a
    href="https://batterista.online"
    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
  >
    ⟵ Home
  </a>

  <button
    onClick={() => setLanguage(prev => prev === 'it' ? 'en' : 'it')}
    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
  >
    {language === 'it' ? '🇬🇧 English' : '🇮🇹 Italiano'}
  </button>
</div>
{/* Toggle Modalità */}
<div className="mt-6 flex items-center justify-center gap-4">
  <button
    onClick={() => {
      if (isRunning) handleReset();
      setSimpleMode(false);
      setShowSettings(false);
    }}
    disabled={false}
    className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
      !simpleMode
        ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
        : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/20 hover:text-neutral-300'
    } `}
  >
    <div>
      <span className="font-semibold text-[#88a7d0]">A</span>
      <span className="font-semibold text-[#c2b68a]">B</span>
      <span className="font-semibold text-[#d9a88a]">C</span>
      <span className="font-semibold text-[#8ab7aa]">D</span>
      <span className="ml-1">{t.advancedMode.replace('ABCD', '').trim()}</span>
    </div>
    <div className="text-xs font-normal mt-0.5 opacity-70">{t.advancedModeDesc}</div>
  </button>
  
  <button
    onClick={() => {
      if (isRunning) handleReset();
      setSimpleMode(true);
      setShowSettings(false);
    }}
    disabled={false}
    className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
      simpleMode
        ? 'border-blue-400/40 bg-blue-500/20 text-blue-200'
        : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/20 hover:text-neutral-300'
    } `}
  >
    <div>{t.simpleMode}</div>
    <div className="text-xs font-normal mt-0.5 opacity-70">{t.simpleModeDesc}</div>
  </button>
</div>



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
    className="mt-14 flex flex-col gap-8 items-center lg:flex-row lg:justify-between lg:items-start" 
    variants={staggerParent}
    initial="hidden"
    animate="visible"
>
            {/* COLONNA DI SINISTRA (lg:w-7/12 - Metronomo, Controlli) */}
<div className={`flex flex-col gap-8 w-full ${simpleMode ? 'max-w-full' : 'max-w-2xl lg:max-w-none lg:w-7/12'}`}>

                {/* 1. SEZIONE METRONOMO: order-1 (Mobile/Desktop) */}
               <motion.section
    variants={scaleIn}
    className={`order-1 lg:order-1 relative overflow-hidden rounded-[32px] border border-white/8 bg-white/5 shadow-[0_32px_70px_rgba(8,10,12,0.35)] backdrop-blur-xl ${
      simpleMode ? 'p-6 w-full' : 'p-8'
    }`}
>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_rgba(17,19,22,0.6))] opacity-90" />
                    <div className="relative z-10 space-y-12">
                        {/* Pills - SOLO MODALITÀ AVANZATA */}
{!simpleMode && (
<motion.div
    variants={staggerParent}
    initial="hidden"
    animate="visible"
    className="grid grid-cols-2 gap-3 justify-items-center sm:grid-cols-4" 
>
    {phaseOrder.map(key => {
  const isActive = currentPhase === key;
  const progress = isActive && isRunning && !isInBreak 
    ? ((phaseDurations[key] * 60 - timeRemaining) / (phaseDurations[key] * 60)) * 100 
    : 0;
  
  return (
    <motion.button
      key={key}
      variants={pillVariant}
      onClick={() => handlePhaseClick(key)}
      className={`relative group flex items-center justify-center w-full gap-0.5 rounded-full px-3.5 py-1.5 text-sm transition cursor-pointer ${
        isActive
          ? `bg-gradient-to-r ${phaseStyles[key].color} text-white font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.25)]`
          : 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/20'
      }`}
      style={isActive && isRunning && !isInBreak ? {
        background: `linear-gradient(90deg, 
          ${phaseStyles[key].accent} 0%, 
          ${phaseStyles[key].accent} ${progress}%, 
          rgba(255,255,255,0.05) ${progress}%, 
          rgba(255,255,255,0.05) 100%)`,
        boxShadow: `0 0 20px ${hexToRgba(phaseStyles[key].accent, 0.4)}, 0 8px 24px rgba(0,0,0,0.25)`,
        border: `2px solid ${phaseStyles[key].accent}`
      } : {}}
    >
      <span className="font-bold relative z-10" style={{ color: isActive ? 'white' : phaseStyles[key].accent }}>
        {key}
      </span>
      <span className={`font-light transition relative z-10 ${isActive ? 'text-white/80' : 'text-neutral-400'}`}>
        {phaseStyles[key].name.substring(1)}
      </span>
    </motion.button>
  );
})}
</motion.div>
)}

{/* FIX: Wrapper Relative per stabilizzare le dimensioni */}
                        <div className="relative" style={simpleMode ? {} : (contentDimensions ?? {})}>
                            <AnimatePresence mode="wait">
  {isInInterPhasePause ? (
    <motion.div
      key="inter-pause"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
      className="rounded-[24px] border border-white/10 bg-white/5 px-10 py-16 text-center shadow-inner backdrop-blur w-full flex flex-col justify-center absolute inset-0"
    >
      <span className="text-xs uppercase tracking-[0.36em] text-neutral-500">
  {t.pauseBetweenSections}
</span>
      <motion.div 
  key={interPhasePauseRemaining}
  initial={{ scale: 1.3, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
  className="mt-6 text-[5.5rem] font-bold text-amber-400 tabular-nums"
>
  {interPhasePauseRemaining > 0 ? interPhasePauseRemaining : '...'}
</motion.div>
      <p className="text-neutral-400">
{t.prepareNext}
      </p>
    </motion.div>
  ) : isInBreak ? (
    <motion.div
      key="break"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
      className="rounded-[24px] border border-white/10 bg-white/5 px-10 py-16 text-center shadow-inner backdrop-blur w-full flex flex-col justify-center absolute inset-0"
    >
      <span className="text-xs uppercase tracking-[0.36em] text-neutral-500">
        {t.preparationFor} {nextPhaseOnBreakEndRef.current}
      </span>
      <div className="mt-6 text-[5.5rem] font-bold text-[#8ab7aa]">
        {countdownBeat > 0 ? (countdownBeat <= 2 ? countdownBeat : countdownBeat - 2) : '...'}
      </div>
      <p className="text-neutral-400">
        {countdownBeat <= 2 ? t.oneTwoText : t.readyGoText}
      </p>
    </motion.div>
  ) : (
    <motion.div 
      key="active" 
      className="w-full" 
      ref={metronomeContentRef}
    > 
     <div className={`${simpleMode ? 'flex flex-col items-center gap-8 w-full' : 'grid gap-8 lg:grid-cols-[minmax(0,260px)_1fr] lg:items-center'}`}>
                                    <div className="relative mx-auto flex h-52 w-52 sm:h-64 sm:w-64 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),rgba(12,13,14,0.82))] shadow-[0_32px_70px_rgba(10,12,14,0.6)]">
                                        {/* Livello Base (Sempre visibile) */}
<div 
  className="absolute inset-0 rounded-full border-[10px] transition-colors duration-500"
  style={{ 
    borderColor: 'rgba(255,255,255,0.12)',
    boxShadow: 'inset 0 0 28px rgba(0,0,0,0.4)'
  }} 
/>
{/* Livello Base Colorato (cambia colore dolcemente) */}
<motion.div
  key={`color-${simpleColorIndex}`}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 1, ease: "easeInOut" }}
  className="absolute inset-0 rounded-full border-[10px] blur-[2px]"
  style={{ 
    borderColor: (simpleMode ? getSimpleModeStyle().accent : phaseStyles[currentPhase].accent) + '30',
    zIndex: 0
  }}
/>

{/* Livello Flash (Si attiva al beat) */}
<motion.div
  key={beatFlash}
  initial={{ 
    scale: 1,
    boxShadow: `0 0 0px ${hexToRgba(simpleMode ? getSimpleModeStyle().accent : phaseStyles[currentPhase].accent, 0)}`
  }}
  animate={{ 
    scale: [1, 1.04, 1],
    boxShadow: [
      `0 0 0px ${hexToRgba(simpleMode ? getSimpleModeStyle().accent : phaseStyles[currentPhase].accent, 0)}`,
      `0 0 60px ${hexToRgba(simpleMode ? getSimpleModeStyle().accent : phaseStyles[currentPhase].accent, 0.8)}, 0 0 100px ${hexToRgba(simpleMode ? getSimpleModeStyle().accent : phaseStyles[currentPhase].accent, 0.4)}`,
      `0 0 0px ${hexToRgba(simpleMode ? getSimpleModeStyle().accent : phaseStyles[currentPhase].accent, 0)}`
    ]
  }}
  transition={{ duration: 0.15, ease: "easeOut" }}
  className="absolute inset-0 rounded-full"
  style={{ zIndex: 1 }}
/>

{/* Effetto Glow diffuso extra */}
<motion.div
  key={`glow-${beatFlash}`}
  initial={{ opacity: 0 }}
  animate={{ opacity: [0, 0.4, 0] }}
  transition={{ duration: 0.15, ease: "easeOut" }}
  className="absolute inset-0 rounded-full"
  style={{
    background: `radial-gradient(circle, ${simpleMode ? getSimpleModeStyle().accent : phaseStyles[currentPhase].accent} 0%, transparent 70%)`,
    zIndex: 0
  }}
/>
                                        <div className="relative text-center">
  <div className="text-[4.85rem] font-semibold" style={{ 
    color: simpleMode ? getSimpleModeStyle().accent : phaseStyles[currentPhase].accent,
    transition: 'color 1s ease-in-out'
  }}>{getCurrentBPM()}</div>
                                        <div className="text-sm uppercase tracking-[0.4em] text-neutral-400">BPM</div>
                                        </div>
                                    </div>

                                   <div className={`space-y-6 ${simpleMode ? 'text-center w-full max-w-full px-4' : 'text-left'}`}>
    <div>
    {!simpleMode && (
      <>
        <span className="text-xs uppercase tracking-[0.4em] text-neutral-500">{t.currentSection}</span>
        <h2 className={`mt-3 text-3xl font-semibold ${phaseStyles[currentPhase].textColor}`}>
            {currentPhase} • {phaseStyles[currentPhase].name}
        </h2>
      </>
    )}
    {simpleMode && (
  <>
    <span className="text-xs uppercase tracking-[0.4em] text-neutral-500">METRONOMO</span>
    <h2 className="mt-3 text-3xl font-semibold transition-colors duration-1000" style={{ 
      color: getSimpleModeStyle().textColor 
    }}>
        {t.simpleMode}
    </h2>
      </>
    )}
                                       <p className="mt-2 text-sm text-neutral-400">
        {subdivisions[subdivision].name} • {targetBPM} BPM
        {!simpleMode && ` • ${t.duration} ${phaseDurations[currentPhase]} ${t.minutes}`}
    </p>
    </div>

    {!simpleMode && (
    <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
                                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-neutral-400">
                                            {t.totalTime} • {formatTime(totalTimeRemaining)}
                                        </span>
                                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-neutral-400">
                                            {phasePercentages[currentPhase]}% {t.ofTargetSpeed}
                                        </span>
                                        </div>
)}
                                        
                                        {/* AGGIUNTO: Indicatore Focus Attivo */}
                                        {isFocused && (
                                            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.35em] text-yellow-300">
                                                <Target size={14} /> {t.focusActive}
                                            </div>
                                        )}

                                        {!simpleMode && (
                                        <div>
                                        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-neutral-500">
                                            <span>{t.sectionProgress}</span>
                                            {/* AGGIUNTO: Logica avviso visivo 10 secondi */}
                                            <span 
                                                className={isTimeWarning ? 'text-red-400 font-bold' : 'text-neutral-500'}
                                            >
                                                {formatTime(timeRemaining)}
                                            </span>
                                        </div>
                                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
                                            <div
                                            className={`h-full rounded-full bg-gradient-to-r ${phaseStyles[currentPhase].color}`}
                                            style={{ width: `${(timeRemaining / (phaseDurations[currentPhase] * 60)) * 100}%` }}
                                            />
                                        </div>
                                        </div>
)}
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
                    
    {/* 1. Pulsante Reset Globale */}
{!simpleMode && (
    <button
        onClick={handleReset}
        className="group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-neutral-300 transition hover:border-white/30 hover:text-white disabled:opacity-40"
        title={t.resetTooltip}
        style={{ 
            boxShadow: getGlobalResetGlow(),
            transition: 'box-shadow 0.3s ease-in-out'
        }} 
    >
        <span className="absolute inset-0 translate-y-full bg-gradient-to-br from-white/15 to-transparent transition duration-300 group-hover:translate-y-0" />
        <RotateCcw size={22} className="relative" />
    </button>
)}

{/* 2. Pulsante Reset Fase Corrente */}
{!simpleMode && (
    <button
        onClick={handleRestartPhase}
        disabled={!isRunning || isInBreak || isFocused}
        className="group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-neutral-300 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        title={`${t.repeatTooltip} ${currentPhase}`}
        style={{ 
            boxShadow: isRunning && !isInBreak && !isFocused ? `0 0 25px ${hexToRgba(phaseStyles[currentPhase].accent, 0.45)}` : 'none', 
            transition: 'box-shadow 0.3s ease-in-out' 
        }}
    >
        <span className="absolute inset-0 translate-y-full bg-gradient-to-br from-white/15 to-transparent transition duration-300 group-hover:translate-y-0" />
        <RefreshCcw size={22} className="relative" />
    </button>
)}

{/* Pulsante Play/Pausa - RIPRISTINATO ORIGINALE */}
<button
    onClick={handleStartStop}
    disabled={isInBreak && countdownTimeoutsRef.current.length > 0}
    className={`relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl px-10 py-4 text-lg font-semibold transition shadow-[0_18px_40px_rgba(7,24,19,0.4)] ${
        isRunning && !isPaused
            ? 'border border-red-500/20 bg-gradient-to-r from-[#734848] to-[#5a3535] text-red-50'
            : 'border border-emerald-400/20 bg-gradient-to-r from-[#3e5c55] to-[#2e4741] text-emerald-50'
    } ${isInBreak && countdownTimeoutsRef.current.length > 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
>
    {isRunning && !isPaused ? (
        <>
            <Pause size={24} fill="currentColor" />
            <span>PAUSE</span>
        </>
    ) : (
        <>
            <Play size={24} fill="currentColor" />
            <span>START</span>
        </>
    )}
</button>
                    
                    {/* AGGIUNTO: Pulsante FOCUS/FREEZE */}
{!simpleMode && (
                    <button
                        onClick={handleFocusToggle}
                        disabled={!isRunning || isInBreak || isPaused} // Disabilita se non in Run, in Break, o Pausato
                        className={`group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border transition ${
                            isFocused 
                            ? `border-yellow-500/40 bg-yellow-500/10 text-yellow-300 shadow-[0_0_25px_rgba(252,211,77,0.4)]`
                            : 'border-white/10 bg-white/5 text-neutral-300 hover:border-white/30 hover:text-white'
                        } disabled:cursor-not-allowed disabled:opacity-40`}
                        title={isFocused ? t.resumeTooltip : t.focusTooltip}
                    >
                        <span className="absolute inset-0 translate-y-full bg-gradient-to-br from-white/15 to-transparent transition duration-300 group-hover:translate-y-0" />
                        <Target size={22} className="relative" />
                    </button>
)}

                    {/* Pulsante Skip Forward */}
{!simpleMode && (
                    <button
                        onClick={() => goToNextPhase(true)}
                        disabled={!isRunning || isInBreak || currentPhase === 'D' || isFocused} // AGGIUNTO: Disabilita se in Focus
                        className="group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-neutral-300 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        title={t.nextTooltip}
                    >
                        <span className="absolute inset-0 translate-y-full bg-gradient-to-br from-white/15 to-transparent transition duration-300 group-hover:translate-y-0" />
                        <SkipForward size={22} className="relative" />
                    </button>
)}
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
<div className={`flex flex-col gap-8 w-full ${simpleMode ? 'max-w-full' : 'max-w-2xl lg:max-w-none lg:w-5/12'}`}>

                {/* 2. TEMPO COMPLESSIVO: order-3 (Mobile) / lg:order-1 (Desktop) */}
                <motion.div
                    variants={scaleIn}
                    className="order-3 lg:order-1 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(6,8,10,0.35)] backdrop-blur"
                >
                    <div className="flex items-center justify-between">
                    <div className="w-full">
  {!simpleMode && (
  <span className="text-xs uppercase tracking-[0.35em] text-neutral-500">{t.overallTime}</span>
  )}
  {simpleMode && (
  <span className="text-xs uppercase tracking-[0.35em] text-neutral-500">METRONOMO CLASSICO ATTIVO</span>
  )}
  {!simpleMode && isInInterPhasePause ? (
    <div className="mt-2 text-3xl font-semibold text-amber-400 tracking-wider">{t.pauseLabel}</div>
  ) : !simpleMode ? (
    <div className="mt-2 text-3xl font-semibold text-neutral-100">{formatTime(totalTimeRemaining)}</div>
  ) : (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-3">
        <button
  onClick={() => adjustBPM(-1)}
  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white text-xl font-bold transition hover:border-white/40 hover:bg-white/20"
>
  −
</button>
        <input
          type="range"
          value={targetBPM}
          onChange={(e) => setTargetBPM(Number(e.target.value))}
          className="flex-1 accent-blue-500 [--tw-ring-color:transparent]"
          min="40"
          max="240"
        />
        <button
  onClick={() => adjustBPM(1)}
  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white text-xl font-bold transition hover:border-white/40 hover:bg-white/20"
>
  +
</button>
        <div className="w-12 text-right text-2xl font-semibold text-blue-300">{targetBPM}</div>
      </div>
    </div>
  )}
</div>
                    {/* Formattazione del tempo su due righe */}
{!simpleMode && (
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-center">
                        <span style={{ color: phaseStyles[currentPhase].accent, fontWeight: 'bold' }}>
                            {`${t.sectionLabel} ${currentPhase}:`}
                        </span>
                        <div className="text-neutral-400 mt-0.5 font-normal tracking-normal text-sm">
                            {`${phaseDurations[currentPhase]} ${t.minutes}`}
                        </div>
                    </div>
)}
                    </div>
                    {audioError && (
                    <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/5 px-4 py-3 text-xs text-red-300">
                        {audioError}
                    </div>
                    )}
                </motion.div>

                {/* 4. PROFILO FASI -> OVERVIEW SEZIONI: order-4 (Mobile) / lg:order-2 (Desktop) */}
{!simpleMode && (                
<motion.div
key="overview-sections"
                    variants={scaleIn}
initial="hidden"        // <--- ASSICURATI CHE CI SIANO QUESTI
    animate="visible"       // <--- ASSICURATI CHE CI SIANO QUESTI
                    className="order-4 lg:order-2 space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(5,7,9,0.4)] backdrop-blur"
                >
                    <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.35em] text-neutral-500">{t.overviewSections}</span> 
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
                            <span>{phaseDurations[key]} {t.minutes}</span>
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
)}
                
                {/* 5. SETTINGS: order-5 (Mobile) / lg:order-3 (Desktop) */}
                <motion.div
    variants={scaleIn}
    className={`order-2 lg:order-2 space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(5,7,9,0.4)] backdrop-blur ${
      simpleMode ? 'w-full' : ''
    }`}
>
                    {/* Pulsante a tutta larghezza */}
                    <button
  onClick={() => {
    setShowSettings(!showSettings);
    setShowInstructions(false); 
  }}
  className="flex w-full items-center justify-between text-sm font-semibold transition"
  style={{ backgroundColor: '#18181b', padding: '12px', borderRadius: '12px' }}
>
  <span style={{ color: '#d4d4d8' }}>Settings</span>
  {showSettings ? <ChevronUp size={18} style={{ color: '#d4d4d8' }} /> : <ChevronDown size={18} style={{ color: '#d4d4d8' }} />}
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
                            <label className="mb-3 block text-xs uppercase tracking-[0.35em] text-neutral-500">{t.subdivision}</label>
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

{!simpleMode && (                        
<div>
                            <label className="mb-3 block text-xs uppercase tracking-[0.35em] text-neutral-500">{t.sectionDuration}</label>
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
 )}

                        {!simpleMode && (

                        <div>
                            <label className="mb-3 block text-xs uppercase tracking-[0.35em] text-neutral-500">{t.speedPercentages}</label>
                            <div className="grid gap-5 md:grid-cols-2">
                            {phaseOrder.map(key => (
                                <div key={key} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400">
                                    <span className={phaseStyles[key].textColor}>{key}</span>
                                    <span>{phasePercentages[key]}%</span>
                                </div>
                                {key === 'D' ? (
                                    <p className="text-[11px] text-neutral-500">{t.fixedAt100}</p>
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
                                    {Math.round(targetBPM * getPhasePercentage(key))} BPM
                                </div>
                                </div>
                            ))}
                            </div>
                        </div>
)}


                        {/* Pulsante Reset alleggerito nello stile e nel testo */}
                        <div className="border-t border-white/10 pt-5 space-y-3">
                            <button
                                onClick={handleResetDefaults}
                                disabled={isRunning && !isPaused} 
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-sm font-semibold text-neutral-400 transition hover:border-white/20 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Ripristina durate e percentuali di default"
                            >
                                <RefreshCcw size={16} className="text-neutral-500" />
                                {t.resetDefaults}
                            </button>

                            <div className="text-center text-[11px] uppercase tracking-[0.3em] text-neutral-500">
  {isRunning && !isPaused ? t.cannotModify : t.allChanges}
</div>
                        </div>
                        
                        <div className="border-t border-white/10 pt-5 text-center text-[11px] uppercase tracking-[0.3em] text-neutral-500">
                            {t.previewUpdated}
                        </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </motion.div>
<div className="space-y-3">
  <div className="text-xs uppercase tracking-[0.35em] text-neutral-500 text-center">
    {language === 'it' ? 'Condividi Settaggi' : 'Share Settings'}
  </div>
  <div className="flex gap-2">
    {/* WhatsApp */}
    <button
      onClick={() => {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(language === 'it' ? 'Guarda questi settaggi ABCD!' : 'Check out these ABCD settings!');
        window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
      }}
      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-green-400/20 bg-green-500/10 px-3 py-2 text-sm font-semibold text-green-300 transition hover:border-green-400/40 hover:bg-green-500/20"
      title="WhatsApp"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
    </button>

    {/* Facebook */}
<button
  onClick={() => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  }}
  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-300 transition hover:border-blue-400/40 hover:bg-blue-500/20"
  title="Facebook"
>
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
</button>

    {/* Copia Link */}
    <button
      onClick={() => {
        navigator.clipboard.writeText(window.location.href);
        alert(language === 'it' ? 'Link copiato!' : 'Link copied!');
      }}
      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/20"
      title={language === 'it' ? 'Copia Link' : 'Copy Link'}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
  </div>
</div>


                {/* 6. INFO & ISTRUZIONI: order-6 (Mobile) / lg:order-4 (Desktop) */}
                <motion.div
    variants={scaleIn}
    className="order-5 lg:order-3 rounded-3xl border border-white/10 bg-[#18181b] p-6 shadow-[0_18px_40px_rgba(5,7,9,0.4)]"
>
                    <button
  onClick={() => {
    setShowInstructions(!showInstructions);
    setShowSettings(false); 
  }}
  className="flex w-full items-center justify-between text-sm font-semibold transition"
  style={{ backgroundColor: '#18181b', padding: '12px', borderRadius: '12px' }}
>
  <span className="flex items-center gap-2" style={{ color: '#d4d4d8' }}>
    <Info size={16} style={{ color: '#d4d4d8' }} /> 
    <span style={{ color: '#d4d4d8' }}>{t.infoInstructions}</span>
  </span>
  {showInstructions ? <ChevronUp size={18} style={{ color: '#d4d4d8' }} /> : <ChevronDown size={18} style={{ color: '#d4d4d8' }} />}
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
                            <h4 className="text-lg font-semibold text-neutral-200">{t.methodTitle}</h4>
                            <p className="text-base text-neutral-400">
                            {t.methodDesc}
                            </p>
                        </div>
                        
                        <div className="border-t border-white/10 pt-4 space-y-3">
                            <h4 className="text-lg font-semibold text-neutral-200">{t.howItWorks}</h4>
                            <p className="text-base text-neutral-400">
                            {t.howItWorksDesc}
                            </p>
                        </div>

                        <div className="border-t border-white/10 pt-4 space-y-3">
                            <h4 className="text-lg font-semibold text-neutral-200">{t.defaultStructure}</h4>
                            <p className="text-base text-neutral-400 mb-2">{t.defaultStructureDesc}</p>
                            <ul className="list-none space-y-1 pl-0 text-base text-neutral-400">
                            <li><span className="font-semibold text-neutral-200">A – 70%</span> {t.phaseA}</li>
                            <li><span className="font-semibold text-neutral-200">B – 85%</span> {t.phaseB}</li>
                            <li><span className="font-semibold text-neutral-200">C – 105%</span> {t.phaseC}</li>
                            <li><span className="font-semibold text-neutral-200">D – 100%</span> {t.phaseD}</li>
                            </ul>
                        </div>
                        
                        <div className="border-t border-white/10 pt-4 space-y-3">
                            <h4 className="text-lg font-semibold text-neutral-200">{t.focusControl}</h4>
                            <p className="text-base text-neutral-400">
                            {t.focusControlDesc}
                            </p>
                        </div>

                        <div className="border-t border-white/10 pt-4 space-y-3">
                            <h4 className="text-lg font-semibold text-neutral-200">{t.customization}</h4>
                            <p className="text-base text-neutral-400">
                           {t.customizationDesc}
                            </p>
                        </div>
                        <div className="mt-8 pt-4 border-t border-white/10 text-center">
    <a 
        href="https://batterista.online" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-lg font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
    >
        {t.goToWebsite}
    </a>
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
  className="mt-16 flex flex-col gap-4 text-center text-[11px] uppercase tracking-[0.3em] text-neutral-600"
>
  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
    <span>{t.copyright} <a href="https://batterista.online" className="hover:text-neutral-400 transition">{t.website}</a>- <a href="mailto:info@batterista.online" className="hover:text-neutral-400 transition">info@batterista.online</a></span>
    <span className="text-neutral-500">{t.version}</span>
  </div>
  {showInstallButton && (
  <div className="flex items-center justify-center pt-4 border-t border-white/10">
    <button
      onClick={handleInstallClick}
      className="flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-6 py-3 text-sm font-semibold text-blue-300 transition hover:border-blue-400/40 hover:bg-blue-500/20 hover:text-blue-200"
    >
      

<Download size={18} className="relative" /> {t.installApp}
    </button>
  </div>
)}
  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-neutral-500 pt-4 border-t border-white/10">
    <span>{t.supportApp}</span>
    <a 
      href="https://www.buymeacoffee.com/batterista" 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold normal-case tracking-normal text-amber-300 transition hover:border-amber-400/40 hover:bg-amber-500/20 hover:text-amber-200"
    >
      ☕ {t.buyMeCoffee}
    </a>
  </div>
</motion.footer>
      </div>
    </div>
  );
};

export default ABCDMetronome;
