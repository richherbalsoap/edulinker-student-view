import { useEffect, useState, useCallback } from "react";
import { useStudentAuth } from "@/context/StudentAuthContext";
import { useDateFilter } from "@/context/DateFilterContext";
import { supabase } from "@/integrations/supabase/client";
import { applyCreatedAtFilter, applySchoolScopeFilter } from "@/lib/queryFilters";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { FileText, ExternalLink, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import DeleteButton from "@/components/DeleteButton";
import { useDeletedItems } from "@/context/DeletedItemsContext";

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

const pctColor = (pct: number) => (pct >= 75 ? "text-green-400" : pct >= 50 ? "text-primary" : "text-destructive");

const pctBg = (pct: number) =>
  pct >= 75
    ? "bg-green-400/10 border-green-400/30"
    : pct >= 50
      ? "bg-primary/10 border-primary/30"
      : "bg-destructive/10 border-destructive/30";

// Group results by exam_name (fallback: "Others")
const groupByExam = (results: any[]) => {
  const map: Record<string, any[]> = {};
  for (const r of results) {
    const key = r.exam_name?.trim() || "Others";
    if (!map[key]) map[key] = [];
    map[key].push(r);
  }
  // Sort exam groups: Unit Test → Mid Term → Final Exam → Others
  const order = ["Unit Test", "Mid Term", "Final Exam"];
  return Object.entries(map).sort(([a], [b]) => {
    const ai = order.indexOf(a),
      bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
};

// Compute overall subject-wise aggregate across all exams
const computeSubjectAggregates = (results: any[]) => {
  const map: Record<string, { obtained: number; total: number; count: number }> = {};
  for (const r of results) {
    const subj = r.subject;
    if (!map[subj]) map[subj] = { obtained: 0, total: 0, count: 0 };
    map[subj].obtained += parseFloat(r.marks_obtained);
    map[subj].total += parseFloat(r.total_marks);
    map[subj].count += 1;
  }
  return Object.entries(map)
    .map(([subject, d]) => ({
      subject,
      obtained: d.obtained,
      total: d.total,
      count: d.count,
      percentage: d.total > 0 ? Math.round((d.obtained / d.total) * 100 * 100) / 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);
};

const ResultsPage = () => {
  const { student, schoolId } = useStudentAuth();
  const { filterType, filterStartDate: startDate, filterEndDate: endDate } = useDateFilter();
  const { isDeleted } = useDeletedItems();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedExams, setCollapsedExams] = useState<Record<string, boolean>>({});
  const [showOverall, setShowOverall] = useState(true);

  const fetchResults = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    let query = supabase.from("results").select("*").eq("student_id", student.id);
    query = applySchoolScopeFilter(query, schoolId, filterType === "all");
    query = applyCreatedAtFilter(query, filterType, startDate, endDate);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) console.error("Results fetch error:", error.message);
    setResults(data || []);
    setLoading(false);
  }, [student, schoolId, filterType, startDate, endDate]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);
  useRealtimeSubscription("results", fetchResults, !!student);

  const filtered = results.filter((r) => !isDeleted(r.id));
  const grouped = groupByExam(filtered);
  const aggregates = computeSubjectAggregates(filtered);
  const hasMultipleExams = grouped.length > 1;

  const toggleExam = (examName: string) => {
    setCollapsedExams((prev) => ({ ...prev, [examName]: !prev[examName] }));
  };

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
          {/* ── Overall Subject Summary (shown only when multiple exams exist) ── */}
          {hasMultipleExams && (
            <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowOverall((v) => !v)}
                className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary" />
                  <span className="text-primary font-semibold text-sm sm:text-base">Overall Performance</span>
                  <span className="text-foreground/40 text-xs">(all exams combined)</span>
                </div>
                {showOverall ? (
                  <ChevronUp size={16} className="text-foreground/40" />
                ) : (
                  <ChevronDown size={16} className="text-foreground/40" />
                )}
              </button>

              {showOverall && (
                <div className="px-4 sm:px-6 pb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {aggregates.map((a) => (
                    <div key={a.subject} className={`rounded-lg border p-3 ${pctBg(a.percentage)}`}>
                      <p className="text-foreground font-semibold text-xs sm:text-sm truncate">{a.subject}</p>
                      <p className={`text-lg font-bold mt-1 ${pctColor(a.percentage)}`}>{a.percentage}%</p>
                      <p className="text-foreground/50 text-xs">
                        {a.obtained}/{a.total} · {a.count} exam{a.count > 1 ? "s" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Exam-wise Groups ── */}
          {grouped.map(([examName, examResults]) => {
            const isCollapsed = collapsedExams[examName] ?? false;
            // Exam-level aggregate
            const totalObtained = examResults.reduce((s, r) => s + parseFloat(r.marks_obtained), 0);
            const totalMax = examResults.reduce((s, r) => s + parseFloat(r.total_marks), 0);
            const examPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100 * 100) / 100 : 0;

            return (
              <div
                key={examName}
                className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl overflow-hidden"
              >
                {/* Exam Header */}
                <button
                  onClick={() => toggleExam(examName)}
                  className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-foreground font-semibold text-sm sm:text-base">{examName}</span>
                    <span className="text-foreground/40 text-xs">
                      {examResults.length} subject{examResults.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${pctColor(examPct)}`}>{examPct}%</span>
                    <span className="text-foreground/40 text-xs hidden sm:inline">
                      {totalObtained}/{totalMax}
                    </span>
                    {isCollapsed ? (
                      <ChevronDown size={16} className="text-foreground/40" />
                    ) : (
                      <ChevronUp size={16} className="text-foreground/40" />
                    )}
                  </div>
                </button>

                {!isCollapsed && (
                  <>
                    {/* Mobile cards */}
                    <div className="space-y-2 px-3 pb-3 sm:hidden">
                      {examResults.map((r) => {
                        const fileUrl = r.file_url ? getFilePublicUrl(r.file_url) : null;
                        const isImage = r.file_url ? isImageFile(r.file_url) : false;
                        return (
                          <div key={r.id} className="bg-background/20 border border-primary/10 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-primary font-semibold text-sm">{r.subject}</p>
                                <p className="text-foreground/80 text-xs mt-1">
                                  {r.marks_obtained}/{r.total_marks}
                                  <span className={`ml-2 font-semibold ${pctColor(r.percentage)}`}>
                                    ({r.percentage}%)
                                  </span>
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {fileUrl && isImage ? (
                                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={fileUrl}
                                      alt={r.subject}
                                      className="w-12 h-12 object-cover rounded-lg border border-primary/10"
                                    />
                                  </a>
                                ) : fileUrl ? (
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary text-xs flex items-center gap-1"
                                  >
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
                    <div className="hidden sm:block overflow-x-auto border-t border-primary/10">
                      <table className="w-full table-fixed">
                        <thead>
                          <tr className="border-b border-primary/10 bg-background/10">
                            <th className="text-left px-6 py-3 text-primary/70 text-xs font-semibold w-[30%]">
                              Subject
                            </th>
                            <th className="text-center px-6 py-3 text-primary/70 text-xs font-semibold w-[18%]">
                              Marks
                            </th>
                            <th className="text-center px-6 py-3 text-primary/70 text-xs font-semibold w-[15%]">
                              Total
                            </th>
                            <th className="text-center px-6 py-3 text-primary/70 text-xs font-semibold w-[15%]">%</th>
                            <th className="text-center px-6 py-3 text-primary/70 text-xs font-semibold w-[22%]">
                              File
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {examResults.map((r) => {
                            const fileUrl = r.file_url ? getFilePublicUrl(r.file_url) : null;
                            const isImage = r.file_url ? isImageFile(r.file_url) : false;
                            return (
                              <tr
                                key={r.id}
                                className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                              >
                                <td className="px-6 py-3 text-foreground font-medium text-sm">{r.subject}</td>
                                <td className="px-6 py-3 text-foreground/80 text-center text-sm">{r.marks_obtained}</td>
                                <td className="px-6 py-3 text-foreground/80 text-center text-sm">{r.total_marks}</td>
                                <td className="px-6 py-3 text-center">
                                  <span className={`font-semibold text-sm ${pctColor(r.percentage)}`}>
                                    {r.percentage}%
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-center">
                                  {fileUrl && isImage ? (
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                      <img
                                        src={fileUrl}
                                        alt={r.subject}
                                        className="w-16 h-16 object-cover rounded-lg border border-primary/10 mx-auto"
                                      />
                                    </a>
                                  ) : fileUrl ? (
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                                    >
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
                          {/* Exam subtotal row */}
                          <tr className="bg-primary/5 border-t border-primary/20">
                            <td className="px-6 py-3 text-foreground/70 text-xs font-semibold">Total ({examName})</td>
                            <td className="px-6 py-3 text-center text-foreground/70 text-xs font-semibold">
                              {totalObtained}
                            </td>
                            <td className="px-6 py-3 text-center text-foreground/70 text-xs font-semibold">
                              {totalMax}
                            </td>
                            <td className="px-6 py-3 text-center">
                              <span className={`text-sm font-bold ${pctColor(examPct)}`}>{examPct}%</span>
                            </td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default ResultsPage;
