import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import CRMLayout from "@/components/CRMLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, DollarSign, Calendar, FileText, User, Check, ChevronsUpDown, Phone, Mail, MessageSquare, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Deal = {
  id: number;
  user_id: string;
  contact_id: number | null;
  title: string;
  value: number | null;
  house_price: number | null;
  commission: number | null;
  stage: 'lead' | 'client' | 'under-contract' | 'closed' | 'lost';
  probability: number;
  expected_close_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Contact = {
  contact_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};

const STAGES = [
  { id: 'lead', label: 'Lead', color: 'bg-blue-500' },
  { id: 'client', label: 'Client', color: 'bg-purple-500' },
  { id: 'under-contract', label: 'Under Contract', color: 'bg-orange-500' },
  { id: 'closed', label: 'Closed', color: 'bg-green-500' },
  { id: 'lost', label: 'Lost', color: 'bg-red-500' },
];

/** Pre-populated in new deal notes so you can fill in answers during initial consultation. */
const INITIAL_CONSULTATION_TEMPLATE = `--- INITIAL CONSULTATION ---

[INTRO — please revise to make it sound natural for you]

Hi, I'm Kevin with Keller Williams. I've been in real estate for over five years, and I bring a practical edge to the process—I'm also knowledgeable about home inspections, so I can help you spot what to look for when we walk through properties. My partner is on the line as well—she's a real estate agent with even more experience than me—so between the two of us, we have a lot of knowledge and value we can offer. We focus on Newton and the surrounding areas. I'd love to hear a bit about you and what's brought you to look for a place right now.

---

• What's bringing you to look now? (job change, family, space, schools, etc.)

• Where are you hoping to land? Any areas or neighborhoods you're drawn to—or trying to avoid?

• What type of property are you looking for? (single family, condo, multi-family, etc.) Any must-have features? (garage, basement, yard, etc.)

• When do you ideally want to be in a new place?

• Must-haves? (beds, baths, yard, school district, commute.) Anything that's a deal-breaker?

• Are you a first-time buyer, or have you bought or sold before?

• How are you thinking about financing? Do you have a pre-approval or are you buying with cash? If pre-approval, with which lender and for how much?

• Do you have a lender you're already working with, or would you like a referral? What's your comfortable price range or max budget?

• Are you renting right now or do you own? (If you own—would you need to sell first?)

• Is anyone else involved in the decision? (spouse, family, etc.)

• How did you find me? What's the best way and time to reach you going forward?

• Any concerns or questions about the process that I can address now?

(Add your notes below as you go.)`;

