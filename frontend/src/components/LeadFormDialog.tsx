import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddLead, useUpdateLead } from '../hooks/useQueries';
import { LeadStatus, type Lead } from '../backend';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: LeadStatus.new_, label: 'New' },
  { value: LeadStatus.contacted, label: 'Contacted' },
  { value: LeadStatus.qualified, label: 'Qualified' },
  { value: LeadStatus.converted, label: 'Converted' },
  { value: LeadStatus.lost, label: 'Lost' },
];

interface LeadFormDialogProps {
  lead?: Lead | null;
  onClose: () => void;
}

export default function LeadFormDialog({ lead, onClose }: LeadFormDialogProps) {
  const addLead = useAddLead();
  const updateLead = useUpdateLead();
  const isEdit = !!lead;

  const [name, setName] = useState(lead?.name ?? '');
  const [contact, setContact] = useState(lead?.contact ?? '');
  const [status, setStatus] = useState<LeadStatus>(lead?.status ?? LeadStatus.new_);
  const [notes, setNotes] = useState(lead?.notes ?? '');

  useEffect(() => {
    if (lead) {
      setName(lead.name);
      setContact(lead.contact);
      setStatus(lead.status);
      setNotes(lead.notes);
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && lead) {
        await updateLead.mutateAsync({ id: lead.id, name, contact, status, notes });
        toast.success('Lead updated successfully');
      } else {
        await addLead.mutateAsync({ name, contact, status, notes });
        toast.success('Lead added successfully');
      }
      onClose();
    } catch {
      toast.error(`Failed to ${isEdit ? 'update' : 'add'} lead`);
    }
  };

  const isPending = addLead.isPending || updateLead.isPending;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-name">Name *</Label>
            <Input
              id="lead-name"
              placeholder="Lead name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-contact">Contact</Label>
            <Input
              id="lead-contact"
              placeholder="Email or phone"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
              <SelectTrigger id="lead-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-notes">Notes</Label>
            <Textarea
              id="lead-notes"
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? 'Saving...' : isEdit ? 'Update Lead' : 'Add Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
