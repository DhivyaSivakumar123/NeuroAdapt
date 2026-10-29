import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import { ScienceDiagram } from './ScienceDiagram';

interface VisualModeRendererProps {
  questionText: string;
  passageText?: string;
  promptText?: string;
  optionsList: string[];
  hasOptions: boolean;
  userAnswer: string;
  onSelectAnswer: (val: string) => void;
  onRecordInteraction: () => void;
  /** The skill_tag of the current task, e.g. "cell_structure", "photosynthesis" */
  skillTag?: string;
  /** The subject of the current task, e.g. "biology", "math", "us_history" */
  subject?: string;
  imageUrl?: string;
}

export const VisualModeRenderer: React.FC<VisualModeRendererProps> = ({
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
  imageUrl,
}) => {
  const handlePinSelection = (answer: string) => {
    // If the answer or an option matching the pin exists, select it
    const matchedOption = optionsList.find(
      (opt) => opt.toLowerCase().includes(answer.toLowerCase()) || answer.toLowerCase().includes(opt.toLowerCase())
    );
    onSelectAnswer(matchedOption || answer);
    onRecordInteraction();
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col space-y-3 font-sans">
      {/* Hero Visual Card */}
      <div className="bg-white rounded-2xl border-2 border-[#d5ded0] p-4 sm:p-5 shadow-xs space-y-3.5">
        {/* Visual Canvas Asset */}
        <div className="w-full bg-[#f4f7f2] rounded-xl border border-[#e2ebd9] p-3 sm:p-4 flex flex-col items-center justify-center relative overflow-hidden min-h-[175px] sm:min-h-[205px]">
          <ScienceDiagram
            questionText={questionText}
            passageText={passageText}
            onSelectPin={handlePinSelection}
            skillTag={skillTag}
            subject={subject}
            imageUrl={imageUrl}
          />

          {/* Subtly placed inside the image at the bottom right */}
          <div className="absolute bottom-2 right-2.5 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-600 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs pointer-events-none">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Tap pins</span>
          </div>
        </div>

        {/* Caption & Question Section */}
        <div className="space-y-2 pt-0.5">
          <div className="bg-[#f9fbf8] p-3 rounded-xl border border-[#e4ede0]">
            <h2 className="text-sm sm:text-base font-bold text-[#1a1c19]">
              {questionText}
            </h2>
            {promptText && (
              <p className="text-xs text-slate-600 mt-1">
                {promptText}
              </p>
            )}
          </div>

          {/* Visual Options / Pin Selectors */}
          {hasOptions ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {optionsList.map((opt, idx) => {
                const isSelected = userAnswer.toLowerCase() === opt.toLowerCase();
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelectAnswer(opt);
                      onRecordInteraction();
                    }}
                    className={`p-3 rounded-xl border-2 text-left font-bold text-xs sm:text-sm flex items-center justify-between transition-all active:scale-[0.98] ${isSelected
                        ? 'border-[#486730] bg-[#eef5e9] text-[#2d471b] ring-1 ring-[#486730]'
                        : 'border-[#dfebd9] bg-white hover:border-[#486730]/60 hover:bg-[#f6faf3] text-[#1a1c19]'
                      }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#486730]" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1 pt-1">
              <label htmlFor="user-answer-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Your Answer (or tap a diagram pin above)
              </label>
              <input
                id="user-answer-input"
                aria-label="Your Answer"
                type="text"
                placeholder="Type answer or tap diagram..."
                value={userAnswer}
                onChange={(e) => {
                  onSelectAnswer(e.target.value);
                  onRecordInteraction();
                }}
                className="w-full p-3 rounded-xl border border-[#c9d8c3] bg-white text-[#1a1c19] text-sm focus:outline-none focus:ring-2 focus:ring-[#486730] focus:border-[#486730] transition-all shadow-2xs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
