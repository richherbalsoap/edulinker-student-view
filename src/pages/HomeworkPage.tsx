import { useEffect, useState } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, ExternalLink, Image } from 'lucide-react';

const SUPABASE_URL = "https://sdvxekymbfyrznhuvvtj.supabase.co";

const getFilePublicUrl = (filePath: string) => {
  if (!filePath) return '';
  if (filePath.startsWith('http')) return filePath;
  return `${SUPABASE_URL}/storage/v1/object/public/edulinker-files/${filePath}`;
};

const isImageFile = (filePath: string) => {
  if (!filePath) return false;
  const lower = filePath.toLowerCase();
  return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp');
};

const HomeworkPage = () => {
  const { student, schoolId } = useStudentAuth();
  const { startDate, endDate } = useAcademicYear();
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student || !schoolId) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('homework')
        .select('*')
        .eq('standard', student.standard)
        .eq('section', student.section)
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });
      setHomework(data || []);
      setLoading(false);
    };
    fetch();
  }, [student, schoolId, startDate, endDate]);

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
        <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left px-6 py-4 text-primary text-sm font-semibold">Subject</th>
                  <th className="text-left px-6 py-4 text-primary text-sm font-semibold">Description</th>
                  <th className="text-center px-6 py-4 text-primary text-sm font-semibold">Date</th>
                  <th className="text-center px-6 py-4 text-primary text-sm font-semibold">File</th>
                </tr>
              </thead>
              <tbody>
                {homework.map(hw => {
                  const fileUrl = hw.file_url ? getFilePublicUrl(hw.file_url) : null;
                  const isImage = hw.file_url ? isImageFile(hw.file_url) : false;
                  return (
                    <tr key={hw.id} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 text-foreground font-medium">{hw.subject}</td>
                      <td className="px-6 py-4 text-foreground/80">{hw.description}</td>
                      <td className="px-6 py-4 text-foreground/80 text-center text-sm">
                        {new Date(hw.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {fileUrl && isImage ? (
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                            <img src={fileUrl} alt={`${hw.subject} homework`} className="w-20 h-20 object-cover rounded-lg border border-primary/10 mx-auto" />
                          </a>
                        ) : fileUrl ? (
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-sm">
                            <ExternalLink size={14} /> View
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkPage;
