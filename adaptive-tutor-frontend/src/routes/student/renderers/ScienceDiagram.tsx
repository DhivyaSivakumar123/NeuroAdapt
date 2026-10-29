import React from 'react';

interface ScienceDiagramProps {
  questionText: string;
  passageText?: string;
  onSelectPin?: (pinAnswer: string) => void;
  skillTag?: string;
  subject?: string;
  imageUrl?: string;
}

export const ScienceDiagram: React.FC<ScienceDiagramProps> = ({
  questionText,
  passageText,
  onSelectPin,
  skillTag,
  subject,
  imageUrl,
}) => {
  if (imageUrl) {
    const fullSrc = imageUrl.startsWith('/') ? `http://localhost:8000${imageUrl}` : imageUrl;
    return (
      <div className="w-full flex flex-col items-center justify-center p-2">
        <img
          src={fullSrc}
          alt={questionText || "Problem Diagram"}
          className="max-h-[350px] w-auto max-w-full object-contain rounded-xl border border-slate-200 shadow-sm"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  const q = (questionText + ' ' + (passageText || '')).toLowerCase();

  const tag = (skillTag || '').toLowerCase();
  const pin = (answer: string) => onSelectPin && onSelectPin(answer);

  // ════════════════════════════════════════════════════════
  //  QUESTION-SPECIFIC ROUTING
  //  Each condition targets the exact language of a real task.
  //  More-specific checks come first.
  // ════════════════════════════════════════════════════════

  // ── "basic unit of life" ─────────────────────────────────
  if (q.includes('basic unit of life')) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Levels of Biological Organization</span>
        <div className="flex items-center gap-3 justify-center w-full">
          <button type="button" onClick={() => pin('cell')} className="flex flex-col items-center p-3 bg-[#e8f5e9] border-2 border-[#2e7d32] rounded-2xl cursor-pointer hover:scale-105 transition-all text-center">
            <span className="text-3xl">🧫</span>
            <span className="text-xs font-extrabold text-[#2e7d32] mt-0.5">Cell</span>
            <span className="text-[9px] font-bold text-emerald-700">★ Basic Unit of Life</span>
          </button>
          <span className="text-slate-400 font-bold">➔</span>
          <button type="button" onClick={() => pin('tissue')} className="flex flex-col items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:scale-105 transition-all text-center opacity-70">
            <span className="text-xl">🥩</span>
            <span className="text-[10px] font-bold text-slate-600">Tissue</span>
          </button>
          <span className="text-slate-400 font-bold">➔</span>
          <button type="button" onClick={() => pin('organ')} className="flex flex-col items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:scale-105 transition-all text-center opacity-70">
            <span className="text-xl">🫀</span>
            <span className="text-[10px] font-bold text-slate-600">Organ</span>
          </button>
        </div>
      </div>
    );
  }

  // ── "control center" / "nucleus" ────────────────────────
  if (q.includes('control center') || (q.includes('nucleus') && !q.includes('nucleotide') && !q.includes('chromosom'))) {
    return (
      <svg viewBox="0 0 380 185" className="w-full max-w-md h-auto select-none" aria-label="Cell — Nucleus highlighted">
        {/* Cell outline */}
        <ellipse cx="190" cy="95" rx="165" ry="78" fill="#e8f5e9" stroke="#486730" strokeWidth="2.5" strokeDasharray="4 2" />
        {/* Cytoplasm fill */}
        <ellipse cx="190" cy="95" rx="155" ry="70" fill="#d7eedc" fillOpacity="0.6" />
        {/* Nucleus — prominent & glowing */}
        <circle cx="190" cy="92" r="44" fill="#32617d" fillOpacity="0.15" stroke="#32617d" strokeWidth="2.5" strokeDasharray="3 2" />
        <circle cx="190" cy="92" r="36" fill="#32617d" fillOpacity="0.9" stroke="#1d4358" strokeWidth="2.5" />
        <circle cx="190" cy="92" r="15" fill="#679ab9" />
        <text x="190" y="96" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">Nucleus</text>
        {/* Mitochondria faded */}
        <ellipse cx="310" cy="65" rx="16" ry="8" fill="#e07a5f" fillOpacity="0.4" transform="rotate(15 310 65)" />
        <ellipse cx="310" cy="120" rx="18" ry="9" fill="#e07a5f" fillOpacity="0.4" transform="rotate(-20 310 120)" />
        {/* Pin */}
        <g className="cursor-pointer group" onClick={() => pin('nucleus')}>
          <line x1="190" y1="56" x2="190" y2="26" stroke="#1a1c19" strokeWidth="1.5" />
          <circle cx="190" cy="22" r="14" fill="#32617d" stroke="#fff" strokeWidth="2" className="transition-transform group-hover:scale-125" />
          <text x="190" y="26" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">A</text>
          <text x="210" y="22" fill="#1a1c19" fontSize="11" fontWeight="bold">Control Center</text>
        </g>
        <g className="cursor-pointer group" onClick={() => pin('cell membrane')}>
          <line x1="42" y1="88" x2="22" y2="88" stroke="#1a1c19" strokeWidth="1.5" />
          <circle cx="18" cy="88" r="12" fill="#486730" stroke="#fff" strokeWidth="2" className="transition-transform group-hover:scale-125" />
          <text x="18" y="92" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">B</text>
          <text x="18" y="108" fill="#1a1c19" fontSize="9" fontWeight="bold" textAnchor="middle">Membrane</text>
        </g>
      </svg>
    );
  }

  // ── "generates ATP" / "mitochondria" / "powerhouse" ─────
  if (q.includes('mitochondria') || q.includes('powerhouse') || (q.includes('atp') && (q.includes('generat') || q.includes('energy') || q.includes('organelle')) && !q.includes('respir') && !q.includes('glycol'))) {
    return (
      <svg viewBox="0 0 360 180" className="w-full max-w-md h-auto select-none" aria-label="Mitochondria close-up">
        {/* Outer membrane */}
        <ellipse cx="180" cy="90" rx="150" ry="70" fill="#fff3e0" stroke="#e65100" strokeWidth="2.5" />
        {/* Inner membrane (cristae) */}
        <ellipse cx="180" cy="90" rx="120" ry="52" fill="#ffe0b2" stroke="#ef6c00" strokeWidth="2" />
        {/* Cristae folds */}
        {[40, 70, 100, 130, 160].map((x, i) => (
          <line key={i} x1={x + 60} y1="58" x2={x + 60} y2="122" stroke="#ef6c00" strokeWidth="1.5" strokeDasharray="4 3" />
        ))}
        <text x="180" y="80" fill="#bf360c" fontSize="11" fontWeight="bold" textAnchor="middle">Mitochondrial</text>
        <text x="180" y="94" fill="#bf360c" fontSize="11" fontWeight="bold" textAnchor="middle">Matrix (ATP)</text>
        {/* ATP badges */}
        {[130, 180, 230].map((x, i) => (
          <g key={i} className="cursor-pointer group" onClick={() => pin('mitochondria')}>
            <rect x={x - 14} y="106" width="28" height="16" rx="5" fill="#ff6f00" />
            <text x={x} y="118" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">ATP ⚡</text>
          </g>
        ))}
        {/* Label pin */}
        <g className="cursor-pointer group" onClick={() => pin('mitochondria')}>
          <line x1="335" y1="90" x2="305" y2="90" stroke="#1a1c19" strokeWidth="1.5" />
          <circle cx="348" cy="90" r="13" fill="#e65100" stroke="#fff" strokeWidth="2" className="transition-transform group-hover:scale-125" />
          <text x="348" y="94" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">A</text>
        </g>
        <text x="180" y="162" fill="#bf360c" fontSize="11" fontWeight="bold" textAnchor="middle">Mitochondria — ATP Factory</text>
      </svg>
    );
  }

  // ── "plant cells but absent in animal cells" / "cell wall" ──
  if (
    (q.includes('plant') && q.includes('animal') && (q.includes('absent') || q.includes('not have') || q.includes('present'))) ||
    (q.includes('plant cell') && (q.includes('present') || q.includes('have something'))) ||
    (q.includes('cell wall') && (q.includes('absent') || q.includes('present') || q.includes('carbohydrate') || q.includes('cellulose') || q.includes('rigid')))
  ) {
    return (
      <div className="w-full flex items-center justify-around py-2 max-w-md gap-3">
        {/* Plant cell */}
        <button type="button" onClick={() => pin('Cell Wall')} className="flex-1 flex flex-col items-center cursor-pointer hover:scale-105 transition-all">
          <svg viewBox="0 0 160 140" className="w-full max-w-[140px] h-auto">
            <rect x="8" y="8" width="144" height="124" rx="14" fill="#e8f5e9" stroke="#2e7d32" strokeWidth="5" />
            <rect x="18" y="18" width="124" height="104" rx="9" fill="#c8e6c9" stroke="#43a047" strokeWidth="2" strokeDasharray="3 2" />
            <ellipse cx="105" cy="60" rx="30" ry="20" fill="#e1f5fe" stroke="#0288d1" strokeWidth="1.5" />
            <circle cx="55" cy="55" r="18" fill="#32617d" stroke="#1d4358" strokeWidth="2" />
            <ellipse cx="48" cy="105" rx="12" ry="7" fill="#2e7d32" />
            <ellipse cx="75" cy="112" rx="12" ry="7" fill="#2e7d32" />
            <text x="80" y="135" fill="#2e7d32" fontSize="10" fontWeight="bold" textAnchor="middle">Plant Cell</text>
          </svg>
          <span className="text-[10px] font-extrabold text-emerald-700 mt-1">✓ Has Cell Wall</span>
        </button>

        <span className="text-xl font-black text-slate-300">vs</span>

        {/* Animal cell */}
        <button type="button" onClick={() => pin('No Cell Wall')} className="flex-1 flex flex-col items-center cursor-pointer hover:scale-105 transition-all">
          <svg viewBox="0 0 160 140" className="w-full max-w-[140px] h-auto">
            <ellipse cx="80" cy="68" rx="68" ry="56" fill="#fce4ec" stroke="#c62828" strokeWidth="3" strokeDasharray="4 2" />
            <ellipse cx="80" cy="68" rx="58" ry="47" fill="#ffcdd2" fillOpacity="0.6" />
            <circle cx="65" cy="60" r="18" fill="#32617d" stroke="#1d4358" strokeWidth="2" />
            <ellipse cx="115" cy="52" rx="13" ry="7" fill="#e07a5f" transform="rotate(15 115 52)" />
            <ellipse cx="118" cy="80" rx="14" ry="7" fill="#e07a5f" transform="rotate(-20 118 80)" />
            <text x="80" y="135" fill="#c62828" fontSize="10" fontWeight="bold" textAnchor="middle">Animal Cell</text>
          </svg>
          <span className="text-[10px] font-extrabold text-rose-700 mt-1">✗ No Cell Wall</span>
        </button>
      </div>
    );
  }

  // ── "cytoplasm" / "jelly-like substance" / labeled 'A' ────
  if (q.includes('cytoplasm') || q.includes('jelly-like') || q.includes('labeled \'a\'') || q.includes('fills the cell')) {
    return (
      <svg viewBox="0 0 360 175" className="w-full max-w-md h-auto select-none" aria-label="Cell — Cytoplasm highlighted">
        <ellipse cx="180" cy="90" rx="155" ry="72" fill="#e8f5e9" stroke="#486730" strokeWidth="2.5" strokeDasharray="4 2" />
        {/* Cytoplasm — shaded distinctively */}
        <ellipse cx="180" cy="90" rx="145" ry="65" fill="#b2dfdb" fillOpacity="0.7" />
        <text x="180" y="155" fill="#00695c" fontSize="10" fontWeight="bold" textAnchor="middle">Cytoplasm (jelly-like fluid)</text>
        {/* Nucleus faded */}
        <circle cx="145" cy="82" r="28" fill="#32617d" fillOpacity="0.7" stroke="#1d4358" strokeWidth="2" />
        <circle cx="145" cy="82" r="12" fill="#679ab9" />
        {/* Organelles in cytoplasm */}
        <ellipse cx="255" cy="68" rx="16" ry="9" fill="#e07a5f" transform="rotate(15 255 68)" />
        <ellipse cx="260" cy="108" rx="17" ry="9" fill="#e07a5f" transform="rotate(-20 260 108)" />
        <circle cx="100" cy="115" r="7" fill="#81b29a" />
        {/* Annotation pin */}
        <g className="cursor-pointer group" onClick={() => pin('cytoplasm')}>
          <line x1="230" y1="92" x2="270" y2="130" stroke="#1a1c19" strokeWidth="1.5" />
          <circle cx="275" cy="135" r="13" fill="#00695c" stroke="#fff" strokeWidth="2" className="transition-transform group-hover:scale-125" />
          <text x="275" y="139" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">A</text>
        </g>
      </svg>
    );
  }

  // ── "ribosome" / "protein synthesis" ────────────────────
  if (q.includes('ribosome') || q.includes('protein synth') || q.includes('synthesizing protein')) {
    return (
      <div className="w-full flex flex-col items-center gap-3 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Protein Synthesis at Ribosome</span>
        <div className="flex items-center gap-3 w-full justify-center">
          {/* mRNA thread */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-xl">🧵</div>
            <span className="text-[9px] font-bold text-slate-500">mRNA strand</span>
            <div className="flex gap-0.5 mt-1">
              {['AUG', 'GCU', 'UAA'].map(codon => (
                <span key={codon} className="px-1 py-0.5 bg-amber-100 border border-amber-300 text-[8px] font-bold text-amber-900 rounded">{codon}</span>
              ))}
            </div>
          </div>
          {/* Ribosome */}
          <button type="button" onClick={() => pin('ribosome')}
            className="flex flex-col items-center p-3 bg-[#e8f5e9] border-2 border-[#2e7d32] rounded-2xl cursor-pointer hover:scale-105 transition-all text-center">
            <span className="text-3xl">🔩</span>
            <span className="text-xs font-extrabold text-[#2e7d32] mt-0.5">Ribosome</span>
            <span className="text-[9px] text-slate-500">Reads mRNA</span>
          </button>
          {/* Output */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-xl">🧬</div>
            <span className="text-[9px] font-bold text-slate-500">Polypeptide</span>
            <span className="text-[9px] font-bold text-emerald-700">= Protein</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-center mt-1">
          {[['Free ribosome', 'cytoplasm'], ['Rough ER ribosome', 'rough ER'], ['Ribosome output', 'protein']].map(([label, ans]) => (
            <button key={label} type="button" onClick={() => pin(ans)}
              className="px-2.5 py-1 bg-[#e8f5e9] border border-emerald-300 text-[10px] font-bold text-emerald-800 rounded-lg cursor-pointer hover:scale-105 transition-all">
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── "plasma membrane" / "regulates what enters" ─────────
  if (q.includes('plasma membrane') || q.includes('what enters') || q.includes('selective') || (q.includes('membrane') && q.includes('function'))) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Plasma Membrane — Selective Permeability</span>
        <svg viewBox="0 0 340 120" className="w-full max-w-sm h-auto">
          {/* Membrane bilayer */}
          <rect x="20" y="50" width="300" height="20" rx="4" fill="#e3f2fd" stroke="#1565c0" strokeWidth="2" />
          {/* Phospholipid heads (top) */}
          {Array.from({ length: 12 }).map((_, i) => (
            <circle key={`t${i}`} cx={32 + i * 25} cy="50" r="6" fill="#1565c0" opacity="0.7" />
          ))}
          {/* Phospholipid heads (bottom) */}
          {Array.from({ length: 12 }).map((_, i) => (
            <circle key={`b${i}`} cx={32 + i * 25} cy="70" r="6" fill="#1565c0" opacity="0.7" />
          ))}
          {/* Arrows showing selective passage */}
          <text x="80" y="35" fill="#2e7d32" fontSize="11" fontWeight="bold" textAnchor="middle">O₂ ✓</text>
          <path d="M80 38 L80 48" stroke="#2e7d32" strokeWidth="2" markerEnd="url(#arr)" />
          <text x="170" y="35" fill="#c62828" fontSize="11" fontWeight="bold" textAnchor="middle">Na⁺ ✗</text>
          <text x="260" y="35" fill="#2e7d32" fontSize="11" fontWeight="bold" textAnchor="middle">H₂O ✓</text>
          <path d="M260 38 L260 48" stroke="#2e7d32" strokeWidth="2" />
          <text x="170" y="105" fill="#1565c0" fontSize="10" fontWeight="bold" textAnchor="middle">Plasma Membrane (Phospholipid Bilayer)</text>
        </svg>
        <div className="flex gap-2 flex-wrap justify-center">
          {[['Regulates entry/exit', 'regulates what enters and leaves the cell'], ['Selective barrier', 'selective barrier'], ['Controls transport', 'controls transport']].map(([label, ans]) => (
            <button key={label} type="button" onClick={() => pin(ans)}
              className="px-2.5 py-1 bg-[#e3f2fd] border border-blue-300 text-[10px] font-bold text-blue-800 rounded-lg cursor-pointer hover:scale-105 transition-all">
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── "chlorophyll" / "green pigment" ─────────────────────
  if (q.includes('chlorophyll') || q.includes('green pigment') || (q.includes('pigment') && q.includes('sunlight'))) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Chlorophyll inside Chloroplast Thylakoids</span>
        <svg viewBox="0 0 340 150" className="w-full max-w-sm h-auto">
          {/* Chloroplast outline */}
          <ellipse cx="170" cy="80" rx="145" ry="58" fill="#e8f5e9" stroke="#2e7d32" strokeWidth="2.5" />
          {/* Thylakoid stacks (grana) */}
          {[60, 120, 180, 240].map((x, i) => (
            <g key={i}>
              {[0, 12, 24].map(dy => (
                <ellipse key={dy} cx={x} cy={70 + dy} rx="22" ry="7" fill="#43a047" stroke="#1b5e20" strokeWidth="1.2" />
              ))}
            </g>
          ))}
          {/* Sunlight arrow */}
          <text x="52" y="22" fill="#f57c00" fontSize="12" fontWeight="bold">☀️</text>
          <path d="M65 25 L95 55" stroke="#f57c00" strokeWidth="2.5" strokeDasharray="4 2" markerEnd="url(#sarr)" />
          {/* Chlorophyll label */}
          <text x="170" y="135" fill="#1b5e20" fontSize="10" fontWeight="bold" textAnchor="middle">Chlorophyll (green) absorbs sunlight</text>
        </svg>
        <div className="flex gap-2 flex-wrap justify-center">
          {[['Chlorophyll', 'chlorophyll'], ['Thylakoid', 'thylakoid'], ['Granum', 'granum']].map(([label, ans]) => (
            <button key={label} type="button" onClick={() => pin(ans)}
              className="px-2.5 py-1 bg-[#e8f5e9] border border-emerald-300 text-[10px] font-bold text-emerald-800 rounded-lg cursor-pointer hover:scale-105 transition-all">
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── "Calvin cycle" / "stroma" ────────────────────────────
  if (q.includes('calvin') || q.includes('stroma') || (q.includes('chloroplast') && q.includes('takes place'))) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Chloroplast Cross-Section</span>
        <svg viewBox="0 0 340 160" className="w-full max-w-sm h-auto">
          {/* Outer membrane */}
          <ellipse cx="170" cy="82" rx="145" ry="62" fill="#e8f5e9" stroke="#2e7d32" strokeWidth="2.5" />
          {/* Stroma region */}
          <ellipse cx="170" cy="82" rx="130" ry="52" fill="#c8e6c9" />
          <text x="250" y="88" fill="#1b5e20" fontSize="10" fontWeight="bold">Stroma</text>
          <text x="250" y="100" fill="#388e3c" fontSize="9">(Calvin Cycle)</text>
          {/* Thylakoid membrane */}
          {[60, 120, 180].map((x, i) => (
            <g key={i}>
              {[0, 10, 20].map(dy => (
                <ellipse key={dy} cx={x} cy={72 + dy} rx="20" ry="6" fill="#43a047" stroke="#1b5e20" strokeWidth="1" />
              ))}
            </g>
          ))}
          <text x="100" y="112" fill="#1b5e20" fontSize="9" fontWeight="bold" textAnchor="middle">Thylakoid</text>
          <text x="100" y="122" fill="#388e3c" fontSize="9" textAnchor="middle">(Light Reactions)</text>
          {/* Pin on Stroma */}
          <g className="cursor-pointer group" onClick={() => pin('stroma')}>
            <circle cx="222" cy="70" r="12" fill="#2e7d32" stroke="#fff" strokeWidth="2" className="transition-transform group-hover:scale-125" />
            <text x="222" y="74" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">A</text>
          </g>
        </svg>
      </div>
    );
  }

  // ── "oxygen released" / "byproduct" in photosynthesis ───
  if ((q.includes('oxygen') || q.includes('gas')) && (q.includes('byproduct') || q.includes('released') || q.includes('release')) && q.includes('photosyn')) {
    return (
      <div className="w-full flex flex-col items-center gap-3 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Photosynthesis — Gas Exchange</span>
        <div className="flex items-center gap-4 w-full justify-center">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 bg-[#e1f5fe] border border-sky-300 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-800 cursor-pointer hover:scale-105 transition-all" onClick={() => pin('carbon dioxide')}>💨 CO₂ absorbed</div>
            <div className="flex items-center gap-1.5 bg-[#e1f5fe] border border-sky-300 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-800 cursor-pointer hover:scale-105 transition-all" onClick={() => pin('water')}>💧 H₂O absorbed</div>
            <div className="flex items-center gap-1.5 bg-[#fff8e1] border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 cursor-pointer hover:scale-105 transition-all" onClick={() => pin('sunlight')}>☀️ Sunlight</div>
          </div>
          <div className="flex flex-col items-center p-3 bg-[#e8f5e9] border-2 border-[#2e7d32] rounded-2xl text-center">
            <span className="text-2xl">🌿</span>
            <span className="text-xs font-extrabold text-[#2e7d32]">Plant</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 bg-[#e8f5e9] border-2 border-emerald-400 px-3 py-1.5 rounded-xl text-xs font-extrabold text-emerald-900 cursor-pointer hover:scale-105 transition-all" onClick={() => pin('oxygen')}>
              🌬️ O₂ released ← Answer
            </div>
            <div className="flex items-center gap-1.5 bg-[#fff3e0] border border-orange-300 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-800 cursor-pointer hover:scale-105 transition-all" onClick={() => pin('glucose')}>🍯 Glucose stored</div>
          </div>
        </div>
      </div>
    );
  }

  // ── Photosynthesis general (where it takes place / reactants) ──
  if (
    q.includes('photosyn') || q.includes('chloroplast') ||
    (q.includes('plant') && (q.includes('sunlight') || q.includes('glucose') || q.includes('reactant')))
  ) {
    return (
      <div className="w-full flex items-center justify-between px-2 py-2 max-w-md">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 bg-[#fff8e1] border border-amber-300 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-800 cursor-pointer hover:scale-105 transition-all" onClick={() => pin('sunlight')}>☀️ Sunlight</div>
          <div className="flex items-center gap-1.5 bg-[#e1f5fe] border border-sky-300 px-2.5 py-1 rounded-lg text-xs font-bold text-sky-800 cursor-pointer hover:scale-105 transition-all" onClick={() => pin('water')}>💧 Water (H₂O)</div>
          <div className="flex items-center gap-1.5 bg-[#eceff1] border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 cursor-pointer hover:scale-105 transition-all" onClick={() => pin('carbon dioxide')}>💨 CO₂</div>
        </div>
        <div className="flex flex-col items-center p-3 bg-[#e8f5e9] border-2 border-[#486730] rounded-2xl text-center">
          <span className="text-3xl">🌿</span>
          <span className="text-xs font-extrabold text-[#2e7d32] mt-0.5">Chloroplast</span>
          <span className="text-[9px] text-slate-500">Photosynthesis</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 bg-[#e8f5e9] border border-emerald-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-800 cursor-pointer hover:scale-105 transition-all" onClick={() => pin('oxygen')}>🌬️ O₂</div>
          <div className="flex items-center gap-1.5 bg-[#fff3e0] border border-orange-300 px-2.5 py-1.5 rounded-lg text-xs font-bold text-orange-800 cursor-pointer hover:scale-105 transition-all" onClick={() => pin('glucose')}>🍯 Glucose</div>
        </div>
      </div>
    );
  }

  // ── DNA base pairing: Adenine pairs with ────────────────
  if (q.includes('adenine') && (q.includes('pairs') || q.includes('base pair'))) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">DNA Base Pairing Rules</span>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {/* A-T pair (highlighted — this is the question) */}
          <div className="flex items-center gap-2 p-2 bg-[#e8f0fe] border-2 border-[#32617d] rounded-xl">
            <button type="button" onClick={() => pin('adenine')} className="px-3 py-1 bg-[#ef5350] text-white text-xs font-extrabold rounded-lg cursor-pointer hover:scale-105 transition-all">Adenine (A)</button>
            <span className="text-sm font-black text-slate-400">⟺</span>
            <button type="button" onClick={() => pin('thymine')} className="px-3 py-1 bg-[#42a5f5] text-white text-xs font-extrabold rounded-lg cursor-pointer hover:scale-105 transition-all">Thymine (T)</button>
            <span className="text-[10px] font-bold text-[#32617d] ml-1">← Answer</span>
          </div>
          {/* G-C pair */}
          <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl opacity-70">
            <button type="button" onClick={() => pin('guanine')} className="px-3 py-1 bg-[#66bb6a] text-white text-xs font-bold rounded-lg cursor-pointer hover:scale-105 transition-all">Guanine (G)</button>
            <span className="text-sm font-black text-slate-400">⟺</span>
            <button type="button" onClick={() => pin('cytosine')} className="px-3 py-1 bg-[#ff7043] text-white text-xs font-bold rounded-lg cursor-pointer hover:scale-105 transition-all">Cytosine (C)</button>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 font-semibold">Tap a base to select it as your answer</div>
      </div>
    );
  }

  // ── DNA base pairing: Guanine pairs with ───────────────
  if (q.includes('guanine') && (q.includes('pairs') || q.includes('base pair'))) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">DNA Base Pairing Rules</span>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <div className="flex items-center gap-2 p-2 bg-[#e8f5e9] border-2 border-[#2e7d32] rounded-xl">
            <button type="button" onClick={() => pin('guanine')} className="px-3 py-1 bg-[#66bb6a] text-white text-xs font-extrabold rounded-lg cursor-pointer hover:scale-105 transition-all">Guanine (G)</button>
            <span className="text-sm font-black text-slate-400">⟺</span>
            <button type="button" onClick={() => pin('cytosine')} className="px-3 py-1 bg-[#ff7043] text-white text-xs font-extrabold rounded-lg cursor-pointer hover:scale-105 transition-all">Cytosine (C)</button>
            <span className="text-[10px] font-bold text-[#2e7d32] ml-1">← Answer</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl opacity-70">
            <button type="button" onClick={() => pin('adenine')} className="px-3 py-1 bg-[#ef5350] text-white text-xs font-bold rounded-lg cursor-pointer hover:scale-105 transition-all">Adenine (A)</button>
            <span className="text-sm font-black text-slate-400">⟺</span>
            <button type="button" onClick={() => pin('thymine')} className="px-3 py-1 bg-[#42a5f5] text-white text-xs font-bold rounded-lg cursor-pointer hover:scale-105 transition-all">Thymine (T)</button>
          </div>
        </div>
      </div>
    );
  }

  // ── "double-helix" / "stores genetic information" ────────
  if (q.includes('double-helix') || q.includes('double helix') || (q.includes('stores') && q.includes('genetic'))) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">DNA Double Helix</span>
        <div className="flex items-center gap-5 justify-center">
          <div className="flex flex-col items-center">
            <div className="text-5xl mb-1">🧬</div>
            <span className="text-xs font-extrabold text-[#32617d]">DNA</span>
            <span className="text-[9px] text-slate-500">Deoxyribonucleic Acid</span>
          </div>
          <div className="flex flex-col gap-2">
            {[['Double helix shape', 'dna'], ['Stores genetic code', 'dna'], ['Found in nucleus', 'nucleus'], ['Made of nucleotides', 'nucleotides']].map(([label, ans]) => (
              <button key={label} type="button" onClick={() => pin(ans)}
                className="px-3 py-1 bg-[#e8f0fe] border border-[#32617d] text-[10px] font-bold text-[#32617d] rounded-lg cursor-pointer hover:scale-105 transition-all text-left">
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Punnett square ───────────────────────────────────────
  if (q.includes('punnett') || (q.includes('genetic cross') && q.includes('grid'))) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Punnett Square (Bb × Bb)</span>
        <div className="flex flex-col items-center gap-1">
          {/* Header row */}
          <div className="flex gap-1">
            <div className="w-12 h-8" />
            <div className="w-14 h-8 flex items-center justify-center text-xs font-black text-[#32617d]">B</div>
            <div className="w-14 h-8 flex items-center justify-center text-xs font-black text-[#32617d]">b</div>
          </div>
          {/* Row 1 */}
          <div className="flex gap-1 items-center">
            <div className="w-12 h-14 flex items-center justify-center text-xs font-black text-[#32617d]">B</div>
            <button type="button" onClick={() => pin('punnett square')} className="w-14 h-14 bg-[#e8f0fe] border-2 border-[#32617d] rounded-lg text-sm font-extrabold text-[#32617d] cursor-pointer hover:scale-105 transition-all">BB</button>
            <button type="button" onClick={() => pin('punnett square')} className="w-14 h-14 bg-[#e8f0fe] border-2 border-[#32617d] rounded-lg text-sm font-extrabold text-[#32617d] cursor-pointer hover:scale-105 transition-all">Bb</button>
          </div>
          {/* Row 2 */}
          <div className="flex gap-1 items-center">
            <div className="w-12 h-14 flex items-center justify-center text-xs font-black text-[#32617d]">b</div>
            <button type="button" onClick={() => pin('punnett square')} className="w-14 h-14 bg-[#e8f0fe] border-2 border-[#32617d] rounded-lg text-sm font-extrabold text-[#32617d] cursor-pointer hover:scale-105 transition-all">Bb</button>
            <button type="button" onClick={() => pin('punnett square')} className="w-14 h-14 bg-slate-100 border-2 border-slate-400 rounded-lg text-sm font-extrabold text-slate-600 cursor-pointer hover:scale-105 transition-all">bb</button>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 font-semibold">Tap any cell → selects "Punnett square"</div>
      </div>
    );
  }

  // ── "dominant" allele ────────────────────────────────────
  if (q.includes('dominant') || q.includes('expresses its phenotype') || (q.includes('allele') && q.includes('one copy'))) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Dominant vs Recessive Alleles</span>
        <div className="flex gap-4 w-full justify-center">
          <button type="button" onClick={() => pin('dominant')}
            className="flex-1 max-w-[140px] p-3 bg-[#e8f0fe] border-2 border-[#32617d] rounded-2xl text-center cursor-pointer hover:scale-105 transition-all">
            <div className="text-2xl mb-1">💪</div>
            <span className="text-xs font-extrabold text-[#32617d]">Dominant (B)</span>
            <div className="text-[9px] text-slate-600 mt-0.5">Expressed with just 1 copy</div>
            <div className="text-[9px] font-bold text-[#32617d] mt-1">BB or Bb → shown ✓</div>
          </button>
          <button type="button" onClick={() => pin('recessive')}
            className="flex-1 max-w-[140px] p-3 bg-slate-100 border-2 border-slate-300 rounded-2xl text-center cursor-pointer hover:scale-105 transition-all opacity-70">
            <div className="text-2xl mb-1">🔕</div>
            <span className="text-xs font-extrabold text-slate-600">Recessive (b)</span>
            <div className="text-[9px] text-slate-600 mt-0.5">Needs 2 copies to show</div>
            <div className="text-[9px] font-bold text-slate-500 mt-1">bb only → shown</div>
          </button>
        </div>
      </div>
    );
  }

  // ── "46 chromosomes" / "somatic cell" ───────────────────
  if (q.includes('46') || q.includes('chromosom') || q.includes('somatic')) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Human Chromosome Pairs (23 pairs = 46 total)</span>
        <div className="grid grid-cols-8 gap-1 px-2">
          {Array.from({ length: 23 }).map((_, i) => (
            <button key={i} type="button" onClick={() => pin('46')}
              className="flex flex-col items-center cursor-pointer hover:scale-110 transition-all">
              <div className="flex gap-0.5">
                <div className={`w-2.5 h-5 rounded-full ${i < 22 ? 'bg-[#32617d]' : 'bg-rose-500'}`} style={{ borderRadius: '4px 4px 2px 2px' }} />
                <div className={`w-2.5 h-5 rounded-full ${i < 22 ? 'bg-[#32617d]' : 'bg-rose-500'}`} style={{ borderRadius: '4px 4px 2px 2px' }} />
              </div>
              <span className="text-[7px] text-slate-500">{i + 1}</span>
            </button>
          ))}
        </div>
        <div className="text-[10px] text-slate-500 font-semibold">23 pairs shown above — tap any pair</div>
      </div>
    );
  }

  // ── "father of modern genetics" / "Gregor Mendel" ───────
  if (q.includes('mendel') || q.includes('father of') || q.includes('pea plant')) {
    return (
      <div className="w-full flex flex-col items-center gap-3 py-2 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Mendel's Pea Plant Experiments</span>
        <div className="flex items-center gap-4 w-full justify-center">
          <div className="flex flex-col items-center p-3 bg-[#e8f5e9] border-2 border-[#2e7d32] rounded-2xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('Gregor Mendel')}>
            <span className="text-3xl">🧑‍🔬</span>
            <span className="text-xs font-extrabold text-[#2e7d32] mt-0.5">Gregor Mendel</span>
            <span className="text-[9px] text-slate-500">1856–1863</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {[['Purple / white flowers', 'flower color'], ['Tall / short stems', 'stem height'], ['Round / wrinkled seeds', 'seed shape']].map(([trait, ans]) => (
              <button key={trait} type="button" onClick={() => pin(ans)}
                className="px-2.5 py-1 bg-[#e8f5e9] border border-emerald-300 text-[10px] font-bold text-emerald-800 rounded-lg cursor-pointer hover:scale-105 transition-all text-left">
                🌱 {trait}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── "glycolysis" / "first step of cellular respiration" ──
  if (q.includes('glycolysis') || (q.includes('first step') && q.includes('respir'))) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Where Does Glycolysis Occur?</span>
        <div className="flex items-center gap-4 w-full justify-center">
          {/* Cell outline */}
          <div className="relative">
            <svg viewBox="0 0 200 160" className="w-44 h-36">
              {/* Cell membrane */}
              <ellipse cx="100" cy="82" rx="88" ry="68" fill="#e8f5e9" stroke="#486730" strokeWidth="2.5" strokeDasharray="4 2" />
              {/* Cytoplasm — highlighted */}
              <ellipse cx="100" cy="82" rx="80" ry="60" fill="#b2dfdb" fillOpacity="0.8" />
              <text x="100" y="130" fill="#00695c" fontSize="9" fontWeight="bold" textAnchor="middle">Cytoplasm ← Here!</text>
              {/* Nucleus */}
              <circle cx="80" cy="72" r="20" fill="#32617d" fillOpacity="0.75" stroke="#1d4358" strokeWidth="1.5" />
              {/* Mitochondria faded */}
              <ellipse cx="148" cy="62" rx="14" ry="7" fill="#e07a5f" fillOpacity="0.35" transform="rotate(15 148 62)" />
              {/* Glucose arrow */}
              <text x="14" y="46" fill="#f57c00" fontSize="9" fontWeight="bold">Glucose</text>
              <path d="M14 48 L34 68" stroke="#f57c00" strokeWidth="2" />
              {/* Pin */}
              <g className="cursor-pointer group" onClick={() => pin('cytoplasm')}>
                <circle cx="100" cy="58" r="11" fill="#00695c" stroke="#fff" strokeWidth="2" className="transition-transform group-hover:scale-125" />
                <text x="100" y="62" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">A</text>
              </g>
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            {[['✓ Cytoplasm', 'cytoplasm'], ['✗ Mitochondria', 'mitochondria'], ['✗ Nucleus', 'nucleus']].map(([label, ans]) => (
              <button key={label} type="button" onClick={() => pin(ans)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer hover:scale-105 transition-all ${label.startsWith('✓') ? 'bg-[#e8f5e9] border-emerald-400 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── "electron transport chain" / "greatest amount of ATP" ──
  if (q.includes('electron transport') || q.includes('greatest amount of atp') || (q.includes('stage') && q.includes('aerobic'))) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">ATP Yield per Stage of Cellular Respiration</span>
        <div className="flex flex-col gap-1.5 w-full max-w-xs">
          {[
            { stage: 'Glycolysis', atp: '2 ATP', color: '#fff9c4', border: '#f9a825', pct: 15, ans: 'glycolysis' },
            { stage: 'Krebs Cycle', atp: '2 ATP', color: '#ffe0b2', border: '#ef6c00', pct: 15, ans: 'krebs cycle' },
            { stage: 'Electron Transport Chain', atp: '~32 ATP ★ MOST', color: '#c8e6c9', border: '#2e7d32', pct: 70, ans: 'electron transport chain' },
          ].map(({ stage, atp, color, border, pct, ans }) => (
            <button key={stage} type="button" onClick={() => pin(ans)}
              className="flex items-center gap-2 p-2 rounded-xl border-2 cursor-pointer hover:scale-[1.02] transition-all text-left"
              style={{ backgroundColor: color, borderColor: border }}>
              <div className="flex-1">
                <div className="text-[10px] font-extrabold text-slate-800">{stage}</div>
                <div className="h-1.5 rounded-full bg-white/60 mt-0.5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: border }} />
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-slate-700 whitespace-nowrap">{atp}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── "ATP" as energy molecule (general) ───────────────────
  if (q.includes('atp') || (q.includes('energy') && q.includes('cellular respir'))) {
    return (
      <div className="w-full flex flex-col items-center gap-3 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Cellular Respiration → ATP</span>
        <div className="flex items-center gap-3 justify-center">
          <div className="flex items-center gap-1.5 bg-[#fff3e0] border border-orange-300 px-3 py-2 rounded-xl text-xs font-bold text-orange-800 cursor-pointer hover:scale-105 transition-all" onClick={() => pin('glucose')}>🍯 Glucose</div>
          <span className="text-lg font-black text-slate-400">+</span>
          <div className="flex items-center gap-1.5 bg-[#e0f7fa] border border-cyan-300 px-3 py-2 rounded-xl text-xs font-bold text-cyan-800 cursor-pointer hover:scale-105 transition-all" onClick={() => pin('oxygen')}>💨 O₂</div>
          <span className="text-lg font-black text-slate-400">→</span>
          <div className="flex flex-col items-center p-2.5 bg-[#e8f5e9] border-2 border-[#2e7d32] rounded-2xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('atp')}>
            <span className="text-xl">⚡</span>
            <span className="text-xs font-extrabold text-[#2e7d32]">ATP</span>
            <span className="text-[9px] text-slate-500">~36 ATP</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Ecosystems / Energy pyramid ───────────────────────────
  if (tag === 'ecosystems' || q.includes('pyramid') || q.includes('10%') || q.includes('trophic') || q.includes('food web')) {
    return (
      <div className="w-full max-w-sm flex flex-col items-center gap-0.5 py-1">
        {[
          { label: 'Tertiary: 10 kcal', width: 'w-24', bg: '#ffcdd2', border: '#e53935', ans: 'tertiary consumers' },
          { label: 'Secondary: 100 kcal', width: 'w-40', bg: '#ffe0b2', border: '#ef6c00', ans: 'secondary consumers' },
          { label: 'Primary: 1,000 kcal', width: 'w-56', bg: '#fff9c4', border: '#f9a825', ans: 'primary consumers' },
          { label: 'Producers: 10,000 kcal ★', width: 'w-72', bg: '#c8e6c9', border: '#2e7d32', ans: 'producers' },
        ].map(({ label, width, bg, border, ans }, i) => (
          <button key={ans} type="button" onClick={() => pin(ans)}
            className={`${width} py-1 px-2 text-center text-[10px] font-bold cursor-pointer hover:scale-105 transition-all border-2 ${i === 0 ? 'rounded-t-lg' : i === 3 ? 'rounded-b-lg' : ''}`}
            style={{ backgroundColor: bg, borderColor: border, color: '#1a1c19' }}>
            {label}
          </button>
        ))}
        <div className="text-[9px] text-slate-500 font-semibold mt-1">10% energy transferred between levels</div>
      </div>
    );
  }

  // ── Food chain ───────────────────────────────────────────
  if (q.includes('food chain') || q.includes('food web') || q.includes('predator') || q.includes('herbivore') || (q.includes('food') && q.includes('ecosystem'))) {
    return (
      <div className="w-full flex items-center justify-around py-2 max-w-md">
        {[
          { emoji: '🌱', label: 'Grass', sub: 'Producer', ans: 'grass' },
          { emoji: '🐇', label: 'Rabbit', sub: 'Herbivore', ans: 'rabbit' },
          { emoji: '🦊', label: 'Fox', sub: 'Carnivore', ans: 'fox' },
          { emoji: '🦅', label: 'Eagle', sub: 'Top Predator', ans: 'eagle' },
        ].map((item, i) => (
          <React.Fragment key={item.label}>
            <div className="flex flex-col items-center bg-white p-2 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:scale-105 transition-all" onClick={() => pin(item.ans)}>
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-[10px] font-bold text-slate-700">{item.label}</span>
              <span className="text-[9px] text-slate-500">{item.sub}</span>
            </div>
            {i < 3 && <span className="text-slate-400 font-bold">➔</span>}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // ── "main job of the heart" ──────────────────────────────
  if (q.includes('job of the heart') || q.includes('pump blood')) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Human Heart — Circulatory Pump</span>
        <div className="flex items-center gap-4 justify-center">
          <div className="flex flex-col items-center p-3 bg-rose-50 border-2 border-rose-500 rounded-2xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('pump blood')}>
            <span className="text-3xl animate-pulse">❤️</span>
            <span className="text-xs font-extrabold text-rose-700 mt-0.5">Heart</span>
            <span className="text-[9px] font-bold text-rose-800">Pumps Blood</span>
          </div>
          <span className="text-slate-400 font-bold">➔</span>
          <div className="flex flex-col gap-1.5">
            <span className="px-2.5 py-1 bg-red-100 border border-red-300 text-[10px] font-bold text-red-800 rounded-lg">🔴 Oxygenated Blood</span>
            <span className="px-2.5 py-1 bg-blue-100 border border-blue-300 text-[10px] font-bold text-blue-800 rounded-lg">🔵 Deoxygenated Blood</span>
          </div>
        </div>
      </div>
    );
  }

  // ── "digestive system" / "small intestine" ───────────────
  if (q.includes('digestive') || q.includes('absorbs most nutrients')) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Human Digestive System</span>
        <div className="flex items-center gap-3 justify-center">
          <div className="p-2 bg-amber-50 border border-amber-300 rounded-xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('stomach')}>
            <span className="text-xl">🥣</span>
            <div className="text-[9px] font-bold text-amber-800">A: Stomach</div>
          </div>
          <span className="text-slate-400 font-bold">➔</span>
          <div className="p-3 bg-emerald-50 border-2 border-emerald-600 rounded-2xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('small intestine')}>
            <span className="text-2xl">🌀</span>
            <div className="text-xs font-extrabold text-emerald-800">B: Small Intestine</div>
            <div className="text-[9px] font-bold text-emerald-700">★ Absorbs Nutrients</div>
          </div>
          <span className="text-slate-400 font-bold">➔</span>
          <div className="p-2 bg-slate-50 border border-slate-300 rounded-xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('large intestine')}>
            <span className="text-xl">🩻</span>
            <div className="text-[9px] font-bold text-slate-700">C: Large Intestine</div>
          </div>
        </div>
      </div>
    );
  }

  // ── "breathe in" / "breathe out" ─────────────────────────
  if (q.includes('breathe in') && q.includes('breathe out')) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Lungs Pulmonary Gas Exchange</span>
        <div className="flex items-center gap-4 justify-center">
          <div className="flex flex-col items-center p-2.5 bg-sky-50 border border-sky-300 rounded-xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('breathe in oxygen')}>
            <span className="text-2xl">🌬️</span>
            <span className="text-xs font-extrabold text-sky-800">Inhale</span>
            <span className="text-[9px] font-bold text-sky-700">Take in Oxygen (O₂)</span>
          </div>
          <span className="text-slate-400 font-bold">⟷</span>
          <div className="flex flex-col items-center p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('breathe out carbon dioxide')}>
            <span className="text-2xl">💨</span>
            <span className="text-xs font-extrabold text-slate-800">Exhale</span>
            <span className="text-[9px] font-bold text-slate-600">Release CO₂</span>
          </div>
        </div>
      </div>
    );
  }

  // ── "job of an antibody" / "pathogen" ────────────────────
  if (q.includes('job of an antibody') || q.includes('antibody') || q.includes('pathogen')) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Immune System — Antibody vs Pathogen</span>
        <div className="flex items-center gap-3 justify-center">
          <div className="p-3 bg-purple-50 border-2 border-purple-600 rounded-2xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('destroy specific pathogens')}>
            <span className="text-2xl">🛡️</span>
            <div className="text-xs font-extrabold text-purple-900">Y-Antibody</div>
            <div className="text-[9px] font-bold text-purple-700">Binds & Neutralizes</div>
          </div>
          <span className="text-slate-400 font-bold">⚔️</span>
          <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('pathogen')}>
            <span className="text-xl">🦠</span>
            <div className="text-[9px] font-bold text-rose-800">Pathogen (Germ)</div>
          </div>
        </div>
      </div>
    );
  }

  // ── "vaccination works" ──────────────────────────────────
  if (q.includes('vaccination works') || q.includes('vaccine protect')) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Vaccination & Immunological Memory</span>
        <div className="flex items-center gap-2 justify-center">
          <div className="p-2 bg-teal-50 border border-teal-300 rounded-xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('weakened pathogen')}>
            <span className="text-lg">💉</span>
            <div className="text-[9px] font-bold text-teal-800">1. Inactive Vaccine</div>
          </div>
          <span className="text-slate-400 font-bold">➔</span>
          <div className="p-2 bg-indigo-50 border border-indigo-300 rounded-xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('memory b-cells')}>
            <span className="text-lg">🧠</span>
            <div className="text-[9px] font-bold text-indigo-800">2. Memory Cells</div>
          </div>
          <span className="text-slate-400 font-bold">➔</span>
          <div className="p-2 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('rapid response')}>
            <span className="text-lg">⚡</span>
            <div className="text-[9px] font-extrabold text-emerald-800">3. Fast Protection</div>
          </div>
        </div>
      </div>
    );
  }

  // ── Algebra: x + 7 = 15 ──────────────────────────────────
  if (q.includes('x + 7 = 15')) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Algebra Scale: x + 7 = 15</span>
        <div className="flex items-center gap-4 justify-center">
          <div className="p-3 bg-[#e8f0fe] border-2 border-[#32617d] rounded-2xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('8')}>
            <span className="text-xl font-black text-[#32617d]">x + 7</span>
            <div className="text-[9px] text-slate-500">Left Pan</div>
          </div>
          <span className="text-2xl font-black text-amber-600">=</span>
          <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-2xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('8')}>
            <span className="text-xl font-black text-amber-800">15</span>
            <div className="text-[9px] text-slate-500">Right Pan</div>
          </div>
        </div>
        <div className="text-[10px] font-bold text-emerald-700">Subtract 7 from both sides ➔ x = 8</div>
      </div>
    );
  }

  // ── Algebra: 3x = 21 ─────────────────────────────────────
  if (q.includes('3x = 21')) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Grouping Visual: 3x = 21</span>
        <div className="flex items-center gap-2 justify-center">
          {[1, 2, 3].map((g) => (
            <div key={g} className="p-2 bg-[#e8f0fe] border border-[#32617d] rounded-xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('7')}>
              <div className="text-xs font-extrabold text-[#32617d]">Group {g}</div>
              <div className="text-[10px] font-bold text-slate-600 mt-0.5">x items (7)</div>
            </div>
          ))}
          <span className="text-sm font-black text-slate-400">= 21</span>
        </div>
        <div className="text-[10px] font-bold text-emerald-700">Divide 21 by 3 ➔ x = 7</div>
      </div>
    );
  }

  // ── Algebra: 2y - 4 = 10 ─────────────────────────────────
  if (q.includes('2y - 4 = 10')) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Two-Step Balance: 2y - 4 = 10</span>
        <div className="flex items-center gap-2 justify-center">
          <div className="p-2 bg-slate-100 border border-slate-300 rounded-xl text-center">
            <span className="text-xs font-bold text-slate-700">2y - 4 = 10</span>
            <div className="text-[8px] text-slate-500">Original</div>
          </div>
          <span className="text-slate-400 font-bold">➔</span>
          <div className="p-2 bg-amber-50 border border-amber-300 rounded-xl text-center">
            <span className="text-xs font-bold text-amber-800">2y = 14</span>
            <div className="text-[8px] text-slate-500">Add 4</div>
          </div>
          <span className="text-slate-400 font-bold">➔</span>
          <div className="p-2 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('7')}>
            <span className="text-xs font-extrabold text-emerald-800">y = 7</span>
            <div className="text-[8px] font-bold text-emerald-700">Divide 2</div>
          </div>
        </div>
      </div>
    );
  }

  // ── Geometry: Rectangle Area 8x5 ──────────────────────────
  if (q.includes('area of a rectangle') && q.includes('8 cm')) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Rectangle Area: 8 cm × 5 cm</span>
        <svg viewBox="0 0 200 110" className="w-48 h-28">
          <rect x="20" y="15" width="160" height="75" fill="#fff9c4" stroke="#f9a825" strokeWidth="3" rx="4" />
          <text x="100" y="10" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#795548">Length = 8 cm</text>
          <text x="10" y="55" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#795548">5 cm</text>
          <text x="100" y="58" textAnchor="middle" fontSize="12" fontWeight="extrabold" fill="#f57f17">Area = 8 × 5 = 40 sq cm</text>
        </svg>
      </div>
    );
  }

  // ── Geometry: Square Perimeter side 6 ─────────────────────
  if (q.includes('perimeter of a square') && q.includes('6 meters')) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Square Perimeter (4 sides of 6m)</span>
        <svg viewBox="0 0 140 130" className="w-36 h-32">
          <rect x="25" y="20" width="90" height="90" fill="#e8f5e9" stroke="#2e7d32" strokeWidth="3" rx="4" />
          <text x="70" y="14" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#2e7d32">6 m</text>
          <text x="70" y="122" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#2e7d32">6 m</text>
          <text x="14" y="68" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#2e7d32">6 m</text>
          <text x="126" y="68" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#2e7d32">6 m</text>
          <text x="70" y="68" textAnchor="middle" fontSize="11" fontWeight="extrabold" fill="#1b5e20">6+6+6+6 = 24m</text>
        </svg>
      </div>
    );
  }

  // ── History: Author of Declaration ────────────────────────
  if (q.includes('primary author') && q.includes('declaration')) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Drafting the Declaration of Independence (1776)</span>
        <div className="flex items-center gap-4 justify-center">
          <div className="p-3 bg-amber-50 border-2 border-amber-600 rounded-2xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('Thomas Jefferson')}>
            <span className="text-3xl">📜</span>
            <div className="text-xs font-extrabold text-amber-900 mt-0.5">Thomas Jefferson</div>
            <div className="text-[9px] font-bold text-amber-700">Primary Author</div>
          </div>
          <div className="flex flex-col gap-1.5 text-left">
            <span className="text-[10px] font-bold text-slate-700">✍️ Drafted in Philadelphia</span>
            <span className="text-[10px] font-bold text-slate-700">🏛️ Adopted July 4, 1776</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Civics: Making Laws ───────────────────────────────────
  if (q.includes('responsible for making laws')) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-1 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Lawmaking Branch of US Government</span>
        <div className="p-3 bg-sky-50 border-2 border-sky-600 rounded-2xl text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('Legislative branch (Congress)')}>
          <span className="text-3xl">🏛️</span>
          <div className="text-xs font-extrabold text-sky-900 mt-0.5">Legislative Branch (Congress)</div>
          <div className="text-[9px] font-bold text-sky-700 mt-0.5">Senate + House of Representatives ➔ Makes Laws</div>
        </div>
      </div>
    );
  }

  // ── Algebra (General) ────────────────────────────────────
  if (tag === 'algebra' || q.includes('equat') || q.includes('variable') || q.includes('solve for') || q.includes('linear')) {
    return (
      <div className="w-full flex flex-col items-center gap-3 py-2 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Algebraic Equation Balance</span>
        <div className="flex items-end justify-center gap-4">
          <div className="bg-[#e8f0fe] border-2 border-[#32617d] rounded-xl p-3 text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('variable')}>
            <span className="text-xl font-black text-[#32617d]">2x + 5</span>
            <div className="text-[9px] text-slate-500 mt-0.5">Left side</div>
          </div>
          <div className="flex flex-col items-center mb-2">
            <span className="text-2xl font-black text-amber-600">=</span>
          </div>
          <div className="bg-[#fff8e1] border-2 border-amber-400 rounded-xl p-3 text-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('constant')}>
            <span className="text-xl font-black text-amber-700">13</span>
            <div className="text-[9px] text-slate-500 mt-0.5">Right side</div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          {[['Variable', 'variable'], ['Coefficient', 'coefficient'], ['Constant', 'constant'], ['x = 4', 'solution']].map(([label, ans]) => (
            <button key={label} type="button" onClick={() => pin(ans)}
              className="px-2.5 py-1 bg-[#e8f0fe] border border-[#32617d] text-[10px] font-bold text-[#32617d] rounded-lg cursor-pointer hover:scale-105 transition-all">
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Geometry ─────────────────────────────────────────────
  if (tag === 'geometry' || q.includes('area') || q.includes('perim') || q.includes('angle') || q.includes('triangle') || q.includes('circle') || q.includes('shape')) {
    return (
      <div className="w-full flex items-center justify-around py-2 max-w-sm gap-4">
        {[
          { path: 'M30,55 L80,5 L130,55 Z', fill: '#e3f2fd', stroke: '#1565c0', label: 'Triangle', formula: '½b·h', ans: 'triangle', viewBox: '0 0 160 65' },
          { rect: true, label: 'Rectangle', formula: 'l × w', ans: 'rectangle', fill: '#fff9c4', stroke: '#f9a825' },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin(s.ans)}>
            <svg viewBox={s.rect ? '0 0 140 80' : s.viewBox} width="80" height="60">
              {s.rect
                ? <><rect x="8" y="12" width="124" height="56" fill={s.fill} stroke={s.stroke} strokeWidth="3" rx="3" /><text x="70" y="44" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#795548">{s.formula}</text></>
                : <><path d={s.path} fill={s.fill} stroke={s.stroke} strokeWidth="3" /><text x="80" y="50" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1565c0">{s.formula}</text></>}
            </svg>
            <span className="text-[10px] font-bold text-slate-700">{s.label}</span>
          </div>
        ))}
        <div className="flex flex-col items-center cursor-pointer hover:scale-105 transition-all" onClick={() => pin('circle')}>
          <svg viewBox="0 0 70 70" width="60" height="60">
            <circle cx="35" cy="35" r="28" fill="#fce4ec" stroke="#c62828" strokeWidth="3" />
            <line x1="35" y1="35" x2="63" y2="35" stroke="#c62828" strokeWidth="2" />
            <text x="48" y="30" fontSize="9" fontWeight="bold" fill="#c62828">r</text>
            <text x="35" y="40" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#c62828">πr²</text>
          </svg>
          <span className="text-[10px] font-bold text-slate-700">Circle</span>
        </div>
      </div>
    );
  }

  // ── American Revolution ───────────────────────────────────
  if (tag === 'revolution' || q.includes('revolution') || q.includes('independence') || q.includes('1776') || q.includes('continental congress') || q.includes('colonial')) {
    return (
      <div className="w-full flex flex-col items-center gap-1.5 py-2 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">American Revolution Timeline</span>
        {[
          { year: '1765', event: 'Stamp Act — Taxation protest', ans: 'taxation', bg: '#ffebee' },
          { year: '1775', event: 'Lexington & Concord — First battles', ans: 'lexington', bg: '#fff3e0' },
          { year: '1776', event: 'Declaration of Independence signed ★', ans: 'declaration of independence', bg: '#e8f5e9' },
          { year: '1781', event: 'Battle of Yorktown — British surrender', ans: 'yorktown', bg: '#e3f2fd' },
        ].map(({ year, event, ans, bg }) => (
          <button key={year} type="button" onClick={() => pin(ans)}
            className="flex items-center gap-2 w-full p-2 rounded-xl border cursor-pointer hover:scale-[1.02] transition-all text-left"
            style={{ backgroundColor: bg }}>
            <span className="text-xs font-black text-slate-700 w-10 flex-shrink-0">{year}</span>
            <span className="text-[10px] font-bold text-slate-700">{event}</span>
          </button>
        ))}
      </div>
    );
  }

  // ── Civics / Three Branches ───────────────────────────────
  if (tag === 'civics' || q.includes('constitution') || q.includes('amendment') || q.includes('branch') || q.includes('congress') || q.includes('president') || q.includes('rights')) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-2 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Three Branches of Government</span>
        <div className="flex items-start gap-2 w-full justify-center">
          {[
            { emoji: '🏛️', label: 'Legislative', sub: 'Congress\nMakes Laws', bg: '#e3f2fd', border: '#1565c0', ans: 'legislative' },
            { emoji: '⚖️', label: 'Judicial', sub: 'Supreme Court\nInterprets Laws', bg: '#fce4ec', border: '#c62828', ans: 'judicial' },
            { emoji: '🏠', label: 'Executive', sub: 'President\nEnforces Laws', bg: '#fff9c4', border: '#f9a825', ans: 'executive' },
          ].map((b) => (
            <button key={b.label} type="button" onClick={() => pin(b.ans)}
              className="flex-1 flex flex-col items-center p-2.5 rounded-2xl border-2 cursor-pointer hover:scale-105 transition-all text-center"
              style={{ backgroundColor: b.bg, borderColor: b.border }}>
              <span className="text-2xl">{b.emoji}</span>
              <span className="text-[10px] font-extrabold mt-0.5 text-slate-800">{b.label}</span>
              <span className="text-[9px] text-slate-500 whitespace-pre-line mt-0.5">{b.sub}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Adaptation / Natural Selection ────────────────────────
  if (tag === 'adaptation' || q.includes('natural selection') || q.includes('adapt') || q.includes('surviv') || q.includes('evolut')) {
    return (
      <div className="w-full flex flex-col items-center gap-2 py-2 max-w-md">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Natural Selection Process</span>
        <div className="flex items-center gap-1 flex-wrap justify-center">
          {[
            { label: 'Variation', emoji: '🌈', bg: '#e3f2fd', border: '#1565c0', ans: 'variation' },
            { label: 'Selection\nPressure', emoji: '🌍', bg: '#fce4ec', border: '#c62828', ans: 'selection pressure' },
            { label: 'Survival\nof Fittest', emoji: '💪', bg: '#fff9c4', border: '#f9a825', ans: 'survival' },
            { label: 'Adaptation', emoji: '🦎', bg: '#e8f5e9', border: '#2e7d32', ans: 'adaptation' },
          ].map((step, i) => (
            <React.Fragment key={step.label}>
              <button type="button" onClick={() => pin(step.ans)}
                className="flex flex-col items-center p-2 rounded-xl border-2 cursor-pointer hover:scale-105 transition-all min-w-[68px] text-center"
                style={{ backgroundColor: step.bg, borderColor: step.border }}>
                <span className="text-xl">{step.emoji}</span>
                <span className="text-[9px] font-extrabold mt-0.5 text-slate-700 whitespace-pre-line">{step.label}</span>
              </button>
              {i < 3 && <span className="text-base font-extrabold text-slate-400">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  // ── Generic science fallback ─────────────────────────────
  return (
    <div className="w-full flex items-center justify-around py-3 max-w-md">
      <div className="flex flex-col items-center bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <span className="text-2xl">🔬</span>
        <span className="text-[11px] font-bold text-slate-800 mt-1">Observe</span>
      </div>
      <span className="text-sm font-bold text-slate-400">→</span>
      <div className="flex flex-col items-center p-3 bg-[#e8f0fe] border-2 border-[#32617d] rounded-2xl shadow-sm text-center">
        <span className="text-3xl">🧪</span>
        <span className="text-xs font-extrabold text-[#32617d] mt-0.5">Analyze</span>
      </div>
      <span className="text-sm font-bold text-slate-400">→</span>
      <div className="flex flex-col items-center bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <span className="text-2xl">💡</span>
        <span className="text-[11px] font-bold text-slate-800 mt-1">Conclude</span>
      </div>
    </div>
  );
};
