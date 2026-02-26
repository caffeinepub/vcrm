import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Local types since these are no longer in the backend
export type ProjectStatusLocal = 'pending' | 'inProgress' | 'completed' | 'onHold';

export interface SolarProjectLocal {
  id: bigint;
  customerId: bigint;
  siteSurvey: {
    notes: string;
    date: bigint;
    surveyorName: string;
  };
  systemSizeKW: number;
  installationStatus: ProjectStatusLocal;
}

export interface CustomerLocal {
  id: bigint;
  name: string;
}

interface SolarProjectFormDialogProps {
  project?: SolarProjectLocal | null;
  customers?: CustomerLocal[];
  onClose: () => void;
}

export default function SolarProjectFormDialog({ project, customers = [], onClose }: SolarProjectFormDialogProps) {
  const isEdit = !!project;

  const [systemSizeKW, setSystemSizeKW] = useState(project?.systemSizeKW?.toString() ?? '');
  const [surveyorName, setSurveyorName] = useState(project?.siteSurvey.surveyorName ?? '');
  const [surveyNotes, setSurveyNotes] = useState(project?.siteSurvey.notes ?? '');

  useEffect(() => {
    if (project) {
      setSystemSizeKW(project.systemSizeKW.toString());
      setSurveyorName(project.siteSurvey.surveyorName);
      setSurveyNotes(project.siteSurvey.notes);
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.info('Solar project management is not available in this version.');
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Solar Project' : 'Add Solar Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sp-size">System Size (kW) *</Label>
            <Input
              id="sp-size"
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 5.0"
              value={systemSizeKW}
              onChange={(e) => setSystemSizeKW(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-surveyor">Surveyor Name</Label>
            <Input
              id="sp-surveyor"
              placeholder="Surveyor name"
              value={surveyorName}
              onChange={(e) => setSurveyorName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-notes">Survey Notes</Label>
            <Textarea
              id="sp-notes"
              placeholder="Survey notes..."
              value={surveyNotes}
              onChange={(e) => setSurveyNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{isEdit ? 'Update' : 'Add'} Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
