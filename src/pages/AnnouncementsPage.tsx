import { useEffect, useState } from 'react';
import { useStudentAuth } from '@/context/StudentAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Bell } from 'lucide-react';
import DeleteButton from '@/components/DeleteButton';
import { useDeletedItems } from '@/context/DeletedItemsContext';

const AnnouncementsPage = () => {
  const { schoolId } = useStudentAuth();
  const { isDeleted } = useDeletedItems();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    const fetchAnnouncements = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Announcements fetch error:', error.message);
      }
      setAnnouncements(data || []);
      setLoading(false);
    };
    fetchAnnouncements();
  }, [schoolId]);

  const typeBadgeColor = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'urgent': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'event': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'holiday': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      <h1 className="text-3xl font-bold text-foreground text-center">Announcements</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-12 text-center">
          <Bell size={48} className="text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/50 text-lg">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.filter(a => !isDeleted(a.id)).map(a => (
            <div key={a.id} className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-5 hover:border-primary/40 transition-all duration-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-foreground font-semibold text-lg">{a.title}</h3>
                  <p className="text-foreground/70 mt-2">{a.content}</p>
                  <p className="text-muted-foreground text-xs mt-3">{new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.type && (
                    <span className={`text-xs px-3 py-1 rounded-full border font-medium ${typeBadgeColor(a.type)}`}>
                      {a.type}
                    </span>
                  )}
                  <DeleteButton id={a.id} type="announcements" data={a} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
