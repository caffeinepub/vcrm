import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetCustomer, useGetCustomerProjects, useDeleteCustomer } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit2, Trash2, MapPin, Mail, Phone, Sun } from 'lucide-react';
import StaticMapWidget from '../components/StaticMapWidget';
import CustomerFormDialog from '../components/CustomerFormDialog';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import { useState } from 'react';
import { toast } from 'sonner';
import { ProjectStatus } from '../backend';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function CustomerDetailPage() {
  const { id } = useParams({ from: '/layout/customers/$id' });
  const navigate = useNavigate();
  const customerId = BigInt(id);
  const { data: customer, isLoading } = useGetCustomer(customerId);
  const { data: projects } = useGetCustomerProjects(customerId);
  const deleteCustomer = useDeleteCustomer();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteCustomer.mutateAsync(customerId);
      toast.success('Customer deleted');
      navigate({ to: '/customers' });
    } catch {
      toast.error('Failed to delete customer');
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

  if (!customer) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Customer not found.</p>
        <Button variant="link" onClick={() => navigate({ to: '/customers' })}>Back to Customers</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/customers' })}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
          <p className="text-muted-foreground text-sm">Customer Details</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
          <Edit2 size={14} className="mr-2" /> Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
          <Trash2 size={14} className="mr-2" /> Delete
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{customer.email || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Phone size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium text-foreground">{customer.phone || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm font-medium text-foreground">{customer.address || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Map */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <StaticMapWidget latitude={customer.latitude} longitude={customer.longitude} />
          </CardContent>
        </Card>
      </div>

      {/* Solar Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sun size={16} className="text-amber-500" />
            Solar Projects ({projects?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!projects || projects.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No solar projects for this customer</p>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id.toString()}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => navigate({ to: '/solar-projects/$id', params: { id: project.id.toString() } })}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{project.systemSizeKW} kW System</p>
                    <p className="text-xs text-muted-foreground">
                      Surveyor: {project.siteSurvey.surveyorName || '—'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[project.installationStatus] ?? ''}`}>
                    {STATUS_LABELS[project.installationStatus] ?? String(project.installationStatus)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showEdit && customer && (
        <CustomerFormDialog customer={customer} onClose={() => setShowEdit(false)} />
      )}
      <DeleteConfirmationDialog
        open={showDelete}
        entityName="customer"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        isLoading={deleteCustomer.isPending}
      />
    </div>
  );
}
