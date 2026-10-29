import React, { useEffect, useState } from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import { ClassAnalyticsResponse } from '../../types/dashboard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { BarChart3, Users, AlertTriangle, ShieldCheck, Sparkles, Activity, ArrowUpRight, Flame } from 'lucide-react';

export const ClassAnalytics: React.FC = () => {
  const { fetchClassAnalytics, loading } = useDashboard();
  const [analytics, setAnalytics] = useState<ClassAnalyticsResponse | null>(null);

  useEffect(() => {
    fetchClassAnalytics().then(setAnalytics);
  }, [fetchClassAnalytics]);

  if (loading && !analytics) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
        <p className="text-sm text-slate-500">Aggregating class engagement analytics...</p>
      </div>
    );
  }

  const total = analytics?.total_students || 0;
  const optimalPct = total > 0 ? Math.round(((analytics?.optimal_count || 0) / total) * 100) : 0;
  const monitorPct = total > 0 ? Math.round(((analytics?.monitoring_count || 0) / total) * 100) : 0;
  const triggerPct = total > 0 ? Math.round(((analytics?.intervention_count || 0) / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-600" />
            Class Analytics & Attention Friction
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Aggregate cognitive attention distribution and skill friction heatmaps across your class roster
          </p>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card glass className="p-5 space-y-1 border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{total}</p>
          <p className="text-[11px] text-slate-400">Active class roster</p>
        </Card>

        <Card glass className="p-5 space-y-1 border-emerald-200 bg-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold uppercase">
            <span>Optimal State</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">{analytics?.optimal_count ?? 0}</p>
          <p className="text-[11px] text-emerald-600">{optimalPct}% of roster focused</p>
        </Card>

        <Card glass className="p-5 space-y-1 border-amber-200 bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold uppercase">
            <span>Monitoring Band</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700">{analytics?.monitoring_count ?? 0}</p>
          <p className="text-[11px] text-amber-600">{monitorPct}% in 0.40–0.70 band</p>
        </Card>

        <Card glass className="p-5 space-y-1 border-rose-200 bg-rose-50/20">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold uppercase">
            <span>Interventions</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold text-rose-700">{analytics?.intervention_count ?? 0}</p>
          <p className="text-[11px] text-rose-600">{triggerPct}% triggered adaptive help</p>
        </Card>
      </div>

      {/* Class Attention Distribution Bar */}
      <Card glass className="p-6 space-y-4 border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Class-Wide Engagement State Distribution
          </h3>
          <span className="text-xs font-medium text-slate-500">
            Avg Score: {(analytics?.avg_engagement_score ?? 1.0).toFixed(2)}
          </span>
        </div>

        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${optimalPct}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Optimal: ${optimalPct}%`}
          />
          <div
            style={{ width: `${monitorPct}%` }}
            className="bg-amber-400 transition-all duration-500"
            title={`Monitoring: ${monitorPct}%`}
          />
          <div
            style={{ width: `${triggerPct}%` }}
            className="bg-rose-500 transition-all duration-500"
            title={`Intervention: ${triggerPct}%`}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span>Optimal (Score &gt; 0.70)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
            <span>Monitoring (0.40–0.70)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span>Needs Intervention (&lt; 0.40)</span>
          </div>
        </div>
      </Card>

      {/* Skill Friction Heatmap List */}
      <Card glass className="p-6 space-y-4 border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            Top Skill Friction Points (Struggle Detection)
          </h3>
          <span className="text-xs text-slate-500">Ranked by retry frequency & interventions</span>
        </div>

        {analytics?.skill_friction && analytics.skill_friction.length > 0 ? (
          <div className="space-y-3">
            {analytics.skill_friction.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-white/70 flex items-center justify-between gap-4 flex-wrap hover:border-brand-300 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="purple" size="sm">{item.subject}</Badge>
                    <h4 className="font-bold text-sm text-slate-900">{item.skill_tag}</h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    {item.total_attempts} total attempts recorded across class
                  </p>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div className="text-center">
                    <p className="font-extrabold text-amber-600 text-sm">{item.retry_count}</p>
                    <p className="text-slate-400 text-[10px]">Retries</p>
                  </div>
                  <div className="text-center">
                    <p className="font-extrabold text-rose-600 text-sm">{item.interventions_count}</p>
                    <p className="text-slate-400 text-[10px]">Interventions</p>
                  </div>
                  <Badge variant={item.interventions_count > 0 ? 'danger' : 'warning'} size="sm">
                    {item.interventions_count > 0 ? 'High Friction' : 'Moderate Friction'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No significant skill friction detected yet. Student telemetry will populate this heatmap in real-time as tasks are attempted.
          </div>
        )}
      </Card>
    </div>
  );
};
