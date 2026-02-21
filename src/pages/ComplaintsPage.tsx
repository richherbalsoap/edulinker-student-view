import { useEffect, useState } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare } from 'lucide-react';

const ComplaintsPage = () => {
  const { student } = useStudentAuth();
  const { startDate, endDate } = useAcademicYear();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { schoolId } = useStudentAuth();

  useEffect(() => {
    if (!student || !schoolId) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('complaints')
        .select('*')
        .eq('student_id', student.id)
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });
      setComplaints(data || []);
      setLoading(false);
    };
    fetch();
  }, [student, schoolId, startDate, endDate]);

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      <h1 className="text-3xl font-bold text-foreground text-center">Complaints</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-12 text-center">
          <MessageSquare size={48} className="text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/50 text-lg">No complaints recorded.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(c => (
            <div key={c.id} className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-5">
              <p className="text-foreground/80">{c.description}</p>
              <p className="text-muted-foreground text-xs mt-3">{new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplaintsPage;
