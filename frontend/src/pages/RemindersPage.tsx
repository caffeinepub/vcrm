import { useState } from 'react';
import { useGetAllReminders, useDeleteReminder, useMarkReminderOverdue } from '../hooks/useQueries';
import type { Reminder } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Bell, Edit2, Trash2, AlertTriangle, Clock } from 'lucide-react';
import ReminderFormDialog from '../components/ReminderFormDialog';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function RemindersPage() {
  const { data: reminders, isLoading } = useGetAllReminders();
  const deleteReminder = useDeleteReminder();
  const markOverdue = useMarkReminderOverdue();
  const [search, setSearch] = useState('');
  const [editReminder, setEditReminder] = useState<Reminder | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'upcoming'>('all');

  const now = Date.now();

  const filtered = (reminders ?? []).filter(r => {
    const matchSearch = r.note.toLowerCase().includes(search.toLowerCase());
    const dueDateMs = Number(r.dueDate) / 1_000_000;
    const isActuallyOverdue = dueDateMs < now;
    if (filter === 'overdue') return matchSearch && (r.isOverdue || isActuallyOverdue);
    if (filter === 'upcoming') return matchSearch && !r.isOverdue && dueDateMs >= now;
    return matchSearch;
  });

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteReminder.mutateAsync(deleteId);
      toast.success('Reminder deleted');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete reminder');
    }
  };

  const handleMarkOverdue = async (id: bigint) => {
    try {
      await markOverdue.mutateAsync(id);
      toast.success('Marked as overdue');
    } catch {
      toast.error('Failed to mark as overdue');
    }
  };

  const formatDate = (dueDate: bigint) => {
    try {
      const ms = Number(dueDate) / 1_000_000;
      return format(new Date(ms), 'MMM d, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const overdueCount = (reminders ?? []).filter(r => r.isOverdue || Number(r.dueDate) / 1_000_000 < now).length;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Reminders</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {reminders?.length ?? 0} total · {overdueCount > 0 && <span className="text-destructive font-medium">{overdueCount} overdue</span>}
          </p>
        </div>
        <Button onClick={() => { setEditReminder(null); setShowForm(true); }}>
          <Plus size={16} className="mr-2" /> Add Reminder
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reminders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'overdue', 'upcoming'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Bell size={40} className="mb-3 opacity-30" />
          <p className="font-medium">No reminders found</p>
          <p className="text-sm mt-1">Add a reminder to stay on top of follow-ups</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((reminder) => {
            const dueDateMs = Number(reminder.dueDate) / 1_000_000;
            const isActuallyOverdue = reminder.isOverdue || dueDateMs < now;
            return (
              <Card
                key={reminder.id.toString()}
                className={`shadow-card transition-shadow ${isActuallyOverdue ? 'border-destructive/40 bg-destructive/5' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActuallyOverdue ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                      {isActuallyOverdue ? (
                        <AlertTriangle size={14} className="text-destructive" />
                      ) : (
                        <Clock size={14} className="text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{reminder.note}</p>
                        {isActuallyOverdue && (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {formatDate(reminder.dueDate)}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!reminder.isOverdue && dueDateMs < now && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleMarkOverdue(reminder.id)}
                        >
                          Mark Overdue
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setEditReminder(reminder); setShowForm(true); }}
                      >
                        <Edit2 size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(reminder.id)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <ReminderFormDialog
          reminder={editReminder}
          onClose={() => { setShowForm(false); setEditReminder(null); }}
        />
      )}

      <DeleteConfirmationDialog
        open={deleteId !== null}
        entityName="reminder"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteReminder.isPending}
      />
    </div>
  );
}
