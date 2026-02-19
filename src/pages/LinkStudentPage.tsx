import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { KeyRound, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const MAX_ATTEMPTS = 5;

const LinkStudentPage = () => {
  const [secretId, setSecretId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { linkStudent, isStudentLinked, isLoggedIn, logout } = useStudentAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    } else if (isStudentLinked) {
      navigate('/student-dashboard', { replace: true });
    }
  }, [isLoggedIn, isStudentLinked, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attempts >= MAX_ATTEMPTS) return;

    setSubmitting(true);

    // Progressive delay
    const delay = (attempts + 1) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      await linkStudent(secretId);
      toast.success('Student linked successfully!');
      navigate('/student-dashboard');
    } catch (error: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        toast.error('Too many failed attempts. Please log in again.');
        await logout();
        navigate('/login');
      } else {
        toast.error(`${error.message} (${MAX_ATTEMPTS - newAttempts} attempts remaining)`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="spotlight-bg"></div>
        <div className="absolute inset-0 tech-grid opacity-20"></div>
        <div className="absolute inset-0">
          {[10, 25, 45, 70, 85, 35, 60].map((left, i) => (
            <div key={i} className="falling-line" style={{ left: `${left}%`, animationDuration: `${4 + (i % 3) * 1.5}s`, animationDelay: `${i * 0.5}s` }} />
          ))}
        </div>
        <div className="horizon-ring"></div>
      </div>

      <div className="relative w-full max-w-md z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-card/40 backdrop-blur-[40px] border border-primary/10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden ring-1 ring-primary/5"
        >
          <div className="relative p-10 sm:p-12">
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                <KeyRound size={32} className="text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground mb-3">
                Enter Your <span className="text-primary">Secret ID</span>
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter the Secret ID provided by your school to access your academic records.
              </p>
            </div>

            {attempts > 0 && attempts < MAX_ATTEMPTS && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 mb-6">
                <AlertTriangle size={16} className="text-destructive shrink-0" />
                <span className="text-destructive text-sm">{MAX_ATTEMPTS - attempts} attempts remaining</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="secretId" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">Secret ID</label>
                <input
                  id="secretId"
                  type="text"
                  value={secretId}
                  onChange={(e) => setSecretId(e.target.value)}
                  required
                  disabled={attempts >= MAX_ATTEMPTS}
                  className="w-full px-5 py-4 bg-background/20 border border-primary/10 rounded-2xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-500 hover:bg-background/30 font-mono tracking-wider text-center text-lg disabled:opacity-50"
                  placeholder="EDU-XXXX-XXXXX"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting || attempts >= MAX_ATTEMPTS}
                className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-2xl transition-all duration-300 shadow-[0_0_20px_hsl(51,100%,50%,0.3)] hover:shadow-[0_0_30px_hsl(51,100%,50%,0.5)]"
              >
                <KeyRound size={20} className="mr-2" />
                {submitting ? 'Verifying...' : 'Verify & Continue'}
              </Button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-semibold">Contact your school admin if you don't have a Secret ID</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LinkStudentPage;
