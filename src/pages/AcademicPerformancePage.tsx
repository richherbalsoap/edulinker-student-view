import { useEffect, useState, useMemo } from "react";
import { useStudentAuth } from "@/context/StudentAuthContext";
import { useDateFilter } from "@/context/DateFilterContext";
import { useDeletedItems } from "@/context/DeletedItemsContext";
import { supabase } from "@/integrations/supabase/client";
import { applyCreatedAtFilter, applySchoolScopeFilter } from "@/lib/queryFilters";
import {
  TrendingUp,
  TrendingDown,
  Award,
  BookOpen,
  BarChart3,
  Trophy,
  Info,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
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
} from "recharts";

// ── Grade scale (used everywhere) ─────────────────────────────────────────
const GRADE_SCALE = [
  {
    min: 90,
    grade: "A+",
    label: "90–100%",
    desc: "Excellent",
    color: "#22c55e",
    bg: "bg-green-500/15",
    border: "border-green-500/30",
    text: "text-green-400",
  },
  {
    min: 75,
    grade: "A",
    label: "75–89%",
    desc: "Very Good",
    color: "#4ade80",
    bg: "bg-green-500/10",
    border: "border-green-400/25",
    text: "text-green-400",
  },
  {
    min: 60,
    grade: "B",
    label: "60–74%",
    desc: "Good",
    color: "#3b82f6",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    text: "text-blue-400",
  },
  {
    min: 50,
    grade: "C",
    label: "50–59%",
    desc: "Average",
    color: "#eab308",
    bg: "bg-yellow-500/15",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
  },
  {
    min: 35,
    grade: "D",
    label: "35–49%",
    desc: "Below Avg",
    color: "#f97316",
    bg: "bg-orange-500/15",
    border: "border-orange-500/30",
    text: "text-orange-400",
  },
  {
    min: 0,
    grade: "F",
    label: "0–34%",
    desc: "Fail",
    color: "#ef4444",
    bg: "bg-red-500/15",
    border: "border-red-500/30",
    text: "text-red-400",
  },
];
const getGrade = (p: number) => GRADE_SCALE.find((g) => p >= g.min) ?? GRADE_SCALE[GRADE_SCALE.length - 1];
const pctColor = (p: number) => getGrade(p).color;

const EXAM_TABS = [
  { key: "all", label: "All Exams" },
  { key: "Unit Test", label: "Unit Test" },
  { key: "Mid Term", label: "Mid Term" },
  { key: "Final Exam", label: "Final Exam" },
];
const EXAM_ORDER = ["Unit Test", "Mid Term", "Final Exam"];
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

const weightedPct = (items: any[]) => {
  const ob = items.reduce((s, r) => s + parseFloat(r.marks_obtained || 0), 0);
  const tot = items.reduce((s, r) => s + parseFloat(r.total_marks || 0), 0);
  return tot > 0 ? Math.round((ob / tot) * 10000) / 100 : 0;
};

// ── Custom bar tooltip ─────────────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].value;
  const g = getGrade(p);
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-white/60 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-white font-bold">{p}%</span>
        <span className={`text-xs px-1.5 py-0.5 rounded border font-bold ${g.bg} ${g.border} ${g.text}`}>
          {g.grade}
        </span>
      </div>
    </div>
  );
};

