import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Sun, Edit2, Trash2, Eye, Zap } from 'lucide-react';
import SolarProjectFormDialog, { type SolarProjectLocal, type ProjectStatusLocal } from '../components/SolarProjectFormDialog';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import { toast } from 'sonner';

const STATUS_LABELS: Record<ProjectStatusLocal, string> = {
  pending: 'Pending',
  inProgress: 'In Progress',
  completed: 'Completed',
  onHold: 'On Hold',
};

const STATUS_COLORS: Record<ProjectStatusLocal, string> = {
  pending: 'bg-slate-100 text-slate-700',
  inProgress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  onHold: 'bg-orange-100 text-orange-700',
};

export default function SolarProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<SolarProjectLocal[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editProject, setEditProject] = useState<SolarProjectLocal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const filtered = projects.filter(p => {
    const matchSearch = p.siteSurvey.surveyorName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.installationStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async () => {
    if (deleteId === null) return;
    setProjects(prev => prev.filter(p => p.id !== deleteId));
    toast.success('Solar project deleted');
    setDeleteId(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Solar Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">{projects.length} total projects</p>
        </div>
        <Button onClick={() => { setEditProject(null); setShowForm(true); }}>
          <Plus size={16} className="mr-2" /> New Project
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by surveyor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.keys(STATUS_LABELS) as ProjectStatusLocal[]).map(s => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Sun size={40} className="mb-3 opacity-30" />
          <p className="font-medium">No solar projects found</p>
          <p className="text-sm mt-1">Add your first solar project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Card key={project.id.toString()} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Sun size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Zap size={12} className="text-amber-500" />
                        <span className="font-semibold text-foreground">{project.systemSizeKW} kW</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{project.siteSurvey.surveyorName || '—'}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[project.installationStatus]}`}>
                    {STATUS_LABELS[project.installationStatus]}
                  </span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button variant="ghost" size="sm" className="flex-1 h-8"
                    onClick={() => navigate({ to: '/solar-projects/$id', params: { id: project.id.toString() } })}>
                    <Eye size={13} className="mr-1" /> View
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 h-8"
                    onClick={() => { setEditProject(project); setShowForm(true); }}>
                    <Edit2 size={13} className="mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm"
                    className="flex-1 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(project.id)}>
                    <Trash2 size={13} className="mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <SolarProjectFormDialog project={editProject} customers={[]} onClose={() => { setShowForm(false); setEditProject(null); }} />
      )}

      <DeleteConfirmationDialog
        open={deleteId !== null}
        entityName="solar project"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
