import { useEffect, useState } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { useAcademicYear } from '@/context/AcademicYearContext';
import { supabase } from '@/integrations/supabase/client';
import { IndianRupee } from 'lucide-react';

const FeesPage = () => {
  const { student, schoolId } = useStudentAuth();
  const { startDate, endDate } = useAcademicYear();
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student || !schoolId) return;
    const fetchFees = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('fees_reminders')
        .select('*')
        .eq('student_id', student.id)
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });
      setFees(data || []);
      setLoading(false);
    };
    fetchFees();
  }, [student, schoolId, startDate, endDate]);

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'paid') return 'text-green-400 bg-green-400/10 border-green-400/30';
    if (s === 'overdue') return 'text-destructive bg-destructive/10 border-destructive/30';
    return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
  };

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      <h1 className="text-3xl font-bold text-foreground text-center">Fees Reminder</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : fees.length === 0 ? (
        <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-12 text-center">
          <IndianRupee size={48} className="text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/50 text-lg">No fees reminders found.</p>
        </div>
      ) : (
        <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left px-3 sm:px-6 py-4 text-primary text-sm font-semibold w-[30%]">Title</th>
                  <th className="text-center px-2 sm:px-6 py-4 text-primary text-sm font-semibold w-[20%]">Amount</th>
                  <th className="text-center px-2 sm:px-6 py-4 text-primary text-sm font-semibold w-[25%]">Due Date</th>
                  <th className="text-center px-2 sm:px-6 py-4 text-primary text-sm font-semibold w-[25%]">Status</th>
                </tr>
              </thead>
              <tbody>
                {fees.map(fee => (
                  <tr key={fee.id} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                    <td className="px-3 sm:px-6 py-4 text-foreground font-medium text-sm break-words">{fee.title}</td>
                    <td className="px-2 sm:px-6 py-4 text-foreground/80 text-center text-sm font-semibold">₹{fee.amount}</td>
                    <td className="px-2 sm:px-6 py-4 text-foreground/80 text-center text-xs sm:text-sm">
                      {fee.due_date ? new Date(fee.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-2 sm:px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(fee.status)}`}>
                        {fee.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesPage;
