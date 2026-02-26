import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Local type since Customer is no longer in the backend
export interface CustomerLocal {
  id: bigint;
  name: string;
  email: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface CustomerFormDialogProps {
  customer?: CustomerLocal | null;
  onClose: () => void;
}

export default function CustomerFormDialog({ customer, onClose }: CustomerFormDialogProps) {
  const isEdit = !!customer;

  const [name, setName] = useState(customer?.name ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [address, setAddress] = useState(customer?.address ?? '');
  const [latitude, setLatitude] = useState(customer?.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(customer?.longitude?.toString() ?? '');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setEmail(customer.email);
      setPhone(customer.phone);
      setAddress(customer.address);
      setLatitude(customer.latitude?.toString() ?? '');
      setLongitude(customer.longitude?.toString() ?? '');
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.info('Customer management is not available in this version.');
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cust-name">Name *</Label>
              <Input id="cust-name" placeholder="Customer name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-email">Email</Label>
              <Input id="cust-email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-phone">Phone</Label>
              <Input id="cust-phone" placeholder="+91 XXXXX XXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cust-address">Address</Label>
              <Input id="cust-address" placeholder="Full address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-lat">Latitude</Label>
              <Input id="cust-lat" type="number" step="any" placeholder="0.000000" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-lng">Longitude</Label>
              <Input id="cust-lng" type="number" step="any" placeholder="0.000000" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{isEdit ? 'Update' : 'Add'} Customer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
