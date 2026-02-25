import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddSolarProject, useUpdateSolarProject } from '../hooks/useQueries';
import { ProjectStatus, type SolarProject, type Customer } from '../backend';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: ProjectStatus.pending, label: 'Pending' },
  { value: ProjectStatus.inProgress, label: 'In Progress' },
  { value: ProjectStatus.completed, label: 'Completed' },
  { value: ProjectStatus.onHold, label: 'On Hold' },
];

interface SolarProjectFormDialogProps {
  project?: SolarProject | null;
  customers: Customer[];
  onClose: () => void;
}

export default function SolarProjectFormDialog({ project, customers, onClose }: SolarProjectFormDialogProps) {
  const addSolarProject = useAddSolarProject();
  const updateSolarProject = useUpdateSolarProject();
  const isEdit = !!project;

  const toDateInput = (ns: bigint): string => {
    try {
      const ms = Number(ns) / 1_000_000;
      return format(new Date(ms), 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };

  const [customerId, setCustomerId] = useState(project?.customerId?.toString() ?? '');
  const [systemSizeKW, setSystemSizeKW] = useState(project?.systemSizeKW?.toString() ?? '');
  const [installationStatus, setInstallationStatus] = useState<ProjectStatus>(
    project?.installationStatus ?? ProjectStatus.pending
  );
  const [surveyDate, setSurveyDate] = useState(project ? toDateInput(project.siteSurvey.date) : '');
  const [surveyorName, setSurveyorName] = useState(project?.siteSurvey.surveyorName ?? '');
  const [notes, setNotes] = useState(project?.siteSurvey.notes ?? '');

  useEffect(() => {
    if (project) {
      setCustomerId(project.customerId.toString());
      setSystemSizeKW(project.systemSizeKW.toString());
      setInstallationStatus(project.installationStatus);
      setSurveyDate(toDateInput(project.siteSurvey.date));
      setSurveyorName(project.siteSurvey.surveyorName);
      setNotes(project.siteSurvey.notes);
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && !customerId) {
      toast.error('Please select a customer');
      return;
    }
    const kw = parseFloat(systemSizeKW) || 0;
    const dateMs = surveyDate ? new Date(surveyDate).getTime() : Date.now();
    const dateNs = BigInt(dateMs) * BigInt(1_000_000);

    try {
      if (isEdit && project) {
        await updateSolarProject.mutateAsync({
          id: project.id,
          systemSizeKW: kw,
          installationStatus,
          notes,
          surveyorName,
          date: dateNs,
        });
        toast.success('Solar project updated');
      } else {
        await addSolarProject.mutateAsync({
          customerId: BigInt(customerId),
          systemSizeKW: kw,
          installationStatus,
          notes,
          surveyorName,
          date: dateNs,
        });
        toast.success('Solar project created');
      }
      onClose();
    } catch {
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} solar project`);
    }
  };

  const isPending = addSolarProject.isPending || updateSolarProject.isPending;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? 'Edit Solar Project' : 'New Solar Project'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer (only for new projects) */}
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="sp-customer">Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="sp-customer">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id.toString()} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* System Size */}
          <div className="space-y-2">
            <Label htmlFor="sp-size">System Size (kW) *</Label>
            <Input
              id="sp-size"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 10.5"
              value={systemSizeKW}
              onChange={(e) => setSystemSizeKW(e.target.value)}
              required
            />
          </div>

          {/* Installation Status */}
          <div className="space-y-2">
            <Label htmlFor="sp-status">Installation Status</Label>
            <Select
              value={installationStatus}
              onValueChange={(v) => setInstallationStatus(v as ProjectStatus)}
            >
              <SelectTrigger id="sp-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Site Survey Section */}
          <div className="border border-border rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Site Survey</p>
            <div className="space-y-2">
              <Label htmlFor="sp-survey-date">Survey Date</Label>
              <Input
                id="sp-survey-date"
                type="date"
                value={surveyDate}
                onChange={(e) => setSurveyDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-surveyor">Surveyor Name</Label>
              <Input
                id="sp-surveyor"
                placeholder="Name of surveyor"
                value={surveyorName}
                onChange={(e) => setSurveyorName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-notes">Survey Notes</Label>
              <Textarea
                id="sp-notes"
                placeholder="Site survey observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || (!isEdit && !customerId) || !systemSizeKW}>
              {isPending ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
