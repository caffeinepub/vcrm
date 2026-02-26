import { useParams, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';

export default function CustomerDetailPage() {
  const { id } = useParams({ from: '/layout/customers/$id' });
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/customers' })}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Customer #{id}</h1>
          <p className="text-muted-foreground text-sm">Customer Details</p>
        </div>
      </div>

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
              <p className="text-sm font-medium text-foreground">—</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Phone size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium text-foreground">—</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="text-sm font-medium text-foreground">—</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center py-8 text-muted-foreground text-sm">
        <p>Customer management is not available in this version.</p>
        <Button variant="link" onClick={() => navigate({ to: '/customers' })}>
          Back to Customers
        </Button>
      </div>
    </div>
  );
}
