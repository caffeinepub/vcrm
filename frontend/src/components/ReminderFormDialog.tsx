import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAddReminder, useUpdateReminder } from '../hooks/useQueries';
import type { Reminder } from '../backend';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ReminderFormDialogProps {
  reminder?: Reminder | null;
  onClose: () => void;
}

export default function ReminderFormDialog({ reminder, onClose }: ReminderFormDialogProps) {
  const addReminder = useAddReminder();
  const updateReminder = useUpdateReminder();
  const isEdit = !!reminder;

  // Convert bigint nanoseconds to datetime-local string
  const toDatetimeLocal = (ns: bigint): string => {
    try {
      const ms = Number(ns) / 1_000_000;
      return format(new Date(ms), "yyyy-MM-dd'T'HH:mm");
    } catch {
      return '';
    }
  };

  const [dueDate, setDueDate] = useState(
    reminder ? toDatetimeLocal(reminder.dueDate) : ''
  );
  const [note, setNote] = useState(reminder?.note ?? '');

  useEffect(() => {
    if (reminder) {
      setDueDate(toDatetimeLocal(reminder.dueDate));
      setNote(reminder.note);
    }
  }, [reminder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate) {
      toast.error('Please select a due date');
      return;
    }
    // Convert datetime-local to nanoseconds bigint
    const ms = new Date(dueDate).getTime();
    const ns = BigInt(ms) * BigInt(1_000_000);
    try {
      if (isEdit && reminder) {
        await updateReminder.mutateAsync({ id: reminder.id, dueDate: ns, note });
        toast.success('Reminder updated');
      } else {
        await addReminder.mutateAsync({ dueDate: ns, note });
        toast.success('Reminder added');
      }
      onClose();
    } catch {
      toast.error(`Failed to ${isEdit ? 'update' : 'add'} reminder`);
    }
  };

  const isPending = addReminder.isPending || updateReminder.isPending;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? 'Edit Reminder' : 'Add Reminder'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminder-date">Due Date & Time *</Label>
            <Input
              id="reminder-date"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminder-note">Note *</Label>
            <Textarea
              id="reminder-note"
              placeholder="What do you need to follow up on?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !note.trim() || !dueDate}>
              {isPending ? 'Saving...' : isEdit ? 'Update Reminder' : 'Add Reminder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
