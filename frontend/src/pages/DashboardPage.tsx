import { useMemo } from 'react';
import { useGetAllLeads, useGetAllDeals } from '../hooks/useQueries';
import { LeadStatus, DealStage } from '../backend';
import {
  Users,
  GitBranch,
  TrendingUp,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const STAGE_COLORS: Record<string, string> = {
  New: '#6366f1',
  'In Progress': '#f59e0b',
  Won: '#10b981',
  Lost: '#ef4444',
};

const STATUS_COLORS: Record<string, string> = {
  New: '#6366f1',
  Contacted: '#3b82f6',
  Qualified: '#10b981',
  Converted: '#8b5cf6',
  Lost: '#ef4444',
};

export default function DashboardPage() {
  const { data: leads = [], isLoading: leadsLoading } = useGetAllLeads();
  const { data: deals = [], isLoading: dealsLoading } = useGetAllDeals();

  const isLoading = leadsLoading || dealsLoading;

  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const totalDeals = deals.length;
    const totalRevenue = deals
      .filter((d) => d.stage === DealStage.won)
      .reduce((sum, d) => sum + d.value, 0);
    const wonDeals = deals.filter((d) => d.stage === DealStage.won).length;

    return { totalLeads, totalDeals, totalRevenue, wonDeals };
  }, [leads, deals]);

  const dealsByStage = useMemo(() => {
    const stageMap: Record<string, number> = {
      New: 0,
      'In Progress': 0,
      Won: 0,
      Lost: 0,
    };
    deals.forEach((d) => {
      if (d.stage === DealStage.new_) stageMap['New']++;
      else if (d.stage === DealStage.inProgress) stageMap['In Progress']++;
      else if (d.stage === DealStage.won) stageMap['Won']++;
      else if (d.stage === DealStage.lost) stageMap['Lost']++;
    });
    return Object.entries(stageMap).map(([name, count]) => ({ name, count }));
  }, [deals]);

  const leadsByStatus = useMemo(() => {
    const statusMap: Record<string, number> = {
      New: 0,
      Contacted: 0,
      Qualified: 0,
      Converted: 0,
      Lost: 0,
    };
    leads.forEach((l) => {
      if (l.status === LeadStatus.new_) statusMap['New']++;
      else if (l.status === LeadStatus.contacted) statusMap['Contacted']++;
      else if (l.status === LeadStatus.qualified) statusMap['Qualified']++;
      else if (l.status === LeadStatus.converted) statusMap['Converted']++;
      else if (l.status === LeadStatus.lost) statusMap['Lost']++;
    });
    return Object.entries(statusMap)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [leads]);

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      icon: Users,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    },
    {
      title: 'Total Deals',
      value: stats.totalDeals,
      icon: GitBranch,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      title: 'Won Deals',
      value: stats.wonDeals,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      title: 'Revenue (Won)',
      value: `₹${stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your CRM data
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="border border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deals by Stage Bar Chart */}
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Deals by Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No deals yet. Add deals to see the chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dealsByStage} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {dealsByStage.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STAGE_COLORS[entry.name] || '#6366f1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Leads by Status Pie Chart */}
        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Leads by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No leads yet. Add leads to see the chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={leadsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {leadsByStatus.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] || '#6366f1'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
              No leads yet. Go to Contacts to add your first lead.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Name</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Contact</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(0, 5).map((lead) => (
                    <tr key={lead.id.toString()} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium text-foreground">{lead.name}</td>
                      <td className="py-2 px-3 text-muted-foreground">{lead.contact}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          lead.status === LeadStatus.converted
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                            : lead.status === LeadStatus.qualified
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                            : lead.status === LeadStatus.contacted
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                            : lead.status === LeadStatus.lost
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400'
                        }`}>
                          {lead.status === LeadStatus.new_ ? 'New'
                            : lead.status === LeadStatus.contacted ? 'Contacted'
                            : lead.status === LeadStatus.qualified ? 'Qualified'
                            : lead.status === LeadStatus.converted ? 'Converted'
                            : 'Lost'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
