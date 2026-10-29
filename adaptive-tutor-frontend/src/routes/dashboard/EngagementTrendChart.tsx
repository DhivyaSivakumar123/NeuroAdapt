import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EngagementScoreResponse } from '../../types/engagement';
import { TrendingUp, HelpCircle, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface EngagementTrendChartProps {
  scores: EngagementScoreResponse[];
  studentName?: string;
}

export const EngagementTrendChart: React.FC<EngagementTrendChartProps> = ({
  scores,
  studentName = 'Student',
}) => {
  if (!scores || scores.length === 0) {
    return (
      <Card glass className="p-8 text-center space-y-3">
        <div className="p-3 bg-slate-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-slate-400">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Learning Sessions Recorded Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          As {studentName} answers questions and explores tasks, attention and pacing trends will appear here in real-time.
        </p>
      </Card>
    );
  }

  // Format data for Recharts with percentage values
  const chartData = scores.map((s, index) => {
    const dateObj = new Date(s.computed_at);
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const pct = Math.round(s.computed_score * 100);
    return {
      index: index + 1,
      time: timeStr,
      focusPercentage: pct,
      score: Number(s.computed_score.toFixed(2)),
      classification: s.classification,
    };
  });

  const latestScore = scores[scores.length - 1];
  const latestPct = Math.round((latestScore ? latestScore.computed_score : 1.0) * 100);

  const getStatusBadge = (classification?: string) => {
    switch (classification) {
      case 'trigger_intervention':
        return <Badge variant="danger">Support Prompt Triggered (&lt; 40%)</Badge>;
      case 'flag_monitor':
        return <Badge variant="warning">Mild Distraction / Pause (40% - 70%)</Badge>;
      case 'no_action':
      default:
        return <Badge variant="success">Strong Concentration (&gt; 70%)</Badge>;
    }
  };

  return (
    <Card glass className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Focus & Engagement Over Time</h3>
            {getStatusBadge(latestScore?.classification)}
          </div>
          <p className="text-xs text-slate-500">
            Real-time measurement of sustained attention, answering pace, and comfort level
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold text-brand-600">{latestPct}%</span>
          <span className="text-xs text-slate-400 font-medium block">Current Focus Level</span>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
            <YAxis
              domain={[0, 100]}
              stroke="#64748b"
              fontSize={11}
              ticks={[0, 40, 70, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              formatter={(value: any) => [`${value}% Focus Level`, 'Engagement']}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                fontSize: '12px',
              }}
            />
            {/* Threshold reference lines with friendly labels */}
            <ReferenceLine
              y={70}
              stroke="#10b981"
              strokeDasharray="4 4"
              label={{ value: '🟢 Optimal Focus (70%)', fill: '#059669', fontSize: 10, position: 'insideTopRight' }}
            />
            <ReferenceLine
              y={40}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{ value: '🟡 Support Band (40%)', fill: '#d97706', fontSize: 10, position: 'insideBottomRight' }}
            />

            <Line
              type="monotone"
              dataKey="focusPercentage"
              stroke="#0284c7"
              strokeWidth={3}
              dot={{ fill: '#0284c7', r: 4 }}
              activeDot={{ r: 6, stroke: '#0369a1', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Human-readable color guide for parents & teachers */}
      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <HelpCircle className="w-4 h-4 text-brand-600" />
          <span>How to read this chart:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-600">
          <div className="flex items-start gap-2 p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-900 block">70% – 100% (Green)</span>
              <span className="text-[11px] text-emerald-800">Deep concentration & fluent learning pace.</span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 bg-amber-50/60 rounded-xl border border-amber-100">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900 block">40% – 69% (Yellow)</span>
              <span className="text-[11px] text-amber-800">Normal pause, thinking through difficult concepts.</span>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 bg-rose-50/60 rounded-xl border border-rose-100">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-900 block">Below 40% (Red)</span>
              <span className="text-[11px] text-rose-800">Moment of fatigue or friction. The AI offers hints or a break.</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
