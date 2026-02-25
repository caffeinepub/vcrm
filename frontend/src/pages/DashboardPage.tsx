import { useGetDashboardStats, useGetAllLeads, useGetAllDeals, useGetAllSolarProjects } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, DollarSign, TrendingUp, Sun, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DealStage, LeadStatus, ProjectStatus } from '../backend';
import { Skeleton } from '@/components/ui/skeleton';

function StatCard({ title, value, icon: Icon, color, subtitle }: {
  title: string; value: string | number; icon: React.ElementType; color: string; subtitle?: string;
}) {
  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-display font-bold text-foreground mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={22} className="text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_COLORS: Record<string, string> = {
  [ProjectStatus.pending]: '#94a3b8',
  [ProjectStatus.inProgress]: '#3b82f6',
  [ProjectStatus.completed]: '#22c55e',
  [ProjectStatus.onHold]: '#f97316',
};

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: leads } = useGetAllLeads();
  const { data: deals } = useGetAllDeals();
  const { data: solarProjects } = useGetAllSolarProjects();

  // Pipeline chart data
  const pipelineData = [
    {
      name: 'New',
      count: deals?.filter(d => d.stage === DealStage.new_).length ?? 0,
      value: deals?.filter(d => d.stage === DealStage.new_).reduce((s, d) => s + d.value, 0) ?? 0,
    },
    {
      name: 'In Progress',
      count: deals?.filter(d => d.stage === DealStage.inProgress).length ?? 0,
      value: deals?.filter(d => d.stage === DealStage.inProgress).reduce((s, d) => s + d.value, 0) ?? 0,
    },
    {
      name: 'Won',
      count: deals?.filter(d => d.stage === DealStage.won).length ?? 0,
      value: deals?.filter(d => d.stage === DealStage.won).reduce((s, d) => s + d.value, 0) ?? 0,
    },
    {
      name: 'Lost',
      count: deals?.filter(d => d.stage === DealStage.lost).length ?? 0,
      value: deals?.filter(d => d.stage === DealStage.lost).reduce((s, d) => s + d.value, 0) ?? 0,
    },
  ];

  // Solar project status pie data
  const solarStatusData = [
    { name: 'Pending', value: solarProjects?.filter(p => p.installationStatus === ProjectStatus.pending).length ?? 0, color: STATUS_COLORS[ProjectStatus.pending] },
    { name: 'In Progress', value: solarProjects?.filter(p => p.installationStatus === ProjectStatus.inProgress).length ?? 0, color: STATUS_COLORS[ProjectStatus.inProgress] },
    { name: 'Completed', value: solarProjects?.filter(p => p.installationStatus === ProjectStatus.completed).length ?? 0, color: STATUS_COLORS[ProjectStatus.completed] },
    { name: 'On Hold', value: solarProjects?.filter(p => p.installationStatus === ProjectStatus.onHold).length ?? 0, color: STATUS_COLORS[ProjectStatus.onHold] },
  ].filter(d => d.value > 0);

  // Count new leads using the enum value
  const newLeadsCount = leads?.filter(l => l.status === LeadStatus.new_).length ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your CRM activity</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-card">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title="Total Leads"
              value={Number(stats?.totalLeads ?? 0)}
              icon={UserCheck}
              color="bg-blue-500"
              subtitle={`${newLeadsCount} new this period`}
            />
            <StatCard
              title="Total Customers"
              value={Number(stats?.totalCustomers ?? 0)}
              icon={Users}
              color="bg-indigo-500"
            />
            <StatCard
              title="Total Deals"
              value={Number(stats?.totalDeals ?? 0)}
              icon={TrendingUp}
              color="bg-orange"
              subtitle={`${deals?.filter(d => d.stage === DealStage.won).length ?? 0} won`}
            />
            <StatCard
              title="Total Revenue"
              value={`$${(stats?.totalRevenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              icon={DollarSign}
              color="bg-emerald-500"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Chart */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-base">Deal Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={pipelineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'value' ? `$${value.toLocaleString()}` : value,
                    name === 'value' ? 'Revenue' : 'Count',
                  ]}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="count" />
                <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} name="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Solar Projects Status */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-base">Solar Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {solarStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={solarStatusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {solarStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex flex-col items-center justify-center text-muted-foreground">
                <Sun size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No solar projects yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Solar Projects', value: solarProjects?.length ?? 0, icon: Sun, color: 'text-orange' },
          { label: 'Completed', value: solarProjects?.filter(p => p.installationStatus === ProjectStatus.completed).length ?? 0, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'In Progress', value: solarProjects?.filter(p => p.installationStatus === ProjectStatus.inProgress).length ?? 0, icon: Clock, color: 'text-blue-500' },
          { label: 'On Hold', value: solarProjects?.filter(p => p.installationStatus === ProjectStatus.onHold).length ?? 0, icon: AlertCircle, color: 'text-orange' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="shadow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <Icon size={20} className={color} />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-display font-bold text-foreground">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
