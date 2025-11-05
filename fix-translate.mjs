import fs from 'fs';

console.log('🔧 Inizio trasformazione automatica CORRETTA...\n');

let content = fs.readFileSync('./src/App.tsx', 'utf8');

// ============================================
// STEP 1: Trova dove finisce defaultPhasePercentages
// ============================================
const translationsObject = `
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
    methodDesc: 'Un metodo semplice per studiare in modo più efficace, anche solo 12 minuti al giorno. Ogni sessione ti fa passare da lentezza e precisione, fino alla velocità target, in modo logico e progressivo. È lo stesso principio dell\\'allenamento sportivo: alternare concentrazione, sforzo e recupero per costruire stabilità.',
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
    version: 'ABCD method versione 1.7',
    audioNotSupported: 'Audio non supportato dal browser; il timer funzionerà senza suoni.',
    audioFailed: "Impossibile inizializzare l'audio. Consenti l'accesso o ricarica la pagina.",
    audioEnable: "Per abilitare i suoni interagisci con la pagina (es. premi Start) e consenti l'audio.",
    pauseLabel: 'PAUSA'
  },
  en: {
    attention: 'Attention',
    base: 'Base',
    challenge: 'Challenge',
    destination: 'Destination',
    producedBy: 'produced by',
    preparationFor: 'Preparation for section',
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
    methodDesc: 'A simple method to study more effectively, even just 12 minutes a day. Each session takes you from slowness and precision to target speed in a logical and progressive way. It\\'s the same principle as sports training: alternating concentration, effort and recovery to build stability.',
    howItWorks: 'How It Works',
    howItWorksDesc: 'When you press Play, the metronome will sound for the set minutes at the speed of the active section. At the end of each phase you will hear a countdown and the timer will automatically move to the next section. By default, each section lasts 3 minutes with speeds: A 70%, B 85%, C 105%, D 100%.',
    defaultStructure: 'Default Structure',
    defaultStructureDesc: '4 phases of 3 minutes each:',
    phaseA: 'control and mechanics',
    phaseB: 'stability and sound',
    phaseC: 'challenge and endurance',
    phaseD: 'naturalness and goal',
    focusControl: 'Focus Control (New)',
    focusControlDesc: 'The Focus button allows you to pause the current phase timer. The metronome will continue to sound at the current BPM, allowing you to practice until you\\'re ready to restart. Press the button again to resume the timer from where it stopped.',
    customization: 'Customization',
    customizationDesc: 'You can modify durations and speeds as you like by clicking the "Settings" section: here you can set the target BPM (the one you want to reach), the duration of each section (from 1 to 5 minutes) and the BPM percentage for each section based on the Target BPM (the percentage of section D (Destination) is not modifiable because it is obviously equal to 100%).',
    goToWebsite: 'Go to Batterista Online website',
    copyright: 'Copyright © Batterista Online - All rights reserved -',
    version: 'ABCD method version 1.7',
    audioNotSupported: 'Audio not supported by browser; the timer will work without sounds.',
    audioFailed: "Unable to initialize audio. Allow access or reload the page.",
    audioEnable: "To enable sounds interact with the page (e.g. press Start) and allow audio.",
    pauseLabel: 'PAUSE'
  }
};
`;

// Inserisci PRIMA dell'oggetto phaseStyles
content = content.replace(
  /const phaseStyles: Record<PhaseKey, PhaseStyle> =/,
  translationsObject + '\n' + 'const phaseStyles: Record<PhaseKey, PhaseStyle> ='
);

console.log('✓ Oggetto translations aggiunto');

