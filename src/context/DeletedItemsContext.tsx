import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type DeletedItemType = 'homework' | 'results' | 'complaints' | 'announcements';

interface DeletedItem {
  id: string;
  type: DeletedItemType;
  data: any;
  deleted_at: string;
}

interface DeletedItemsContextType {
  deletedItems: DeletedItem[];
  deleteItem: (id: string, type: DeletedItemType, data: any) => void;
  restoreItem: (id: string) => void;
  permanentDeleteItem: (id: string) => void;
  isDeleted: (id: string) => boolean;
  binPin: string | null;
  setBinPin: (pin: string) => void;
  isBinUnlocked: boolean;
  unlockBin: (pin: string) => boolean;
  lockBin: () => void;
}

const DeletedItemsContext = createContext<DeletedItemsContextType | undefined>(undefined);

const DELETED_ITEMS_KEY = 'edulinker_deleted_items';
const BIN_PIN_KEY = 'edulinker_bin_pin';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const DeletedItemsProvider = ({ children }: { children: ReactNode }) => {
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [binPin, setBinPinState] = useState<string | null>(null);
  const [isBinUnlocked, setIsBinUnlocked] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(DELETED_ITEMS_KEY);
    if (stored) {
      const items: DeletedItem[] = JSON.parse(stored);
      // Auto-delete items older than 30 days
      const now = Date.now();
      const filtered = items.filter(item => {
        const age = now - new Date(item.deleted_at).getTime();
        return age < THIRTY_DAYS_MS;
      });
      if (filtered.length !== items.length) {
        localStorage.setItem(DELETED_ITEMS_KEY, JSON.stringify(filtered));
      }
      setDeletedItems(filtered);
    }
    const pin = localStorage.getItem(BIN_PIN_KEY);
    setBinPinState(pin);
  }, []);

  const persist = (items: DeletedItem[]) => {
    localStorage.setItem(DELETED_ITEMS_KEY, JSON.stringify(items));
    setDeletedItems(items);
  };

  const deleteItem = useCallback((id: string, type: DeletedItemType, data: any) => {
    const newItem: DeletedItem = { id, type, data, deleted_at: new Date().toISOString() };
    const updated = [...deletedItems, newItem];
    persist(updated);
  }, [deletedItems]);

  const restoreItem = useCallback((id: string) => {
    persist(deletedItems.filter(item => item.id !== id));
  }, [deletedItems]);

  const permanentDeleteItem = useCallback((id: string) => {
    persist(deletedItems.filter(item => item.id !== id));
  }, [deletedItems]);

  const isDeleted = useCallback((id: string) => {
    return deletedItems.some(item => item.id === id);
  }, [deletedItems]);

  const setBinPin = (pin: string) => {
    localStorage.setItem(BIN_PIN_KEY, pin);
    setBinPinState(pin);
  };

  const unlockBin = (pin: string): boolean => {
    if (pin === binPin) {
      setIsBinUnlocked(true);
      return true;
    }
    return false;
  };

  const lockBin = () => setIsBinUnlocked(false);

  return (
    <DeletedItemsContext.Provider value={{
      deletedItems, deleteItem, restoreItem, permanentDeleteItem, isDeleted,
      binPin, setBinPin, isBinUnlocked, unlockBin, lockBin
    }}>
      {children}
    </DeletedItemsContext.Provider>
  );
};

export const useDeletedItems = () => {
  const ctx = useContext(DeletedItemsContext);
  if (!ctx) throw new Error('useDeletedItems must be used within DeletedItemsProvider');
  return ctx;
};
