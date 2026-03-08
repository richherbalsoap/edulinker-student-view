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
      // Fetch fees assigned to this student directly OR to their class (standard/section)
      const [byStudent, byClass] = await Promise.all([
        supabase
          .from('fees_reminders')
          .select('*')
          .eq('student_id', student.id)
          .eq('school_id', schoolId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('fees_reminders')
          .select('*')
          .is('student_id', null)
          .ilike('standard', student.standard)
          .ilike('section', student.section)
          .eq('school_id', schoolId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false }),
      ]);
      // Merge and deduplicate by id
      const allFees = [...(byStudent.data || []), ...(byClass.data || [])];
      const uniqueFees = Array.from(new Map(allFees.map(f => [f.id, f])).values());
      setFees(uniqueFees);
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
                  <th className="text-left px-3 sm:px-6 py-4 text-primary text-sm font-semibold w-[60%]">Title</th>
                  <th className="text-center px-2 sm:px-6 py-4 text-primary text-sm font-semibold w-[40%]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {fees.map(fee => {
                  // Extract amount from title if fee.amount is not set
                  const extractedAmount = fee.amount || (() => {
                    const match = fee.title?.match(/(\d+)/);
                    return match ? match[1] : '—';
                  })();
                  // Remove the number from the title for clean display
                  const cleanTitle = fee.title?.replace(/\d+/, '').replace(/\s+/g, ' ').trim() || fee.title;
                  return (
                    <tr key={fee.id} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                      <td className="px-3 sm:px-6 py-4 text-foreground font-medium text-sm break-words">{cleanTitle}</td>
                      <td className="px-2 sm:px-6 py-4 text-primary text-center text-lg font-bold">₹{extractedAmount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesPage;
