import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetAllSolarProjects, useGetAllCustomers, useDeleteSolarProject } from '../hooks/useQueries';
import { ProjectStatus, type SolarProject } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Sun, Edit2, Trash2, Eye, Zap, Calendar } from 'lucide-react';
import SolarProjectFormDialog from '../components/SolarProjectFormDialog';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const STATUS_LABELS: Record<string, string> = {
  [ProjectStatus.pending]: 'Pending',
  [ProjectStatus.inProgress]: 'In Progress',
  [ProjectStatus.completed]: 'Completed',
  [ProjectStatus.onHold]: 'On Hold',
};

const STATUS_COLORS: Record<string, string> = {
  [ProjectStatus.pending]: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  [ProjectStatus.inProgress]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  [ProjectStatus.completed]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  [ProjectStatus.onHold]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

export default function SolarProjectsPage() {
  const { data: projects, isLoading } = useGetAllSolarProjects();
  const { data: customers } = useGetAllCustomers();
  const deleteSolarProject = useDeleteSolarProject();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editProject, setEditProject] = useState<SolarProject | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const customerMap = new Map((customers ?? []).map(c => [c.id.toString(), c]));

  const filtered = (projects ?? []).filter(p => {
    const customer = customerMap.get(p.customerId.toString());
    const matchSearch = (customer?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      p.siteSurvey.surveyorName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.installationStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteSolarProject.mutateAsync(deleteId);
      toast.success('Solar project deleted');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete solar project');
    }
  };

  const formatDate = (date: bigint) => {
    try {
      const ms = Number(date) / 1_000_000;
      return format(new Date(ms), 'MMM d, yyyy');
    } catch {
      return '—';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Solar Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">{projects?.length ?? 0} total projects</p>
        </div>
        <Button onClick={() => { setEditProject(null); setShowForm(true); }}>
          <Plus size={16} className="mr-2" /> New Project
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by customer or surveyor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-28 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Sun size={40} className="mb-3 opacity-30" />
          <p className="font-medium">No solar projects found</p>
          <p className="text-sm mt-1">Create your first solar project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const customer = customerMap.get(project.customerId.toString());
            return (
              <Card key={project.id.toString()} className="shadow-card hover:shadow-card-hover transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-orange/10 flex items-center justify-center">
                        <Sun size={16} className="text-orange" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{customer?.name ?? 'Unknown Customer'}</h3>
                        <p className="text-xs text-muted-foreground">{customer?.address ?? ''}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[project.installationStatus] ?? ''}`}>
                      {STATUS_LABELS[project.installationStatus] ?? project.installationStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-muted/50 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                        <Zap size={10} /> System Size
                      </div>
                      <p className="text-sm font-bold text-foreground">{project.systemSizeKW} kW</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                        <Calendar size={10} /> Survey Date
                      </div>
                      <p className="text-sm font-medium text-foreground">{formatDate(project.siteSurvey.date)}</p>
                    </div>
                  </div>

                  {project.siteSurvey.surveyorName && (
                    <p className="text-xs text-muted-foreground mb-3">
                      Surveyor: <span className="font-medium text-foreground">{project.siteSurvey.surveyorName}</span>
                    </p>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-8"
                      onClick={() => navigate({ to: '/solar-projects/$id', params: { id: project.id.toString() } })}
                    >
                      <Eye size={13} className="mr-1" /> View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-8"
                      onClick={() => { setEditProject(project); setShowForm(true); }}
                    >
                      <Edit2 size={13} className="mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(project.id)}
                    >
                      <Trash2 size={13} className="mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <SolarProjectFormDialog
          project={editProject}
          customers={customers ?? []}
          onClose={() => { setShowForm(false); setEditProject(null); }}
        />
      )}

      <DeleteConfirmationDialog
        open={deleteId !== null}
        entityName="solar project"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteSolarProject.isPending}
      />
    </div>
  );
}
