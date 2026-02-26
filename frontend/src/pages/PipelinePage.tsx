import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ArrowLeft,
  Plus,
  Search,
  ChevronDown,
  MoreVertical,
  ArrowUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useGetSampleCampaigns, useGetSamplePipelineStats } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';

const FUNNEL_STAGES = [
  { name: 'OPEN', pct: 91.94, color: '#3b82f6', width: '100%' },
  { name: 'Contacted', pct: 6.31, color: '#06b6d4', width: '75%' },
  { name: 'Details share', pct: 0.00, color: '#8b5cf6', width: '60%' },
  { name: 'Site Visit', pct: 1.00, color: '#10b981', width: '45%' },
  { name: 'In-progress', pct: 0.44, color: '#f59e0b', width: '30%' },
];

const TAGS_DATA = [
  { name: 'Call back', value: 1623, color: '#ef4444' },
  { name: 'Interested', value: 318, color: '#06b6d4' },
  { name: 'Not interested', value: 43, color: '#f59e0b' },
  { name: 'Details share pending', value: 0, color: '#eab308' },
  { name: 'Details share done', value: 2, color: '#1e3a5f' },
  { name: 'Site visit scheduled', value: 172, color: '#1e293b' },
];

export default function PipelinePage() {
  const navigate = useNavigate();
  const [hidePaused, setHidePaused] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState('');

  const { data: campaigns = [], isLoading: campaignsLoading } = useGetSampleCampaigns();
  const { data: pipelineStats, isLoading: statsLoading } = useGetSamplePipelineStats();

  const filteredCampaigns = campaigns.filter((c) =>
    c.toLowerCase().includes(campaignSearch.toLowerCase())
  );

  const totalLeads = 136256;
  const totalInProgress = 10564;
  const totalClosed = 414;

  return (
    <div className="flex h-full bg-background">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card flex-shrink-0">
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground font-display">Sales Pipeline</h1>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: '/pipeline/lead-summary' })}
            >
              Lead Summary
            </Button>
            <Button variant="outline" size="sm">Call Logs</Button>
            <Button variant="outline" size="sm" className="gap-1">
              Action <ChevronDown className="w-3 h-3" />
            </Button>
            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Create Campaign
            </Button>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search Campaign"
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                className="pl-8 h-8 w-44 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Funnel + Tags */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Lead Funnel */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                LEAD FUNNEL BY STAGES
              </h2>
              <div className="flex gap-6">
                {/* Stats */}
                <div className="space-y-3 flex-shrink-0">
                  <div className="border border-border rounded-lg p-3 text-center min-w-[140px]">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">TOTAL LEADS</div>
                    <div className="text-xl font-bold text-foreground mt-1">{totalLeads.toLocaleString()}</div>
                  </div>
                  <div className="border border-border rounded-lg p-3 text-center min-w-[140px]">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">TOTAL IN-PROGRESS</div>
                    <div className="text-xl font-bold text-foreground mt-1">{totalInProgress.toLocaleString()}</div>
                  </div>
                  <div className="border border-border rounded-lg p-3 text-center min-w-[140px]">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">TOTAL CLOSED</div>
                    <div className="text-xl font-bold text-foreground mt-1">{totalClosed.toLocaleString()}</div>
                  </div>
                </div>

                {/* Funnel visual */}
                <div className="flex-1 flex flex-col gap-1.5 justify-center">
                  {FUNNEL_STAGES.map((stage, i) => (
                    <div key={stage.name} className="flex items-center gap-3">
                      <div
                        className="h-8 rounded-sm flex items-center justify-end pr-2 transition-all"
                        style={{
                          width: stage.width,
                          backgroundColor: stage.color,
                          clipPath: i === 0
                            ? 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)'
                            : `polygon(${5 * i}% 0, ${100 - 5 * i}% 0, ${95 - 5 * i}% 100%, ${5 * (i + 1)}% 100%)`,
                        }}
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {stage.name}({stage.pct.toFixed(2)} %)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Leads by Tags */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                LEADS BY TAGS
              </h2>
              <div className="flex gap-6 items-center">
                <div className="w-48 h-48 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={TAGS_DATA.filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="#fff"
                      >
                        {TAGS_DATA.filter((d) => d.value > 0).map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground mb-3 text-center">IN-PROGRESS</div>
                  <div className="space-y-2">
                    {TAGS_DATA.map((tag) => (
                      <div key={tag.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: tag.color }} />
                        <span className="text-xs text-muted-foreground flex-1">{tag.name}</span>
                        <span className="text-xs font-semibold text-foreground">({tag.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Campaigns panel */}
          <div className="w-72 border-l border-border bg-card flex flex-col flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CAMPAIGNS</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">HIDE PAUSED</span>
                <Switch checked={hidePaused} onCheckedChange={setHidePaused} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {campaignsLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <div
                    key={campaign}
                    className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox className="flex-shrink-0" />
                    <ArrowUp className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-foreground flex-1 truncate">{campaign}</span>
                    <button className="p-1 rounded hover:bg-accent transition-colors flex-shrink-0">
                      <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
