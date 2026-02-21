import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { KeyRound, School, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const MAX_ATTEMPTS = 5;

const LoginPage = () => {
  const [selectedSchool, setSelectedSchool] = useState('');
  const [secretId, setSecretId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { login, isLoggedIn, schools, fetchSchools } = useStudentAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/student-dashboard', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attempts >= MAX_ATTEMPTS) return;

    setSubmitting(true);

    // Progressive delay
    const delay = (attempts + 1) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      await login(selectedSchool, secretId);
      toast.success('Login successful!');
      navigate('/student-dashboard');
    } catch (error: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        toast.error('Too many failed attempts. Please refresh and try again.');
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
            <div key={i} className="falling-line" style={{ left: `${left}%`, animationDuration: `${4 + i % 3 * 1.5}s`, animationDelay: `${i * 0.5}s` }} />
          ))}
        </div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent to-transparent via-primary/10"></div>
        <div className="horizon-ring"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60vw] h-[200px] bg-primary/5 blur-[100px] rounded-full"></div>
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
              <motion.h1
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-4xl font-bold tracking-tight mb-3 text-sidebar-ring"
              >
                <span className="text-primary">EDU</span>Linker
              </motion.h1>
              <p className="text-muted-foreground text-sm font-medium tracking-wide">
                Student Portal — Select your school & enter Secret ID
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
                <label htmlFor="school" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                  <School size={12} className="inline mr-1 mb-0.5" />
                  Select School
                </label>
                <select
                  id="school"
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  required
                  disabled={attempts >= MAX_ATTEMPTS}
                  className="w-full px-5 py-4 bg-background/20 border border-primary/10 rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-500 hover:bg-background/30 disabled:opacity-50 appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-background text-muted-foreground">
                    — Choose your school —
                  </option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id} className="bg-background text-foreground">
                      {s.school_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="secretId" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                  <KeyRound size={12} className="inline mr-1 mb-0.5" />
                  Secret ID
                </label>
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
                disabled={submitting || attempts >= MAX_ATTEMPTS || !selectedSchool}
                className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-2xl transition-all duration-300 transform active:scale-[0.98] shadow-[0_0_20px_hsl(51,100%,50%,0.3)] hover:shadow-[0_0_30px_hsl(51,100%,50%,0.5)]"
              >
                <KeyRound size={20} className="mr-2" />
                {submitting ? 'Verifying...' : 'Sign In'}
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

export default LoginPage;
