import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { KeyRound, AlertTriangle, Hash, RefreshCw, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { useStudentAuth } from "@/context/StudentAuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/* ─── Forest Background Canvas ─────────────────── */
const ForestBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Deep jungle gradient sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#020a02");
      sky.addColorStop(0.4, "#0a1a0a");
      sky.addColorStop(0.7, "#0f2010");
      sky.addColorStop(1, "#152515");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Distant mountain silhouette
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * 0.55);
      ctx.bezierCurveTo(w * 0.1, h * 0.35, w * 0.2, h * 0.45, w * 0.28, h * 0.38);
      ctx.bezierCurveTo(w * 0.36, h * 0.31, w * 0.42, h * 0.42, w * 0.5, h * 0.34);
      ctx.bezierCurveTo(w * 0.58, h * 0.26, w * 0.65, h * 0.4, w * 0.72, h * 0.36);
      ctx.bezierCurveTo(w * 0.8, h * 0.32, w * 0.88, h * 0.44, w, h * 0.5);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = "#0d1f0d";
      ctx.fill();

      // Mid mountains
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * 0.65);
      ctx.bezierCurveTo(w * 0.08, h * 0.55, w * 0.15, h * 0.62, w * 0.22, h * 0.58);
      ctx.bezierCurveTo(w * 0.3, h * 0.54, w * 0.38, h * 0.64, w * 0.45, h * 0.57);
      ctx.bezierCurveTo(w * 0.52, h * 0.5, w * 0.6, h * 0.62, w * 0.68, h * 0.56);
      ctx.bezierCurveTo(w * 0.76, h * 0.5, w * 0.85, h * 0.6, w, h * 0.62);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = "#132213";
      ctx.fill();

      // Foreground trees
      const drawTree = (x: number, baseY: number, height: number, spread: number) => {
        ctx.beginPath();
        ctx.rect(x - spread * 0.06, baseY - height * 0.3, spread * 0.12, height * 0.3);
        ctx.fillStyle = "#0a150a";
        ctx.fill();
        for (let i = 0; i < 4; i++) {
          const layerH = height * (0.5 - i * 0.05);
          const layerW = spread * (1 - i * 0.15);
          const layerY = baseY - height * (0.2 + i * 0.22);
          ctx.beginPath();
          ctx.moveTo(x, layerY - layerH);
          ctx.lineTo(x - layerW / 2, layerY);
          ctx.lineTo(x + layerW / 2, layerY);
          ctx.closePath();
          ctx.fillStyle = i === 0 ? "#0d1c0d" : "#111f11";
          ctx.fill();
        }
      };

      const treeData = [
        { x: 0.04, h: 0.52, s: 0.07 },
        { x: 0.1, h: 0.65, s: 0.09 },
        { x: 0.17, h: 0.48, s: 0.06 },
        { x: 0.24, h: 0.7, s: 0.1 },
        { x: 0.32, h: 0.55, s: 0.07 },
        { x: 0.68, h: 0.55, s: 0.07 },
        { x: 0.76, h: 0.7, s: 0.1 },
        { x: 0.83, h: 0.48, s: 0.06 },
        { x: 0.9, h: 0.65, s: 0.09 },
        { x: 0.97, h: 0.52, s: 0.07 },
      ];
      treeData.forEach(({ x, h: th, s }) => drawTree(x * w, h, th * h, s * w));

      // Amber horizon glow
      const glow = ctx.createRadialGradient(w / 2, h * 0.6, 0, w / 2, h * 0.6, w * 0.35);
      glow.addColorStop(0, "rgba(212,133,74,0.07)");
      glow.addColorStop(1, "rgba(212,133,74,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />;
};