// ── Trend Table component ──────────────────────────────────────────────────
// Replaces confusing line chart — shows subject × exam grid with ↑↓ arrows
const TrendTable = ({ allActive }: { allActive: any[] }) => {
  const subjects = useMemo(() => [...new Set(allActive.map((r: any) => r.subject as string))], [allActive]);

  const exams = useMemo(() => {
    const present = [...new Set(allActive.map((r: any) => r.exam_name || "Others"))] as string[];
    return present.sort((a, b) => {
      const ai = EXAM_ORDER.indexOf(a),
        bi = EXAM_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [allActive]);

  const scoreMap = useMemo(() => {
    const m: Record<string, Record<string, { ob: number; tot: number }>> = {};
    allActive.forEach((r: any) => {
      const ex = r.exam_name || "Others";
      if (!m[r.subject]) m[r.subject] = {};
      if (!m[r.subject][ex]) m[r.subject][ex] = { ob: 0, tot: 0 };
      m[r.subject][ex].ob += parseFloat(r.marks_obtained || 0);
      m[r.subject][ex].tot += parseFloat(r.total_marks || 0);
    });
    return m;
  }, [allActive]);

  if (exams.length < 2) return null;

  return (
    <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
      <h2 className="text-base font-semibold text-primary mb-1">Performance Trend</h2>
      <p className="text-foreground/35 text-xs mb-4">
        Each subject's score per exam. The <span className="text-green-400 font-semibold">Trend</span> column shows
        improvement (+) or drop (−) from first to last exam.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-foreground/40 text-xs font-semibold pb-3 pr-4">Subject</th>
              {exams.map((ex) => (
                <th key={ex} className="text-center text-foreground/40 text-xs font-semibold pb-3 px-2 min-w-[75px]">
                  {ex}
                </th>
              ))}
              <th className="text-center text-foreground/40 text-xs font-semibold pb-3 px-2">Trend</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subj, si) => {
              const scores = exams.map((ex) => {
                const d = scoreMap[subj]?.[ex];
                return d && d.tot > 0 ? Math.round((d.ob / d.tot) * 10000) / 100 : null;
              });
              const nonNull = scores.filter((s): s is number => s !== null);
              const diff =
                nonNull.length >= 2 ? Math.round((nonNull[nonNull.length - 1] - nonNull[0]) * 10) / 10 : null;

              return (
                <tr key={subj} className="border-b border-white/5 last:border-0">
                  {/* Subject name */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: SUBJECT_COLORS[si % SUBJECT_COLORS.length] }}
                      />
                      <span className="text-foreground/75 text-xs sm:text-sm font-medium">{subj}</span>
                    </div>
                  </td>

                  {/* Score per exam */}
                  {scores.map((score, ei) => {
                    if (score === null)
                      return (
                        <td key={ei} className="py-3 px-2 text-center">
                          <span className="text-foreground/20 text-xs">—</span>
                        </td>
                      );
                    const g = getGrade(score);
                    return (
                      <td key={ei} className="py-3 px-2 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className={`text-sm font-bold ${g.text}`}>{score}%</span>
                          <span className={`text-[10px] px-1 rounded border font-bold ${g.bg} ${g.border} ${g.text}`}>
                            {g.grade}
                          </span>
                        </div>
                      </td>
                    );
                  })}

                  {/* Trend arrow */}
                  <td className="py-3 px-2 text-center">
                    {diff === null ? (
                      <span className="text-foreground/20 text-xs">—</span>
                    ) : diff > 0 ? (
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <ArrowUp size={13} className="text-green-400" />
                        <span className="text-green-400 text-[10px] font-bold">+{diff}%</span>
                      </div>
                    ) : diff < 0 ? (
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <ArrowDown size={13} className="text-red-400" />
                        <span className="text-red-400 text-[10px] font-bold">{diff}%</span>
                      </div>
                    ) : (
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <Minus size={13} className="text-foreground/30" />
                        <span className="text-foreground/30 text-[10px]">Same</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────
const AcademicPerformancePage = () => {
  const { student, schoolId } = useStudentAuth();
  const { filterType, filterStartDate: startDate, filterEndDate: endDate } = useDateFilter();
  const { isDeleted } = useDeletedItems();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [examFilter, setExamFilter] = useState("all");
  const [showGradeInfo, setShowGradeInfo] = useState(false);

  useEffect(() => {
    if (!student) return;
    const fetchData = async () => {
      setLoading(true);
      let query = supabase.from("results").select("*").eq("student_id", student.id);
      query = applySchoolScopeFilter(query, schoolId, filterType === "all");
      query = applyCreatedAtFilter(query, filterType, startDate, endDate);
      const { data } = await query.order("created_at", { ascending: true });
      setResults(data || []);
      setLoading(false);
    };
    fetchData();
  }, [student, schoolId, filterType, startDate, endDate]);

  const allActive = useMemo(() => results.filter((r) => !isDeleted(r.id)), [results, isDeleted]);

  const activeResults = useMemo(
    () => (examFilter === "all" ? allActive : allActive.filter((r) => r.exam_name === examFilter)),
    [allActive, examFilter],
  );

  const availableExams = useMemo(() => {
    const present = new Set(allActive.map((r) => r.exam_name || "Others"));
    return EXAM_TABS.filter((t) => t.key === "all" || present.has(t.key));
  }, [allActive]);

  const subjectPerformance = useMemo(() => {
    const map: Record<string, { ob: number; tot: number; count: number }> = {};
    activeResults.forEach((r) => {
      if (!map[r.subject]) map[r.subject] = { ob: 0, tot: 0, count: 0 };
      map[r.subject].ob += parseFloat(r.marks_obtained || 0);
      map[r.subject].tot += parseFloat(r.total_marks || 0);
      map[r.subject].count += 1;
    });
    return Object.entries(map)
      .map(([subject, d], i) => ({
        subject,
        shortSubject: subject.length > 9 ? subject.slice(0, 8) + "…" : subject,
        ob: d.ob,
        tot: d.tot,
        count: d.count,
        pct: d.tot > 0 ? Math.round((d.ob / d.tot) * 10000) / 100 : 0,
        color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [activeResults]);

  const overallPct = useMemo(() => weightedPct(activeResults), [activeResults]);
  const bestSubject = subjectPerformance[0];
  const weakSubject = subjectPerformance[subjectPerformance.length - 1];
  const overallGrade = getGrade(overallPct);
  const hasData = activeResults.length > 0;
  const radarData = subjectPerformance.map((s) => ({ subject: s.shortSubject, pct: s.pct }));

  return (
    <div className="space-y-4 sm:space-y-5 relative z-10 px-3 sm:px-4 py-4 sm:py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center">Academic Performance</h1>

      {/* ── Grade Scale Info Box ─────────────────────────────────────── */}
      <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowGradeInfo((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info size={14} className="text-primary" />
            <span className="text-foreground/60 text-xs font-semibold uppercase tracking-wider">Grade Scale</span>
            <span className="text-foreground/30 text-xs">
              — tap to {showGradeInfo ? "hide" : "see"} grading criteria
            </span>
          </div>
          <span className={`text-xs font-bold ${showGradeInfo ? "text-primary" : "text-foreground/30"}`}>
            {showGradeInfo ? "▲" : "▼"}
          </span>
        </button>
        {showGradeInfo && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {GRADE_SCALE.map((g) => (
                <div key={g.grade} className={`rounded-lg border p-2.5 text-center ${g.bg} ${g.border}`}>
                  <p className={`text-2xl font-black ${g.text}`}>{g.grade}</p>
                  <p className={`text-xs font-bold mt-0.5 ${g.text}`}>{g.label}</p>
                  <p className="text-foreground/40 text-[10px] mt-0.5">{g.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-foreground/25 text-[10px] mt-3">
              Grades are calculated using weighted percentage: total marks obtained ÷ total marks possible × 100
            </p>
          </div>
        )}
      </div>

      {/* ── Exam Filter Tabs ─────────────────────────────────────────── */}
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

      {/* ── Stat Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            icon: TrendingUp,
            label: "Overall",
            value: hasData ? `${overallPct}%` : "--",
            sub: hasData ? `Grade ${overallGrade.grade}` : "",
          },
          { icon: BookOpen, label: "Subjects", value: subjectPerformance.length || "--", sub: "" },
          {
            icon: Award,
            label: "Best Subject",
            value: bestSubject?.subject ?? "--",
            sub: bestSubject ? `${bestSubject.pct}%` : "",
          },
          {
            icon: TrendingDown,
            label: "Needs Work",
            value: weakSubject?.subject ?? "--",
            sub: weakSubject ? `${weakSubject.pct}%` : "",
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
          {/* ── Overall Grade Banner ─────────────────────────────────── */}
          <div
            className={`rounded-xl border px-5 py-4 flex items-center justify-between ${overallGrade.bg} ${overallGrade.border}`}
          >
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider opacity-60 ${overallGrade.text}`}>
                {examFilter === "all" ? "Overall Performance" : examFilter}
              </p>
              <p className={`text-2xl font-bold mt-0.5 ${overallGrade.text}`}>
                {overallPct}% &nbsp;·&nbsp; Grade {overallGrade.grade}
              </p>
              <p className={`text-xs opacity-50 mt-0.5 ${overallGrade.text}`}>
                {subjectPerformance.length} subject{subjectPerformance.length !== 1 ? "s" : ""} · {activeResults.length}{" "}
                result{activeResults.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Trophy size={40} className={`opacity-25 shrink-0 ${overallGrade.text}`} />
          </div>

          {/* ── Bar Chart + Detailed Breakdown ───────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-primary mb-4">Subject Scores</h2>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectPerformance} barSize={26} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="shortSubject"
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={11}
                      tick={{ fill: "rgba(255,255,255,0.45)" }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.3)"
                      fontSize={11}
                      domain={[0, 100]}
                      tick={{ fill: "rgba(255,255,255,0.35)" }}
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

            <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-primary mb-4">Detailed Breakdown</h2>
              <div className="space-y-3">
                {subjectPerformance.map((s) => {
                  const g = getGrade(s.pct);
                  return (
                    <div key={s.subject}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground/75 text-xs sm:text-sm font-medium">{s.subject}</span>
                          {s.count > 1 && <span className="text-foreground/30 text-xs">({s.count}×)</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] px-1.5 py-0.5 rounded border font-black ${g.bg} ${g.border} ${g.text}`}
                          >
                            {g.grade}
                          </span>
                          <span className={`text-sm font-bold ${g.text}`}>{s.pct}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                        <div
                          style={{ width: `${Math.min(s.pct, 100)}%`, background: g.color }}
                          className="h-full rounded-full transition-all duration-700"
                        />
                      </div>
                      <p className="text-foreground/25 text-[10px] mt-0.5 text-right">
                        {s.ob}/{s.tot} marks
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Radar Chart ───────────────────────────────────────────── */}
          {subjectPerformance.length >= 3 && (
            <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 sm:p-6">
              <h2 className="text-base font-semibold text-primary mb-1">Performance Radar</h2>
              <p className="text-foreground/35 text-xs mb-4">
                Visual shape of academic strengths — wider = stronger overall
              </p>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
                      tickCount={4}
                    />
                    <Radar
                      name="Score"
                      dataKey="pct"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.22}
                      dot={{ r: 3, fill: "#3b82f6" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Trend Table — replaces broken line chart ──────────────── */}
          {examFilter === "all" && <TrendTable allActive={allActive} />}
        </>
      )}
    </div>
  );
};

export default AcademicPerformancePage;
