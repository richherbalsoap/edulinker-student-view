import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { LogOut, User, Menu, Calendar, RefreshCw } from 'lucide-react';

const StudentHeader = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { logout, student } = useStudentAuth();
  const { academicYear, setAcademicYear, yearOptions } = useAcademicYear();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      // Invalidate all react-query caches
      await queryClient.invalidateQueries();
      // Notify all pages to refetch their data
      window.dispatchEvent(new CustomEvent('app-refresh'));
      toast.success('Sab kuch update ho gaya!', { duration: 1500 });
    } catch (e) {
      toast.error('Refresh fail hua, dobara try karein');
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-primary/20">
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg border border-primary/20 bg-card/30 text-primary hover:bg-primary/10 hover:border-primary/40 active:bg-primary/20 transition-colors duration-200"
          >
            <Menu size={18} />
          </button>
          <h2 className="text-lg font-bold text-primary drop-shadow-[0_0_10px_hsl(51,100%,50%,0.3)]">
            Student Portal
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card/30 rounded-lg border border-primary/20">
            <Calendar size={14} className="text-primary" />
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-transparent text-foreground/90 text-sm font-medium outline-none cursor-pointer"
            >
              {yearOptions.map(year => (
                <option key={year} value={year} className="bg-background text-foreground">
                  {year === 'all' ? 'All Years' : year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-card/30 rounded-lg border border-primary/20">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <User size={14} className="text-primary" />
            </div>
            <span className="text-foreground/90 text-sm font-medium hidden sm:block">{student?.name || 'Student'}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors duration-200"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default StudentHeader;
