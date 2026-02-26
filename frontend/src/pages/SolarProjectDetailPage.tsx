import { useParams, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sun } from 'lucide-react';

export default function SolarProjectDetailPage() {
  const { id } = useParams({ from: '/layout/solar-projects/$id' });
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/solar-projects' })}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Solar Project #{id}</h1>
          <p className="text-muted-foreground text-sm">Solar Project Details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sun size={16} className="text-amber-500" /> Project Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>Solar project management is not available in this version.</p>
            <Button variant="link" onClick={() => navigate({ to: '/solar-projects' })}>
              Back to Solar Projects
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
