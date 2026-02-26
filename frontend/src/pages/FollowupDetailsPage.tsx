import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAllLeads } from '../hooks/useQueries';
import { LeadStatus } from '../backend';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_COLORS: Record<string, string> = {
  [LeadStatus.new_]: 'text-green-600 bg-green-50 border-green-200',
  [LeadStatus.contacted]: 'text-amber-600 bg-amber-50 border-amber-200',
  [LeadStatus.qualified]: 'text-purple-600 bg-purple-50 border-purple-200',
  [LeadStatus.converted]: 'text-blue-600 bg-blue-50 border-blue-200',
  [LeadStatus.lost]: 'text-red-600 bg-red-50 border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
  [LeadStatus.new_]: 'New',
  [LeadStatus.contacted]: 'Contacted',
  [LeadStatus.qualified]: 'Qualified',
  [LeadStatus.converted]: 'Converted',
  [LeadStatus.lost]: 'Lost',
};

export default function FollowupDetailsPage() {
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState('20');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: leads = [], isLoading } = useGetAllLeads();

  const totalEntries = leads.length;
  const perPage = parseInt(entriesPerPage);
  const totalPages = Math.ceil(totalEntries / perPage);
  const startIdx = (currentPage - 1) * perPage;
  const endIdx = Math.min(startIdx + perPage, totalEntries);
  const pageLeads = leads.slice(startIdx, endIdx);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card flex-shrink-0">
        <button
          onClick={() => navigate({ to: '/pipeline/lead-summary' })}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Followup Details</h1>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : pageLeads.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            No leads found. Add leads from the Contacts page.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody>
                {pageLeads.map((lead) => {
                  const statusClass = STATUS_COLORS[lead.status] || 'text-gray-600 bg-gray-50 border-gray-200';
                  return (
                    <tr key={lead.id.toString()} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusClass}`}>
                          {STATUS_LABELS[lead.status] || lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{lead.name}</td>
                      <td className="px-4 py-3 text-foreground">{lead.contact}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{lead.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Entries per page:</span>
          <Select value={entriesPerPage} onValueChange={(v) => { setEntriesPerPage(v); setCurrentPage(1); }}>
            <SelectTrigger className="h-7 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {startIdx + 1}–{endIdx} of {totalEntries}
          </span>
          <button
            className="px-3 py-1 border border-border rounded text-xs hover:bg-accent transition-colors disabled:opacity-50"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>
          <button
            className="px-3 py-1 border border-border rounded text-xs hover:bg-accent transition-colors disabled:opacity-50"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
