import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, isLoggedIn, isStudentLinked } = useStudentAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn && isStudentLinked) {
      navigate('/student-dashboard', { replace: true });
    } else if (isLoggedIn && !isStudentLinked) {
      navigate('/link-student', { replace: true });
    }
  }, [isLoggedIn, isStudentLinked, navigate]);

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
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
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
          {[10, 25, 45, 70, 85, 35, 60].map((left, i) =>
          <div key={i} className="falling-line" style={{ left: `${left}%`, animationDuration: `${4 + i % 3 * 1.5}s`, animationDelay: `${i * 0.5}s` }} />
          )}
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
          className="bg-card/40 backdrop-blur-[40px] border border-primary/10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden ring-1 ring-primary/5">

          <div className="relative p-10 sm:p-12">
            <div className="text-center mb-10">
              <motion.h1
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-4xl font-bold tracking-tight mb-3 text-sidebar-ring">

                <span className="text-primary">EDU</span>Linker
              </motion.h1>
              <p className="text-muted-foreground text-sm font-medium tracking-wide">
                Student Portal — Enter your credentials
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
                <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-5 py-4 bg-background/20 border border-primary/10 rounded-2xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-500 hover:bg-background/30"
                placeholder="name@institution.edu" />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">Password</label>
                <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="w-full px-5 py-4 bg-background/20 border border-primary/10 rounded-2xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-500 hover:bg-background/30"
                placeholder="••••••••" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-2xl transition-all duration-300 transform active:scale-[0.98] shadow-[0_0_20px_hsl(51,100%,50%,0.3)] hover:shadow-[0_0_30px_hsl(51,100%,50%,0.5)]">
                <LogIn size={20} className="mr-2" />
                {submitting ? 'Please wait...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-semibold">Secure student portal access</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>);

};

export default LoginPage;