import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorMessage } from '@/lib/utils';

interface Lockbox {
  id: number;
  lockbox_type: string;
  location: string;
  code: string | null;
  status: string;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** The dialog and the table both read their options from here. */
const LOCKBOX_TYPES = ['SentriLock', 'Supra', 'Combination', 'Other'] as const;

const LOCKBOX_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'in-use', label: 'In use' },
  { value: 'retired', label: 'Retired' },
] as const;

const statusLabel = (value: string) =>
  LOCKBOX_STATUSES.find((s) => s.value === value)?.label ?? value;

const statusVariant = (value: string): 'default' | 'secondary' | 'outline' => {
  if (value === 'in-use') return 'default';
  if (value === 'retired') return 'outline';
  return 'secondary';
};

const emptyForm = {
  lockbox_type: LOCKBOX_TYPES[0] as string,
  location: '',
  code: '',
  status: 'available',
  notes: '',
};

const Lockboxes = () => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lockboxes, setLockboxes] = useState<Lockbox[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLockbox, setSelectedLockbox] = useState<Lockbox | null>(null);
  // Which rows have their code revealed. Shoulder-surfing hygiene only —
  // anyone who can load this page can already read every row.
  const [revealedCodes, setRevealedCodes] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({ ...emptyForm });

  // Handle admin check
  useEffect(() => {
    if (loading) return;

    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  const fetchLockboxes = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lockboxes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLockboxes(data || []);
    } catch (error) {
      console.error('Error fetching lockboxes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lockboxes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchLockboxes();
    }
  }, [isAdmin, fetchLockboxes]);

  const handleAdd = () => {
    setSelectedLockbox(null);
    setFormData({ ...emptyForm });
    setIsDialogOpen(true);
  };

  const handleEdit = (lockbox: Lockbox) => {
    setSelectedLockbox(lockbox);
    setFormData({
      lockbox_type: lockbox.lockbox_type,
      location: lockbox.location,
      code: lockbox.code || '',
      status: lockbox.status,
      notes: lockbox.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (lockbox: Lockbox) => {
    setSelectedLockbox(lockbox);
    setIsDeleteDialogOpen(true);
  };

  const toggleCode = (id: number) => {
    setRevealedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!formData.location.trim()) {
      toast({
        title: 'Error',
        description: 'Location is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const dataToSave = {
        lockbox_type: formData.lockbox_type,
        location: formData.location.trim(),
        code: formData.code.trim() || null,
        status: formData.status,
        notes: formData.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (selectedLockbox) {
        const { error } = await supabase
          .from('lockboxes')
          .update(dataToSave)
          .eq('id', selectedLockbox.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Lockbox updated successfully',
        });
      } else {
        const { error } = await supabase.from('lockboxes').insert([dataToSave]);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Lockbox added successfully',
        });
      }

      setIsDialogOpen(false);
      fetchLockboxes();
    } catch (error: unknown) {
      console.error('Error saving lockbox:', error);
      toast({
        title: 'Error',
        description: errorMessage(error) || 'Failed to save lockbox',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedLockbox) return;

    try {
      // Soft delete, same as properties — the row stays for the record.
      const { error } = await supabase
        .from('lockboxes')
        .update({ is_active: false })
        .eq('id', selectedLockbox.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lockbox deleted successfully',
      });

      setIsDeleteDialogOpen(false);
      setSelectedLockbox(null);
      fetchLockboxes();
    } catch (error: unknown) {
      console.error('Error deleting lockbox:', error);
      toast({
        title: 'Error',
        description: errorMessage(error) || 'Failed to delete lockbox',
        variant: 'destructive',
      });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Lockboxes</h1>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lockbox
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lockboxes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No lockboxes yet. Click "Add Lockbox" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                lockboxes.map((lockbox) => (
                  <TableRow key={lockbox.id}>
                    <TableCell className="font-medium">{lockbox.lockbox_type}</TableCell>
                    <TableCell>{lockbox.location}</TableCell>
                    <TableCell>
                      {lockbox.code ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            {revealedCodes.has(lockbox.id) ? lockbox.code : '••••••'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => toggleCode(lockbox.id)}
                            aria-label={
                              revealedCodes.has(lockbox.id) ? 'Hide code' : 'Show code'
                            }
                          >
                            {revealedCodes.has(lockbox.id) ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(lockbox.status)}>
                        {statusLabel(lockbox.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{lockbox.notes || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(lockbox)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(lockbox)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedLockbox ? 'Edit Lockbox' : 'Add Lockbox'}
              </DialogTitle>
              <DialogDescription>
                {selectedLockbox
                  ? 'Update the lockbox information below.'
                  : 'Fill in the lockbox information below.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type *</label>
                <Select
                  value={formData.lockbox_type}
                  onValueChange={(value) => setFormData({ ...formData, lockbox_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCKBOX_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCKBOX_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Location *</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="12 Oak St front door, office safe, car trunk"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Code</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Shackle or access code"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Anything else worth remembering about this lockbox"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {selectedLockbox ? 'Save Changes' : 'Add Lockbox'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the {selectedLockbox?.lockbox_type} lockbox at
                {' '}{selectedLockbox?.location}. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Lockboxes;
