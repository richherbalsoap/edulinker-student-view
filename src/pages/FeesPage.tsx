import { useEffect, useState } from "react";
import { useStudentAuth } from "@/context/StudentAuthContext";
import { useDateFilter } from '@/context/DateFilterContext';
import { supabase } from "@/integrations/supabase/client";
import { applyCreatedAtFilter, applySchoolScopeFilter } from '@/lib/queryFilters';
import { IndianRupee } from "lucide-react";

const FeesPage = () => {
  const { student, schoolId } = useStudentAuth();
  const { filterType, filterStartDate: startDate, filterEndDate: endDate } = useDateFilter();
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;
    const fetchFees = async () => {
      setLoading(true);
      const includeLegacyNull = filterType === 'all';

      const buildStudentFeesQuery = () => {
        let query = supabase
          .from("fees_reminders")
          .select("*")
          .eq("student_id", student.id);

        query = applySchoolScopeFilter(query, schoolId, includeLegacyNull);
        query = applyCreatedAtFilter(query, filterType, startDate, endDate);

        return query.order("created_at", { ascending: false });
      };

      const buildClassFeesQuery = () => {
        let query = supabase
          .from("fees_reminders")
          .select("*")
          .is("student_id", null)
          .ilike("standard", student.standard)
          .ilike("section", student.section);

        query = applySchoolScopeFilter(query, schoolId, includeLegacyNull);
        query = applyCreatedAtFilter(query, filterType, startDate, endDate);

        return query.order("created_at", { ascending: false });
      };

      const [byStudent, byClass] = await Promise.all([
        buildStudentFeesQuery(),
        buildClassFeesQuery(),
      ]);
      if (byStudent.error) console.error('Fees (student) fetch error:', byStudent.error.message);
      if (byClass.error) console.error('Fees (class) fetch error:', byClass.error.message);
      const allFees = [...(byStudent.data || []), ...(byClass.data || [])];
      const uniqueFees = Array.from(new Map(allFees.map((f) => [f.id, f])).values());
      setFees(uniqueFees);
      setLoading(false);
    };
    fetchFees();
  }, [student, schoolId, filterType, startDate, endDate]);

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
                {fees.map((fee) => (
                  <tr key={fee.id} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                    <td className="px-3 sm:px-6 py-4 text-foreground font-medium text-sm break-words">
                      {/* Title dikhao, agar nahi hai toh message dikhao */}
                      {fee.title || fee.message || "—"}
                    </td>
                    <td className="px-2 sm:px-6 py-4 text-primary text-center text-lg font-bold">
                      {/* Amount directly use karo — koi regex nahi */}
                      {fee.amount && fee.amount > 0 ? `₹${fee.amount}` : "—"}
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
