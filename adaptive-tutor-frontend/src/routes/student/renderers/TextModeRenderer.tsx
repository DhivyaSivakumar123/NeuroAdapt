import React from 'react';

interface TextModeRendererProps {
  questionText: string;
  passageText?: string;
  promptText?: string;
  imageUrl?: string;
  imageDescription?: string;
  tableData?: { headers: string[]; rows: string[][] };
  optionsList: string[];
  hasOptions: boolean;
  userAnswer: string;
  onSelectAnswer: (val: string) => void;
  onRecordInteraction: () => void;
  skillTag?: string;
  subject?: string;
  topicName?: string;
}

export const TextModeRenderer: React.FC<TextModeRendererProps> = ({
  questionText,
  passageText,
  promptText,
  imageUrl,
  imageDescription,
  tableData,
  optionsList,
  hasOptions,
  userAnswer,
  onSelectAnswer,
  onRecordInteraction,
  skillTag,
  subject,
  topicName,
}) => {
  // Render question-specific image or structured table only when defined for this question
  const renderQuestionVisualOrTable = () => {
    // 1. Direct Image URL
    if (imageUrl && imageUrl.trim()) {
      const fullSrc = imageUrl.startsWith('/') ? `http://localhost:8000${imageUrl}` : imageUrl;
      return (
        <div className="w-full flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <img
            src={fullSrc}
            alt={questionText || 'Question Illustration'}
            className="max-h-[280px] w-auto max-w-full object-contain rounded-xl shadow-xs"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      );
    }

    // 2. Structured Table Data
    if (tableData && tableData.headers && tableData.headers.length > 0) {
      return (
        <div className="w-full overflow-x-auto my-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs">
          <table className="w-full text-xs sm:text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200">
                {tableData.headers.map((h, i) => (
                  <th key={i} className="py-2.5 px-3.5 font-extrabold text-slate-800">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.rows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50/60">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2.5 px-3.5 font-medium text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    const q = (questionText + ' ' + (passageText || '') + ' ' + (imageDescription || '')).toLowerCase();

    // 3. Question-Specific Visual: 6x7 Dot Array
    if (q.includes('6 rows') && q.includes('7 columns') && (q.includes('array') || q.includes('dots'))) {
      return (
        <div className="w-full flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
            Visual Array: 6 Rows × 7 Columns
          </span>
          <div className="grid grid-rows-6 grid-cols-7 gap-2 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#32617d] shadow-2xs" />
            ))}
          </div>
        </div>
      );
    }

    // 4. Question-Specific Visual: 8-slice Circle with 3 Shaded Slices
    if (
      q.includes('8 equal slices') &&
      (q.includes('3 slices') || q.includes('3 shaded') || q.includes('fraction is shaded'))
    ) {
      return (
        <div className="w-full flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
            Fraction Model: 3 of 8 Slices Shaded
          </span>
          <svg viewBox="0 0 160 160" className="w-36 h-36 select-none drop-shadow-xs">
            <circle cx="80" cy="80" r="72" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
            {/* 3 Shaded Slices */}
            <path d="M 80 80 L 80 8 A 72 72 0 0 1 130.91 29.09 Z" fill="#2e7d32" stroke="#1b5e20" strokeWidth="1.5" />
            <path d="M 80 80 L 130.91 29.09 A 72 72 0 0 1 152 80 Z" fill="#2e7d32" stroke="#1b5e20" strokeWidth="1.5" />
            <path d="M 80 80 L 152 80 A 72 72 0 0 1 130.91 130.91 Z" fill="#2e7d32" stroke="#1b5e20" strokeWidth="1.5" />
            {/* 5 Unshaded Slices */}
            <path d="M 80 80 L 130.91 130.91 A 72 72 0 0 1 80 152 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <path d="M 80 80 L 80 152 A 72 72 0 0 1 29.09 130.91 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <path d="M 80 80 L 29.09 130.91 A 72 72 0 0 1 8 80 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <path d="M 80 80 L 8 80 A 72 72 0 0 1 29.09 29.09 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <path d="M 80 80 L 29.09 29.09 A 72 72 0 0 1 80 8 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <circle cx="80" cy="80" r="4" fill="#334155" />
          </svg>
        </div>
      );
    }

    // 5. Question-Specific Visual: Cartesian Coordinate Grid with Point P (3, 4)
    if (q.includes('coordinate grid') && (q.includes('point p') || q.includes('3 units right'))) {
      return (
        <div className="w-full flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
            Cartesian Coordinate Grid
          </span>
          <svg viewBox="0 0 220 200" className="w-52 h-48 select-none bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
            {[0, 30, 60, 90, 120, 150, 180].map((pos, idx) => (
              <React.Fragment key={idx}>
                <line x1="25" y1={pos + 10} x2="205" y2={pos + 10} stroke="#e2e8f0" strokeWidth="1" />
                <line x1={pos + 25} y1="10" x2={pos + 25} y2="190" stroke="#e2e8f0" strokeWidth="1" />
              </React.Fragment>
            ))}
            {/* Axes */}
            <line x1="25" y1="10" x2="25" y2="190" stroke="#475569" strokeWidth="2" />
            <line x1="25" y1="190" x2="205" y2="190" stroke="#475569" strokeWidth="2" />
            {/* X Labels */}
            <text x="25" y="198" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#64748b">0</text>
            <text x="55" y="198" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#64748b">1</text>
            <text x="85" y="198" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#64748b">2</text>
            <text x="115" y="198" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#64748b">3</text>
            <text x="145" y="198" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#64748b">4</text>
            <text x="175" y="198" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#64748b">5</text>
            <text x="200" y="198" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#334155">X</text>
            {/* Y Labels */}
            <text x="15" y="163" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#64748b">1</text>
            <text x="15" y="133" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#64748b">2</text>
            <text x="15" y="103" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#64748b">3</text>
            <text x="15" y="73" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#64748b">4</text>
            <text x="15" y="43" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#64748b">5</text>
            <text x="15" y="15" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#334155">Y</text>
            {/* Point P at (3, 4) */}
            <circle cx="115" cy="70" r="5" fill="#32617d" stroke="#ffffff" strokeWidth="2" />
            <text x="125" y="66" fontSize="11" fontWeight="bold" fill="#32617d">Point P (3, 4)</text>
          </svg>
        </div>
      );
    }

    // 6. Question-Specific Table: 2x2 Punnett Square
    if (q.includes('punnett') || (q.includes('2x2') && q.includes('grid') && q.includes('genetic'))) {
      return (
        <div className="w-full flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
            2×2 Punnett Square Table (Bb × Bb)
          </span>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <table className="border-collapse text-center text-xs sm:text-sm font-bold">
              <tbody>
                <tr>
                  <td className="p-2 border-b border-r border-slate-200 text-slate-400 font-normal">Alleles</td>
                  <td className="p-2.5 border-b border-r border-slate-200 bg-blue-50 text-blue-900 font-extrabold">B</td>
                  <td className="p-2.5 border-b border-slate-200 bg-blue-50 text-blue-900 font-extrabold">b</td>
                </tr>
                <tr>
                  <td className="p-2.5 border-b border-r border-slate-200 bg-amber-50 text-amber-900 font-extrabold">B</td>
                  <td className="p-3 border-b border-r border-slate-300 font-extrabold text-slate-900 bg-slate-50">BB</td>
                  <td className="p-3 border-b border-slate-300 font-extrabold text-slate-900 bg-slate-50">Bb</td>
                </tr>
                <tr>
                  <td className="p-2.5 border-r border-slate-200 bg-amber-50 text-amber-900 font-extrabold">b</td>
                  <td className="p-3 border-r border-slate-300 font-extrabold text-slate-900 bg-slate-50">Bb</td>
                  <td className="p-3 font-extrabold text-slate-900 bg-slate-50">bb</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col space-y-3 font-sans">
      {/* Assessment Question Canvas */}
      <div className="bg-[#fcfcfa] rounded-2xl border border-[#e5e5dc] p-5 sm:p-7 shadow-xs space-y-4">
        {(subject || topicName || skillTag) && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-[#32617d] uppercase tracking-wider bg-[#e8f0fe] px-3 py-1 rounded-xl w-fit border border-blue-100">
            <span>{subject || 'Topic Cluster'}</span>
            {topicName && <span>• {topicName}</span>}
            {skillTag && <span className="bg-[#32617d] text-white px-2 py-0.2 rounded-md text-[9px]">{skillTag}</span>}
          </div>
        )}

        {/* Reading Passage if defined */}
        {passageText && (
          <div className="border-l-2 border-[#32617d]/50 pl-4 py-1">
            <p className="text-slate-800 text-sm sm:text-base leading-relaxed tracking-normal font-medium">
              {passageText}
            </p>
          </div>
        )}

        {promptText && (
          <p className="text-xs font-semibold text-slate-500">
            {promptText}
          </p>
        )}

        {/* Question-Specific Visual / Table (Rendered only when defined for this question) */}
        {renderQuestionVisualOrTable()}

        {passageText && <div className="border-t border-[#ecece4]" />}

        {/* Question & Options/Input */}
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#1a1c19] leading-snug">
            {questionText}
          </h2>

          {hasOptions ? (
            <div className="space-y-2 pt-1">
              {optionsList.map((opt, idx) => {
                const isSelected = userAnswer === opt;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelectAnswer(opt);
                      onRecordInteraction();
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 cursor-pointer active:scale-[0.99] ${
                      isSelected
                        ? 'border-[#32617d] bg-[#f2f7fa] ring-1 ring-[#32617d] text-[#32617d]'
                        : 'border-[#dfdfd6] bg-white hover:border-[#32617d]/50 hover:bg-[#fafaf7] text-slate-800'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-sm sm:text-base font-semibold">{opt}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5 pt-1">
              <label htmlFor="user-answer-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Your Answer
              </label>
              <input
                id="user-answer-input"
                aria-label="Your Answer"
                type="text"
                placeholder="Type your answer here..."
                value={userAnswer}
                onChange={(e) => {
                  onSelectAnswer(e.target.value);
                  onRecordInteraction();
                }}
                className="w-full p-3.5 rounded-xl border border-[#dfdfd6] bg-white text-slate-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#32617d] focus:border-[#32617d] transition-all shadow-2xs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
