import { useState } from 'react';
import { useGetAllDeals, useGetAllCustomers, useMoveDealStage, useDeleteDeal } from '../hooks/useQueries';
import { DealStage, type Deal } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Briefcase } from 'lucide-react';
import DealFormDialog from '../components/DealFormDialog';
import DealCard from '../components/DealCard';
import { toast } from 'sonner';

const STAGES = [
  { key: DealStage.new_, label: 'New', color: 'border-t-blue-500' },
  { key: DealStage.inProgress, label: 'In Progress', color: 'border-t-orange-500' },
  { key: DealStage.won, label: 'Won', color: 'border-t-green-500' },
  { key: DealStage.lost, label: 'Lost', color: 'border-t-red-500' },
];

export default function DealsPage() {
  const { data: deals, isLoading } = useGetAllDeals();
  const { data: customers } = useGetAllCustomers();
  const moveDealStage = useMoveDealStage();
  const deleteDeal = useDeleteDeal();
  const [search, setSearch] = useState('');
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [showForm, setShowForm] = useState(false);

  const customerMap = new Map((customers ?? []).map(c => [c.id.toString(), c.name]));

  const filteredDeals = (deals ?? []).filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    (customerMap.get(d.customerId.toString()) ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleMoveStage = async (dealId: bigint, stage: DealStage) => {
    try {
      await moveDealStage.mutateAsync({ id: dealId, stage });
      toast.success('Deal stage updated');
    } catch {
      toast.error('Failed to update deal stage');
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteDeal.mutateAsync(id);
      toast.success('Deal deleted');
    } catch {
      toast.error('Failed to delete deal');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Deal Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">{deals?.length ?? 0} total deals</p>
        </div>
        <Button onClick={() => { setEditDeal(null); setShowForm(true); }}>
          <Plus size={16} className="mr-2" /> Add Deal
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search deals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto">
          {STAGES.map(({ key, label, color }) => {
            const stageDeals = filteredDeals.filter(d => d.stage === key);
            const totalValue = stageDeals.reduce((s, d) => s + d.value, 0);
            return (
              <div key={key} className="min-w-0">
                <Card className={`shadow-card border-t-4 ${color}`}>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-display text-sm font-semibold">{label}</CardTitle>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {stageDeals.length}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-2">
                    {stageDeals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/50">
                        <Briefcase size={20} className="mb-1" />
                        <p className="text-xs">No deals</p>
                      </div>
                    ) : (
                      stageDeals.map(deal => (
                        <DealCard
                          key={deal.id.toString()}
                          deal={deal}
                          customerName={customerMap.get(deal.customerId.toString()) ?? 'Unknown'}
                          onMoveStage={handleMoveStage}
                          onEdit={(d) => { setEditDeal(d); setShowForm(true); }}
                          onDelete={handleDelete}
                          currentStage={key}
                          allStages={STAGES}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <DealFormDialog
          deal={editDeal}
          customers={customers ?? []}
          onClose={() => { setShowForm(false); setEditDeal(null); }}
        />
      )}
    </div>
  );
}
