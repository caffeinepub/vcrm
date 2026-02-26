import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAddLead, useUpdateLead } from '../hooks/useQueries';
import { LeadStatus } from '../backend';
import type { Lead } from '../backend';
import { Loader2 } from 'lucide-react';

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead;
}

const STATUS_OPTIONS = [
  { value: LeadStatus.new_, label: 'New' },
  { value: LeadStatus.contacted, label: 'Contacted' },
  { value: LeadStatus.qualified, label: 'Qualified' },
  { value: LeadStatus.converted, label: 'Converted' },
  { value: LeadStatus.lost, label: 'Lost' },
];

export default function LeadFormDialog({ open, onOpenChange, lead }: LeadFormDialogProps) {
  const addLead = useAddLead();
  const updateLead = useUpdateLead();

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<LeadStatus>(LeadStatus.new_);
  const [notes, setNotes] = useState('');

  const isEditing = !!lead;
  const isPending = addLead.isPending || updateLead.isPending;

  useEffect(() => {
    if (open) {
      if (lead) {
        setName(lead.name);
        setContact(lead.contact);
        setStatus(lead.status);
        setNotes(lead.notes);
      } else {
        setName('');
        setContact('');
        setStatus(LeadStatus.new_);
        setNotes('');
      }
    }
  }, [open, lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!contact.trim()) {
      toast.error('Contact is required');
      return;
    }

    try {
      if (isEditing && lead) {
        await updateLead.mutateAsync({
          id: lead.id,
          name: name.trim(),
          contact: contact.trim(),
          status,
          notes: notes.trim(),
        });
        toast.success('Lead updated successfully');
      } else {
        await addLead.mutateAsync({
          name: name.trim(),
          contact: contact.trim(),
          status,
          notes: notes.trim(),
        });
        toast.success('Lead added successfully');
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lead-name">Name *</Label>
            <Input
              id="lead-name"
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-contact">Contact (Phone/Email) *</Label>
            <Input
              id="lead-contact"
              placeholder="Phone number or email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as LeadStatus)}
              disabled={isPending}
            >
              <SelectTrigger id="lead-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-notes">Notes</Label>
            <Textarea
              id="lead-notes"
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Update Lead' : 'Add Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
