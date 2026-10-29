import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Check,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Activity,
  Dna,
  Sliders,
  Scale,
  Search,
  Zap,
  Heart,
  Calendar,
  Landmark,
  Compass,
  Share2,
  CheckCircle2,
} from 'lucide-react';

interface InteractiveModeRendererProps {
  questionText: string;
  passageText?: string;
  promptText?: string;
  optionsList: string[];
  hasOptions: boolean;
  userAnswer: string;
  onSelectAnswer: (val: string) => void;
  onRecordInteraction: () => void;
  skillTag?: string;
  subject?: string;
}

export const InteractiveModeRenderer: React.FC<InteractiveModeRendererProps> = ({
  questionText,
  passageText,
  promptText,
  optionsList,
  hasOptions,
  userAnswer,
  onSelectAnswer,
  onRecordInteraction,
  skillTag,
  subject,
}) => {
  const q = (questionText + ' ' + (passageText || '')).toLowerCase();
  const tag = (skillTag || '').toLowerCase();
  const subj = (subject || '').toLowerCase();

  const handleSelect = (val: string) => {
    onSelectAnswer(val);
    onRecordInteraction();
  };

  // Helper to pick option matching keyword or default
  const pickOpt = (keywords: string[], fallback: string): string => {
    if (hasOptions && optionsList.length > 0) {
      for (const kw of keywords) {
        const found = optionsList.find((o) => o.toLowerCase().includes(kw.toLowerCase()));
        if (found) return found;
      }
    }
    return fallback;
  };

  // ═════════════════════════════════════════════════════════════════════════
  // 1. PLANT VS ANIMAL CELL BOUNDARY WORKSPACE (Q5, QB2, QB4)
  // ═════════════════════════════════════════════════════════════════════════
  if (
    (q.includes('plant') && q.includes('animal') && (q.includes('not have') || q.includes('absent') || q.includes('present') || q.includes('unique'))) ||
    (q.includes('cell wall') && (q.includes('plant') || q.includes('absent') || q.includes('rigid') || q.includes('carbohydrate') || q.includes('cellulose')))
  ) {
    const wallAns = pickOpt(['wall', 'cellulose'], 'Cell wall');
    const celluloseAns = pickOpt(['cellulose'], 'Cellulose');
    const targetAns = q.includes('carbohydrate') ? celluloseAns : wallAns;

    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl border-2 border-[#dbe6ee] p-5 shadow-xs space-y-4 font-sans">
        <div className="flex items-center gap-2 text-[#2e7d32]">
          <Search className="w-5 h-5" />
          <h2 className="text-base font-extrabold">Microscope Inspection: Plant vs. Animal Cell Boundaries</h2>
        </div>
        <p className="text-xs text-slate-600">
          Inspect the outer boundaries of both cell types below. Tap the structure or matrix material unique to plant cells:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
          {/* Plant Cell Viewport */}
          <div className="p-4 bg-[#e8f5e9] border-2 border-[#2e7d32] rounded-2xl flex flex-col items-center text-center space-y-2">
            <span className="text-xs font-black text-[#2e7d32] uppercase tracking-wider">Plant Cell View</span>
            <svg viewBox="0 0 160 130" className="w-40 h-32">
              <rect x="8" y="8" width="144" height="114" rx="14" fill="none" stroke="#2e7d32" strokeWidth="6" className="animate-pulse" />
              <rect x="18" y="18" width="124" height="94" rx="9" fill="#c8e6c9" stroke="#43a047" strokeWidth="2" strokeDasharray="3 2" />
              <circle cx="55" cy="55" r="18" fill="#32617d" />
              <ellipse cx="105" cy="45" rx="12" ry="7" fill="#2e7d32" />
              <ellipse cx="105" cy="80" rx="12" ry="7" fill="#2e7d32" />
              <text x="80" y="125" fill="#2e7d32" fontSize="9" fontWeight="bold" textAnchor="middle">Plant Cell</text>
            </svg>
            <button
              type="button"
              onClick={() => handleSelect(targetAns)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs ${
                userAnswer.toLowerCase().includes('wall') || userAnswer.toLowerCase().includes('cellulose')
                  ? 'bg-[#2e7d32] text-white ring-2 ring-[#2e7d32]/40 scale-105'
                  : 'bg-white text-[#2e7d32] border border-[#2e7d32] hover:bg-[#e8f5e9]'
              }`}
            >
              ✓ {q.includes('carbohydrate') ? 'Cellulose Polymer Wall' : 'Rigid Cell Wall (Present)'}
            </button>
          </div>

          {/* Animal Cell Viewport */}
          <div className="p-4 bg-[#fce4ec] border-2 border-[#c62828] rounded-2xl flex flex-col items-center text-center space-y-2">
            <span className="text-xs font-black text-[#c62828] uppercase tracking-wider">Animal Cell View</span>
            <svg viewBox="0 0 160 130" className="w-40 h-32">
              <ellipse cx="80" cy="60" rx="65" ry="50" fill="#ffcdd2" stroke="#c62828" strokeWidth="3" strokeDasharray="4 2" />
              <circle cx="65" cy="55" r="18" fill="#32617d" />
              <ellipse cx="115" cy="50" rx="12" ry="6" fill="#e07a5f" transform="rotate(15 115 50)" />
              <text x="80" y="125" fill="#c62828" fontSize="9" fontWeight="bold" textAnchor="middle">Animal Cell</text>
            </svg>
            <div className="w-full py-2 px-3 bg-white/80 border border-[#c62828]/40 text-[#c62828] rounded-xl text-xs font-extrabold">
              ✗ No Cell Wall (Membrane Only)
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-700 font-medium">
          <strong>Key Insight:</strong> Plant cells require a rigid outer <strong>Cell Wall</strong> (composed of <strong>cellulose</strong>) for structural support against osmotic pressure.
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 2. CELL ORGANELLE MICROSCOPE HOTSPOT WORKSPACE (Q1, Q2, Q3, Q4, Q6, Q7, Q8, QB1, QB3, QB5, QB6, QB22)
  // ═════════════════════════════════════════════════════════════════════════
  if (
    q.includes('basic unit of life') ||
    q.includes('jelly-like') || q.includes('labeled \'a\'') || q.includes('fills the cell') || q.includes('cytoplasm') ||
    q.includes('control center') || (q.includes('nucleus') && !q.includes('dna') && !q.includes('base')) ||
    q.includes('mitochondria') || q.includes('powerhouse') || q.includes('atp energy') || (q.includes('atp') && q.includes('cell') && !q.includes('respiration')) ||
    q.includes('synthesizing protein') || q.includes('synthesizes protein') || q.includes('ribosome') || (q.includes('protein') && q.includes('organelle')) ||
    q.includes('cell membrane') || q.includes('plasma membrane') || q.includes('goes in and out') || q.includes('enters and leaves') || q.includes('every animal cell')
  ) {
    const isBasicUnit = q.includes('basic unit of life');
    const isCytoplasm = q.includes('jelly-like') || q.includes('labeled \'a\'') || q.includes('cytoplasm');
    const isNucleus = q.includes('control center') || q.includes('nucleus');
    const isMito = q.includes('mitochondria') || q.includes('powerhouse') || q.includes('atp');
    const isRibosome = q.includes('ribosome') || q.includes('protein');
    const isMembrane = q.includes('membrane') || q.includes('goes in and out') || q.includes('enters and leaves') || q.includes('every animal cell');

    let defaultTarget = 'cytoplasm';
    if (isBasicUnit) defaultTarget = 'cell';
    else if (isNucleus) defaultTarget = 'nucleus';
    else if (isMito) defaultTarget = 'mitochondria';
    else if (isRibosome) defaultTarget = 'ribosome';
    else if (isMembrane) defaultTarget = pickOpt(['membrane', 'regulates'], 'cell membrane');
    else if (isCytoplasm) defaultTarget = 'cytoplasm';

    const targetAns = pickOpt([defaultTarget], defaultTarget);

    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl border-2 border-[#dbe6ee] p-5 shadow-xs space-y-4 font-sans">
        <div className="flex items-center gap-2 text-[#32617d]">
          <Search className="w-5 h-5" />
          <h2 className="text-base font-extrabold">Microscope Organelle Inspector & Hotspot Selector</h2>
        </div>
        <p className="text-xs text-slate-600">
          Tap an organelle hotspot on the cell interactive view to inspect its function and select your answer:
        </p>

        {/* Interactive SVG Cell Viewer */}
        <div className="p-4 bg-[#f0f4f8] border-2 border-[#32617d]/40 rounded-2xl flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
          <svg viewBox="0 0 340 180" className="w-full max-w-md h-auto select-none">
            {/* Cell Membrane Boundary */}
            <ellipse
              cx="170"
              cy="90"
              rx="150"
              ry="75"
              fill="#e8f5e9"
              stroke="#486730"
              strokeWidth="3"
              className={`cursor-pointer transition-all ${isMembrane ? 'stroke-amber-500 stroke-[4px] fill-emerald-100' : ''}`}
              onClick={() => handleSelect(pickOpt(['membrane', 'regulates'], 'cell membrane'))}
            />
            {/* Cytoplasm Interior */}
            <ellipse
              cx="170"
              cy="90"
              rx="138"
              ry="65"
              fill="#b2dfdb"
              fillOpacity="0.75"
              className={`cursor-pointer transition-all ${isCytoplasm ? 'fill-teal-300 fill-opacity-90 animate-pulse' : ''}`}
              onClick={() => handleSelect(pickOpt(['cytoplasm'], 'cytoplasm'))}
            />
            <text x="170" y="145" fill="#00695c" fontSize="10" fontWeight="extrabold" textAnchor="middle" pointerEvents="none">
              Cytoplasm (jelly-like fluid)
            </text>

            {/* Nucleus Hotspot */}
            <g className="cursor-pointer group" onClick={() => handleSelect(pickOpt(['nucleus'], 'nucleus'))}>
              <circle cx="120" cy="80" r="30" fill="#32617d" stroke="#1d4358" strokeWidth="2.5" className={isNucleus ? 'stroke-amber-400 stroke-[4px]' : ''} />
              <circle cx="120" cy="80" r="10" fill="#679ab9" />
              <text x="120" y="84" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">Nucleus</text>
            </g>

            {/* Mitochondria Hotspots */}
            <g className="cursor-pointer group" onClick={() => handleSelect(pickOpt(['mitochondria', 'atp', 'powerhouse'], 'mitochondria'))}>
              <ellipse cx="230" cy="65" rx="18" ry="9" fill="#e07a5f" transform="rotate(15 230 65)" stroke="#bf360c" strokeWidth="1.5" className={isMito ? 'stroke-amber-400 stroke-[3px]' : ''} />
              <ellipse cx="240" cy="105" rx="18" ry="9" fill="#e07a5f" transform="rotate(-20 240 105)" stroke="#bf360c" strokeWidth="1.5" className={isMito ? 'stroke-amber-400 stroke-[3px]' : ''} />
              <text x="235" y="68" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">ATP ⚡</text>
            </g>

            {/* Ribosome Dots */}
            <g className="cursor-pointer group" onClick={() => handleSelect(pickOpt(['ribosome'], 'ribosome'))}>
              {[
                [180, 50], [195, 55], [175, 120], [190, 125]
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="4" fill="#6a1b9a" />
              ))}
              <text x="195" y="44" fill="#4a148c" fontSize="8" fontWeight="extrabold">Ribosomes (Protein)</text>
            </g>
          </svg>

          {/* Interactive Button Deck */}
          <div className="flex flex-wrap justify-center gap-2 w-full pt-1">
            {[
              { name: 'Cytoplasm (Jelly Fluid)', val: pickOpt(['cytoplasm'], 'cytoplasm'), active: isCytoplasm },
              { name: 'Nucleus (Control Center)', val: pickOpt(['nucleus'], 'nucleus'), active: isNucleus },
              { name: 'Mitochondria (ATP Energy)', val: pickOpt(['mitochondria', 'energy', 'atp'], 'mitochondria'), active: isMito },
              { name: 'Cell Membrane (Barrier)', val: pickOpt(['membrane', 'regulates'], 'cell membrane'), active: isMembrane },
              { name: 'Ribosomes (Protein Synth)', val: pickOpt(['ribosome'], 'ribosome'), active: isRibosome },
            ].map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(item.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs ${
                  userAnswer.toLowerCase().includes(item.val.toLowerCase()) || (item.active && userAnswer === '')
                    ? 'bg-[#32617d] text-white ring-2 ring-[#32617d]/40 scale-105'
                    : 'bg-white text-[#32617d] border border-[#32617d]/40 hover:bg-[#e8f0fe]'
                }`}
              >
                ✓ {item.name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-[#e8f0fe] border border-blue-200 rounded-xl text-center text-xs text-[#32617d] font-medium">
          <strong>Organelle Principle:</strong> Each cellular compartment performs a specialized life function (Cytoplasm = fluid medium; Nucleus = genetic control; Mitochondria = ATP production; Membrane = gatekeeper).
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 3. PHOTOSYNTHESIS ASSEMBLY & GAS FLOW WORKSPACE (Q9, Q10, Q11, Q12, Q13, QB7, QB8, QB9, QB10, QB11, QB12, QB23)
  // ═════════════════════════════════════════════════════════════════════════
  if (
    q.includes('photosyn') || q.includes('chloroplast') || q.includes('chlorophyll') || q.includes('pigment') ||
    q.includes('calvin') || q.includes('stroma') || q.includes('sunlight to make') || q.includes('three things go into') ||
    q.includes('reactants required') || q.includes('gas do plants') || q.includes('byproduct into') || q.includes('raw reactants') || q.includes('equation for photosynthesis') ||
    q.includes('plant making food')
  ) {
    const isCO2 = q.includes('absorb') || q.includes('take in') || q.includes('carbon dioxide');
    const isO2 = q.includes('released') || q.includes('byproduct') || q.includes('release');
    const isChlorophyll = q.includes('green pigment') || q.includes('chlorophyll');
    const isStroma = q.includes('calvin') || q.includes('stroma');
    const isGlucose = q.includes('sunlight to make') || q.includes('sugar molecule') || q.includes('glucose');

    const co2Ans = pickOpt(['carbon dioxide', 'co2'], 'Carbon dioxide (CO2)');
    const o2Ans = pickOpt(['oxygen', 'o2'], 'Oxygen');
    const chlorophyllAns = pickOpt(['chlorophyll'], 'chlorophyll');
    const stromaAns = pickOpt(['stroma'], 'Stroma');
    const glucoseAns = pickOpt(['glucose', 'food'], 'food (sugar/glucose)');
    const threeAns = pickOpt(['sunlight', 'water'], 'sunlight, water, and carbon dioxide');

    let activeTarget = 'carbon dioxide + water + sunlight → glucose + oxygen';
    if (isCO2) activeTarget = co2Ans;
    else if (isO2) activeTarget = o2Ans;
    else if (isChlorophyll) activeTarget = chlorophyllAns;
    else if (isStroma) activeTarget = stromaAns;
    else if (isGlucose) activeTarget = glucoseAns;
    else if (q.includes('three things')) activeTarget = threeAns;

    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl border-2 border-[#dbe6ee] p-5 shadow-xs space-y-4 font-sans">
        <div className="flex items-center gap-2 text-emerald-700">
          <Activity className="w-5 h-5" />
          <h2 className="text-base font-extrabold">Chloroplast Photosynthesis Reaction & Gas Chamber</h2>
        </div>
        <p className="text-xs text-slate-600">
          Assemble the photosynthesis inputs and outputs by selecting the appropriate chemical component:
        </p>

        {/* Reaction Chamber */}
        <div className="p-4 bg-[#e8f5e9] border-2 border-[#2e7d32] rounded-2xl flex flex-col items-center space-y-3">
          <span className="text-xs font-black text-[#2e7d32] uppercase tracking-wider">Chloroplast Plant Factory</span>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-extrabold">
            <button
              type="button"
              onClick={() => handleSelect(co2Ans)}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                userAnswer.toLowerCase().includes('carbon') || userAnswer.toLowerCase().includes('co2')
                  ? 'bg-sky-600 text-white border-sky-700 scale-105'
                  : 'bg-white text-sky-800 border-sky-300 hover:bg-sky-50'
              }`}
            >
              💨 CO₂ (Carbon Dioxide In)
            </button>
            <span>+</span>
            <button
              type="button"
              onClick={() => handleSelect(threeAns)}
              className="px-3 py-1.5 bg-white text-blue-800 border border-blue-300 rounded-xl hover:bg-blue-50 cursor-pointer"
            >
              💧 H₂O (Water)
            </button>
            <span>+</span>
            <button
              type="button"
              onClick={() => handleSelect(chlorophyllAns)}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                userAnswer.toLowerCase().includes('chlorophyll')
                  ? 'bg-amber-500 text-white border-amber-600 scale-105'
                  : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
              }`}
            >
              ☀️ Sunlight & Chlorophyll
            </button>
            <span className="text-lg font-black text-emerald-700">➔</span>
            <button
              type="button"
              onClick={() => handleSelect(glucoseAns)}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                userAnswer.toLowerCase().includes('glucose') || userAnswer.toLowerCase().includes('food')
                  ? 'bg-amber-600 text-white border-amber-800 scale-105'
                  : 'bg-white text-amber-900 border-amber-400 hover:bg-amber-50'
              }`}
            >
              🍯 Glucose (C₆H₁₂O₆ Food)
            </button>
            <span>+</span>
            <button
              type="button"
              onClick={() => handleSelect(o2Ans)}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                userAnswer.toLowerCase().includes('oxygen') || userAnswer.toLowerCase().includes('o2')
                  ? 'bg-emerald-600 text-white border-emerald-800 scale-105'
                  : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              🌬️ O₂ (Oxygen Gas Out)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {isStroma && (
            <button
              type="button"
              onClick={() => handleSelect(stromaAns)}
              className="px-4 py-2 bg-emerald-700 text-white text-xs font-extrabold rounded-xl hover:bg-emerald-800 transition-all cursor-pointer"
            >
              ✓ Stroma (Fluid region of Calvin Cycle)
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSelect(activeTarget)}
            className="px-4 py-2 bg-[#2e7d32] text-white text-xs font-extrabold rounded-xl hover:bg-[#236326] transition-all cursor-pointer shadow-xs"
          >
            ✓ Confirm Reaction Component ({activeTarget})
          </button>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-900 font-medium">
          <strong>Photosynthesis Formula:</strong> 6CO₂ + 6H₂O + Light Energy ➔ C₆H₁₂O₆ (Glucose) + 6O₂ (Oxygen gas byproduct).
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 4. ECOSYSTEM FOOD WEB & TROPHIC DYNAMICS WORKSPACE (Q14, Q15, Q16, Q17, Q18, Q19, Q20)
  // ═════════════════════════════════════════════════════════════════════════
  if (
    q.includes('eats only plants') || q.includes('herbivore') || q.includes('food chain') || q.includes('food web') || q.includes('grasshoppers') ||
    q.includes('decomposers') || q.includes('rabbits') || q.includes('fox population') || q.includes('energy pyramid') || q.includes('10%') || q.includes('ecosystem')
  ) {
    const isHerbivore = q.includes('eats only plants') || q.includes('herbivore');
    const isSequence = q.includes('build a correct food chain');
    const isCascade = q.includes('grasshoppers disappeared') || q.includes('frog population');
    const isDecomposer = q.includes('decomposers') || q.includes('bacteria and fungi');
    const isFoxRabbit = q.includes('rabbits') || q.includes('fox population');
    const isPyramid = q.includes('energy pyramid') || q.includes('most energy');
    const isTenPct = q.includes('10%') || q.includes('90% go');

    const herbivoreAns = pickOpt(['herbivore'], 'Herbivore');
    const sequenceAns = 'Grass -> Rabbit -> Snake -> Hawk';
    const cascadeAns = pickOpt(['decrease', 'less food'], 'The frog population would decrease due to lack of food');
    const decomposerAns = pickOpt(['break down', 'nutrients'], 'they break down dead organisms and return nutrients to the soil');
    const foxAns = pickOpt(['decrease', 'food source'], 'The fox population would decrease because they lost a food source');
    const pyramidAns = pickOpt(['bottom', 'producers'], 'the bottom level — producers (grass)');
    const tenPctAns = pickOpt(['heat', 'metabolism'], 'the other 90% is lost as heat energy during life processes');

    let activeTarget = herbivoreAns;
    if (isSequence) activeTarget = sequenceAns;
    else if (isCascade) activeTarget = cascadeAns;
    else if (isDecomposer) activeTarget = decomposerAns;
    else if (isFoxRabbit) activeTarget = foxAns;
    else if (isPyramid) activeTarget = pyramidAns;
    else if (isTenPct) activeTarget = tenPctAns;

    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl border-2 border-[#dbe6ee] p-5 shadow-xs space-y-4 font-sans">
        <div className="flex items-center gap-2 text-emerald-800">
          <Compass className="w-5 h-5" />
          <h2 className="text-base font-extrabold">Ecosystem Food Web & Trophic Level Simulator</h2>
        </div>
        <p className="text-xs text-slate-600">
          Interact with the trophic levels and energy flow dynamics below:
        </p>

        {/* Dynamic Interactive Trophic View */}
        {isPyramid || isTenPct ? (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex flex-col items-center space-y-2">
            <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">Trophic Energy Pyramid (10% Rule)</span>
            <div className="w-full max-w-md space-y-1">
              <div className="p-2 bg-rose-100 border border-rose-300 text-center text-xs font-extrabold text-rose-900 rounded-lg">Apex Predator (0.1% Energy)</div>
              <div className="p-2 bg-amber-100 border border-amber-300 text-center text-xs font-extrabold text-amber-900 rounded-lg">Secondary Consumers (1% Energy)</div>
              <div className="p-2 bg-sky-100 border border-sky-300 text-center text-xs font-extrabold text-sky-900 rounded-lg">Primary Consumers / Herbivores (10% Energy)</div>
              <button
                type="button"
                onClick={() => handleSelect(pyramidAns)}
                className="w-full p-3 bg-emerald-600 text-white text-center text-xs font-extrabold rounded-lg hover:bg-emerald-700 cursor-pointer shadow-xs"
              >
                ★ Bottom Level: Primary Producers / Grass (100% Energy — MOST)
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[#f4f7f2] border-2 border-[#486730]/30 rounded-2xl flex flex-col items-center space-y-3">
            <span className="text-xs font-black text-[#2d471b] uppercase tracking-wider">Trophic Chain Dynamics</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="px-3 py-1.5 bg-emerald-100 border border-emerald-400 text-emerald-900 text-xs font-extrabold rounded-xl">🌿 Grass (Producer)</span>
              <span>➔</span>
              <button
                type="button"
                onClick={() => handleSelect(herbivoreAns)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                  isHerbivore ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400' : 'bg-white text-slate-800 border-slate-300'
                }`}
              >
                🐇 Rabbit (Herbivore)
              </button>
              <span>➔</span>
              <button
                type="button"
                onClick={() => handleSelect(foxAns)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                  isFoxRabbit ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400' : 'bg-white text-slate-800 border-slate-300'
                }`}
              >
                🦊 Fox (Predator)
              </button>
              <span>➔</span>
              <button
                type="button"
                onClick={() => handleSelect(decomposerAns)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                  isDecomposer ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-400' : 'bg-white text-slate-800 border-slate-300'
                }`}
              >
                🍄 Decomposer (Fungi)
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => handleSelect(activeTarget)}
            className="px-4 py-2 bg-emerald-800 text-white text-xs font-extrabold rounded-xl hover:bg-emerald-900 transition-all cursor-pointer shadow-xs"
          >
            ✓ Select Concept Answer ({activeTarget})
          </button>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-700 font-medium">
          <strong>Ecological Principle:</strong> Organisms depend on energy transfer up trophic levels; 90% of energy is expended as heat, leaving 10% for consumers.
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 5. HUMAN BODY SYSTEMS & IMMUNITY WORKSPACE (Q21, Q22, Q23, Q24, Q25)
  // ═════════════════════════════════════════════════════════════════════════
  if (
    q.includes('heart') || q.includes('pump blood') || q.includes('small intestine') || q.includes('organ labeled \'b\'') ||
    q.includes('lungs') || q.includes('breathe') || q.includes('antibody') || q.includes('antibodies') || q.includes('pathogen') || q.includes('vaccination') || q.includes('vaccine')
  ) {
    const isHeart = q.includes('heart') || q.includes('pump blood');
    const isGut = q.includes('small intestine') || q.includes('organ labeled \'b\'');
    const isLungs = q.includes('lungs') || q.includes('breathe');
    const isAntibody = q.includes('antibody') || q.includes('pathogen');
    const isVaccine = q.includes('vaccination') || q.includes('vaccine');

    const heartAns = pickOpt(['pump blood'], 'Pump blood around the body');
    const gutAns = pickOpt(['small intestine'], 'small intestine');
    const lungsAns = pickOpt(['breathe in oxygen'], 'breathe in oxygen; breathe out carbon dioxide');
    const antibodyAns = pickOpt(['destroy specific pathogens', 'pathogens'], 'Recognise and help destroy specific pathogens (germs)');
    const vaccineAns = pickOpt(['weakened', 'memory', 'antibodies'], 'A vaccine introduces a weakened pathogen to create memory B-cells');

    let activeTarget = heartAns;
    if (isGut) activeTarget = gutAns;
    else if (isLungs) activeTarget = lungsAns;
    else if (isAntibody) activeTarget = antibodyAns;
    else if (isVaccine) activeTarget = vaccineAns;

    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl border-2 border-[#dbe6ee] p-5 shadow-xs space-y-4 font-sans">
        <div className="flex items-center gap-2 text-rose-700">
          <Heart className="w-5 h-5" />
          <h2 className="text-base font-extrabold">Human Physiology & Immune Response Simulator</h2>
        </div>
        <p className="text-xs text-slate-600">
          Interact with organ systems and immune defense mechanisms:
        </p>

        {isAntibody || isVaccine ? (
          <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-2xl flex flex-col items-center space-y-3">
            <span className="text-xs font-black text-purple-900 uppercase tracking-wider">Immune Y-Antibody & Antigen Receptor Lock</span>
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-purple-200">
              <span className="text-3xl">🦠</span>
              <div className="text-xs">
                <span className="font-extrabold text-rose-800 block">Pathogen with Antigens</span>
                <span className="text-[10px] text-slate-500">Y-Antibodies lock onto surface markers to destroy germs</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSelect(activeTarget)}
              className="px-4 py-2 bg-purple-700 text-white text-xs font-extrabold rounded-xl hover:bg-purple-800 cursor-pointer shadow-xs"
            >
              ✓ Activate Immune Binding Response
            </button>
          </div>
        ) : (
          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-col items-center space-y-3">
            <span className="text-xs font-black text-rose-900 uppercase tracking-wider">Organ System Function Interactive</span>
            <div className="grid grid-cols-3 gap-2 w-full">
              <button
                type="button"
                onClick={() => handleSelect(heartAns)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isHeart ? 'bg-rose-600 text-white border-rose-700 font-extrabold scale-105' : 'bg-white text-rose-900 border-rose-200'
                }`}
              >
                🫀 Heart (Pumps Blood)
              </button>
              <button
                type="button"
                onClick={() => handleSelect(gutAns)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isGut ? 'bg-amber-600 text-white border-amber-700 font-extrabold scale-105' : 'bg-white text-amber-900 border-amber-200'
                }`}
              >
                🪱 Small Intestine (Absorbs Nutrients)
              </button>
              <button
                type="button"
                onClick={() => handleSelect(lungsAns)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isLungs ? 'bg-sky-600 text-white border-sky-700 font-extrabold scale-105' : 'bg-white text-sky-900 border-sky-200'
                }`}
              >
                🫁 Lungs (O₂ / CO₂ Gas Exchange)
              </button>
            </div>
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-700 font-medium">
          <strong>Physiological Principle:</strong> Human body systems maintain homeostasis by coordinating blood transport, nutrient absorption, and immune memory defenses.
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 6. DNA DOUBLE HELIX & PUNNETT SQUARE GENETICS LAB WORKSPACE (QB13..18, QB24)
  // ═════════════════════════════════════════════════════════════════════════
  if (
    q.includes('dna') || q.includes('base pair') || q.includes('adenine') || q.includes('guanine') || q.includes('thymine') || q.includes('cytosine') || q.includes('double-helix') || q.includes('double helix') ||
    q.includes('punnett') || q.includes('dominant') || q.includes('allele') || q.includes('chromosome') || q.includes('46') || q.includes('mendel') || q.includes('genetics')
  ) {
    const isAdenine = q.includes('adenine');
    const isGuanine = q.includes('guanine');
    const isPunnett = q.includes('punnett');
    const isDominant = q.includes('dominant');
    const isChr = q.includes('46') || q.includes('chromosome');
    const isMendel = q.includes('mendel') || q.includes('pea plant');

    const dnaAns = pickOpt(['dna'], 'DNA');
    const tAns = pickOpt(['thymine'], 'Thymine (T)');
    const cAns = pickOpt(['cytosine'], 'Cytosine');
    const punnettAns = pickOpt(['punnett'], 'Punnett square');
    const domAns = pickOpt(['dominant'], 'Dominant');
    const chrAns = pickOpt(['46'], '46');
    const mendelAns = pickOpt(['mendel'], 'Gregor Mendel');

    let activeTarget = dnaAns;
    if (isAdenine) activeTarget = tAns;
    else if (isGuanine) activeTarget = cAns;
    else if (isPunnett) activeTarget = punnettAns;
    else if (isDominant) activeTarget = domAns;
    else if (isChr) activeTarget = chrAns;
    else if (isMendel) activeTarget = mendelAns;

    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl border-2 border-[#dbe6ee] p-5 shadow-xs space-y-4 font-sans">
        <div className="flex items-center gap-2 text-[#32617d]">
          <Dna className="w-5 h-5" />
          <h2 className="text-base font-extrabold">DNA Double Helix & Genetics Cross Laboratory</h2>
        </div>
        <p className="text-xs text-slate-600">
          Perform nitrogenous base-pairing or genetic cross prediction below:
        </p>

        <div className="p-4 bg-[#e8f0fe] border-2 border-[#32617d] rounded-2xl flex flex-col items-center space-y-3">
          {isPunnett ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-black text-[#32617d]">2x2 Allele Grid (Bb × Bb)</span>
              <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-[#32617d]">
                <div className="p-2 bg-blue-100 font-black text-center text-xs">BB</div>
                <div className="p-2 bg-blue-100 font-black text-center text-xs">Bb</div>
                <div className="p-2 bg-blue-100 font-black text-center text-xs">Bb</div>
                <div className="p-2 bg-slate-100 font-black text-center text-xs">bb</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-[#32617d]/30 w-full max-w-md justify-between">
              <div className="px-3 py-1.5 bg-rose-500 text-white text-xs font-black rounded-lg">
                {isGuanine ? 'Guanine (G)' : 'Adenine (A)'}
              </div>
              <div className="text-xs font-black text-slate-400">══ Hydrogen Bonds ══</div>
              <button
                type="button"
                onClick={() => handleSelect(activeTarget)}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-extrabold rounded-lg hover:bg-emerald-700 cursor-pointer"
              >
                {isGuanine ? 'Cytosine (C)' : isAdenine ? 'Thymine (T)' : 'DNA Strand'}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleSelect(activeTarget)}
            className="px-4 py-2 bg-[#32617d] text-white text-xs font-extrabold rounded-xl hover:bg-[#25495e] cursor-pointer shadow-xs"
          >
            ✓ Confirm Answer ({activeTarget})
          </button>
        </div>

        <div className="p-3 bg-[#e8f0fe] border border-blue-200 rounded-xl text-center text-xs text-[#32617d] font-medium">
          <strong>Genetics Rule:</strong> DNA complementary pairing follows A=T (2 bonds) and G≡C (3 bonds); human somatic cells possess 46 chromosomes (23 pairs).
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 7. CELLULAR RESPIRATION ATP YIELD & PATHWAY WORKSPACE (QB19, QB20, QB21)
  // ═════════════════════════════════════════════════════════════════════════
  if (
    q.includes('glycolysis') || q.includes('krebs') || q.includes('electron transport') || q.includes('cellular respiration') || (q.includes('respiration') && q.includes('atp'))
  ) {
    const isGlycolysis = q.includes('glycolysis') || q.includes('first step');
    const isETC = q.includes('electron transport') || q.includes('greatest amount');

    const atpAns = pickOpt(['atp'], 'ATP');
    const cytoAns = pickOpt(['cytoplasm'], 'Cytoplasm');
    const etcAns = pickOpt(['electron transport'], 'Electron Transport Chain');

    let activeTarget = atpAns;
    if (isGlycolysis) activeTarget = cytoAns;
    else if (isETC) activeTarget = etcAns;

    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl border-2 border-[#dbe6ee] p-5 shadow-xs space-y-4 font-sans">
        <div className="flex items-center gap-2 text-amber-700">
          <Zap className="w-5 h-5" />
          <h2 className="text-base font-extrabold">Cellular Respiration ATP Yield & Pathway Matrix</h2>
        </div>
        <p className="text-xs text-slate-600">
          Inspect the cellular respiration stages and energy yields below:
        </p>

        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col items-center space-y-3">
          <div className="w-full space-y-2">
            <div className="p-2 bg-white border border-amber-300 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Step 1: Glycolysis (Cytoplasm)</span>
              <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-black">2 ATP</span>
            </div>
            <div className="p-2 bg-white border border-amber-300 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Step 2: Krebs Cycle (Mitochondrial Matrix)</span>
              <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-black">2 ATP</span>
            </div>
            <button
              type="button"
              onClick={() => handleSelect(activeTarget)}
              className="w-full p-2.5 bg-amber-600 text-white rounded-xl flex items-center justify-between text-xs font-black hover:bg-amber-700 cursor-pointer shadow-xs"
            >
              <span>Step 3: Electron Transport Chain (Inner Membrane) ★ GREATEST</span>
              <span className="px-2 py-0.5 bg-amber-800 text-white rounded font-black">32-34 ATP ⚡</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSelect(activeTarget)}
            className="px-4 py-2 bg-amber-700 text-white text-xs font-extrabold rounded-xl hover:bg-amber-800 cursor-pointer"
          >
            ✓ Select Stage/Energy Molecule ({activeTarget})
          </button>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-900 font-medium">
          <strong>Respiration Principle:</strong> Glycolysis occurs in cytoplasm (2 ATP); Electron Transport Chain in mitochondria yields the bulk of cellular ATP (32-34 ATP).
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 8. ALGEBRA BALANCE SCALE & GEOMETRIC GRID WORKSPACE (Q26, Q27, Q28, Q29, Q30)
  // ═════════════════════════════════════════════════════════════════════════
  if (
    tag === 'algebra' || tag === 'geometry' || q.includes('solve for') || q.includes('equation') || q.includes('3x =') || q.includes('2y -') || q.includes('area') || q.includes('perimeter') || q.includes('rectangle') || q.includes('square')
  ) {
    const isAlg1 = q.includes('x + 7 = 15');
    const isAlg2 = q.includes('3x = 21');
    const isAlg3 = q.includes('2y - 4 = 10');
    const isGeomArea = q.includes('area') || q.includes('8 cm');
    const isGeomPerim = q.includes('perimeter') || q.includes('square');

    let targetAns = '8';
    if (isAlg2 || isAlg3) targetAns = '7';
    if (isGeomArea) targetAns = pickOpt(['40'], '40 sq cm');
    if (isGeomPerim) targetAns = pickOpt(['24'], '24 meters');

    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl border-2 border-[#dbe6ee] p-5 shadow-xs space-y-4 font-sans">
        <div className="flex items-center gap-2 text-amber-700">
          <Scale className="w-5 h-5" />
          <h2 className="text-base font-extrabold">
            {tag === 'geometry' ? 'Geometric Measurement & Unit Grid Explorer' : 'Algebraic Balance Scale & Inverse Operations'}
          </h2>
        </div>

        {isGeomArea ? (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col items-center space-y-3">
            <span className="text-xs font-extrabold text-amber-900">Rectangle Area = Length (8 cm) × Width (5 cm)</span>
            <div className="grid grid-cols-8 gap-1 p-2 bg-white border border-amber-300 rounded-xl">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="w-4 h-4 bg-amber-200 border border-amber-400 rounded-xs flex items-center justify-center text-[7px] font-bold text-amber-900">
                  {i + 1}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleSelect(targetAns)}
              className="px-4 py-2 bg-amber-600 text-white text-xs font-extrabold rounded-xl hover:bg-amber-700 cursor-pointer shadow-xs"
            >
              ✓ Calculate Area: 8 × 5 = 40 sq cm
            </button>
          </div>
        ) : (
          <div className="p-4 bg-[#e8f0fe] border-2 border-[#32617d] rounded-2xl flex flex-col items-center space-y-3">
            <span className="text-xs font-black text-[#32617d] uppercase tracking-wider">Maintain Balance on Both Sides</span>

            <div className="flex items-center gap-4">
              <div className="p-3 bg-white border-2 border-[#32617d] rounded-xl text-center min-w-[100px]">
                <span className="text-lg font-black text-[#32617d]">{isAlg1 ? 'x + 7' : isAlg2 ? '3x' : '2y - 4'}</span>
                <span className="text-[9px] text-slate-500 block">Left Pan</span>
              </div>
              <span className="text-2xl font-black text-amber-600">=</span>
              <div className="p-3 bg-white border-2 border-amber-400 rounded-xl text-center min-w-[100px]">
                <span className="text-lg font-black text-amber-800">{isAlg1 ? '15' : isAlg2 ? '21' : '10'}</span>
                <span className="text-[9px] text-slate-500 block">Right Pan</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSelect(targetAns)}
              className="px-4 py-2 bg-[#32617d] text-white text-xs font-extrabold rounded-xl hover:bg-[#25495e] cursor-pointer shadow-xs"
            >
              ✓ Perform Inverse Operation ➔ Isolate Variable ({targetAns})
            </button>
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-700 font-medium">
          <strong>Mathematical Principle:</strong> Equality requires applying identical inverse operations to both sides of an algebraic balance.
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 9. US HISTORY & CIVICS INTERACTIVE TIMELINE & CONSTITUTIONAL MAP (Q31..34)
  // ═════════════════════════════════════════════════════════════════════════
  if (
    subj === 'us_history' || tag === 'revolution' || tag === 'civics' || q.includes('declaration') || q.includes('jefferson') || q.includes('1776') || q.includes('branches') || q.includes('legislative') || q.includes('constitution') || q.includes('congress')
  ) {
    const isYear = q.includes('1776') || q.includes('adopted');
    const isJefferson = q.includes('author') || q.includes('jefferson');
    const isBranches = q.includes('how many branches') || q.includes('3');
    const isLegislative = q.includes('making laws') || q.includes('legislative');

    const yearAns = pickOpt(['1776'], '1776');
    const jeffersonAns = pickOpt(['jefferson'], 'Thomas Jefferson');
    const branchAns = pickOpt(['3'], '3');
    const legAns = pickOpt(['legislative', 'congress'], 'Legislative branch (Congress)');

    let activeTarget = yearAns;
    if (isJefferson) activeTarget = jeffersonAns;
    else if (isBranches) activeTarget = branchAns;
    else if (isLegislative) activeTarget = legAns;

    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl border-2 border-[#dbe6ee] p-5 shadow-xs space-y-4 font-sans">
        <div className="flex items-center gap-2 text-blue-900">
          <Landmark className="w-5 h-5" />
          <h2 className="text-base font-extrabold">US History & Constitutional Structure Map</h2>
        </div>
        <p className="text-xs text-slate-600">
          Explore historical milestones and constitutional government branches:
        </p>

        <div className="p-4 bg-slate-50 border-2 border-blue-300 rounded-2xl flex flex-col items-center space-y-3">
          {isBranches || isLegislative ? (
            <div className="grid grid-cols-3 gap-2 w-full">
              <button
                type="button"
                onClick={() => handleSelect(legAns)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isLegislative ? 'bg-blue-800 text-white border-blue-900 font-extrabold scale-105' : 'bg-white text-blue-900 border-blue-200'
                }`}
              >
                📜 Legislative (Congress makes laws)
              </button>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-center text-xs font-bold text-slate-600">
                🏛️ Executive (President enforces laws)
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-center text-xs font-bold text-slate-600">
                ⚖️ Judicial (Supreme Court interprets)
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-blue-200 w-full justify-between">
              <span className="text-xs font-extrabold text-blue-900">Declaration of Independence (1776)</span>
              <button
                type="button"
                onClick={() => handleSelect(activeTarget)}
                className="px-3 py-1.5 bg-blue-800 text-white text-xs font-black rounded-lg hover:bg-blue-900 cursor-pointer"
              >
                ✓ Select ({activeTarget})
              </button>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-700 font-medium">
          <strong>Civic Foundation:</strong> The US Constitution establishes 3 co-equal branches (Legislative, Executive, Judicial) to enforce separation of powers.
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 10. DYNAMIC CONCEPT WORKSPACE (Fallback for any future non-seed task)
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl border-2 border-[#dbe6ee] p-5 shadow-xs space-y-4 font-sans">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#32617d]/10 text-[#32617d] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#1a1c19] tracking-tight leading-snug">
            {questionText}
          </h2>
          {promptText && <p className="text-xs text-slate-500 font-medium mt-0.5">{promptText}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {optionsList.map((opt, idx) => {
          const isSelected = userAnswer === opt;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(opt)}
              className={`group relative text-left p-4 rounded-2xl border-2 transition-all duration-150 transform active:scale-[0.98] cursor-pointer flex flex-col justify-between min-h-[84px] ${
                isSelected
                  ? 'border-[#32617d] bg-[#f0f6fa] shadow-sm ring-2 ring-[#32617d]/20'
                  : 'border-[#e4e4dd] bg-[#fafaf7] hover:border-[#32617d] hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-extrabold text-slate-400 group-hover:text-[#32617d]">
                  Concept Option {idx + 1}
                </span>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'border-[#32617d] bg-[#32617d] text-white scale-110' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
              <span className="text-sm sm:text-base font-bold text-[#1a1c19] mt-2 block">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
