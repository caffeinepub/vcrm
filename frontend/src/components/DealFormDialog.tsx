import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddDeal, useUpdateDeal } from '../hooks/useQueries';
import { DealStage, type Deal, type Customer } from '../backend';
import { toast } from 'sonner';

const STAGE_OPTIONS = [
  { value: DealStage.new_, label: 'New' },
  { value: DealStage.inProgress, label: 'In Progress' },
  { value: DealStage.won, label: 'Won' },
  { value: DealStage.lost, label: 'Lost' },
];

interface DealFormDialogProps {
  deal?: Deal | null;
  customers: Customer[];
  onClose: () => void;
}

export default function DealFormDialog({ deal, customers, onClose }: DealFormDialogProps) {
  const addDeal = useAddDeal();
  const updateDeal = useUpdateDeal();
  const isEdit = !!deal;

  const [title, setTitle] = useState(deal?.title ?? '');
  const [value, setValue] = useState(deal?.value?.toString() ?? '');
  const [customerId, setCustomerId] = useState(deal?.customerId?.toString() ?? '');
  const [stage, setStage] = useState<DealStage>(deal?.stage ?? DealStage.new_);

  useEffect(() => {
    if (deal) {
      setTitle(deal.title);
      setValue(deal.value.toString());
      setCustomerId(deal.customerId.toString());
      setStage(deal.stage);
    }
  }, [deal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }
    const numValue = parseFloat(value) || 0;
    try {
      if (isEdit && deal) {
        await updateDeal.mutateAsync({ id: deal.id, title, value: numValue, customerId: BigInt(customerId), stage });
        toast.success('Deal updated successfully');
      } else {
        await addDeal.mutateAsync({ title, value: numValue, customerId: BigInt(customerId), stage });
        toast.success('Deal added successfully');
      }
      onClose();
    } catch {
      toast.error(`Failed to ${isEdit ? 'update' : 'add'} deal`);
    }
  };

  const isPending = addDeal.isPending || updateDeal.isPending;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? 'Edit Deal' : 'Add New Deal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deal-title">Title *</Label>
            <Input
              id="deal-title"
              placeholder="Deal title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deal-value">Value ($)</Label>
            <Input
              id="deal-value"
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deal-customer">Customer *</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger id="deal-customer">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id.toString()} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deal-stage">Stage</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as DealStage)}>
              <SelectTrigger id="deal-stage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim() || !customerId}>
              {isPending ? 'Saving...' : isEdit ? 'Update Deal' : 'Add Deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
