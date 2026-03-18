import { useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import GoldenBackground from '@/components/GoldenBackground';
import StudentSidebar from '@/components/StudentSidebar';
import StudentHeader from '@/components/StudentHeader';
import DateFilterBar from '@/components/DateFilterBar';

const StudentLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

  return (
    <div className="flex h-screen bg-background">
      <GoldenBackground />
      <StudentSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <StudentHeader toggleSidebar={toggleSidebar} />
        <DateFilterBar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
