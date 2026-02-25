import { useParams, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useGetSolarProject, useGetCustomer, useDeleteSolarProject, useGetAllCustomers } from '../hooks/useQueries';
import { ProjectStatus } from '../backend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit2, Trash2, Sun, Zap, Calendar, User, FileText, MapPin } from 'lucide-react';
import StaticMapWidget from '../components/StaticMapWidget';
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
  [ProjectStatus.pending]: 'bg-slate-100 text-slate-700',
  [ProjectStatus.inProgress]: 'bg-blue-100 text-blue-700',
  [ProjectStatus.completed]: 'bg-green-100 text-green-700',
  [ProjectStatus.onHold]: 'bg-orange-100 text-orange-700',
};

export default function SolarProjectDetailPage() {
  const { id } = useParams({ from: '/layout/solar-projects/$id' });
  const navigate = useNavigate();
  const projectId = BigInt(id);
  const { data: project, isLoading } = useGetSolarProject(projectId);
  const { data: customer } = useGetCustomer(project?.customerId ?? null);
  const { data: allCustomers } = useGetAllCustomers();
  const deleteSolarProject = useDeleteSolarProject();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteSolarProject.mutateAsync(projectId);
      toast.success('Solar project deleted');
      navigate({ to: '/solar-projects' });
    } catch {
      toast.error('Failed to delete solar project');
    }
  };

  const formatDate = (date: bigint) => {
    try {
      const ms = Number(date) / 1_000_000;
      return format(new Date(ms), 'MMMM d, yyyy');
    } catch {
      return '—';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Solar project not found.</p>
        <Button variant="link" onClick={() => navigate({ to: '/solar-projects' })}>
          Back to Solar Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/solar-projects' })}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-bold text-foreground">
              {customer?.name ?? 'Solar Project'}
            </h1>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[project.installationStatus] ?? ''}`}
            >
              {STATUS_LABELS[project.installationStatus] ?? String(project.installationStatus)}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">Solar Project Details</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
          <Edit2 size={14} className="mr-2" /> Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
          <Trash2 size={14} className="mr-2" /> Delete
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Info */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Sun size={16} className="text-orange" /> System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center">
                <Zap size={14} className="text-orange" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">System Size</p>
                <p className="text-lg font-bold text-foreground">{project.systemSizeKW} kW</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Survey Date</p>
                <p className="text-sm font-medium text-foreground">{formatDate(project.siteSurvey.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Surveyor</p>
                <p className="text-sm font-medium text-foreground">
                  {project.siteSurvey.surveyorName || '—'}
                </p>
              </div>
            </div>
            {project.siteSurvey.notes && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Survey Notes</p>
                  <p className="text-sm text-foreground mt-0.5">{project.siteSurvey.notes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Location */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <MapPin size={16} className="text-primary" /> Customer Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{customer.address || 'No address provided'}</p>
                <StaticMapWidget latitude={customer.latitude} longitude={customer.longitude} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Customer data not available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Info */}
      {customer && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-base">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="text-sm font-medium text-foreground">{customer.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{customer.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium text-foreground">{customer.phone || '—'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {showEdit && (
        <SolarProjectFormDialog
          project={project}
          customers={allCustomers ?? []}
          onClose={() => setShowEdit(false)}
        />
      )}
      <DeleteConfirmationDialog
        open={showDelete}
        entityName="solar project"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        isLoading={deleteSolarProject.isPending}
      />
    </div>
  );
}
