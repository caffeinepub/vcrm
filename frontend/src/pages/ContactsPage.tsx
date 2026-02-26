import { useState } from 'react';
import { useGetAllLeads, useDeleteLead } from '../hooks/useQueries';
import { LeadStatus } from '../backend';
import type { Lead } from '../backend';
import { Plus, Search, Trash2, Edit2, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import LeadFormDialog from '../components/LeadFormDialog';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';

const statusLabel: Record<string, string> = {
  [LeadStatus.new_]: 'New',
  [LeadStatus.contacted]: 'Contacted',
  [LeadStatus.qualified]: 'Qualified',
  [LeadStatus.converted]: 'Converted',
  [LeadStatus.lost]: 'Lost',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [LeadStatus.new_]: 'default',
  [LeadStatus.contacted]: 'secondary',
  [LeadStatus.qualified]: 'default',
  [LeadStatus.converted]: 'default',
  [LeadStatus.lost]: 'destructive',
};

export default function ContactsPage() {
  const { data: leads = [], isLoading } = useGetAllLeads();
  const deleteLead = useDeleteLead();

  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editLead, setEditLead] = useState<Lead | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [deleteName, setDeleteName] = useState('');

  const filtered = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.contact.toLowerCase().includes(search.toLowerCase())
  );

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
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your leads and contacts</p>
        </div>
        <Button onClick={() => { setEditLead(undefined); setShowAddDialog(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Lead
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">
            {search ? 'No leads match your search.' : 'No leads yet. Click "Add Lead" to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lead) => (
            <Card key={lead.id.toString()} className="border border-border hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{lead.name}</p>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{lead.contact}</p>
                    {lead.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{lead.notes}</p>
                    )}
                  </div>
                  <Badge variant={statusVariant[lead.status] || 'default'} className="flex-shrink-0 text-xs">
                    {statusLabel[lead.status] || lead.status}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => { setEditLead(lead); setShowAddDialog(true); }}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1 text-destructive hover:text-destructive"
                    onClick={() => {
                      setDeleteId(lead.id);
                      setDeleteName(lead.name);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LeadFormDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditLead(undefined);
          }
        }}
        lead={editLead}
      />

      <DeleteConfirmationDialog
        open={deleteId !== null}
        onCancel={() => setDeleteId(null)}
        entityName={deleteName}
        onConfirm={handleDelete}
        isLoading={deleteLead.isPending}
      />
    </div>
  );
}
