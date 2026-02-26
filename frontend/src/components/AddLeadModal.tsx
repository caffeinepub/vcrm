import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAddLead } from '../hooks/useQueries';
import { LeadStatus } from '../backend';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddLeadModal({ open, onClose }: AddLeadModalProps) {
  const addLead = useAddLead();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    if (!phone.trim()) {
      toast.error('Contact Number is required');
      return;
    }
    try {
      await addLead.mutateAsync({
        name: name.trim() || phone.trim(),
        contact: phone.trim(),
        status: LeadStatus.new_,
        notes: email.trim() ? `Email: ${email.trim()}` : '',
      });
      toast.success('Lead added successfully!');
      setName('');
      setPhone('');
      setEmail('');
      onClose();
    } catch {
      toast.error('Failed to add lead');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Add Lead</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label htmlFor="lead-name" className="text-sm font-medium">Contact Name</Label>
            <Input
              id="lead-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contact Name"
              className="mt-1"
              disabled={addLead.isPending}
            />
          </div>

          <div>
            <Label htmlFor="lead-phone" className="text-sm font-medium">
              Contact Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lead-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contact Number"
              className="mt-1"
              disabled={addLead.isPending}
            />
          </div>

          <div>
            <Label htmlFor="lead-email" className="text-sm font-medium">Email</Label>
            <Input
              id="lead-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="mt-1"
              disabled={addLead.isPending}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={addLead.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={addLead.isPending}>
            {addLead.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