// ============================================
// Converti phaseStyles in funzione
// ============================================
content = content.replace(
  /const phaseStyles: Record<PhaseKey, PhaseStyle> = \{[\s\S]*?\};/,
  `const getPhaseStyles = (lang: 'it' | 'en'): Record<PhaseKey, PhaseStyle> => ({
  A: { name: translations[lang].attention, color: 'from-[#4d6bb3] to-[#345997]', textColor: 'text-[#98b5f5]', accent: '#5f8dff', globalBarColor: '#537abf' }, 
  B: { name: translations[lang].base, color: 'from-[#d8a343] to-[#b9852c]', textColor: 'text-[#f4d48a]', accent: '#f1b54f', globalBarColor: '#d6a855' }, 
  C: { name: translations[lang].challenge, color: 'from-[#d46c4a] to-[#b55133]', textColor: 'text-[#ffb08a]', accent: '#ff865c', globalBarColor: '#e07659' }, 
  D: { name: translations[lang].destination, color: 'from-[#3a9d7a] to-[#2a7c5f]', textColor: 'text-[#9de7c6]', accent: '#5dda9d', globalBarColor: '#47b089' } 
});`
);

console.log('✓ phaseStyles convertito');

// ============================================
// Aggiungi stati nel componente
// ============================================
content = content.replace(
  /const \[volume, setVolume\] = useState\(0\.85\);/,
  `const [volume, setVolume] = useState(0.85);
  const [language, setLanguage] = useState<'it' | 'en'>('it');
  const t = translations[language];
  const phaseStyles = getPhaseStyles(language);`
);

console.log('✓ Stati aggiunti');

// ============================================
// Sostituzioni SOLO nel JSX (dopo la line del componente)
// ============================================
const componentStartIndex = content.indexOf('const ABCDMetronome = () => {');
const beforeComponent = content.substring(0, componentStartIndex);
let afterComponent = content.substring(componentStartIndex);

// Sostituzioni nel codice del componente
const replacements = [
  ["'prodotto da'", "t.producedBy"],
  ["'Controlli'", "t.controls"],
  ["'live'", "t.live"],
  ["'Pausa'", "t.pause"],
  ["'Start'", "t.start"],
  ["'Settings'", "t.settings"],
  ["'Overview Sezioni'", "t.overviewSections"],
  ["'overview'", "t.overview"],
  ["'BPM Target'", "t.bpmTarget"],
  ["'Suddivisione'", "t.subdivision"],
  ["'Durata sezioni (minuti)'", "t.sectionDuration"],
  ["'Percentuali velocità'", "t.speedPercentages"],
  ["'Ripristina Defaults'", "t.resetDefaults"],
  ["'Info & Istruzioni'", "t.infoInstructions"],
  ["'Tempo complessivo'", "t.overallTime"],
  ["'Sezione attuale'", "t.currentSection"],
  ["'Progressione sezione'", "t.sectionProgress"],
  ["'Pausa tra le sezioni'", "t.pauseBetweenSections"],
  ["'Preparati per la sezione successiva...'", "t.prepareNext"],
  ["'Preparazione per la sezione'", "t.preparationFor"],
  ["'One... Two...'", "t.oneTwoText"],
  ["'One, Two, Ready, Go!'", "t.readyGoText"],
  ["'FOCUS ATTIVO • TIMER FREEZE'", "t.focusActive"],
  ["'PAUSA'", "t.pauseLabel"],
  ["'Tempo totale •'", "t.totalTime + ' •'"],
  ["'% della velocità target'", "'% ' + t.ofTargetSpeed"],
  ["'BPM previsti'", "t.expectedBpm"],
  ["'Vai al sito Batterista Online'", "t.goToWebsite"],
  ["'Copyright © Batterista Online - Tutti i diritti riservati -'", "t.copyright"],
  ["'ABCD method versione 1.7'", "t.version"],
  ["'Fissata a 100% per mantenere il target definitivo.'", "t.fixedAt100"],
  ["'Impossibile modificare le impostazioni durante la riproduzione'", "t.cannotModify"],
  ["'Tutte le modifiche (BPM, durate, percentuali) verranno riportate ai valori iniziali.'", "t.allChanges"],
  ["'Preview BPM per sezione aggiornata in tempo reale'", "t.previewUpdated"],
  ["'ABCD method = Attenzione, Base, Challenge, Destinazione.'", "t.methodTitle"],
  ["'Funzionamento'", "t.howItWorks"],
  ["'Struttura Default'", "t.defaultStructure"],
  ["'4 fasi da 3 minuti ciascuna:'", "t.defaultStructureDesc"],
  ["'controllo e meccanica'", "t.phaseA"],
  ["'stabilità e suono'", "t.phaseB"],
  ["'sfida e resistenza'", "t.phaseC"],
  ["'naturalezza e obiettivo'", "t.phaseD"],
  ["'Controllo Focus (Novità)'", "t.focusControl"],
  ["'Personalizzazione'", "t.customization"],
  ['title="Reset (ricomincia da A)"', 'title={t.resetTooltip}'],
  ['title={`Ripeti la sezione ${currentPhase}`}', 'title={`${t.repeatTooltip} ${currentPhase}`}'],
  ['title="Sezione successiva"', 'title={t.nextTooltip}'],
  ['title={isFocused ? "Riprendi Timer (Focus Attivo)" : "Attiva Focus (Ferma Timer Sezione)"}', 'title={isFocused ? t.resumeTooltip : t.focusTooltip}'],
  ['`Sezione ${currentPhase}:`', '`${t.sectionLabel} ${currentPhase}:`'],
  ['`${phaseDurations[currentPhase]} minuti`', '`${phaseDurations[currentPhase]} ${t.minutes}`'],
  ['{phaseDurations[key]} min', '{phaseDurations[key]} {t.minutes}'],
  ["'Target'", "t.targetBpm"],
  ["'Durata'", "t.duration"],
  ["'Audio non supportato dal browser; il timer funzionerà senza suoni.'", "translations[language].audioNotSupported"],
  ['"Impossibile inizializzare l\'audio. Consenti l\'accesso o ricarica la pagina."', "translations[language].audioFailed"],
  ['"Per abilitare i suoni interagisci con la pagina (es. premi Start) e consenti l\'audio."', "translations[language].audioEnable"],
];

