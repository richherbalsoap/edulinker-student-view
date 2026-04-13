import { useEffect, useState, useCallback } from "react";
import { useStudentAuth } from "@/context/StudentAuthContext";
import { useDateFilter } from "@/context/DateFilterContext";
import { supabase } from "@/integrations/supabase/client";
import { applyCreatedAtFilter, applySchoolScopeFilter } from "@/lib/queryFilters";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { FileText, ExternalLink } from "lucide-react";
import DeleteButton from '@/components/DeleteButton';
import { useDeletedItems } from '@/context/DeletedItemsContext';

const SUPABASE_URL = "https://sdvxekymbfyrznhuvvtj.supabase.co";

const getFilePublicUrl = (filePath: string) => {
  if (!filePath) return "";
  if (filePath.startsWith("http")) return filePath;
  return `${SUPABASE_URL}/storage/v1/object/public/edulinker-files/${filePath}`;
};

const isImageFile = (filePath: string) => {
  if (!filePath) return false;
  const lower = filePath.toLowerCase();
  return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp");
};

const ResultsPage = () => {
  const { student, schoolId } = useStudentAuth();
  const { filterType, filterStartDate: startDate, filterEndDate: endDate } = useDateFilter();
  const { isDeleted } = useDeletedItems();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    let query = supabase.from("results").select("*").eq("student_id", student.id);
    query = applySchoolScopeFilter(query, schoolId, filterType === 'all');
    query = applyCreatedAtFilter(query, filterType, startDate, endDate);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) console.error("Results fetch error:", error.message);
    setResults(data || []);
    setLoading(false);
  }, [student, schoolId, filterType, startDate, endDate]);

  useEffect(() => { fetchResults(); }, [fetchResults]);
  useRealtimeSubscription('results', fetchResults, !!student);

  const filtered = results.filter(r => !isDeleted(r.id));

  return (
    <div className="space-y-4 sm:space-y-6 relative z-10 px-3 sm:px-4 py-4 sm:py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center">Results</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-8 sm:p-12 text-center">
          <FileText size={48} className="text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/50 text-lg">No results available yet.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {filtered.map(r => {
              const fileUrl = r.file_url ? getFilePublicUrl(r.file_url) : null;
              const isImage = r.file_url ? isImageFile(r.file_url) : false;
              return (
                <div key={r.id} className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-primary font-semibold text-sm">{r.subject}</p>
                      <p className="text-foreground/80 text-xs mt-1">
                        {r.marks_obtained}/{r.total_marks}
                        <span className={`ml-2 font-semibold ${r.percentage >= 75 ? "text-green-400" : r.percentage >= 50 ? "text-primary" : "text-destructive"}`}>
                          ({r.percentage}%)
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {fileUrl && isImage ? (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                          <img src={fileUrl} alt={r.subject} className="w-12 h-12 object-cover rounded-lg border border-primary/10" />
                        </a>
                      ) : fileUrl ? (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs flex items-center gap-1">
                          <ExternalLink size={12} /> View
                        </a>
                      ) : null}
                      <DeleteButton id={r.id} type="results" data={r} />
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
                    <th className="text-left px-6 py-4 text-primary text-sm font-semibold w-[25%]">Subject</th>
                    <th className="text-center px-6 py-4 text-primary text-sm font-semibold w-[20%]">Marks</th>
                    <th className="text-center px-6 py-4 text-primary text-sm font-semibold w-[15%]">Total</th>
                    <th className="text-center px-6 py-4 text-primary text-sm font-semibold w-[15%]">%</th>
                    <th className="text-center px-6 py-4 text-primary text-sm font-semibold w-[25%]">File</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const fileUrl = r.file_url ? getFilePublicUrl(r.file_url) : null;
                    const isImage = r.file_url ? isImageFile(r.file_url) : false;
                    return (
                      <tr key={r.id} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 text-foreground font-medium">{r.subject}</td>
                        <td className="px-6 py-4 text-foreground/80 text-center">{r.marks_obtained}</td>
                        <td className="px-6 py-4 text-foreground/80 text-center">{r.total_marks}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-semibold ${r.percentage >= 75 ? "text-green-400" : r.percentage >= 50 ? "text-primary" : "text-destructive"}`}>
                            {r.percentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {fileUrl && isImage ? (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                              <img src={fileUrl} alt={r.subject} className="w-20 h-20 object-cover rounded-lg border border-primary/10 mx-auto" />
                            </a>
                          ) : fileUrl ? (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-sm">
                              <ExternalLink size={14} /> View
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                          <DeleteButton id={r.id} type="results" data={r} />
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

export default ResultsPage;
