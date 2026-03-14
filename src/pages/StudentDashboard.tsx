import { useEffect, useState, useMemo } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { supabase } from '@/integrations/supabase/client';
import { LayoutDashboard, BookOpen, FileText, TrendingUp, Calendar } from 'lucide-react';

const StudentDashboard = () => {
  const { student, schoolId } = useStudentAuth();
  const { startDate, endDate } = useAcademicYear();
  const [results, setResults] = useState<any[]>([]);
  const [homework, setHomework] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [homeworkCount, setHomeworkCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!student || !schoolId) return;
    const fetchData = async () => {
      const { data: res, error: resErr } = await supabase
        .from('results')
        .select('*')
        .eq('student_id', student.id)
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      if (resErr) console.error('Dashboard results error:', resErr.message);
      setResults(res || []);

      const { data: hw, count, error: hwErr } = await supabase
        .from('homework')
        .select('*', { count: 'exact' })
        .ilike('standard', student.standard)
        .ilike('section', student.section)
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      if (hwErr) console.error('Dashboard homework error:', hwErr.message);
      setHomework(hw || []);
      setHomeworkCount(count || 0);

      const { data: comp, error: compErr } = await supabase
        .from('complaints')
        .select('*')
        .eq('student_id', student.id)
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      if (compErr) console.error('Dashboard complaints error:', compErr.message);
      setComplaints(comp || []);
    };
    fetchData();
  }, [student, schoolId, startDate, endDate]);

  const overallPercentage = useMemo(() => {
    if (results.length === 0) return 0;
    return Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length);
  }, [results]);

  const subjects = useMemo(() => {
    const unique = new Set(results.map(r => r.subject));
    return unique.size;
  }, [results]);

  // Calendar logic
  const today = new Date();
  const calMonth = selectedDate.getMonth();
  const calYear = selectedDate.getFullYear();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const prevMonth = () => setSelectedDate(new Date(calYear, calMonth - 1, 1));
  const nextMonth = () => setSelectedDate(new Date(calYear, calMonth + 1, 1));

  // Date-filtered items
  const matchesDate = (createdAt: string) => {
    const d = new Date(createdAt);
    return d.getDate() === selectedDate.getDate() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getFullYear() === selectedDate.getFullYear();
  };
  const dateHomework = homework.filter(h => matchesDate(h.created_at));
  const dateComplaints = complaints.filter(c => matchesDate(c.created_at));
  const dateResults = results.filter(r => matchesDate(r.created_at));
  const hasDateData = dateHomework.length > 0 || dateComplaints.length > 0 || dateResults.length > 0;

  const statCards = [
    { icon: LayoutDashboard, label: 'Class', value: `${student?.standard}-${student?.section}` },
    { icon: TrendingUp, label: 'Overall Percentage', value: results.length ? `${overallPercentage}%` : '--' },
    { icon: FileText, label: 'Total Subjects', value: subjects },
    { icon: BookOpen, label: 'Homework Assigned', value: homeworkCount },
  ];

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome, <span className="text-primary">{student?.name}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Here's your academic overview</p>
      </div>

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

      {/* Calendar + Activity Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Date Activity Panel */}
        <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Activity on {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </h2>
          {hasDateData ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {dateHomework.map(h => (
                <div key={h.id} className="bg-black/40 rounded-lg p-3 border border-primary/10">
                  <span className="text-xs text-primary/60 font-bold">HOMEWORK</span>
                  <p className="text-foreground text-sm">{h.subject} — {h.description}</p>
                </div>
              ))}
              {dateComplaints.map(c => (
                <div key={c.id} className="bg-black/40 rounded-lg p-3 border border-primary/10">
                  <span className="text-xs text-primary/60 font-bold">COMPLAINT</span>
                  <p className="text-foreground text-sm truncate">{c.description}</p>
                </div>
              ))}
              {dateResults.map(r => (
                <div key={r.id} className="bg-black/40 rounded-lg p-3 border border-primary/10">
                  <span className="text-xs text-primary/60 font-bold">RESULT</span>
                  <p className="text-foreground text-sm">{r.subject} — {r.marks_obtained}/{r.total_marks} ({r.percentage}%)</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground/40 text-sm">No activity recorded for this date.</p>
          )}
        </div>

        {/* Calendar */}
        <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar size={20} className="text-primary" /> Calendar
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1 rounded hover:bg-primary/10 text-primary transition-colors">&lt;</button>
              <span className="text-foreground text-sm font-medium">{monthNames[calMonth]} {calYear}</span>
              <button onClick={nextMonth} className="p-1 rounded hover:bg-primary/10 text-primary transition-colors">&gt;</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-primary/60 font-semibold py-1">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
              const isSelected = day === selectedDate.getDate() && calMonth === selectedDate.getMonth() && calYear === selectedDate.getFullYear();
              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(new Date(calYear, calMonth, day))}
                  className={`py-1.5 rounded cursor-pointer transition-all duration-200 text-sm
                    ${isSelected ? 'bg-primary text-primary-foreground font-bold shadow-[0_0_10px_hsl(51,100%,50%,0.4)]'
                      : isToday ? 'bg-primary/20 text-primary font-bold border border-primary/30'
                      : 'text-foreground/70 hover:bg-primary/10 hover:text-foreground'}`}
                >
                  {day}
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
