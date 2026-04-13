import { useEffect, useState, useMemo } from "react";
import { useStudentAuth } from "@/context/StudentAuthContext";
import { useDateFilter } from "@/context/DateFilterContext";
import { useDeletedItems } from "@/context/DeletedItemsContext";
import { supabase } from "@/integrations/supabase/client";
import { applyCreatedAtFilter, applySchoolScopeFilter } from "@/lib/queryFilters";
import { TrendingUp, TrendingDown, Award, BookOpen, BarChart3, Trophy } from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

// ── Exam filter options (matches DB values exactly)
const EXAM_TABS = [
  { key: "all", label: "All Exams" },
  { key: "Unit Test", label: "Unit Test" },
  { key: "Mid Term", label: "Mid Term" },
  { key: "Final Exam", label: "Final Exam" },
];

const SUBJECT_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#eab308",
  "#ec4899",
  "#06b6d4",
  "#ef4444",
  "#6366f1",
  "#f97316",
  "#14b8a6",
];

const pctColor = (p: number) => (p >= 75 ? "#22c55e" : p >= 50 ? "#3b82f6" : "#ef4444");
const pctTextClass = (p: number) => (p >= 75 ? "text-green-400" : p >= 50 ? "text-primary" : "text-destructive");
const pctBgClass = (p: number) => (p >= 75 ? "bg-green-500" : p >= 50 ? "bg-blue-500" : "bg-red-500");
const gradeBadge = (p: number) => {
  if (p >= 90) return { grade: "A+", cls: "bg-green-500/20 text-green-400 border-green-500/40" };
  if (p >= 75) return { grade: "A", cls: "bg-green-500/20 text-green-400 border-green-500/40" };
  if (p >= 60) return { grade: "B", cls: "bg-blue-500/20 text-blue-400 border-blue-500/40" };
  if (p >= 50) return { grade: "C", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" };
  if (p >= 35) return { grade: "D", cls: "bg-orange-500/20 text-orange-400 border-orange-500/40" };
  return { grade: "F", cls: "bg-red-500/20 text-red-400 border-red-500/40" };
};

// Weighted % = total_obtained / total_max * 100  (more accurate than avg of %)
const weightedPct = (items: any[]) => {
  const ob = items.reduce((s, r) => s + parseFloat(r.marks_obtained || 0), 0);
  const tot = items.reduce((s, r) => s + parseFloat(r.total_marks || 0), 0);
  return tot > 0 ? Math.round((ob / tot) * 10000) / 100 : 0;
};

// Custom bar tooltip
const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].value;
  const { grade, cls } = gradeBadge(p);
  return (
    <div className="bg-[hsl(0,0%,6%)] border border-white/10 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-white/70 mb-1 font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-white font-bold">{p}%</span>
        <span className={`text-xs px-1.5 py-0.5 rounded border font-bold ${cls}`}>{grade}</span>
      </div>
    </div>
  );
};

