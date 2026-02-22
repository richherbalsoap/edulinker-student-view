import { useEffect, useState } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { supabase } from '@/integrations/supabase/client';
import { FileText, ExternalLink } from 'lucide-react';

const SUPABASE_URL = "https://sdvxekymbfyrznhuvvtj.supabase.co";

const getFilePublicUrl = (filePath: string) => {
  if (!filePath) return '';
  if (filePath.startsWith('http')) return filePath;
  return `${SUPABASE_URL}/storage/v1/object/public/edulinker-files/${filePath}`;
};

const ResultsPage = () => {
  const { student } = useStudentAuth();
  const { startDate, endDate } = useAcademicYear();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { schoolId } = useStudentAuth();

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
        .order('created_at', { ascending: false });
      setResults(data || []);
      setLoading(false);
    };
    fetch();
  }, [student, schoolId, startDate, endDate]);

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      <h1 className="text-3xl font-bold text-foreground text-center">Results</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-12 text-center">
          <FileText size={48} className="text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/50 text-lg">No results available yet.</p>
        </div>
      ) : (
        <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left px-6 py-4 text-primary text-sm font-semibold">Subject</th>
                  <th className="text-center px-6 py-4 text-primary text-sm font-semibold">Marks Obtained</th>
                  <th className="text-center px-6 py-4 text-primary text-sm font-semibold">Total Marks</th>
                  <th className="text-center px-6 py-4 text-primary text-sm font-semibold">Percentage</th>
                  <th className="text-center px-6 py-4 text-primary text-sm font-semibold">File</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-4 text-foreground font-medium">{r.subject}</td>
                    <td className="px-6 py-4 text-foreground/80 text-center">{r.marks_obtained}</td>
                    <td className="px-6 py-4 text-foreground/80 text-center">{r.total_marks}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-semibold ${r.percentage >= 75 ? 'text-green-400' : r.percentage >= 50 ? 'text-primary' : 'text-destructive'}`}>
                        {r.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {r.file_name ? (
                        <a href={r.file_name} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-sm">
                          <ExternalLink size={14} /> View
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
