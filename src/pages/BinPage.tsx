import { useState, useEffect } from 'react';
import { useDeletedItems, DeletedItemType } from '@/context/DeletedItemsContext';
import { useDateFilter } from '@/context/DateFilterContext';
import { Trash2, RotateCcw, AlertTriangle, Lock, BookOpen, FileText, MessageSquare, Bell } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

const typeIcons: Record<DeletedItemType, React.ElementType> = {
  homework: BookOpen, results: FileText, complaints: MessageSquare, announcements: Bell
};

const typeLabels: Record<DeletedItemType, string> = {
  homework: 'Homework', results: 'Results', complaints: 'Complaints', announcements: 'Announcements'
};

const BinPage = () => {
  const {
    deletedItems, restoreItem, permanentDeleteItem,
    binPin, setBinPin, isBinUnlocked, unlockBin, lockBin
  } = useDeletedItems();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(!binPin);
  const [filter, setFilter] = useState<'all' | DeletedItemType>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { filterStartDate, filterEndDate } = useDateFilter();

  // Auto-lock when leaving the page
  useEffect(() => {
    return () => { lockBin(); };
  }, []);

  const handlePinSubmit = () => {
    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      setPinError('Enter a 4-digit PIN');
      return;
    }
    if (isSettingPin) {
      setBinPin(pinInput);
      setIsSettingPin(false);
      setPinInput('');
      // Auto unlock after setting
      unlockBin(pinInput);
    } else {
      if (unlockBin(pinInput)) {
        setPinError('');
      } else {
        setPinError('Wrong PIN. Try again.');
      }
      setPinInput('');
    }
  };

  // PIN screen
  if (!isBinUnlocked) {
    return (
      <div className="space-y-6 relative z-10 px-4 py-6">
        <h1 className="text-3xl font-bold text-foreground text-center">Bin</h1>
        <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-8 max-w-xs mx-auto text-center">
          <Lock size={48} className="text-primary mx-auto mb-4" />
          <p className="text-foreground/70 mb-4">
            {isSettingPin ? 'Set a 4-digit PIN to secure your Bin' : 'Enter your 4-digit PIN to access Bin'}
          </p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pinInput}
            onChange={e => { setPinInput(e.target.value.replace(/\D/g, '')); setPinError(''); }}
            onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
            className="w-full text-center text-2xl tracking-[0.5em] bg-card border border-primary/30 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
            placeholder="••••"
          />
          {pinError && <p className="text-destructive text-sm mt-2">{pinError}</p>}
          <button
            onClick={handlePinSubmit}
            className="mt-4 w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            {isSettingPin ? 'Set PIN' : 'Unlock'}
          </button>
        </div>
      </div>
    );
  }

  const typeFiltered = filter === 'all' ? deletedItems : deletedItems.filter(i => i.type === filter);
  const filtered = typeFiltered.filter(item => {
    const deletedDate = new Date(item.deleted_at);
    return deletedDate >= filterStartDate && deletedDate <= filterEndDate;
  });

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Bin</h1>
        <button onClick={lockBin} className="text-xs text-foreground/50 hover:text-primary border border-primary/20 rounded-lg px-3 py-1.5">
          <Lock size={14} className="inline mr-1" />Lock
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'homework', 'results', 'complaints', 'announcements'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'bg-card/30 text-foreground/60 border-primary/10 hover:border-primary/30'
            }`}
          >
            {f === 'all' ? 'All' : typeLabels[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-12 text-center">
          <Trash2 size={48} className="text-foreground/20 mx-auto mb-4" />
          <p className="text-foreground/50 text-lg">Bin is empty.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const Icon = typeIcons[item.type];
            const remaining = daysLeft(item.deleted_at);
            return (
              <div key={item.id} className="bg-card/30 backdrop-blur-md border border-primary/20 rounded-xl p-4 hover:border-primary/40 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={16} className="text-primary shrink-0" />
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {typeLabels[item.type]}
                      </span>
                      <span className="text-xs text-foreground/40">{remaining}d left</span>
                    </div>
                    <p className="text-foreground font-medium text-sm truncate">
                      {item.data.title || item.data.subject || item.data.description || 'Untitled'}
                    </p>
                    <p className="text-foreground/50 text-xs mt-0.5">
                      Deleted {new Date(item.deleted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => restoreItem(item.id)}
                      className="p-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                      title="Restore"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="p-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
                      title="Delete permanently"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Permanent delete confirmation */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <AlertDialogContent className="bg-card border border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="text-destructive" size={20} />
              Permanent Delete
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/60">
              This action cannot be undone. The item will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-primary/20 text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmDeleteId) permanentDeleteItem(confirmDeleteId); setConfirmDeleteId(null); }}
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BinPage;