/* ─── Stars ─────────────────────────────────────── */
const Stars = () => {
  const stars = Array.from({ length: 55 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 45,
    size: 0.5 + Math.random() * 1.5,
    duration: 2 + Math.random() * 4,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {stars.map((s) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            backgroundColor: "#e8f0ec",
            animation: `twinkleS ${s.duration}s ${s.delay}s infinite ease-in-out`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkleS {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
};

/* ─── Fireflies ──────────────────────────────────── */
const Fireflies = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: 40 + Math.random() * 50,
    size: 2 + Math.random() * 3,
    delay: Math.random() * 8,
    duration: 5 + Math.random() * 8,
    driftX: (Math.random() - 0.5) * 20,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={
            {
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: "#d4854a",
              boxShadow: `0 0 ${p.size * 3}px ${p.size}px rgba(212,133,74,0.6)`,
              animation: `ffFloat ${p.duration}s ${p.delay}s infinite ease-in-out`,
              "--drift": `${p.driftX}px`,
            } as React.CSSProperties
          }
        />
      ))}
      <style>{`
        @keyframes ffFloat {
          0%   { transform: translate(0,0) scale(1); opacity: 0; }
          15%  { opacity: 1; }
          50%  { transform: translate(var(--drift), -40px) scale(1.4); opacity: 0.8; }
          85%  { opacity: 0.6; }
          100% { transform: translate(calc(var(--drift)*-1), -80px) scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

/* ─── Shared CSS ─────────────────────────────────── */
const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Nunito:wght@300;400;500&display=swap');

  .f-card {
    background: rgba(10,26,10,0.82);
    border: 1px solid rgba(74,138,122,0.3);
    border-radius: 20px;
    backdrop-filter: blur(22px);
    box-shadow:
      0 0 0 1px rgba(74,138,122,0.08),
      0 8px 40px rgba(0,0,0,0.65),
      0 0 80px rgba(74,138,122,0.04) inset;
  }
  .f-card-destructive {
    background: rgba(10,26,10,0.85);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: 20px;
    backdrop-filter: blur(22px);
    box-shadow: 0 8px 40px rgba(0,0,0,0.65);
  }
  .f-input {
    width: 100%;
    padding: 14px 20px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(74,138,122,0.3);
    border-radius: 14px;
    color: #e8f0ec;
    font-family: 'Nunito', sans-serif;
    font-weight: 300;
    font-size: 1rem;
    text-align: center;
    transition: border-color .3s, box-shadow .3s;
    outline: none;
  }
  .f-input::placeholder { color: rgba(232,240,236,0.3); }
  .f-input:focus {
    border-color: rgba(212,133,74,0.55);
    box-shadow: 0 0 0 3px rgba(212,133,74,0.1);
  }
  .f-input:hover { background: rgba(255,255,255,0.06); }
  .f-btn {
    background: #1e3a1e !important;
    border: 1px solid rgba(74,138,122,0.45) !important;
    color: #e8f0ec !important;
    font-family: 'Cinzel', serif !important;
    font-weight: 500 !important;
    letter-spacing: 0.09em !important;
    font-size: 0.8rem !important;
    border-radius: 14px !important;
    height: 52px !important;
    transition: all .3s ease !important;
    box-shadow: 0 0 18px rgba(74,138,122,0.12) !important;
  }
  .f-btn:hover:not(:disabled) {
    background: rgba(74,138,122,0.2) !important;
    border-color: #4a8a7a !important;
    box-shadow: 0 0 28px rgba(74,138,122,0.28) !important;
    color: #d4854a !important;
  }
  .f-btn:disabled { opacity: 0.45 !important; }
  .f-label {
    display: block;
    font-family: 'Nunito', sans-serif;
    font-size: 0.68rem;
    font-weight: 500;
    color: rgba(232,240,236,0.45);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 8px;
    margin-left: 4px;
  }
  .f-title {
    font-family: 'Cinzel', serif;
    font-size: 2rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    color: #e8f0ec;
  }
  .f-title span { color: #d4854a; }
  .f-subtitle {
    font-family: 'Nunito', sans-serif;
    font-size: 0.75rem;
    font-weight: 300;
    color: rgba(232,240,236,0.4);
    letter-spacing: 0.05em;
  }
  .amber-line {
    width: 50px; height: 1px;
    background: linear-gradient(to right, transparent, #d4854a66, transparent);
    margin: 10px auto 0;
  }
  .f-warn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 12px;
    padding: 10px 16px;
    margin-bottom: 20px;
  }
  .f-warn span {
    font-family: 'Nunito', sans-serif;
    font-size: 0.8rem;
    color: #f87171;
  }
  .f-footer {
    font-family: 'Nunito', sans-serif;
    font-size: 0.65rem;
    color: rgba(232,240,236,0.25);
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 500;
  }
  @keyframes fCardIn {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .f-card-enter { animation: fCardIn 0.85s cubic-bezier(0.22,1,0.36,1) forwards; }
`;

/* ─── Vignette ───────────────────────────────────── */
const Vignette = () => (
  <div
    className="fixed inset-0 pointer-events-none"
    style={{
      zIndex: 2,
      background: "radial-gradient(ellipse at center, transparent 40%, rgba(2,8,2,0.72) 100%)",
    }}
  />
);

/* ─── Main Component ─────────────────────────────── */
const LoginPage = () => {
  const [secretId, setSecretId] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockedOut, setLockedOut] = useState(false);
  const { login, isLoggedIn } = useStudentAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) navigate("/student-dashboard", { replace: true });
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockedOut || submitting) return;
    const cleanSecretId = secretId.trim();
    const cleanRollNo = rollNo.trim();
    if (!cleanSecretId || !cleanRollNo) return;

    setSubmitting(true);
    try {
      await login(cleanSecretId, cleanRollNo);
      toast.success("Login successful!");
      navigate("/student-dashboard");
    } catch (error: any) {
      if (error.message === "TOO_MANY_ATTEMPTS") {
        setRemainingAttempts(0);
        setLockedOut(true);
      } else {
        const match = error.message?.match(/(\d+) attempts remaining/);
        if (match) setRemainingAttempts(parseInt(match[1], 10));
        toast.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Lockout Screen ── */
  if (lockedOut) {
    return (
      <>
        <style>{sharedStyles}</style>
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
          <ForestBackground />
          <Stars />
          <Fireflies />
          <Vignette />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="f-card-destructive f-card-enter w-full max-w-sm relative z-10 p-10 text-center"
            style={{ zIndex: 10 }}
          >
            <div className="flex justify-center mb-6">
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldAlert size={32} style={{ color: "#f87171" }} />
              </div>
            </div>

            <h2 style={{ fontFamily: "'Cinzel', serif", color: "#f87171", fontSize: "1.3rem", marginBottom: 8 }}>
              Account Locked
            </h2>
            <div
              className="amber-line"
              style={{ background: "linear-gradient(to right, transparent, #f8717166, transparent)" }}
            />

            <p
              style={{
                fontFamily: "'Nunito', sans-serif",
                color: "rgba(232,240,236,0.5)",
                fontSize: "0.82rem",
                margin: "16px 0",
                lineHeight: 1.7,
              }}
            >
              You've entered incorrect credentials 5 times.
              <br />
              Contact your <span style={{ color: "#d4854a", fontWeight: 500 }}>Principal or Admin</span> to reset your
              access.
            </p>

            <div
              style={{
                background: "rgba(239,68,68,0.05)",
                border: "1px solid rgba(239,68,68,0.15)",
                borderRadius: 12,
                padding: "12px 16px",
                textAlign: "left",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <AlertTriangle size={12} style={{ color: "#f87171" }} />
                <span
                  style={{
                    fontFamily: "'Cinzel',serif",
                    fontSize: "0.65rem",
                    color: "#f87171",
                    letterSpacing: "0.1em",
                  }}
                >
                  ACCESS DENIED
                </span>
              </div>
              <p
                style={{
                  fontFamily: "'Nunito',sans-serif",
                  fontSize: "0.72rem",
                  color: "rgba(232,240,236,0.4)",
                  lineHeight: 1.6,
                }}
              >
                Ask your Principal to reset your login attempts from the Student Management panel.
              </p>
            </div>

            <Button onClick={() => window.location.reload()} className="f-btn w-full">
              <RefreshCw size={14} className="mr-2" />
              Refresh & Try Again
            </Button>
          </motion.div>
        </div>
      </>
    );
  }

  /* ── Login Screen ── */
  return (
    <>
      <style>{sharedStyles}</style>
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <ForestBackground />
        <Stars />
        <Fireflies />
        <Vignette />

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="f-card w-full max-w-sm px-8 py-10"
          style={{ zIndex: 10, position: "relative" }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="f-title">
              <span>EDU</span>Linker
            </h1>
            <div className="amber-line" />
            <p className="f-subtitle mt-3">Student Portal — Secret ID &amp; Roll Number</p>
          </div>

          {/* Attempts warning */}
          {remainingAttempts !== null && remainingAttempts > 0 && (
            <div className="f-warn">
              <AlertTriangle size={15} style={{ color: "#f87171", flexShrink: 0 }} />
              <span>{remainingAttempts} attempts remaining</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Secret ID */}
            <div>
              <label className="f-label">
                <KeyRound size={11} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
                Secret ID
              </label>
              <input
                type="text"
                value={secretId}
                onChange={(e) => setSecretId(e.target.value)}
                required
                autoComplete="off"
                spellCheck={false}
                placeholder="EDU-XXXX-XXXXX"
                className="f-input"
                style={{ fontFamily: "monospace", letterSpacing: "0.12em", fontSize: "1.05rem" }}
              />
            </div>

            {/* Roll Number */}
            <div>
              <label className="f-label">
                <Hash size={11} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
                Roll Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value.replace(/\D/g, ""))}
                required
                autoComplete="off"
                placeholder="Enter your roll number"
                className="f-input"
                style={{ fontSize: "1.05rem" }}
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || !secretId.trim() || !rollNo.trim()}
              className="f-btn w-full"
              style={{ marginTop: 4 }}
            >
              <KeyRound size={14} className="mr-2" />
              {submitting ? "Verifying..." : "Sign In"}
            </Button>
          </form>

          <p className="f-footer mt-8">Contact your school admin if you don't have a Secret ID</p>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;
