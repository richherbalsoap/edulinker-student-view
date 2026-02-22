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
        <div className="space-y-4">
          {homework.map(hw => {
            const fileUrl = hw.file_url ? getFilePublicUrl(hw.file_url) : null;
            const isImage = hw.file_url ? isImageFile(hw.file_url) : false;

            return (
              <div key={hw.id} className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-5 hover:border-primary/40 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-foreground font-semibold text-lg">{hw.subject}</h3>
                    <p className="text-foreground/70 mt-1">{hw.description}</p>
                    <p className="text-muted-foreground text-xs mt-2">
                      {new Date(hw.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {fileUrl && !isImage && (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-primary/20 text-primary hover:bg-primary/10 transition-colors">
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
                {fileUrl && isImage && (
                  <div className="mt-4">
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={fileUrl}
                        alt={`${hw.subject} homework`}
                        className="w-full max-h-96 object-contain rounded-lg border border-primary/10"
                      />
                    </a>
                  </div>
                )}
                {fileUrl && !isImage && (
                  <div className="mt-3">
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                      <ExternalLink size={14} /> View Attachment
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HomeworkPage;
