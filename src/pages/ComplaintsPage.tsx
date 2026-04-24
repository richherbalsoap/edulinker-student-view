import { useEffect, useState, useCallback } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { useDateFilter } from '@/context/DateFilterContext';
import { supabase } from '@/integrations/supabase/client';
import { applyCreatedAtFilter, applySchoolScopeFilter } from '@/lib/queryFilters';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

import { MessageSquare, ExternalLink } from 'lucide-react';
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

const ComplaintsPage = () => {
  const { student, schoolId } = useStudentAuth();
  const { filterType, filterStartDate: startDate, filterEndDate: endDate } = useDateFilter();
  const { isDeleted } = useDeletedItems();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    let query = supabase.from('complaints').select('*').eq('student_id', student.id);
    query = applySchoolScopeFilter(query, schoolId, filterType === 'all');
    query = applyCreatedAtFilter(query, filterType, startDate, endDate);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) console.error('Complaints fetch error:', error.message);
    setComplaints(data || []);
    setLoading(false);
  }, [student, schoolId, filterType, startDate, endDate]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);
  useRealtimeSubscription('complaints', fetchComplaints, !!student);
  useAppRefresh(fetchComplaints);

  const filtered = complaints.filter(c => !isDeleted(c.id));

  return (
    <div className="space-y-4 sm:space-y-6 relative z-10 px-3 sm:px-4 py-4 sm:py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center">Complaints</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-8 sm:p-12 text-center">
          <MessageSquare size={48} className="text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/50 text-lg">No complaints recorded.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {filtered.map(c => {
              const fileUrl = c.file_url ? getFilePublicUrl(c.file_url) : null;
              const isImage = c.file_url ? isImageFile(c.file_url) : false;
              return (
                <div key={c.id} className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground/80 text-sm break-words">{c.description}</p>
                      <p className="text-foreground/50 text-xs mt-1">
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {fileUrl && isImage ? (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                          <img src={fileUrl} alt="Complaint" className="w-12 h-12 object-cover rounded-lg border border-primary/10" />
                        </a>
                      ) : fileUrl ? (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs flex items-center gap-1">
                          <ExternalLink size={12} /> View
                        </a>
                      ) : null}
                      <DeleteButton id={c.id} type="complaints" data={c} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th className="text-left px-6 py-4 text-primary text-sm font-semibold w-[50%]">Description</th>
                    <th className="text-center px-6 py-4 text-primary text-sm font-semibold w-[25%]">Date</th>
                    <th className="text-center px-6 py-4 text-primary text-sm font-semibold w-[25%]">File</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const fileUrl = c.file_url ? getFilePublicUrl(c.file_url) : null;
                    const isImage = c.file_url ? isImageFile(c.file_url) : false;
                    return (
                      <tr key={c.id} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 text-foreground/80 break-words">{c.description}</td>
                        <td className="px-6 py-4 text-foreground/80 text-center text-sm">
                          {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {fileUrl && isImage ? (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                              <img src={fileUrl} alt="Complaint" className="w-20 h-20 object-cover rounded-lg border border-primary/10 mx-auto" />
                            </a>
                          ) : fileUrl ? (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-sm">
                              <ExternalLink size={14} /> View
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                          <DeleteButton id={c.id} type="complaints" data={c} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ComplaintsPage;