export default function CRMDeals() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [contactSearchOpen, setContactSearchOpen] = useState(false);
  const [editContactSearchOpen, setEditContactSearchOpen] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [editContactSearchQuery, setEditContactSearchQuery] = useState('');
  const [newDeal, setNewDeal] = useState({
    title: '',
    contact_id: '',
    house_price: '',
    commission: '',
    stage: 'lead' as Deal['stage'],
    probability: 0,
    expected_close_date: '',
    notes: INITIAL_CONSULTATION_TEMPLATE,
  });
  const [editDeal, setEditDeal] = useState({
    title: '',
    contact_id: '',
    house_price: '',
    commission: '',
    stage: 'lead' as Deal['stage'],
    probability: 0,
    expected_close_date: '',
    notes: '',
  });
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Pre-populate notes with consultation template whenever Create dialog opens
  useEffect(() => {
    if (isCreateDialogOpen) {
      setNewDeal((prev) => ({ ...prev, notes: INITIAL_CONSULTATION_TEMPLATE }));
    }
  }, [isCreateDialogOpen]);

  // Fetch deals
  const { data: deals, isLoading } = useQuery({
    queryKey: ['crm-deals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const query = supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!isAdmin) {
        query.eq('user_id', user.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Deal[];
    },
    enabled: !!user,
  });

  // Fetch contact names for deals
  const { data: allContacts } = useQuery({
    queryKey: ['crm-contacts-for-deals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Fetch all contacts - use range to get all records
      let allData: Contact[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('contacts_view')
          .select('contact_id, first_name, last_name, email, phone')
          .range(from, from + pageSize - 1)
          .order('last_name', { ascending: true })
          .order('first_name', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      return allData as Contact[];
    },
    enabled: !!user,
  });

  // Helper to get contact name
  const getContactName = (contactId: number | null) => {
    if (!contactId || !allContacts) return null;
    const contact = allContacts.find(c => c.contact_id === contactId);
    if (!contact) return null;
    const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    return name || contact.email || null;
  };

  // Helper to get contact info (name, email, phone)
  const getContactInfo = (contactId: number | null) => {
    if (!contactId || !allContacts) return null;
    const contact = allContacts.find(c => c.contact_id === contactId);
    if (!contact) return null;
    return {
      name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email || 'Unknown',
      email: contact.email || null,
      phone: contact.phone || null,
    };
  };

  // Update deal stage mutation
  const updateDealStage = useMutation({
    mutationFn: async ({ dealId, newStage }: { dealId: number; newStage: Deal['stage'] }) => {
      const updateData: any = { stage: newStage };
      
      // If moving to closed, try to calculate commission if house_price exists but commission doesn't
      if (newStage === 'closed') {
        const deal = deals?.find(d => d.id === dealId);
        if (deal && deal.house_price && !deal.commission) {
          // We can't calculate commission without the percentage
          // The user will need to edit the deal to set commission percentage
          // For now, we'll just update the stage
        }
      }
      
      const { error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', dealId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm-deals', user?.id] }); // Also invalidate dashboard
      toast.success('Deal updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update deal');
      console.error(error);
    },
  });

  // Update deal mutation
  const updateDeal = useMutation({
    mutationFn: async ({ dealId, dealData }: { dealId: number; dealData: typeof editDeal }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Calculate commission amount from percentage if both are provided
      let commissionAmount = null;
      if (dealData.commission && dealData.house_price) {
        const housePrice = parseFloat(dealData.house_price);
        const commissionPercent = parseFloat(dealData.commission);
        if (!isNaN(housePrice) && !isNaN(commissionPercent)) {
          commissionAmount = (housePrice * commissionPercent) / 100;
        }
      }

      const updateData: any = {
        title: dealData.title,
        stage: dealData.stage,
        probability: dealData.probability,
        expected_close_date: dealData.expected_close_date || null,
        notes: dealData.notes || null,
        contact_id: dealData.contact_id ? parseInt(dealData.contact_id) : null,
      };

      // Add house_price if provided
      if (dealData.house_price) {
        const housePrice = parseFloat(dealData.house_price);
        if (!isNaN(housePrice)) {
          updateData.house_price = housePrice;
          updateData.value = housePrice; // Keep for backward compatibility
        }
      }

      // If stage is closed, calculate and set commission from percentage
      if (dealData.stage === 'closed' && commissionAmount !== null) {
        updateData.commission = commissionAmount;
      } else if (dealData.stage === 'closed' && dealData.commission && dealData.house_price) {
        // Recalculate if we have both values
        const housePrice = parseFloat(dealData.house_price);
        const commissionPercent = parseFloat(dealData.commission);
        if (!isNaN(housePrice) && !isNaN(commissionPercent)) {
          updateData.commission = (housePrice * commissionPercent) / 100;
        }
      } else if (commissionAmount !== null) {
        // Set commission for any stage if calculated
        updateData.commission = commissionAmount;
      }

      const { error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', dealId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm-deals', user?.id] }); // Also invalidate dashboard
      toast.success('Deal updated successfully');
      setIsEditDialogOpen(false);
      setEditingDeal(null);
    },
    onError: (error) => {
      toast.error('Failed to update deal');
      console.error(error);
    },
  });

  // Delete deal mutation
  const deleteDeal = useMutation({
    mutationFn: async (dealId: number) => {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm-deals', user?.id] });
      toast.success('Deal deleted');
      setDealToDelete(null);
      setIsEditDialogOpen(false);
      setEditingDeal(null);
    },
    onError: (error) => {
      toast.error('Failed to delete deal');
      console.error(error);
    },
  });

  // Create deal mutation
  const createDeal = useMutation({
    mutationFn: async (deal: typeof newDeal) => {
      if (!user) throw new Error('Not authenticated');
      
      // Calculate commission amount from percentage
      let commissionAmount = null;
      if (deal.commission && deal.house_price) {
        const housePrice = parseFloat(deal.house_price);
        const commissionPercent = parseFloat(deal.commission);
        commissionAmount = (housePrice * commissionPercent) / 100;
      }

      // Build insert object, only including fields that exist
      const insertData: any = {
        user_id: user.id,
        title: deal.title,
        stage: deal.stage,
        probability: deal.probability,
        expected_close_date: deal.expected_close_date || null,
        notes: deal.notes || null,
        contact_id: deal.contact_id ? parseInt(deal.contact_id) : null,
      };

      // Add house_price if provided
      if (deal.house_price) {
        insertData.house_price = parseFloat(deal.house_price);
        insertData.value = parseFloat(deal.house_price); // Keep for backward compatibility
      }

      // Add commission if calculated
      if (commissionAmount !== null) {
        insertData.commission = commissionAmount;
      }

      const { error } = await supabase
        .from('deals')
        .insert(insertData);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      toast.success('Deal created successfully');
      setIsCreateDialogOpen(false);
      setNewDeal({
        title: '',
        contact_id: '',
        house_price: '',
        commission: '',
        stage: 'lead',
        probability: 0,
        expected_close_date: '',
        notes: INITIAL_CONSULTATION_TEMPLATE,
      });
      setContactSearchQuery('');
      setContactSearchOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to create deal');
      console.error(error);
    },
  });

  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: Deal['stage']) => {
    e.preventDefault();
    if (draggedDeal && draggedDeal.stage !== targetStage) {
      // If moving to closed and commission percentage exists but commission amount doesn't, calculate it
      if (targetStage === 'closed' && draggedDeal.house_price && !draggedDeal.commission) {
        // We need to get the commission percentage from the deal
        // For now, we'll just update the stage - commission should be set via edit dialog
        updateDealStage.mutate({ dealId: draggedDeal.id, newStage: targetStage });
      } else {
        updateDealStage.mutate({ dealId: draggedDeal.id, newStage: targetStage });
      }
    }
    setDraggedDeal(null);
  };

  const handleCreateDeal = () => {
    if (!newDeal.title.trim()) {
      toast.error('Please enter a deal title');
      return;
    }
    if (!newDeal.contact_id) {
      toast.error('Please select a contact');
      return;
    }
    createDeal.mutate(newDeal);
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    // Calculate commission percentage from commission amount if available
    let commissionPercent = '';
    if (deal.commission && deal.house_price) {
      commissionPercent = ((deal.commission / deal.house_price) * 100).toFixed(2);
    }
    
    setEditDeal({
      title: deal.title,
      contact_id: deal.contact_id?.toString() || '',
      house_price: deal.house_price?.toString() || '',
      commission: commissionPercent,
      stage: deal.stage,
      probability: deal.probability,
      expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date).toISOString().split('T')[0] : '',
      notes: deal.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEditDeal = () => {
    if (!editingDeal) return;
    if (!editDeal.title.trim()) {
      toast.error('Please enter a deal title');
      return;
    }
    if (!editDeal.contact_id) {
      toast.error('Please select a contact');
      return;
    }
    updateDeal.mutate({ dealId: editingDeal.id, dealData: editDeal });
  };

  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.id] = deals?.filter((deal) => deal.stage === stage.id) || [];
    return acc;
  }, {} as Record<string, Deal[]>);

  // Commission summary: earned (closed) and potential (other stages with commission)
  const commissionEarned = (deals?.filter((d) => d.stage === 'closed' && d.commission != null) || []).reduce(
    (sum, d) => sum + (d.commission ?? 0),
    0
  );
  const commissionPotential = (deals?.filter((d) => d.stage !== 'closed' && d.stage !== 'lost' && d.commission != null && d.commission > 0) || []).reduce(
    (sum, d) => sum + (d.commission ?? 0),
    0
  );

  if (loading) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </CRMLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <CRMLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Deal Pipeline
          </h1>
          <p className="text-gray-600 mb-6">
            Drag and drop deals to move them between stages
          </p>
          <div className="flex flex-wrap gap-4">
            <Card className="flex-1 min-w-[200px] border-[#9b87f5]/30 bg-[#9b87f5]/5">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm font-medium text-gray-600 mb-1">Commission earned (closed)</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${commissionEarned.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[200px] border-[#9b87f5]/30 bg-[#9b87f5]/5">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm font-medium text-gray-600 mb-1">Commission potential (pipeline)</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${commissionPotential.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="mb-8 flex justify-end">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#9b87f5] hover:bg-[#8b7ae5]">
                <Plus className="h-4 w-4 mr-2" />
                New Deal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Deal</DialogTitle>
                <DialogDescription>
                  Add a new deal to your pipeline
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Contact Name *</Label>
                  <Popover open={contactSearchOpen} onOpenChange={setContactSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={contactSearchOpen}
                        className="w-full justify-between"
                      >
                        {newDeal.contact_id
                          ? (() => {
                              const contact = allContacts?.find(
                                (c) => c.contact_id.toString() === newDeal.contact_id
                              );
                              return contact
                                ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email || 'Unknown'
                                : 'Select contact...';
                            })()
                          : 'Select contact...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 max-h-[400px]" align="start">
                      <Command shouldFilter={false} className="h-full">
                        <CommandInput 
                          placeholder="Search contacts..." 
                          value={contactSearchQuery}
                          onValueChange={setContactSearchQuery}
                        />
                        <div className="overflow-y-auto max-h-[300px]">
                          <CommandList>
                          <CommandEmpty>No contacts found.</CommandEmpty>
                          <CommandGroup>
                            {allContacts
                              ?.filter((contact) => {
                                if (!contactSearchQuery) return true;
                                const query = contactSearchQuery.toLowerCase().trim();
                                if (!query) return true;
                                
                                // Search in first name, last name, and email
                                const firstName = (contact.first_name || '').toLowerCase();
                                const lastName = (contact.last_name || '').toLowerCase();
                                const fullName = `${firstName} ${lastName}`.trim();
                                const email = (contact.email || '').toLowerCase();
                                
                                // Check if query matches any part
                                return (
                                  firstName.includes(query) ||
                                  lastName.includes(query) ||
                                  fullName.includes(query) ||
                                  email.includes(query) ||
                                  // Also check if query matches when reversed (last, first)
                                  `${lastName} ${firstName}`.trim().includes(query)
                                );
                              })
                              .map((contact) => {
                                const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email || 'Unknown';
                                return (
                                  <CommandItem
                                    key={contact.contact_id}
                                    value={`${contact.first_name || ''} ${contact.last_name || ''} ${contact.email || ''}`.toLowerCase()}
                                    onSelect={() => {
                                      setNewDeal({ ...newDeal, contact_id: contact.contact_id.toString() });
                                      setContactSearchOpen(false);
                                      setContactSearchQuery('');
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4 shrink-0",
                                        newDeal.contact_id === contact.contact_id.toString()
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <span className="flex-1">{name}</span>
                                    {contact.email && (
                                      <span className="ml-2 text-xs text-gray-500 truncate">
                                        ({contact.email})
                                      </span>
                                    )}
                                  </CommandItem>
                                );
                              })}
                          </CommandGroup>
                          </CommandList>
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Deal Title *</Label>
                  <Input
                    value={newDeal.title}
                    onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                    placeholder="e.g., Property Sale - 123 Main St"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>House Price ($)</Label>
                    <Input
                      type="number"
                      value={newDeal.house_price}
                      onChange={(e) => setNewDeal({ ...newDeal, house_price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Commission (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={newDeal.commission}
                      onChange={(e) => setNewDeal({ ...newDeal, commission: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label>Probability (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newDeal.probability}
                    onChange={(e) => setNewDeal({ ...newDeal, probability: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Stage</Label>
                  <Select
                    value={newDeal.stage}
                    onValueChange={(value) => setNewDeal({ ...newDeal, stage: value as Deal['stage'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Expected Close Date</Label>
                  <Input
                    type="date"
                    value={newDeal.expected_close_date}
                    onChange={(e) => setNewDeal({ ...newDeal, expected_close_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Notes — Initial consultation (edit as you go)</Label>
                  <Textarea
                    value={newDeal.notes}
                    onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                    rows={14}
                    className="font-mono text-sm"
                  />
                </div>
                <Button
                  onClick={handleCreateDeal}
                  className="w-full bg-[#9b87f5] hover:bg-[#8b7ae5]"
                  disabled={createDeal.isPending}
                >
                  {createDeal.isPending ? 'Creating...' : 'Create Deal'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pipeline Board */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-600">
            Loading deals...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
            {STAGES.map((stage) => (
              <Card
                key={stage.id}
                className="min-w-[250px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id as Deal['stage'])}
              >
                <CardHeader className={`pb-3 ${stage.color} rounded-t-lg`}>
                  <CardTitle className="text-white text-sm font-semibold">
                    {stage.label}
                  </CardTitle>
                  <CardDescription className="text-white/80 text-xs">
                    {dealsByStage[stage.id]?.length || 0} deals
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-2 max-h-[600px] overflow-y-auto">
                  {dealsByStage[stage.id]?.map((deal) => (
                    <Card
                      key={deal.id}
                      draggable
                      onDragStart={() => handleDragStart(deal)}
                      onClick={() => handleEditDeal(deal)}
                      className="cursor-pointer hover:shadow-md transition-all"
                    >
                      <CardContent className="p-4">
                        {deal.contact_id && (() => {
                          const contactInfo = getContactInfo(deal.contact_id);
                          if (!contactInfo) return null;
                          
                          const formatPhoneForLink = (phone: string | null) => {
                            if (!phone) return null;
                            // Remove all non-digits and add +1 for US numbers
                            const digits = phone.replace(/\D/g, '');
                            if (digits.length === 10) {
                              return `+1${digits}`;
                            }
                            return phone.startsWith('+') ? phone : `+1${digits}`;
                          };

                          return (
                            <div className="mb-3 space-y-2">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-gray-600" />
                                <span className="text-xs text-gray-600 font-medium">
                                  {contactInfo.name}
                                </span>
                              </div>
                              
                              {contactInfo.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-gray-500" />
                                  <span className="text-xs text-gray-600">{contactInfo.phone}</span>
                                  <div className="flex gap-1 ml-auto">
                                    <a
                                      href={`tel:${formatPhoneForLink(contactInfo.phone)}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                                      title="Call"
                                    >
                                      <Phone className="h-3 w-3" />
                                    </a>
                                    <a
                                      href={`sms:${formatPhoneForLink(contactInfo.phone)}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"
                                      title="Text"
                                    >
                                      <MessageSquare className="h-3 w-3" />
                                    </a>
                                  </div>
                                </div>
                              )}
                              
                              {contactInfo.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3 text-gray-500" />
                                  <span className="text-xs text-gray-600 truncate flex-1">{contactInfo.email}</span>
                                  <a
                                    href={`mailto:${contactInfo.email}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 rounded hover:bg-purple-100 text-purple-600 transition-colors ml-auto"
                                    title="Email"
                                  >
                                    <Mail className="h-3 w-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        <h3 className="font-semibold mb-2">
                          {deal.title}
                        </h3>
                        {(deal.house_price || deal.value) && (
                          <div className="flex items-center gap-1 mb-2">
                            <DollarSign className="h-3 w-3 text-gray-600" />
                            <span className="text-sm text-gray-700">
                              House: ${((deal.house_price || deal.value) || 0).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {deal.commission && deal.house_price && (
                          <div className="flex items-center gap-1 mb-2">
                            <DollarSign className="h-3 w-3 text-gray-600" />
                            <span className="text-sm text-gray-700">
                              Commission: ${deal.commission.toLocaleString()} ({((deal.commission / deal.house_price) * 100).toFixed(2)}%)
                            </span>
                          </div>
                        )}
                        {deal.commission && !deal.house_price && (
                          <div className="flex items-center gap-1 mb-2">
                            <DollarSign className="h-3 w-3 text-gray-600" />
                            <span className="text-sm text-gray-700">
                              Commission: ${deal.commission.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {deal.expected_close_date && (
                          <div className="flex items-center gap-1 mb-2">
                            <Calendar className="h-3 w-3 text-gray-600" />
                            <span className="text-xs text-gray-600">
                              {format(new Date(deal.expected_close_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        {deal.probability > 0 && (
                          <div className="mb-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600">Probability</span>
                              <span className="text-gray-700">{deal.probability}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-200">
                              <div
                                className={`h-full rounded-full ${stage.color}`}
                                style={{ width: `${deal.probability}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {deal.notes && (
                          <div className="flex items-start gap-1 mt-2">
                            <FileText className="h-3 w-3 mt-0.5 text-gray-600" />
                            <p className="text-xs line-clamp-2 text-gray-600">
                              {deal.notes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {(!dealsByStage[stage.id] || dealsByStage[stage.id].length === 0) && (
                    <div className="text-center py-8 text-sm text-gray-400">
                      No deals in this stage
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Deal Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Deal</DialogTitle>
              <DialogDescription>
                Update deal information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Contact Name *</Label>
                <Popover open={editContactSearchOpen} onOpenChange={setEditContactSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={editContactSearchOpen}
                      className="w-full justify-between"
                    >
                      {editDeal.contact_id
                        ? (() => {
                            const contact = allContacts?.find(
                              (c) => c.contact_id.toString() === editDeal.contact_id
                            );
                            return contact
                              ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email || 'Unknown'
                              : 'Select contact...';
                          })()
                        : 'Select contact...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 max-h-[400px]" align="start">
                    <Command shouldFilter={false} className="h-full">
                      <CommandInput 
                        placeholder="Search contacts..." 
                        value={editContactSearchQuery}
                        onValueChange={setEditContactSearchQuery}
                      />
                      <div className="overflow-y-auto max-h-[300px]">
                        <CommandList>
                        <CommandEmpty>No contacts found.</CommandEmpty>
                        <CommandGroup>
                          {allContacts
                            ?.filter((contact) => {
                              if (!editContactSearchQuery) return true;
                              const query = editContactSearchQuery.toLowerCase().trim();
                              if (!query) return true;
                              
                              const firstName = (contact.first_name || '').toLowerCase();
                              const lastName = (contact.last_name || '').toLowerCase();
                              const fullName = `${firstName} ${lastName}`.trim();
                              const email = (contact.email || '').toLowerCase();
                              
                              return (
                                firstName.includes(query) ||
                                lastName.includes(query) ||
                                fullName.includes(query) ||
                                email.includes(query) ||
                                `${lastName} ${firstName}`.trim().includes(query)
                              );
                            })
                            .map((contact) => {
                              const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email || 'Unknown';
                              return (
                                <CommandItem
                                  key={contact.contact_id}
                                  value={`${contact.first_name || ''} ${contact.last_name || ''} ${contact.email || ''}`.toLowerCase()}
                                  onSelect={() => {
                                    setEditDeal({ ...editDeal, contact_id: contact.contact_id.toString() });
                                    setEditContactSearchOpen(false);
                                    setEditContactSearchQuery('');
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4 shrink-0",
                                      editDeal.contact_id === contact.contact_id.toString()
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <span className="flex-1">{name}</span>
                                  {contact.email && (
                                    <span className="ml-2 text-xs text-gray-500 truncate">
                                      ({contact.email})
                                    </span>
                                  )}
                                </CommandItem>
                              );
                            })}
                        </CommandGroup>
                        </CommandList>
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Deal Title *</Label>
                <Input
                  value={editDeal.title}
                  onChange={(e) => setEditDeal({ ...editDeal, title: e.target.value })}
                  placeholder="e.g., Property Sale - 123 Main St"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>House Price ($)</Label>
                  <Input
                    type="number"
                    value={editDeal.house_price}
                    onChange={(e) => setEditDeal({ ...editDeal, house_price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Commission (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editDeal.commission}
                    onChange={(e) => setEditDeal({ ...editDeal, commission: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label>Probability (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editDeal.probability}
                  onChange={(e) => setEditDeal({ ...editDeal, probability: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Stage</Label>
                <Select
                  value={editDeal.stage}
                  onValueChange={(value) => setEditDeal({ ...editDeal, stage: value as Deal['stage'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Expected Close Date</Label>
                <Input
                  type="date"
                  value={editDeal.expected_close_date}
                  onChange={(e) => setEditDeal({ ...editDeal, expected_close_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={editDeal.notes}
                  onChange={(e) => setEditDeal({ ...editDeal, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveEditDeal}
                    className="flex-1 bg-[#9b87f5] hover:bg-[#8b7ae5]"
                    disabled={updateDeal.isPending}
                  >
                    {updateDeal.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingDeal(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => editingDeal && setDealToDelete(editingDeal)}
                  disabled={updateDeal.isPending || deleteDeal.isPending}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete deal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!dealToDelete} onOpenChange={(open) => !open && setDealToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this deal?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the deal "{dealToDelete?.title}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => dealToDelete && deleteDeal.mutate(dealToDelete.id)}
              >
                {deleteDeal.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CRMLayout>
  );
}
