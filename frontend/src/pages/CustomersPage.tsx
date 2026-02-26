import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Edit2, Trash2, Users, MapPin, Eye } from 'lucide-react';
import CustomerFormDialog, { type CustomerLocal } from '../components/CustomerFormDialog';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import { toast } from 'sonner';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<CustomerLocal[]>([]);
  const [editCustomer, setEditCustomer] = useState<CustomerLocal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (deleteId === null) return;
    setCustomers(prev => prev.filter(c => c.id !== deleteId));
    toast.success('Customer deleted successfully');
    setDeleteId(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">{customers.length} total customers</p>
        </div>
        <Button onClick={() => { setEditCustomer(null); setShowForm(true); }}>
          <Plus size={16} className="mr-2" /> Add Customer
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Users size={40} className="mb-3 opacity-30" />
          <p className="font-medium">No customers found</p>
          <p className="text-sm mt-1">Add your first customer to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((customer) => (
            <Card key={customer.id.toString()} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">{customer.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{customer.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  </div>
                </div>
                {customer.address && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                    <MapPin size={12} />
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button variant="ghost" size="sm" className="flex-1 h-8"
                    onClick={() => navigate({ to: '/customers/$id', params: { id: customer.id.toString() } })}>
                    <Eye size={13} className="mr-1" /> View
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 h-8"
                    onClick={() => { setEditCustomer(customer); setShowForm(true); }}>
                    <Edit2 size={13} className="mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm"
                    className="flex-1 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(customer.id)}>
                    <Trash2 size={13} className="mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <CustomerFormDialog
          customer={editCustomer}
          onClose={() => { setShowForm(false); setEditCustomer(null); }}
        />
      )}

      <DeleteConfirmationDialog
        open={deleteId !== null}
        entityName="customer"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
