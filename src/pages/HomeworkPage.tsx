import { useEffect, useState } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, ExternalLink } from 'lucide-react';

const HomeworkPage = () => {
  const { student } = useStudentAuth();
  const { startDate, endDate } = useAcademicYear();
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('homework')
        .select('*')
        .eq('standard', student.standard)
        .eq('section', student.section)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });
      setHomework(data || []);
      setLoading(false);
    };
    fetch();
  }, [student, startDate, endDate]);

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      <h1 className="text-3xl font-bold text-foreground text-center">Homework</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : homework.length === 0 ? (
        <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-12 text-center">
          <BookOpen size={48} className="text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/50 text-lg">No homework assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {homework.map(hw => (
            <div key={hw.id} className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-5 hover:border-primary/40 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-foreground font-semibold text-lg">{hw.subject}</h3>
                  <p className="text-foreground/70 mt-1">{hw.description}</p>
                  <p className="text-muted-foreground text-xs mt-2">{new Date(hw.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                {hw.file_url && (
                  <a href={hw.file_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-primary/20 text-primary hover:bg-primary/10 transition-colors">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeworkPage;
