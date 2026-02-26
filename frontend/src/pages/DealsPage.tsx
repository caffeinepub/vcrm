import { useState } from 'react';
import { useGetAllDeals, useDeleteDeal, useMoveDealStage, useGetAllLeads } from '../hooks/useQueries';
import { DealStage } from '../backend';
import type { Deal } from '../backend';
import { Plus, Loader2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import DealFormDialog from '../components/DealFormDialog';
import DealCard from '../components/DealCard';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';

const STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: DealStage.new_, label: 'New', color: 'border-t-indigo-500' },
  { key: DealStage.inProgress, label: 'In Progress', color: 'border-t-amber-500' },
  { key: DealStage.won, label: 'Won', color: 'border-t-emerald-500' },
  { key: DealStage.lost, label: 'Lost', color: 'border-t-red-500' },
];

export default function DealsPage() {
  const { data: deals = [], isLoading } = useGetAllDeals();
  const { data: leads = [] } = useGetAllLeads();
  const deleteDeal = useDeleteDeal();
  const moveDealStage = useMoveDealStage();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [deleteTitle, setDeleteTitle] = useState('');

  const getLeadName = (customerId: bigint) => {
    const lead = leads.find((l) => l.id === customerId);
    return lead?.name ?? `Lead #${customerId}`;
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteDeal.mutateAsync(deleteId);
      toast.success('Deal deleted successfully');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete deal');
    }
  };

  const handleMoveStage = async (dealId: bigint, stage: DealStage) => {
    try {
      await moveDealStage.mutateAsync({ id: dealId, stage });
      toast.success('Deal stage updated');
    } catch {
      toast.error('Failed to update deal stage');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your deals through the sales pipeline</p>
        </div>
        <Button onClick={() => { setEditDeal(undefined); setShowAddDialog(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Deal
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key);
          const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div key={stage.key} className="flex flex-col gap-3">
              <Card className={`border border-border border-t-4 ${stage.color}`}>
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-foreground">{stage.label}</CardTitle>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                      {stageDeals.length}
                    </span>
                  </div>
                  {stageDeals.length > 0 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <DollarSign className="w-3 h-3" />
                      ₹{stageValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                  )}
                </CardHeader>
              </Card>

              {stageDeals.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
                  No deals
                </div>
              ) : (
                stageDeals.map((deal) => (
                  <DealCard
                    key={deal.id.toString()}
                    deal={deal}
                    customerName={getLeadName(deal.customerId)}
                    onEdit={() => { setEditDeal(deal); setShowAddDialog(true); }}
                    onDelete={() => {
                      setDeleteId(deal.id);
                      setDeleteTitle(deal.title);
                    }}
                    onMoveStage={(s) => handleMoveStage(deal.id, s)}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>

      <DealFormDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditDeal(undefined);
          }
        }}
        deal={editDeal}
      />

      <DeleteConfirmationDialog
        open={deleteId !== null}
        onCancel={() => setDeleteId(null)}
        entityName={deleteTitle}
        onConfirm={handleDelete}
        isLoading={deleteDeal.isPending}
      />
    </div>
  );
}
