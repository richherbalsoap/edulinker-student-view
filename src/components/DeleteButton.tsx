import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useDeletedItems, DeletedItemType } from '@/context/DeletedItemsContext';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface DeleteButtonProps {
  id: string;
  type: DeletedItemType;
  data: any;
  size?: number;
}

const DeleteButton = ({ id, type, data, size = 16 }: DeleteButtonProps) => {
  const { deleteItem } = useDeletedItems();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg text-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
        title="Delete"
      >
        <Trash2 size={size} />
      </button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="bg-card border border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete this item?</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/60">
              Are you sure you want to delete this item? It will be moved to Bin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-primary/20 text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { deleteItem(id, type, data); setOpen(false); }}
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteButton;