const AcademicPerformancePage = () => {
  const { student, schoolId } = useStudentAuth();
  const { filterType, filterStartDate: startDate, filterEndDate: endDate } = useDateFilter();
  const { isDeleted } = useDeletedItems();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [examFilter, setExamFilter] = useState<string>("all");

  useEffect(() => {
    if (!student) return;
    const fetch = async () => {
      setLoading(true);
      let query = supabase.from("results").select("*").eq("student_id", student.id);
      query = applySchoolScopeFilter(query, schoolId, filterType === "all");
      query = applyCreatedAtFilter(query, filterType, startDate, endDate);
      const { data } = await query.order("created_at", { ascending: true });
      setResults(data || []);
      setLoading(false);
    };
    fetch();
  }, [student, schoolId, filterType, startDate, endDate]);

  // All active (not soft-deleted)
  const allActive = useMemo(() => results.filter((r) => !isDeleted(r.id)), [results, isDeleted]);

  // Exam-filtered view
  const activeResults = useMemo(
    () => (examFilter === "all" ? allActive : allActive.filter((r) => r.exam_name === examFilter)),
    [allActive, examFilter],
  );

  // Which exam tabs actually have data?
  const availableExams = useMemo(() => {
    const present = new Set(allActive.map((r) => r.exam_name || "Others"));
    return EXAM_TABS.filter((t) => t.key === "all" || present.has(t.key));
  }, [allActive]);

  // Subject performance for selected exam filter
  const subjectPerformance = useMemo(() => {
    const map: Record<string, { obtained: number; total: number; count: number }> = {};
    activeResults.forEach((r) => {
      if (!map[r.subject]) map[r.subject] = { obtained: 0, total: 0, count: 0 };
      map[r.subject].obtained += parseFloat(r.marks_obtained || 0);
      map[r.subject].total += parseFloat(r.total_marks || 0);
      map[r.subject].count += 1;
    });
    return Object.entries(map)
      .map(([subject, d], i) => ({
        subject,
        shortSubject: subject.length > 8 ? subject.slice(0, 7) + "…" : subject,
        obtained: d.obtained,
        total: d.total,
        count: d.count,
        pct: d.total > 0 ? Math.round((d.obtained / d.total) * 10000) / 100 : 0,
        color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [activeResults]);

  const overallPct = useMemo(() => weightedPct(activeResults), [activeResults]);
  const bestSubject = subjectPerformance[0]?.subject ?? "--";
  const weakSubject = subjectPerformance[subjectPerformance.length - 1]?.subject ?? "--";
  const { grade: overallGrade, cls: overallGradeCls } = gradeBadge(overallPct);

  // Trend: group by exam_name, then by date within each exam
  // X-axis = exam_name ordering (Unit Test → Mid Term → Final Exam)
  const trendData = useMemo(() => {
    const examOrder = ["Unit Test", "Mid Term", "Final Exam"];
    const subjects = [...new Set(allActive.map((r) => r.subject))];

    // Build map: examName → subject → weighted pct
    const examMap: Record<string, Record<string, { ob: number; tot: number }>> = {};
    allActive.forEach((r) => {
      const ex = r.exam_name || "Others";
      if (!examMap[ex]) examMap[ex] = {};
      if (!examMap[ex][r.subject]) examMap[ex][r.subject] = { ob: 0, tot: 0 };
      examMap[ex][r.subject].ob += parseFloat(r.marks_obtained || 0);
      examMap[ex][r.subject].tot += parseFloat(r.total_marks || 0);
    });

    const sortedExams = Object.keys(examMap).sort((a, b) => {
      const ai = examOrder.indexOf(a),
        bi = examOrder.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    const data = sortedExams.map((ex) => {
      const point: any = { exam: ex };
      subjects.forEach((subj) => {
        const d = examMap[ex]?.[subj];
        point[subj] = d && d.tot > 0 ? Math.round((d.ob / d.tot) * 10000) / 100 : null;
      });
      return point;
    });

    return { data, subjects };
  }, [allActive]);

  // Radar data (for current filter)
  const radarData = subjectPerformance.map((s) => ({ subject: s.shortSubject, pct: s.pct }));

  const hasData = activeResults.length > 0;

  return (
    <div className="space-y-5 relative z-10 px-3 sm:px-4 py-4 sm:py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center">Academic Performance</h1>

      {/* ── Exam Filter Tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {availableExams.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setExamFilter(tab.key)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-all ${
              examFilter === tab.key
                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_hsl(51,100%,50%,0.3)]"
                : "bg-card/30 text-foreground/60 border-primary/20 hover:border-primary/40 hover:text-foreground/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            icon: TrendingUp,
            label: "Overall",
            value: hasData ? `${overallPct}%` : "--",
            sub: hasData ? overallGrade : "",
          },
          { icon: BookOpen, label: "Subjects", value: subjectPerformance.length || "--", sub: "" },
          {
            icon: Award,
            label: "Best Subject",
            value: bestSubject,
            sub: hasData ? `${subjectPerformance[0]?.pct ?? 0}%` : "",
          },
          {
            icon: TrendingDown,
            label: "Needs Work",
            value: weakSubject,
            sub: hasData ? `${subjectPerformance[subjectPerformance.length - 1]?.pct ?? 0}%` : "",
          },
          { icon: BarChart3, label: "Results", value: activeResults.length || "--", sub: "" },
        ].map((card) => (
          <div key={card.label} className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={15} className="text-primary shrink-0" />
              <p className="text-foreground/50 text-xs truncate">{card.label}</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary truncate">{card.value}</p>
            {card.sub && <p className="text-foreground/40 text-xs mt-0.5">{card.sub}</p>}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !hasData ? (
        <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-12 text-center">
          <BookOpen size={48} className="text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/50 text-lg">No data for this filter.</p>
        </div>
      ) : (
        <>
          {/* ── Overall Grade Banner ── */}
          <div
            className={`rounded-xl border px-5 py-4 flex items-center justify-between ${overallGradeCls} border-current/30`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                {examFilter === "all" ? "Overall Performance" : examFilter}
              </p>
              <p className="text-2xl font-bold mt-0.5">
                {overallPct}% &nbsp;·&nbsp; Grade {overallGrade}
              </p>
              <p className="text-xs opacity-60 mt-0.5">
                Weighted across {subjectPerformance.length} subject{subjectPerformance.length !== 1 ? "s" : ""} ·{" "}
                {activeResults.length} result{activeResults.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Trophy size={40} className="opacity-30 shrink-0" />
          </div>

          {/* ── Subject Bar Chart + Progress Bars ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bar Chart */}
            <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-primary mb-4">Subject Scores</h2>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectPerformance} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="shortSubject"
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={11}
                      tick={{ fill: "rgba(255,255,255,0.5)" }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={11}
                      domain={[0, 100]}
                      tick={{ fill: "rgba(255,255,255,0.4)" }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="pct" radius={[5, 5, 0, 0]}>
                      {subjectPerformance.map((s) => (
                        <Cell key={s.subject} fill={pctColor(s.pct)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-primary mb-4">Detailed Breakdown</h2>
              <div className="space-y-3">
                {subjectPerformance.map((s) => {
                  const { grade, cls } = gradeBadge(s.pct);
                  return (
                    <div key={s.subject}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground/80 text-sm font-medium">{s.subject}</span>
                          {s.count > 1 && <span className="text-foreground/30 text-xs">({s.count} exams)</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded border font-bold ${cls}`}>{grade}</span>
                          <span className={`text-sm font-bold ${pctTextClass(s.pct)}`}>{s.pct}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                        <div
                          style={{ width: `${Math.min(s.pct, 100)}%` }}
                          className={`h-full ${pctBgClass(s.pct)} rounded-full transition-all duration-700`}
                        />
                      </div>
                      <p className="text-foreground/30 text-xs mt-0.5 text-right">
                        {s.obtained}/{s.total} marks
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Radar Chart (only if 3+ subjects) ── */}
          {subjectPerformance.length >= 3 && (
            <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-primary mb-2">Performance Radar</h2>
              <p className="text-foreground/40 text-xs mb-4">Overall shape of your academic strengths</p>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }}
                      tickCount={4}
                    />
                    <Radar
                      name="Score"
                      dataKey="pct"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.25}
                      dot={{ r: 3, fill: "#3b82f6" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Trend Chart across exams (only shown on "All Exams" with 2+ exam types) ── */}
          {examFilter === "all" && trendData.data.length >= 2 && (
            <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-primary mb-1">Performance Trend Across Exams</h2>
              <p className="text-foreground/40 text-xs mb-4">
                How each subject changed from Unit Test → Mid Term → Final Exam
              </p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData.data} margin={{ top: 4, right: 20, left: -15, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="exam"
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={11}
                      tick={{ fill: "rgba(255,255,255,0.5)" }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={11}
                      domain={[0, 100]}
                      tick={{ fill: "rgba(255,255,255,0.4)" }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0,0%,6%)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "white",
                        fontSize: 12,
                      }}
                      formatter={(value: any, name: string) => [`${value}%`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }} />
                    {trendData.subjects.map((subject, i) => (
                      <Line
                        key={subject}
                        type="monotone"
                        dataKey={subject}
                        stroke={SUBJECT_COLORS[i % SUBJECT_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                        connectNulls={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AcademicPerformancePage;
