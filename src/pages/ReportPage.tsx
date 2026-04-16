import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  FileText,
  BookOpen,
  Bell,
  MessageSquare,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Loader2,
  TrendingUp,
  Award,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentInfo {
  id: string;
  name: string;
  standard: string;
  section: string;
  roll_no: number | null;
  school_id: string;
}

interface Result {
  id: string;
  subject: string;
  exam_name: string | null;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  created_at: string;
  source: string;
}

interface Homework {
  id: string;
  subject: string;
  description: string;
  created_at: string;
  file_url: string | null;
}

interface Announcement {
  id: string;
  title: string | null;
  content: string | null;
  type: string | null;
  created_at: string;
}

interface Complaint {
  id: string;
  description: string;
  created_at: string;
  file_url: string | null;
}

interface FeeReminder {
  id: string;
  title: string | null;
  message: string;
  amount: number;
  created_at: string;
}

interface AllData {
  results: Result[];
  selfResults: Result[];
  homework: Homework[];
  announcements: Announcement[];
  complaints: Complaint[];
  fees: FeeReminder[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const percentColor = (pct: number) => {
  if (pct >= 75) return "text-green-400";
  if (pct >= 50) return "text-yellow-400";
  return "text-red-400";
};

const SectionHeader = ({
  icon: Icon,
  title,
  count,
  open,
  onToggle,
}: {
  icon: React.ElementType;
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-md border border-primary/20 rounded-xl text-left hover:border-primary/40 transition-all"
  >
    <div className="flex items-center gap-2">
      <Icon size={18} className="text-primary" />
      <span className="font-semibold text-foreground">{title}</span>
      <span className="ml-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{count}</span>
    </div>
    {open ? <ChevronUp size={16} className="text-primary/60" /> : <ChevronDown size={16} className="text-primary/60" />}
  </button>
);

const EmptyState = ({ text }: { text: string }) => (
  <p className="text-center text-foreground/40 text-sm py-6">{text}</p>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ReportPage = () => {
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [data, setData] = useState<AllData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState({
    results: true,
    homework: false,
    announcements: false,
    complaints: false,
    fees: false,
  });

  const toggle = (key: keyof typeof open) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const secretId = localStorage.getItem("studentSecretId");
        if (!secretId) throw new Error("Student not logged in.");

        // 1. Get student record by secret_id
        const { data: stdData, error: stdErr } = await supabase
          .from("students")
          .select("id, name, standard, section, roll_no, school_id")
          .eq("secret_id", secretId)
          .single();

        if (stdErr || !stdData) throw new Error("Student record not found.");
        setStudent(stdData);

        const sid = stdData.id;
        const schoolId = stdData.school_id;

        // 2. Fetch all data in parallel
        const [resResults, resSelfResults, resHomework, resAnnouncements, resComplaints, resFees] = await Promise.all([
          // Admin-uploaded results for this student
          supabase
            .from("results")
            .select("id, subject, exam_name, marks_obtained, total_marks, percentage, created_at, source")
            .eq("student_id", sid)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false }),

          // Self-uploaded results by student
          supabase
            .from("student_self_results")
            .select("id, subject, exam_name, marks_obtained, total_marks, percentage, created_at, source")
            .eq("student_id", sid)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false }),

          // Homework for this student's class + section
          supabase
            .from("homework")
            .select("id, subject, description, created_at, file_url")
            .eq("school_id", schoolId)
            .eq("standard", stdData.standard)
            .eq("section", stdData.section)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false }),

