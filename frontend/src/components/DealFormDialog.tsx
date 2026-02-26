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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAddDeal, useUpdateDeal, useGetAllLeads } from '../hooks/useQueries';
import { DealStage } from '../backend';
import type { Deal } from '../backend';
import { Loader2 } from 'lucide-react';

interface DealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal;
}

const STAGE_OPTIONS = [
  { value: DealStage.new_, label: 'New' },
  { value: DealStage.inProgress, label: 'In Progress' },
  { value: DealStage.won, label: 'Won' },
  { value: DealStage.lost, label: 'Lost' },
];

export default function DealFormDialog({ open, onOpenChange, deal }: DealFormDialogProps) {
  const addDeal = useAddDeal();
  const updateDeal = useUpdateDeal();
  const { data: leads = [] } = useGetAllLeads();

  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [stage, setStage] = useState<DealStage>(DealStage.new_);

  const isEditing = !!deal;
  const isPending = addDeal.isPending || updateDeal.isPending;

  useEffect(() => {
    if (open) {
      if (deal) {
        setTitle(deal.title);
        setValue(deal.value.toString());
        setCustomerId(deal.customerId.toString());
        setStage(deal.stage);
      } else {
        setTitle('');
        setValue('');
        setCustomerId('');
        setStage(DealStage.new_);
      }
    }
  }, [open, deal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      toast.error('Please enter a valid deal value');
      return;
    }
    if (!customerId) {
      toast.error('Please select a lead/contact');
      return;
    }

    try {
      if (isEditing && deal) {
        await updateDeal.mutateAsync({
          id: deal.id,
          title: title.trim(),
          value: numValue,
          customerId: BigInt(customerId),
          stage,
        });
        toast.success('Deal updated successfully');
      } else {
        await addDeal.mutateAsync({
          title: title.trim(),
          value: numValue,
          customerId: BigInt(customerId),
          stage,
        });
        toast.success('Deal added successfully');
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
          <DialogTitle>{isEditing ? 'Edit Deal' : 'Add New Deal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="deal-title">Deal Title *</Label>
            <Input
              id="deal-title"
              placeholder="Enter deal title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deal-value">Value (₹) *</Label>
            <Input
              id="deal-value"
              type="number"
              placeholder="0"
              min="0"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deal-customer">Lead / Contact *</Label>
            {leads.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-muted rounded-md px-3 py-2">
                No leads available. Please add a lead first from the Contacts page.
              </p>
            ) : (
              <Select
                value={customerId}
                onValueChange={setCustomerId}
                disabled={isPending}
              >
                <SelectTrigger id="deal-customer">
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id.toString()} value={lead.id.toString()}>
                      {lead.name} — {lead.contact}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deal-stage">Stage</Label>
            <Select
              value={stage}
              onValueChange={(v) => setStage(v as DealStage)}
              disabled={isPending}
            >
              <SelectTrigger id="deal-stage">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button type="submit" disabled={isPending || leads.length === 0}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Update Deal' : 'Add Deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
