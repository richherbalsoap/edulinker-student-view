import { useEffect, useState, useRef, useCallback } from "react";
import { useStudentAuth } from "@/context/StudentAuthContext";
import { useDateFilter } from "@/context/DateFilterContext";
import { supabase } from "@/integrations/supabase/client";
import { FileText, ExternalLink, Plus, X, Upload, Trash2, ShieldAlert, Trash, RotateCcw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = "https://sdvxekymbfyrznhuvvtj.supabase.co";

const getFilePublicUrl = (filePath: string) => {
  if (!filePath) return "";
  if (filePath.startsWith("http")) return filePath;
  return `${SUPABASE_URL}/storage/v1/object/public/edulinker-files/${filePath}`;
};

const isImageFile = (filePath: string) => {
  if (!filePath) return false;
  const lower = filePath.toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "gif"].some((ext) => lower.endsWith(`.${ext}`));
};

const sha256 = async (text: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

// ─── PIN Modal ───────────────────────────────────────────────────────────────
const PinModal = ({
  studentId,
  mode, // 'setup' | 'verify'
  onSuccess,
  onClose,
}: {
  studentId: string;
  mode: "setup" | "verify";
  onSuccess: () => void;
  onClose: () => void;
}) => {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits.");
      return;
    }
    if (mode === "setup" && pin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }
    setLoading(true);
    const hash = await sha256(pin);

    if (mode === "setup") {
      const { error: err } = await supabase.from("student_pins").insert({ student_id: studentId, pin_hash: hash });
      setLoading(false);
      if (err) {
        setError("Failed to set PIN.");
        return;
      }
      onSuccess();
    } else {
      const { data } = await supabase.from("student_pins").select("pin_hash").eq("student_id", studentId).maybeSingle();
      setLoading(false);
      if (!data || data.pin_hash !== hash) {
        setError("Incorrect PIN.");
        return;
      }
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-black/90 backdrop-blur-2xl rounded-2xl p-6 w-full max-w-sm border border-primary/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <Lock size={20} className="text-primary" />
          <h3 className="text-lg font-bold text-foreground">
            {mode === "setup" ? "Set Your Delete PIN" : "Enter PIN to Confirm"}
          </h3>
        </div>
        {mode === "setup" && (
          <p className="text-foreground/50 text-xs mb-4">
            This PIN will be required for all permanent deletions. Set it once — keep it safe!
          </p>
        )}
        <div className="space-y-3">
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ""));
              setError("");
            }}
            placeholder="Enter PIN (numbers only)"
            className="w-full p-3 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 text-center tracking-widest text-xl"
            autoFocus
          />
          {mode === "setup" && (
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={confirmPin}
              onChange={(e) => {
                setConfirmPin(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              placeholder="Confirm PIN"
              className="w-full p-3 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 text-center tracking-widest text-xl"
            />
          )}
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-black/40 border border-primary/20 text-foreground hover:bg-black/60"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground font-bold"
            >
              {loading ? "..." : mode === "setup" ? "Set PIN" : "Confirm"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Warning Modal ─────────────────────────────────────────────────────
const DeleteWarningModal = ({
  onMoveToBin,
  onClose,
  itemLabel,
}: {
  onMoveToBin: () => void;
  onClose: () => void;
  itemLabel: string;
}) => (
  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div
      className="bg-black/90 backdrop-blur-2xl rounded-2xl p-6 w-full max-w-sm border border-destructive/30"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 mb-3">
        <ShieldAlert size={20} className="text-destructive" />
        <h3 className="text-lg font-bold text-foreground">Move to Bin?</h3>
      </div>
      <p className="text-foreground/60 text-sm mb-2">
        "<span className="text-foreground font-semibold">{itemLabel}</span>" will be moved to Bin.
      </p>
      <p className="text-foreground/40 text-xs mb-5">
        Items in Bin are automatically deleted after 3 days. You can permanently delete or restore them from Bin.
      </p>
      <div className="flex gap-3">
        <Button
          onClick={onClose}
          className="flex-1 bg-black/40 border border-primary/20 text-foreground hover:bg-black/60"
        >
          Cancel
        </Button>
        <Button onClick={onMoveToBin} className="flex-1 bg-destructive hover:bg-destructive/80 text-white font-bold">
          Move to Bin
        </Button>
      </div>
    </div>
  </div>
);

// ─── Bin Page ─────────────────────────────────────────────────────────────────
const BinPage = ({
  studentId,
  schoolId,
  onClose,
  onRestored,
}: {
  studentId: string;
  schoolId: string;
  onClose: () => void;
  onRestored: () => void;
}) => {
  const [binItems, setBinItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinVerified, setPinVerified] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinMode, setPinMode] = useState<"setup" | "verify">("verify");
  const [hasPinSetup, setHasPinSetup] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  const fetchBin = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("student_bin")
      .select("*")
      .eq("student_id", studentId)
      .eq("school_id", schoolId)
      .eq("item_type", "result")
      .order("deleted_at", { ascending: false });
    setBinItems(data || []);
    setLoading(false);
  }, [studentId, schoolId]);

  useEffect(() => {
    fetchBin();
    // Check if PIN exists
    supabase
      .from("student_pins")
      .select("student_id")
      .eq("student_id", studentId)
      .maybeSingle()
      .then(({ data }) => setHasPinSetup(!!data));
  }, [studentId, fetchBin]);

  const requirePin = (onVerified: () => void) => {
    if (pinVerified) {
      onVerified();
      return;
    }
    if (!hasPinSetup) {
      setPinMode("setup");
    } else {
      setPinMode("verify");
    }
    setShowPinModal(true);
    // Store callback
    (window as any).__pinCallback = onVerified;
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    setPinVerified(true);
    setHasPinSetup(true);
    const cb = (window as any).__pinCallback;
    if (cb) {
      cb();
      delete (window as any).__pinCallback;
    }
  };

  const handleRestore = async (item: any) => {
    // Re-insert into student_self_results
    const d = item.item_data;
    await supabase.from("student_self_results").insert({
      id: item.item_id,
      student_id: studentId,
      school_id: schoolId,
      subject: d.subject,
      exam_name: d.exam_name || null,
      marks_obtained: d.marks_obtained,
      total_marks: d.total_marks,
      file_url: d.file_url || null,
      created_at: d.created_at,
    });
    await supabase.from("student_bin").delete().eq("id", item.id);
    setBinItems((prev) => prev.filter((b) => b.id !== item.id));
    onRestored();
  };

  const handlePermDelete = (item: any) => {
    requirePin(async () => {
      // Delete file from storage if exists
      if (item.file_url && !item.file_url.startsWith("http")) {
        await supabase.storage.from("edulinker-files").remove([item.file_url]);
      }
      await supabase.from("student_bin").delete().eq("id", item.id);
      setBinItems((prev) => prev.filter((b) => b.id !== item.id));
      setPendingDeleteId(null);
    });
  };

  const handleDeleteAll = () => {
    requirePin(async () => {
      setDeletingAll(true);
      const filePaths = binItems.filter((b) => b.file_url && !b.file_url.startsWith("http")).map((b) => b.file_url);
      if (filePaths.length > 0) await supabase.storage.from("edulinker-files").remove(filePaths);
      const ids = binItems.map((b) => b.id);
      await supabase.from("student_bin").delete().in("id", ids);
      setBinItems([]);
      setDeletingAll(false);
    });
  };

  const getDaysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-40 flex flex-col">
      {showPinModal && (
        <PinModal
          studentId={studentId}
          mode={pinMode}
          onSuccess={handlePinSuccess}
          onClose={() => setShowPinModal(false)}
        />
      )}
      <div className="flex items-center justify-between px-4 py-4 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <Trash size={20} className="text-destructive" />
          <h2 className="text-xl font-bold text-foreground">Bin — Results</h2>
          <span className="text-xs text-foreground/40">(3 days auto-delete)</span>
        </div>
        <button onClick={onClose} className="text-foreground/60 hover:text-foreground">
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasPinSetup && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
            <Lock size={16} className="text-primary" />
            <p className="text-sm text-foreground/70">Set a PIN to permanently delete items.</p>
            <button
              onClick={() => {
                setPinMode("setup");
                setShowPinModal(true);
              }}
              className="ml-auto text-xs font-bold text-primary border border-primary/30 px-3 py-1 rounded-lg"
            >
              Set PIN
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : binItems.length === 0 ? (
          <div className="text-center py-16">
            <Trash size={48} className="text-foreground/10 mx-auto mb-4" />
            <p className="text-foreground/40">Bin is empty.</p>
          </div>
        ) : (
          <>
            {binItems.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleDeleteAll}
                  disabled={deletingAll}
                  className="text-xs font-bold text-destructive border border-destructive/20 px-3 py-1.5 rounded-lg hover:bg-destructive/10 flex items-center gap-1"
                >
                  <Trash2 size={13} /> Delete All Permanently
                </button>
              </div>
            )}
            {binItems.map((item) => {
              const d = item.item_data;
              const daysLeft = getDaysLeft(item.expires_at);
              const fileUrl = d.file_url ? getFilePublicUrl(d.file_url) : null;
              return (
                <div key={item.id} className="bg-black/40 border border-destructive/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-foreground">{d.subject}</p>
                      {d.exam_name && <p className="text-xs text-foreground/40">{d.exam_name}</p>}
                      <p className="text-sm text-foreground/60 mt-1">
                        {d.marks_obtained}/{d.total_marks} — {d.percentage}%
                      </p>
                      {fileUrl && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                        >
                          <ExternalLink size={11} /> View File
                        </a>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${daysLeft <= 1 ? "text-destructive border-destructive/30 bg-destructive/10" : "text-foreground/40 border-foreground/10"}`}
                    >
                      {daysLeft}d left
                    </span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleRestore(item)}
                      className="flex-1 text-xs font-bold text-primary border border-primary/20 py-2 rounded-lg hover:bg-primary/10 flex items-center justify-center gap-1"
                    >
                      <RotateCcw size={12} /> Restore
                    </button>
                    <button
                      onClick={() => handlePermDelete(item)}
                      className="flex-1 text-xs font-bold text-destructive border border-destructive/20 py-2 rounded-lg hover:bg-destructive/10 flex items-center justify-center gap-1"
                    >
                      <Trash2 size={12} /> Delete Forever
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Add Result Modal ─────────────────────────────────────────────────────────
const AddResultModal = ({
  onClose,
  onSaved,
  studentId,
  schoolId,
}: {
  onClose: () => void;
  onSaved: () => void;
  studentId: string;
  schoolId: string;
}) => {
  const [subject, setSubject] = useState("");
  const [examName, setExamName] = useState("");
  const [marksObtained, setMarksObtained] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 7 * 1024 * 1024) {
      setError("File too large. Max 7MB.");
      return;
    }
    setError("");
    setFile(f);
  };

  const handleSave = async () => {
    if (!subject.trim()) {
      setError("Subject is required.");
      return;
    }
    const mo = parseFloat(marksObtained);
    const tm = parseFloat(totalMarks);
    if (isNaN(mo) || isNaN(tm) || tm <= 0) {
      setError("Enter valid marks.");
      return;
    }
    if (mo > tm) {
      setError("Marks obtained cannot exceed total marks.");
      return;
    }
    setUploading(true);
    setError("");
    let fileUrl: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop() || "bin";
      const path = `results/${studentId}/self_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("edulinker-files")
        .upload(path, file, { contentType: file.type });
      if (upErr) {
        setError("Upload failed: " + upErr.message);
        setUploading(false);
        return;
      }
      fileUrl = path;
    }
    const { error: insErr } = await supabase.from("student_self_results").insert({
      student_id: studentId,
      school_id: schoolId,
      subject: subject.trim(),
      exam_name: examName.trim() || null,
      marks_obtained: mo,
      total_marks: tm,
      file_url: fileUrl,
    });
    setUploading(false);
    if (insErr) {
      setError("Save failed: " + insErr.message);
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-black/90 backdrop-blur-2xl rounded-2xl p-6 w-full max-w-md border border-primary/30 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-foreground/60 hover:text-foreground">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-primary mb-5">Add My Result</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-primary/60 mb-1 uppercase tracking-wider">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Mathematics"
              className="w-full p-3 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-primary/60 mb-1 uppercase tracking-wider">
              Exam Name (optional)
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g. Unit Test, Mid Term"
              className="w-full p-3 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-primary/60 mb-1 uppercase tracking-wider">
                Marks Obtained *
              </label>
              <input
                type="number"
                value={marksObtained}
                onChange={(e) => setMarksObtained(e.target.value)}
                placeholder="78"
                min="0"
                className="w-full p-3 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-primary/60 mb-1 uppercase tracking-wider">
                Total Marks *
              </label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                placeholder="100"
                min="1"
                className="w-full p-3 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-primary/60 mb-1 uppercase tracking-wider">
              Photo / File (optional, max 7MB)
            </label>
            <div
              className="relative border-2 border-dashed border-primary/20 rounded-lg p-5 text-center cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                onChange={handleFile}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              <Upload size={24} className="mx-auto mb-2 text-foreground/40" />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-foreground text-sm truncate max-w-[200px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-destructive"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <p className="text-foreground/40 text-sm">Click to upload (any image, PDF, etc.)</p>
              )}
            </div>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button
            onClick={handleSave}
            disabled={uploading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg shadow-[0_0_20px_hsl(51,100%,50%,0.3)]"
          >
            {uploading ? "Saving..." : "Save Result"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Result Table ─────────────────────────────────────────────────────────────
const ResultTable = ({
  results,
  showDelete,
  onDelete,
}: {
  results: any[];
  showDelete?: boolean;
  onDelete?: (id: string, label: string) => void;
}) => (
  <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-primary/20">
            <th className="text-left px-4 py-3 text-primary text-sm font-semibold">Subject</th>
            <th className="text-center px-4 py-3 text-primary text-sm font-semibold">Marks</th>
            <th className="text-center px-4 py-3 text-primary text-sm font-semibold">Total</th>
            <th className="text-center px-4 py-3 text-primary text-sm font-semibold">%</th>
            <th className="text-center px-4 py-3 text-primary text-sm font-semibold">File</th>
            {showDelete && <th className="w-10" />}
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const fileUrl = r.file_url ? getFilePublicUrl(r.file_url) : null;
            const isImage = r.file_url ? isImageFile(r.file_url) : false;
            return (
              <tr key={r.id} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                <td className="px-4 py-3 text-foreground font-medium">
                  {r.subject}
                  {r.exam_name && <span className="block text-xs text-foreground/40">{r.exam_name}</span>}
                </td>
                <td className="px-4 py-3 text-foreground/80 text-center">{r.marks_obtained}</td>
                <td className="px-4 py-3 text-foreground/80 text-center">{r.total_marks}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`font-semibold ${r.percentage >= 75 ? "text-green-400" : r.percentage >= 50 ? "text-primary" : "text-destructive"}`}
                  >
                    {r.percentage}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
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
                </td>
                {showDelete && onDelete && (
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => onDelete(r.id, r.subject)}
                      className="text-destructive/50 hover:text-destructive transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
type Category = "all" | "school" | "self";

const ResultsPage = () => {
  const { student, schoolId } = useStudentAuth();
  const { filterStartDate: startDate, filterEndDate: endDate } = useDateFilter();

  const [schoolResults, setSchoolResults] = useState<any[]>([]);
  const [selfResults, setSelfResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBin, setShowBin] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<{ id: string; label: string; data: any } | null>(null);

  const fetchAll = useCallback(async () => {
    if (!student || !schoolId) return;
    setLoading(true);
    const [schoolRes, selfRes] = await Promise.all([
      supabase
        .from("results")
        .select("*")
        .eq("student_id", student.id)
        .eq("school_id", schoolId)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false }),
      supabase
        .from("student_self_results")
        .select("*")
        .eq("student_id", student.id)
        .eq("school_id", schoolId)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false }),
    ]);
    setSchoolResults(schoolRes.data || []);
    setSelfResults(selfRes.data || []);
    setLoading(false);
  }, [student, schoolId, startDate, endDate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDeleteSelf = (id: string, label: string) => {
    const item = selfResults.find((r) => r.id === id);
    setDeleteWarning({ id, label, data: item });
  };

  const confirmMoveToBin = async () => {
    if (!deleteWarning || !student || !schoolId) return;
    const { id, data } = deleteWarning;
    // Move to bin
    await supabase.from("student_bin").insert({
      student_id: student.id,
      school_id: schoolId,
      item_type: "result",
      item_id: id,
      item_data: data,
      file_url: data.file_url || null,
    });
    // Remove from self results
    await supabase.from("student_self_results").delete().eq("id", id);
    setSelfResults((prev) => prev.filter((r) => r.id !== id));
    setDeleteWarning(null);
  };

  const displayedSchool = category === "self" ? [] : schoolResults;
  const displayedSelf = category === "school" ? [] : selfResults;
  const totalCount = displayedSchool.length + displayedSelf.length;

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      {/* Modals */}
      {showBin && student && schoolId && (
        <BinPage studentId={student.id} schoolId={schoolId} onClose={() => setShowBin(false)} onRestored={fetchAll} />
      )}
      {showAddModal && student && schoolId && (
        <AddResultModal
          studentId={student.id}
          schoolId={schoolId}
          onClose={() => setShowAddModal(false)}
          onSaved={fetchAll}
        />
      )}
      {deleteWarning && (
        <DeleteWarningModal
          itemLabel={deleteWarning.label}
          onMoveToBin={confirmMoveToBin}
          onClose={() => setDeleteWarning(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-bold text-foreground">Results</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBin(true)}
            className="relative text-foreground/50 hover:text-destructive transition-colors p-2"
          >
            <Trash size={20} />
          </button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-[0_0_15px_hsl(51,100%,50%,0.3)] flex items-center gap-2"
          >
            <Plus size={18} /> Add My Result
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "school", "self"] as Category[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${category === cat ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_hsl(51,100%,50%,0.3)]" : "bg-black/40 text-foreground/60 border-primary/20 hover:border-primary/40"}`}
          >
            {cat === "all" ? "All Results" : cat === "school" ? "📚 School Sent" : "✍️ Self Added"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : totalCount === 0 ? (
        <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-12 text-center">
          <FileText size={48} className="text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/50 text-lg">No results found.</p>
          <p className="text-foreground/30 text-sm mt-1">Add your own results using the button above.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedSchool.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary/70 uppercase tracking-wider">📚 School Sent</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                  {displayedSchool.length}
                </span>
              </div>
              <ResultTable results={displayedSchool} />
            </div>
          )}
          {displayedSelf.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary/70 uppercase tracking-wider">✍️ Self Added</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                  {displayedSelf.length}
                </span>
              </div>
              <ResultTable results={displayedSelf} showDelete onDelete={handleDeleteSelf} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
