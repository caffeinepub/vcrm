import { BarChart2 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-background">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <BarChart2 className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground font-display mb-2">Reports</h1>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        Detailed analytics and reports on leads, campaigns, agent activity, and business performance.
      </p>
      <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-2 rounded-full">
        🚀 Coming Soon
      </div>
    </div>
  );
}
