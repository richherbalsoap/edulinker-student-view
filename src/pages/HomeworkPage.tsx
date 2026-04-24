import { useEffect, useState, useCallback } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { useDateFilter } from '@/context/DateFilterContext';
import { supabase } from '@/integrations/supabase/client';
import { applyCreatedAtFilter, applySchoolScopeFilter } from '@/lib/queryFilters';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

import { BookOpen, ExternalLink } from 'lucide-react';
import DeleteButton from '@/components/DeleteButton';
import { useDeletedItems } from '@/context/DeletedItemsContext';

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
  const { filterType, filterStartDate: startDate, filterEndDate: endDate } = useDateFilter();
  const { isDeleted } = useDeletedItems();
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHomework = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    let query = supabase
      .from('homework')
      .select('*')
      .ilike('standard', student.standard)
      .ilike('section', student.section);

    query = applySchoolScopeFilter(query, schoolId, filterType === 'all');
    query = applyCreatedAtFilter(query, filterType, startDate, endDate);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) console.error('Homework fetch error:', error.message);
    setHomework(data || []);
    setLoading(false);
  }, [student, schoolId, filterType, startDate, endDate]);

  useEffect(() => { fetchHomework(); }, [fetchHomework]);
  useRealtimeSubscription('homework', fetchHomework, !!student);

  return (
    <div className="space-y-4 sm:space-y-6 relative z-10 px-3 sm:px-4 py-4 sm:py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center">Homework</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : homework.filter(hw => !isDeleted(hw.id)).length === 0 ? (
        <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-8 sm:p-12 text-center">
          <BookOpen size={48} className="text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/50 text-lg">No homework assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-3 sm:hidden">
          {homework.filter(hw => !isDeleted(hw.id)).map(hw => {
            const fileUrl = hw.file_url ? getFilePublicUrl(hw.file_url) : null;
            const isImage = hw.file_url ? isImageFile(hw.file_url) : false;
            return (
              <div key={hw.id} className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-primary font-semibold text-sm">{hw.subject}</p>
                    <p className="text-foreground/80 text-xs mt-1 break-words">{hw.description}</p>
                    <p className="text-foreground/50 text-xs mt-1">
                      {new Date(hw.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {fileUrl && isImage ? (
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                        <img src={fileUrl} alt={`${hw.subject}`} className="w-12 h-12 object-cover rounded-lg border border-primary/10" />
                      </a>
                    ) : fileUrl ? (
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs flex items-center gap-1">
                        <ExternalLink size={12} /> View
                      </a>
                    ) : null}
                    <DeleteButton id={hw.id} type="homework" data={hw} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Desktop table */}
      {!loading && homework.filter(hw => !isDeleted(hw.id)).length > 0 && (
        <div className="hidden sm:block bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left px-6 py-4 text-primary text-sm font-semibold w-[25%]">Subject</th>
                  <th className="text-left px-6 py-4 text-primary text-sm font-semibold w-[30%]">Description</th>
                  <th className="text-center px-6 py-4 text-primary text-sm font-semibold w-[20%]">Date</th>
                  <th className="text-center px-6 py-4 text-primary text-sm font-semibold w-[25%]">File</th>
                </tr>
              </thead>
              <tbody>
                {homework.filter(hw => !isDeleted(hw.id)).map(hw => {
                  const fileUrl = hw.file_url ? getFilePublicUrl(hw.file_url) : null;
                  const isImage = hw.file_url ? isImageFile(hw.file_url) : false;
                  return (
                    <tr key={hw.id} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 text-foreground font-medium text-sm break-words">{hw.subject}</td>
                      <td className="px-6 py-4 text-foreground/80 text-sm break-words">{hw.description}</td>
                      <td className="px-6 py-4 text-foreground/80 text-center text-sm">
                        {new Date(hw.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                        {fileUrl && isImage ? (
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                            <img src={fileUrl} alt={`${hw.subject}`} className="w-20 h-20 object-cover rounded-lg border border-primary/10 mx-auto" />
                          </a>
                        ) : fileUrl ? (
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-sm">
                            <ExternalLink size={14} /> View
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                        <DeleteButton id={hw.id} type="homework" data={hw} />
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
