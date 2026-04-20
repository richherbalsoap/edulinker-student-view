import { useEffect, useState, useMemo, useCallback } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { useDateFilter } from '@/context/DateFilterContext';
import { useDeletedItems } from '@/context/DeletedItemsContext';
import { supabase } from '@/integrations/supabase/client';
import { applyCreatedAtFilter, applySchoolScopeFilter } from '@/lib/queryFilters';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { LayoutDashboard, BookOpen, FileText, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';

const StudentDashboard = () => {
  const { student, schoolId } = useStudentAuth();
  const { filterType, filterStartDate: startDate, filterEndDate: endDate } = useDateFilter();
  const { isDeleted } = useDeletedItems();
  const [results, setResults] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchData = useCallback(async () => {
    if (!student) return;
    const includeLegacyNull = filterType === 'all';

    let resultsQuery = supabase.from('results').select('*').eq('student_id', student.id);
    resultsQuery = applySchoolScopeFilter(resultsQuery, schoolId, includeLegacyNull);
    resultsQuery = applyCreatedAtFilter(resultsQuery, filterType, startDate, endDate);
    const { data: res } = await resultsQuery;
    setResults(res || []);

    let homeworkQuery = supabase.from('homework').select('*').ilike('standard', student.standard).ilike('section', student.section);
    homeworkQuery = applySchoolScopeFilter(homeworkQuery, schoolId, includeLegacyNull);
    homeworkQuery = applyCreatedAtFilter(homeworkQuery, filterType, startDate, endDate);
    const { data: hw } = await homeworkQuery;
    setHomework(hw || []);

    let complaintsQuery = supabase.from('complaints').select('*').eq('student_id', student.id);
    complaintsQuery = applySchoolScopeFilter(complaintsQuery, schoolId, includeLegacyNull);
    complaintsQuery = applyCreatedAtFilter(complaintsQuery, filterType, startDate, endDate);
    const { data: comp } = await complaintsQuery;
    setComplaints(comp || []);
  }, [student, schoolId, filterType, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime subscriptions
  useRealtimeSubscription('results', fetchData, !!student);
  useRealtimeSubscription('homework', fetchData, !!student);
  useRealtimeSubscription('complaints', fetchData, !!student);

  const activeResults = useMemo(() => results.filter(r => !isDeleted(r.id)), [results, isDeleted]);
  const activeHomework = useMemo(() => homework.filter(h => !isDeleted(h.id)), [homework, isDeleted]);
  const activeComplaints = useMemo(() => complaints.filter(c => !isDeleted(c.id)), [complaints, isDeleted]);

  const overallPercentage = useMemo(() => {
    if (activeResults.length === 0) return 0;
    return Math.round(activeResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / activeResults.length);
  }, [activeResults]);

  const today = new Date();
  const calMonth = selectedDate.getMonth();
  const calYear = selectedDate.getFullYear();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const prevMonth = () => setSelectedDate(new Date(calYear, calMonth - 1, 1));
  const nextMonth = () => setSelectedDate(new Date(calYear, calMonth + 1, 1));

  const matchesDate = (createdAt: string) => {
    const d = new Date(createdAt);
    return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
  };
  const dateHomework = activeHomework.filter(h => matchesDate(h.created_at));
  const dateComplaints = activeComplaints.filter(c => matchesDate(c.created_at));
  const dateResults = activeResults.filter(r => matchesDate(r.created_at));
  const hasDateData = dateHomework.length > 0 || dateComplaints.length > 0 || dateResults.length > 0;

  // Build a set of day numbers (in current calendar month/year) that have any activity
  const activityDays = useMemo(() => {
    const days = new Set<number>();
    const collect = (items: any[]) => {
      items.forEach(item => {
        if (!item.created_at) return;
        const d = new Date(item.created_at);
        if (d.getMonth() === calMonth && d.getFullYear() === calYear) {
          days.add(d.getDate());
        }
      });
    };
    collect(activeHomework);
    collect(activeComplaints);
    collect(activeResults);
    return days;
  }, [activeHomework, activeComplaints, activeResults, calMonth, calYear]);

  const statCards = [
    { icon: LayoutDashboard, label: 'Class', value: `${student?.standard}-${student?.section}` },
    { icon: TrendingUp, label: 'Overall %', value: activeResults.length ? `${overallPercentage}%` : '--' },
    { icon: FileText, label: 'Results', value: activeResults.length },
    { icon: BookOpen, label: 'Homework', value: activeHomework.length },
    { icon: AlertTriangle, label: 'Complaints', value: activeComplaints.length },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 relative z-10 px-3 sm:px-4 py-4 sm:py-6">
      <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
        <h1 className="text-xl sm:text-3xl font-bold text-foreground">
          Welcome, <span className="text-primary">{student?.name}</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Here's your academic overview</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map(stat => (
          <div key={stat.label} className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon size={16} className="text-primary shrink-0" />
              <p className="text-foreground/60 text-xs truncate">{stat.label}</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-primary drop-shadow-[0_0_15px_hsl(51,100%,50%,0.5)]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
        <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-3 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3">
            Activity on {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </h2>
          {hasDateData ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dateHomework.map(h => (
                <div key={h.id} className="bg-black/40 rounded-lg p-2.5 border border-primary/10">
                  <span className="text-xs text-primary/60 font-bold">HOMEWORK</span>
                  <p className="text-foreground text-sm truncate">{h.subject} — {h.description}</p>
                </div>
              ))}
              {dateComplaints.map(c => (
                <div key={c.id} className="bg-black/40 rounded-lg p-2.5 border border-primary/10">
                  <span className="text-xs text-primary/60 font-bold">COMPLAINT</span>
                  <p className="text-foreground text-sm truncate">{c.description}</p>
                </div>
              ))}
              {dateResults.map(r => (
                <div key={r.id} className="bg-black/40 rounded-lg p-2.5 border border-primary/10">
                  <span className="text-xs text-primary/60 font-bold">RESULT</span>
                  <p className="text-foreground text-sm truncate">{r.subject} — {r.marks_obtained}/{r.total_marks} ({r.percentage}%)</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground/40 text-sm">No activity recorded for this date.</p>
          )}
        </div>

        <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-3 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar size={18} className="text-primary" /> Calendar
            </h2>
            <div className="flex items-center gap-1.5">
              <button onClick={prevMonth} className="p-1 rounded hover:bg-primary/10 text-primary transition-colors">&lt;</button>
              <span className="text-foreground text-xs sm:text-sm font-medium">{monthNames[calMonth]} {calYear}</span>
              <button onClick={nextMonth} className="p-1 rounded hover:bg-primary/10 text-primary transition-colors">&gt;</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center text-xs">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={`${d}-${i}`} className="text-primary/60 font-semibold py-1">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
              const isSelected = day === selectedDate.getDate() && calMonth === selectedDate.getMonth() && calYear === selectedDate.getFullYear();
              const hasActivity = activityDays.has(day);
              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(new Date(calYear, calMonth, day))}
                  className={`relative py-1 sm:py-1.5 rounded cursor-pointer transition-all duration-200 text-xs sm:text-sm
                    ${isSelected ? 'bg-primary text-primary-foreground font-bold shadow-[0_0_10px_hsl(51,100%,50%,0.4)]'
                      : isToday ? 'bg-primary/20 text-primary font-bold border border-primary/30'
                      : 'text-foreground/70 hover:bg-primary/10 hover:text-foreground'}`}
                >
                  {day}
                  {hasActivity && (
                    <span
                      className={`absolute left-1/2 -translate-x-1/2 bottom-0.5 w-1 h-1 rounded-full ${
                        isSelected ? 'bg-primary-foreground' : 'bg-primary'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
