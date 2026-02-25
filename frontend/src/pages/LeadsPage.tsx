import { useState } from 'react';
import { useGetAllLeads, useDeleteLead } from '../hooks/useQueries';
import { LeadStatus, type Lead } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit2, Trash2, UserCheck } from 'lucide-react';
import LeadFormDialog from '../components/LeadFormDialog';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_LABELS: Record<string, string> = {
  [LeadStatus.new_]: 'New',
  [LeadStatus.contacted]: 'Contacted',
  [LeadStatus.qualified]: 'Qualified',
  [LeadStatus.converted]: 'Converted',
  [LeadStatus.lost]: 'Lost',
};

const STATUS_COLORS: Record<string, string> = {
  [LeadStatus.new_]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  [LeadStatus.contacted]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  [LeadStatus.qualified]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  [LeadStatus.converted]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  [LeadStatus.lost]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export default function LeadsPage() {
  const { data: leads, isLoading } = useGetAllLeads();
  const deleteLead = useDeleteLead();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const filtered = (leads ?? []).filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.contact.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteLead.mutateAsync(deleteId);
      toast.success('Lead deleted successfully');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete lead');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">{leads?.length ?? 0} total leads</p>
        </div>
        <Button onClick={() => { setEditLead(null); setShowForm(true); }}>
          <Plus size={16} className="mr-2" /> Add Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <UserCheck size={40} className="mb-3 opacity-30" />
          <p className="font-medium">No leads found</p>
          <p className="text-sm mt-1">Try adjusting your search or add a new lead</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((lead) => (
            <Card key={lead.id.toString()} className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{lead.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{lead.contact}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 flex-shrink-0 ${STATUS_COLORS[lead.status] ?? ''}`}>
                    {STATUS_LABELS[lead.status] ?? lead.status}
                  </span>
                </div>
                {lead.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{lead.notes}</p>
                )}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8"
                    onClick={() => { setEditLead(lead); setShowForm(true); }}
                  >
                    <Edit2 size={13} className="mr-1" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(lead.id)}
                  >
                    <Trash2 size={13} className="mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <LeadFormDialog
          lead={editLead}
          onClose={() => { setShowForm(false); setEditLead(null); }}
        />
      )}

      <DeleteConfirmationDialog
        open={deleteId !== null}
        entityName="lead"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteLead.isPending}
      />
    </div>
  );
}