replacements.forEach(([find, replace]) => {
  afterComponent = afterComponent.replaceAll(find, replace);
});

content = beforeComponent + afterComponent;

console.log(`✓ ${replacements.length} sostituzioni applicate`);

// Aggiungi bottone lingua
content = content.replace(
  `<p className="max-w-xl text-sm text-neutral-500 lg:text-base">
            prodotto da <a href="https://batterista.online">Batterista Online</a>
          </p>`,
  `<p className="max-w-xl text-sm text-neutral-500 lg:text-base">
            {t.producedBy} <a href="https://batterista.online">Batterista Online</a>
          </p>
          <button
            onClick={() => setLanguage(prev => prev === 'it' ? 'en' : 'it')}
            className="mt-3 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            {language === 'it' ? '🇬🇧 English' : '🇮🇹 Italiano'}
          </button>`
);

console.log('✓ Bottone lingua aggiunto');

// Testi lunghi
content = content.replace(
  /'Un metodo semplice per studiare in modo più efficace.*?stabilità\.'/s,
  't.methodDesc'
);
content = content.replace(
  /'Quando premi Play, il metronomo suonerà.*?D 100%\.'/s,
  't.howItWorksDesc'
);
content = content.replace(
  /'Il pulsante Focus ti permette di mettere in pausa.*?interrotto\.'/s,
  't.focusControlDesc'
);
content = content.replace(
  /'Puoi modificare durate e velocità come vuoi.*?100%\)\.'/s,
  't.customizationDesc'
);

console.log('✓ Testi lunghi sostituiti');

fs.writeFileSync('./src/App.tsx', content, 'utf8');

console.log('\n🎉 COMPLETATO! Prova: npm run dev');
