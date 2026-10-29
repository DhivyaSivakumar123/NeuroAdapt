import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { InterventionResponse, InterventionType, InterventionOutcome } from '../../types/intervention';
import { History, Layers, Eye, Coffee, Sparkles, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface InterventionHistoryProps {
  interventions: InterventionResponse[];
  studentName?: string;
}

export const InterventionHistoryList: React.FC<InterventionHistoryProps> = ({
  interventions,
  studentName = 'Student',
}) => {
  if (!interventions || interventions.length === 0) {
    return (
      <Card glass className="p-8 text-center space-y-3">
        <div className="p-3 bg-slate-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-slate-400">
          <History className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Interventions Recorded</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {studentName} is engaging smoothly! Adaptive micro-interventions will log here if triggered.
        </p>
      </Card>
    );
  }

  const getTypeBadge = (type: InterventionType) => {
    switch (type) {
      case 're_chunk':
        return { label: 'Step-by-Step Chunking', variant: 'info' as const, icon: Layers };
      case 'modality_switch':
        return { label: 'Visual Modality Switch', variant: 'purple' as const, icon: Eye };
      case 'break_task':
        return { label: 'Micro Break', variant: 'warning' as const, icon: Coffee };
      case 'difficulty_step_down':
        return { label: 'Guided Scaffold', variant: 'success' as const, icon: Sparkles };
      default:
        return { label: type, variant: 'default' as const, icon: Sparkles };
    }
  };

  const getOutcomeBadge = (outcome: InterventionOutcome | null) => {
    if (!outcome) {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <Clock className="w-3 h-3 animate-pulse" />
          In Progress
        </Badge>
      );
    }
    switch (outcome) {
      case 'improved_score':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Improved Score
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="info" className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </Badge>
        );
      case 'abandoned_after':
        return (
          <Badge variant="danger" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Abandoned
          </Badge>
        );
      default:
        return <Badge variant="default">{outcome}</Badge>;
    }
  };

  return (
    <Card glass className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Intervention Log & Outcomes</h3>
          <p className="text-xs text-slate-500">History of adaptive supports triggered during learning</p>
        </div>
        <Badge variant="default" size="sm">
          {interventions.length} Total Triggered
        </Badge>
      </div>

      <div className="space-y-3">
        {interventions.map((item) => {
          const typeMeta = getTypeBadge(item.intervention_type);
          const Icon = typeMeta.icon;
          const timeStr = new Date(item.triggered_at).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{typeMeta.label}</span>
                    <Badge variant={typeMeta.variant} size="sm">
                      {item.intervention_type}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">Triggered on {timeStr}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">{getOutcomeBadge(item.outcome)}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
