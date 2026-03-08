import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, FileText, MessageSquare,
  Bell, BarChart3, Bot, IndianRupee, LogOut, X, GraduationCap
} from 'lucide-react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { useNavigate } from 'react-router-dom';

interface NavItemType {
  path: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItemType[] = [
  { path: '/student-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/homework', icon: BookOpen, label: 'Homework' },
  { path: '/results', icon: FileText, label: 'Results' },
  { path: '/complaints', icon: MessageSquare, label: 'Complaints' },
  { path: '/announcements', icon: Bell, label: 'Announcements' },
  { path: '/academic-performance', icon: BarChart3, label: 'Academic Performance' },
  { path: '/ai-insight', icon: Bot, label: 'AI Insight' },
];

const SideNavItem = ({ item, onClick }: { item: NavItemType; onClick: () => void }) => (
  <li>
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-3 rounded-lg
        transition-colors duration-200 group
        ${isActive
          ? 'bg-primary/15 text-primary border border-primary/30 shadow-[0_0_15px_hsl(51,100%,50%,0.15)]'
          : 'text-foreground/70 hover:bg-primary/5 hover:text-foreground border border-transparent'
        }
      `}
    >
      <item.icon size={20} />
      <span className="font-medium text-sm">{item.label}</span>
    </NavLink>
  </li>
);

const StudentSidebar = ({ isOpen, toggleSidebar }: { isOpen: boolean; toggleSidebar: () => void }) => {
  const { student, logout } = useStudentAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div onClick={toggleSidebar} className="fixed inset-0 bg-background/60 z-40 transition-opacity duration-200" />
      )}
      <aside className={`
        fixed top-0 left-0 h-screen w-[280px] z-50
        bg-background/95 border-r border-primary/20
        flex flex-col transition-transform duration-200 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-5 border-b border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
              <GraduationCap size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">EDULinker</h1>
              <p className="text-xs text-foreground/40">{student?.name || 'Student'}</p>
            </div>
          </div>
          <button onClick={toggleSidebar} className="p-1.5 rounded-lg text-foreground/50 hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-colors duration-200">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <SideNavItem key={item.path} item={item} onClick={toggleSidebar} />
            ))}
          </ul>
        </nav>

        <div className="p-3 border-t border-primary/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-colors duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default StudentSidebar;
