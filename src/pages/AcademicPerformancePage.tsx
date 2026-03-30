import { useEffect, useState, useMemo } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { useDateFilter } from '@/context/DateFilterContext';
import { useDeletedItems } from '@/context/DeletedItemsContext';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Award, BookOpen, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#eab308', '#ec4899', '#06b6d4', '#ef4444', '#6366f1'];

const AcademicPerformancePage = () => {
  const { student } = useStudentAuth();
  const { filterStartDate: startDate, filterEndDate: endDate } = useDateFilter();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { schoolId } = useStudentAuth();
  const { isDeleted } = useDeletedItems();

  useEffect(() => {
    if (!student || !schoolId) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('results')
        .select('*')
        .eq('student_id', student.id)
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });
      setResults(data || []);
      setLoading(false);
    };
    fetch();
  }, [student, schoolId, startDate, endDate]);

  // Filter out deleted results
  const activeResults = useMemo(() => results.filter(r => !isDeleted(r.id)), [results, isDeleted]);

  const subjectPerformance = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    activeResults.forEach(r => {
      if (!map[r.subject]) map[r.subject] = { total: 0, count: 0 };
      map[r.subject].total += r.percentage || 0;
      map[r.subject].count += 1;
    });
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500', 'bg-cyan-500', 'bg-red-500', 'bg-indigo-500'];
    return Object.entries(map).map(([subject, data], i) => ({
      subject,
      avgScore: Math.round(data.total / data.count),
      color: colors[i % colors.length],
    }));
  }, [activeResults]);

  const overallAvg = useMemo(() => {
    if (subjectPerformance.length === 0) return 0;
    return Math.round(subjectPerformance.reduce((s, x) => s + x.avgScore, 0) / subjectPerformance.length);
  }, [subjectPerformance]);

  const bestSubject = useMemo(() => {
    if (subjectPerformance.length === 0) return '--';
    return subjectPerformance.reduce((best, s) => s.avgScore > best.avgScore ? s : best).subject;
  }, [subjectPerformance]);

  const weakSubject = useMemo(() => {
    if (subjectPerformance.length === 0) return '--';
    return subjectPerformance.reduce((worst, s) => s.avgScore < worst.avgScore ? s : worst).subject;
  }, [subjectPerformance]);

  // Trend chart data: group results by date, each subject as a series
  const trendData = useMemo(() => {
    const subjects = [...new Set(activeResults.map(r => r.subject))];
    const dateMap: Record<string, any> = {};
    activeResults.forEach(r => {
      const date = new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      if (!dateMap[date]) dateMap[date] = { date };
      dateMap[date][r.subject] = r.percentage;
    });
    return { data: Object.values(dateMap), subjects };
  }, [activeResults]);

  const statCards = [
    { icon: TrendingUp, label: 'Overall Average', value: activeResults.length ? `${overallAvg}%` : '--' },
    { icon: BookOpen, label: 'Total Subjects', value: subjectPerformance.length },
    { icon: Award, label: 'Best Subject', value: bestSubject },
    { icon: TrendingDown, label: 'Weak Subject', value: weakSubject },
    { icon: BarChart3, label: 'Results Count', value: activeResults.length },
  ];

  const hasData = activeResults.length > 0;

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      <h1 className="text-3xl font-bold text-foreground text-center">Academic Performance</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(stat => (
          <div key={stat.label} className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <stat.icon size={20} className="text-primary" />
              <p className="text-foreground/60 text-sm">{stat.label}</p>
            </div>
            <p className="text-4xl font-bold text-primary drop-shadow-[0_0_15px_hsl(51,100%,50%,0.5)]">{stat.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : hasData ? (
        <>
          <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-primary mb-6">Subject-wise Performance</h2>
            <div className="space-y-4">
              {subjectPerformance.map(s => (
                <div key={s.subject}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-foreground font-medium">{s.subject}</span>
                    <span className="text-primary font-semibold">{s.avgScore}%</span>
                  </div>
                  <div className="w-full bg-primary/10 rounded-full h-3 overflow-hidden">
                    <div style={{ width: `${Math.min(s.avgScore, 100)}%` }} className={`h-full ${s.color} shadow-lg transition-all duration-500`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {trendData.data.length > 1 && (
            <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-primary mb-6">Performance Trend</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(51 100% 50% / 0.1)" />
                    <XAxis dataKey="date" stroke="hsl(0 0% 64%)" fontSize={12} />
                    <YAxis stroke="hsl(0 0% 64%)" fontSize={12} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(0 0% 6%)',
                        border: '1px solid hsl(51 20% 20%)',
                        borderRadius: '8px',
                        color: 'hsl(0 0% 98%)',
                      }}
                    />
                    <Legend />
                    {trendData.subjects.map((subject, i) => (
                      <Line
                        key={subject}
                        type="monotone"
                        dataKey={subject}
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-12 text-center">
          <BookOpen size={48} className="text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/50 text-lg">No performance data available yet.</p>
        </div>
      )}
    </div>
  );
};

export default AcademicPerformancePage;
