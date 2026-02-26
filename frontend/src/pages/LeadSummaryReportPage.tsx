import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Search,
  Download,
  LayoutGrid,
  ChevronDown,
  Filter,
  MoreVertical,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAllLeads } from '../hooks/useQueries';
import { LeadStatus } from '../backend';
import { Skeleton } from '@/components/ui/skeleton';

const STAGE_COLORS: Record<string, string> = {
  [LeadStatus.new_]: 'text-green-600 bg-green-50',
  [LeadStatus.contacted]: 'text-amber-600 bg-amber-50',
  [LeadStatus.qualified]: 'text-purple-600 bg-purple-50',
  [LeadStatus.converted]: 'text-blue-600 bg-blue-50',
  [LeadStatus.lost]: 'text-red-600 bg-red-50',
};

const STAGE_LABELS: Record<string, string> = {
  [LeadStatus.new_]: 'New',
  [LeadStatus.contacted]: 'Contacted',
  [LeadStatus.qualified]: 'Qualified',
  [LeadStatus.converted]: 'Converted',
  [LeadStatus.lost]: 'Lost',
};

export default function LeadSummaryReportPage() {
  const navigate = useNavigate();
  const [searchName, setSearchName] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState('50');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const { data: leads = [], isLoading } = useGetAllLeads();

  const filteredLeads = leads.filter((l) =>
    searchName
      ? l.name.toLowerCase().includes(searchName.toLowerCase()) ||
        l.contact.toLowerCase().includes(searchName.toLowerCase())
      : true
  );

  const toggleRow = (idx: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === filteredLeads.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredLeads.map((_, i) => i)));
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card flex-shrink-0">
        <button
          onClick={() => navigate({ to: '/pipeline' })}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Lead Summary Report</h1>
        <div className="ml-auto">
          <Button variant="outline" size="sm">Call Logs</Button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-card flex-shrink-0 flex-wrap">
        <Button variant="outline" size="sm" className="gap-1 h-8">
          Stage <ChevronDown className="w-3 h-3" />
        </Button>
        <Button variant="outline" size="sm" className="gap-1 h-8">
          <Filter className="w-3 h-3" /> Filters
        </Button>
        <Button variant="outline" size="sm" className="gap-1 h-8">
          <Edit className="w-3 h-3" /> Bulk Actions <ChevronDown className="w-3 h-3" />
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name or contact"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="pl-8 h-8 w-52 text-sm"
            />
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <LayoutGrid className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            No leads found. Add leads from the Contacts page.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="w-10 px-3 py-3">
                  <Checkbox
                    checked={selectedRows.size === filteredLeads.length && filteredLeads.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground w-12">No.</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground">Name</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground">Contact</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground">Notes</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground">Lead Stage</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, idx) => {
                const stageClass = STAGE_COLORS[lead.status] || 'text-gray-600 bg-gray-50';
                const leadId = lead.id.toString();
                return (
                  <tr
                    key={lead.id.toString()}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                      selectedRows.has(idx) ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <Checkbox checked={selectedRows.has(idx)} onCheckedChange={() => toggleRow(idx)} />
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-foreground max-w-[140px] truncate">{lead.name || '—'}</td>
                    <td className="px-3 py-2.5 text-foreground">{lead.contact}</td>
                    <td className="px-3 py-2.5 text-muted-foreground max-w-[160px] truncate">{lead.notes || '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageClass}`}>
                        {STAGE_LABELS[lead.status] || lead.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate({ to: '/followup/$id', params: { id: leadId } })}
                          className="text-xs border border-primary text-primary rounded px-2 py-0.5 hover:bg-primary/10 transition-colors"
                        >
                          Edit
                        </button>
                        <button className="p-1 rounded hover:bg-accent transition-colors">
                          <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer pagination */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Items per page:</span>
          <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
            <SelectTrigger className="h-7 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            1 – {Math.min(parseInt(itemsPerPage), filteredLeads.length)} of {filteredLeads.length}
          </span>
          <button className="px-3 py-1 border border-border rounded text-xs hover:bg-accent transition-colors disabled:opacity-50" disabled>
            ‹
          </button>
          <button className="px-3 py-1 border border-border rounded text-xs hover:bg-accent transition-colors">
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
