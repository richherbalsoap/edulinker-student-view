import { useEffect, useState, useCallback } from "react";
import { useStudentAuth } from "@/context/StudentAuthContext";
import { useDateFilter } from "@/context/DateFilterContext";
import { supabase } from "@/integrations/supabase/client";
import { applyCreatedAtFilter, applySchoolScopeFilter } from "@/lib/queryFilters";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useAppRefresh } from "@/hooks/useAppRefresh";
import { IndianRupee, QrCode, X } from "lucide-react";

const FeesPage = () => {
  const { student, schoolId } = useStudentAuth();
  const { filterType, filterStartDate: startDate, filterEndDate: endDate } = useDateFilter();
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentQr, setPaymentQr] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const fetchFees = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    const includeLegacyNull = filterType === "all";

    const buildStudentFeesQuery = () => {
      let query = supabase.from("fees_reminders").select("*").eq("student_id", student.id);
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

    const [byStudent, byClass] = await Promise.all([buildStudentFeesQuery(), buildClassFeesQuery()]);
    if (byStudent.error) console.error("Fees (student) fetch error:", byStudent.error.message);
    if (byClass.error) console.error("Fees (class) fetch error:", byClass.error.message);

    const allFees = [...(byStudent.data || []), ...(byClass.data || [])];
    const uniqueFees = Array.from(new Map(allFees.map((f) => [f.id, f])).values());
    setFees(uniqueFees);
    setLoading(false);
  }, [student, schoolId, filterType, startDate, endDate]);

  useEffect(() => {
    fetchFees();
    if (schoolId) {
      (async () => {
        const { data } = await (supabase.from("schools") as any).select("payment_qr_url").eq("id", schoolId).single();
        if (data?.payment_qr_url) setPaymentQr(data.payment_qr_url);
      })();
    }
  }, [fetchFees, schoolId]);

  useRealtimeSubscription('fees_reminders', fetchFees, !!student);
  useAppRefresh(fetchFees);

  return (
    <div className="space-y-4 sm:space-y-6 relative z-10 px-3 sm:px-4 py-4 sm:py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center">Fees Reminder</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : fees.length === 0 ? (
        <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-8 sm:p-12 text-center">
          <IndianRupee size={48} className="text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/50 text-lg">No fees reminders found.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {fees.map(fee => (
              <div key={fee.id} className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-3 flex items-center justify-between">
                <p className="text-foreground font-medium text-sm flex-1 min-w-0 break-words">{fee.title || fee.message || "—"}</p>
                <p className="text-primary text-lg font-bold shrink-0 ml-3">
                  {fee.amount && fee.amount > 0 ? `₹${fee.amount}` : "—"}
                </p>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th className="text-left px-6 py-4 text-primary text-sm font-semibold w-[60%]">Title</th>
                    <th className="text-center px-6 py-4 text-primary text-sm font-semibold w-[40%]">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map(fee => (
                    <tr key={fee.id} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 text-foreground font-medium text-sm break-words">{fee.title || fee.message || "—"}</td>
                      <td className="px-6 py-4 text-primary text-center text-lg font-bold">
                        {fee.amount && fee.amount > 0 ? `₹${fee.amount}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {paymentQr && fees.length > 0 && (
        <div className="fixed bottom-20 right-4 z-40">
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold px-5 py-3 rounded-full shadow-lg shadow-green-500/40 transition-all"
          >
            <QrCode size={18} />
            Pay Now
          </button>
        </div>
      )}

      {showQrModal && paymentQr && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={() => setShowQrModal(false)}>
          <div className="bg-black/95 backdrop-blur-2xl border border-primary/30 rounded-2xl p-6 max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <QrCode size={20} className="text-primary" />
                <h3 className="text-lg font-bold text-foreground">Scan to Pay</h3>
              </div>
              <button onClick={() => setShowQrModal(false)} className="text-foreground/40 hover:text-foreground transition-colors p-1">
                <X size={20} />
              </button>
            </div>
            <p className="text-foreground/40 text-xs mb-4 text-center">GPay / PhonePe / BHIM — kisi bhi UPI app se scan karo</p>
            <div className="bg-white rounded-2xl p-3 mx-auto w-fit shadow-lg">
              <img src={paymentQr} alt="Payment QR Code" className="w-56 h-56 object-contain" />
            </div>
            <p className="text-foreground/20 text-xs text-center mt-4">Bahar tap karo ya × press karo band karne ke liye</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesPage;