          // School-wide announcements
          supabase
            .from("announcements")
            .select("id, title, content, type, created_at")
            .eq("school_id", schoolId)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false }),

          // Complaints filed for this student
          supabase
            .from("complaints")
            .select("id, description, created_at, file_url")
            .eq("student_id", sid)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false }),

          // Fee reminders for this student
          supabase
            .from("fees_reminders")
            .select("id, title, message, amount, created_at")
            .eq("student_id", sid)
            .order("created_at", { ascending: false }),
        ]);

        const firstError = [resResults, resSelfResults, resHomework, resAnnouncements, resComplaints, resFees].find(
          (r) => r.error,
        )?.error;

        if (firstError) throw firstError;

        setData({
          results: resResults.data || [],
          selfResults: resSelfResults.data || [],
          homework: resHomework.data || [],
          announcements: resAnnouncements.data || [],
          complaints: resComplaints.data || [],
          fees: resFees.data || [],
        });
      } catch (err: any) {
        console.error("StudentReport fetch error:", err);
        setError(err.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!data) return null;
    const allResults = [...data.results, ...data.selfResults];
    const avgPct =
      allResults.length > 0
        ? Math.round(allResults.reduce((sum, r) => sum + Number(r.percentage), 0) / allResults.length)
        : null;
    const best = allResults.length > 0 ? allResults.reduce((a, b) => (a.percentage > b.percentage ? a : b)) : null;
    return { avgPct, best, totalResults: allResults.length };
  }, [data]);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-primary" size={36} />
        <p className="text-foreground/50 text-sm">Loading your data...</p>
      </div>
    );
  }

  if (error || !student || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-red-400">
        <AlertCircle size={32} />
        <p className="text-sm">{error || "Something went wrong."}</p>
      </div>
    );
  }

  const allResults = [...data.results, ...data.selfResults];

  return (
    <div className="space-y-4 px-4 py-6 max-w-2xl mx-auto">
      {/* ── Header ── */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">{student.name}</h1>
        <p className="text-foreground/50 text-sm mt-1">
          Class {student.standard} – {student.section}
          {student.roll_no ? ` • Roll No. ${student.roll_no}` : ""}
        </p>
      </div>

      {/* ── Stats bar ── */}
      {stats && stats.totalResults > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-black/30 border border-primary/20 rounded-xl p-3 text-center">
            <FileText size={16} className="text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-primary">{stats.totalResults}</p>
            <p className="text-xs text-foreground/50">Results</p>
          </div>
          <div className="bg-black/30 border border-primary/20 rounded-xl p-3 text-center">
            <TrendingUp size={16} className="text-primary mx-auto mb-1" />
            <p className={`text-xl font-bold ${percentColor(stats.avgPct ?? 0)}`}>{stats.avgPct}%</p>
            <p className="text-xs text-foreground/50">Avg Score</p>
          </div>
          <div className="bg-black/30 border border-primary/20 rounded-xl p-3 text-center">
            <Award size={16} className="text-primary mx-auto mb-1" />
            <p className={`text-xl font-bold ${percentColor(Number(stats.best?.percentage ?? 0))}`}>
              {stats.best ? `${stats.best.percentage}%` : "–"}
            </p>
            <p className="text-xs text-foreground/50">Best Score</p>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      <div className="space-y-2">
        <SectionHeader
          icon={FileText}
          title="Results"
          count={allResults.length}
          open={open.results}
          onToggle={() => toggle("results")}
        />
        {open.results && (
          <div className="space-y-2 pl-1">
            {allResults.length === 0 ? (
              <EmptyState text="No results found." />
            ) : (
              allResults.map((r) => (
                <div
                  key={r.id}
                  className="bg-black/20 border border-primary/10 rounded-lg px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground text-sm">{r.subject}</p>
                    <p className="text-xs text-foreground/40">
                      {r.exam_name || "Exam"} • {format(new Date(r.created_at), "dd MMM yyyy")}
                      {r.source === "manual" && <span className="ml-2 text-primary/50 italic">self-added</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${percentColor(Number(r.percentage))}`}>{r.percentage}%</p>
                    <p className="text-xs text-foreground/40">
                      {r.marks_obtained}/{r.total_marks}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Homework ── */}
      <div className="space-y-2">
        <SectionHeader
          icon={BookOpen}
          title="Homework"
          count={data.homework.length}
          open={open.homework}
          onToggle={() => toggle("homework")}
        />
        {open.homework && (
          <div className="space-y-2 pl-1">
            {data.homework.length === 0 ? (
              <EmptyState text="No homework assigned." />
            ) : (
              data.homework.map((h) => (
                <div key={h.id} className="bg-black/20 border border-primary/10 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-foreground text-sm">{h.subject}</p>
                    <p className="text-xs text-foreground/40">{format(new Date(h.created_at), "dd MMM yyyy")}</p>
                  </div>
                  <p className="text-sm text-foreground/70">{h.description}</p>
                  {h.file_url && (
                    <a
                      href={h.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary mt-1 inline-block underline"
                    >
                      View Attachment
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Announcements ── */}
      <div className="space-y-2">
        <SectionHeader
          icon={Bell}
          title="Announcements"
          count={data.announcements.length}
          open={open.announcements}
          onToggle={() => toggle("announcements")}
        />
        {open.announcements && (
          <div className="space-y-2 pl-1">
            {data.announcements.length === 0 ? (
              <EmptyState text="No announcements." />
            ) : (
              data.announcements.map((a) => (
                <div key={a.id} className="bg-black/20 border border-primary/10 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-foreground text-sm">{a.title || "Announcement"}</p>
                    <p className="text-xs text-foreground/40">{format(new Date(a.created_at), "dd MMM yyyy")}</p>
                  </div>
                  {a.content && <p className="text-sm text-foreground/70">{a.content}</p>}
                  {a.type && (
                    <span className="text-xs bg-primary/10 text-primary/70 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {a.type}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Complaints ── */}
      <div className="space-y-2">
        <SectionHeader
          icon={MessageSquare}
          title="Complaints"
          count={data.complaints.length}
          open={open.complaints}
          onToggle={() => toggle("complaints")}
        />
        {open.complaints && (
          <div className="space-y-2 pl-1">
            {data.complaints.length === 0 ? (
              <EmptyState text="No complaints on record." />
            ) : (
              data.complaints.map((c) => (
                <div key={c.id} className="bg-black/20 border border-red-500/10 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-foreground text-sm">Complaint</p>
                    <p className="text-xs text-foreground/40">{format(new Date(c.created_at), "dd MMM yyyy")}</p>
                  </div>
                  <p className="text-sm text-foreground/70">{c.description}</p>
                  {c.file_url && (
                    <a
                      href={c.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary mt-1 inline-block underline"
                    >
                      View Attachment
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Fees Reminders ── */}
      <div className="space-y-2">
        <SectionHeader
          icon={DollarSign}
          title="Fee Reminders"
          count={data.fees.length}
          open={open.fees}
          onToggle={() => toggle("fees")}
        />
        {open.fees && (
          <div className="space-y-2 pl-1">
            {data.fees.length === 0 ? (
              <EmptyState text="No fee reminders." />
            ) : (
              data.fees.map((f) => (
                <div key={f.id} className="bg-black/20 border border-yellow-500/10 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-foreground text-sm">{f.title || "Fee Reminder"}</p>
                    <p className="text-xs text-foreground/40">{format(new Date(f.created_at), "dd MMM yyyy")}</p>
                  </div>
                  <p className="text-sm text-foreground/70">{f.message}</p>
                  {f.amount > 0 && (
                    <p className="text-sm font-semibold text-yellow-400 mt-1">₹{f.amount.toLocaleString("en-IN")}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;
