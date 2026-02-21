import { useEffect, useState, useMemo } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { supabase } from '@/integrations/supabase/client';
import { LayoutDashboard, BookOpen, FileText, TrendingUp } from 'lucide-react';

const StudentDashboard = () => {
  const { student } = useStudentAuth();
  const { startDate, endDate } = useAcademicYear();
  const [results, setResults] = useState<any[]>([]);
  const [homeworkCount, setHomeworkCount] = useState(0);

  const { schoolId } = useStudentAuth();

  useEffect(() => {
    if (!student || !schoolId) return;
    const fetchData = async () => {
      const { data: res } = await supabase
        .from('results')
        .select('*')
        .eq('student_id', student.id)
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      setResults(res || []);

      const { count } = await supabase
        .from('homework')
        .select('*', { count: 'exact', head: true })
        .eq('standard', student.standard)
        .eq('section', student.section)
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      setHomeworkCount(count || 0);
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
    </div>
  );
};

export default StudentDashboard;
