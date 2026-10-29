import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { FlaggedStudent } from '../../types/dashboard';
import { AlertTriangle, ChevronRight, User, CheckCircle, Clock, Activity } from 'lucide-react';

interface NeedsAttentionListProps {
  flaggedStudents: FlaggedStudent[];
  selectedStudentId?: string;
  onSelectStudent: (studentId: string) => void;
}

export const NeedsAttentionList: React.FC<NeedsAttentionListProps> = ({
  flaggedStudents,
  selectedStudentId,
  onSelectStudent,
}) => {
  if (!flaggedStudents || flaggedStudents.length === 0) {
    return (
      <Card glass className="p-6 text-center space-y-2 border border-[#deded6] bg-white rounded-2xl shadow-2xs">
        <div className="inline-flex p-2.5 bg-[#eef5e9] text-[#486730] rounded-full">
          <CheckCircle className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-extrabold text-[#1a1c19]">All Learners in Steady Flow</h4>
        <p className="text-xs text-slate-500 font-medium">
          No learners are currently experiencing high cognitive friction or pause.
        </p>
      </Card>
    );
  }

  return (
    <Card glass className="p-6 space-y-4 border border-[#deded6] bg-white rounded-2xl shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm sm:text-base font-extrabold text-[#1a1c19]">Students Needing Support</h3>
        </div>
        <Badge variant="warning" size="sm">{flaggedStudents.length} Active</Badge>
      </div>

      <div className="space-y-2.5">
        {flaggedStudents.map((student) => {
          const isSelected = selectedStudentId === student.student_id;
          const isDanger = student.classification === 'trigger_intervention';
          const focusPct = Math.round(student.latest_score * 100);

          return (
            <button
              key={student.student_id}
              onClick={() => onSelectStudent(student.student_id)}
              className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all min-h-[44px] cursor-pointer ${
                isSelected
                  ? 'border-[#32617d] bg-[#f0f4f8] shadow-xs'
                  : 'border-[#deded6] bg-white hover:bg-[#fafaf7] hover:border-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#e8f0fe] border border-[#d2e3fc] flex items-center justify-center text-[#32617d] font-extrabold text-xs shadow-2xs">
                  {student.student_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#1a1c19]">{student.student_name}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                    <span>Focus Level:</span>
                    <span className="font-extrabold text-slate-800">{focusPct}%</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={isDanger ? 'danger' : 'warning'} size="sm">
                  {isDanger ? 'Break Suggested' : 'Mild Hesitation'}
                </Badge>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};
