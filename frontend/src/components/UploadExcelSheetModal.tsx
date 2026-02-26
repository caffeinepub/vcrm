import { useState } from 'react';
import { Upload, Play, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface UploadExcelSheetModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UploadExcelSheetModal({ open, onClose }: UploadExcelSheetModalProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    toast.info('File upload is a UI placeholder. No actual processing occurs.');
  };

  const handleBrowse = () => {
    toast.info('File upload is a UI placeholder. No actual processing occurs.');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg font-bold">Upload Excel Sheet</DialogTitle>
            <button className="flex items-center gap-1 text-xs border border-primary text-primary rounded-full px-3 py-1 hover:bg-primary/10 transition-colors">
              <Play className="w-3 h-3" /> Learn More
            </button>
          </div>
        </DialogHeader>

        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-2 border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-primary/40 bg-primary/5'
          }`}
        >
          <Upload className="w-8 h-8 text-primary" />
          <p className="text-sm text-primary font-medium">Drag and drop file</p>
          <Button
            onClick={handleBrowse}
            className="bg-primary hover:bg-primary/90 rounded-full px-6"
          >
            Browse
          </Button>
          <p className="text-xs text-muted-foreground">Supported formats are .csv, .xls, .xlsx</p>
        </div>

        {/* Info row */}
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-muted-foreground">Max leads: 25,000 at a time, file size limit: 3MB.</span>
          <button className="text-primary hover:underline flex items-center gap-1 text-sm">
            <Download className="w-3.5 h-3.5" /> Download Sample file
          </button>
        </div>

        {/* Tip */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 mt-1">
          <span className="text-amber-500 text-base">💡</span>
          <p className="text-xs text-amber-700">
            No specific column order needed! Just include crucial details like name and number in the file.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
