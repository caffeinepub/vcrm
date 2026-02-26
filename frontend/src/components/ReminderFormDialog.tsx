import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Local type since Reminder is no longer in the backend
export interface ReminderLocal {
  id: bigint;
  dueDate: bigint;
  note: string;
  isOverdue: boolean;
}

interface ReminderFormDialogProps {
  reminder?: ReminderLocal | null;
  onClose: () => void;
}

export default function ReminderFormDialog({ reminder, onClose }: ReminderFormDialogProps) {
  const isEdit = !!reminder;

  const bigintToDatetimeLocal = (ns: bigint): string => {
    try {
      const ms = Number(ns) / 1_000_000;
      const d = new Date(ms);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const [dueDate, setDueDate] = useState(reminder ? bigintToDatetimeLocal(reminder.dueDate) : '');
  const [note, setNote] = useState(reminder?.note ?? '');

  useEffect(() => {
    if (reminder) {
      setDueDate(bigintToDatetimeLocal(reminder.dueDate));
      setNote(reminder.note);
    }
  }, [reminder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.info('Reminders are not available in this version.');
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Reminder' : 'Add Reminder'}</DialogTitle>
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
              placeholder="Reminder note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{isEdit ? 'Update' : 'Add'} Reminder</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
