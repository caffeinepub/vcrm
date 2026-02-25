import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddCustomer, useUpdateCustomer } from '../hooks/useQueries';
import type { Customer } from '../backend';
import { toast } from 'sonner';

interface CustomerFormDialogProps {
  customer?: Customer | null;
  onClose: () => void;
}

export default function CustomerFormDialog({ customer, onClose }: CustomerFormDialogProps) {
  const addCustomer = useAddCustomer();
  const updateCustomer = useUpdateCustomer();
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
    const lat = parseFloat(latitude) || 0;
    const lng = parseFloat(longitude) || 0;
    try {
      if (isEdit && customer) {
        await updateCustomer.mutateAsync({ id: customer.id, name, email, phone, address, latitude: lat, longitude: lng });
        toast.success('Customer updated successfully');
      } else {
        await addCustomer.mutateAsync({ name, email, phone, address, latitude: lat, longitude: lng });
        toast.success('Customer added successfully');
      }
      onClose();
    } catch {
      toast.error(`Failed to ${isEdit ? 'update' : 'add'} customer`);
    }
  };

  const isPending = addCustomer.isPending || updateCustomer.isPending;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cust-name">Name *</Label>
              <Input
                id="cust-name"
                placeholder="Customer name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-email">Email</Label>
              <Input
                id="cust-email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-phone">Phone</Label>
              <Input
                id="cust-phone"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cust-address">Address</Label>
              <Input
                id="cust-address"
                placeholder="123 Main St, City, State"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-lat">Latitude</Label>
              <Input
                id="cust-lat"
                type="number"
                step="any"
                placeholder="e.g. 37.7749"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-lng">Longitude</Label>
              <Input
                id="cust-lng"
                type="number"
                step="any"
                placeholder="e.g. -122.4194"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? 'Saving...' : isEdit ? 'Update Customer' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
