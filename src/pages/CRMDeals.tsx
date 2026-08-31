import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import AdminShell, {
  AdminCard,
  AdminLoading,
  CRM_LINKS,
} from "@/components/AdminShell";
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
import { Plus, DollarSign, Calendar, FileText, User, Check, ChevronsUpDown, Phone, Mail, MessageSquare, Trash2, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createContact } from "@/lib/crmContacts";
import { digitsOnly, groupThousands, formatCurrency } from "@/lib/money";
import type { Database } from '@/integrations/supabase/types';
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

/**
 * A deal is one side of one transaction, so the title is one of two things.
 * It used to be a free-text field, which produced a pipeline board where no two
 * cards were labelled the same way. Legacy titles still round-trip: the edit
 * dialog adds whatever the deal already says as an extra option.
 */
const DEAL_TITLES = ['BUYER', 'SELLER'];

/**
 * Commission is stored in `deals.commission` as a DOLLAR AMOUNT either way —
 * this only decides how it is entered. A percentage is multiplied out against
 * the house price; a flat fee is taken as typed, which is what a rental
 * placement or a referral usually is.
 *
 * The database has no column recording which was used, so the edit dialog
 * opens in 'flat' with the exact stored amount. That is lossless in both
 * directions: saving an untouched percentage deal writes back the identical
 * number, and the field shows the equivalent percentage underneath.
 */
type CommissionType = 'percent' | 'flat';

/** Entered commission -> the dollar amount stored on the deal, or null. */
const resolveCommission = (
  entered: string,
  housePrice: string,
  type: CommissionType,
): number | null => {
  const amount = parseFloat(entered);
  if (!entered || isNaN(amount)) return null;
  if (type === 'flat') return amount;
  const price = parseFloat(housePrice);
  // A percentage of nothing is nothing — without a house price there is
  // nothing to take a percentage of, so the deal carries no commission yet.
  if (!housePrice || isNaN(price)) return null;
  return (price * amount) / 100;
};

/** The shape both the create and the edit dialog hold. */
type DealForm = {
  title: string;
  contact_id: string;
  house_price: string;
  commission: string;
  commission_type: CommissionType;
  stage: Deal['stage'];
  expected_close_date: string;
  notes: string;
};

const STAGES = [
  { id: 'lead', label: 'Lead', color: 'bg-blue-500' },
  { id: 'client', label: 'Client', color: 'bg-purple-500' },
  { id: 'under-contract', label: 'Under Contract', color: 'bg-orange-500' },
  { id: 'closed', label: 'Closed', color: 'bg-green-500' },
  { id: 'lost', label: 'Lost', color: 'bg-red-500' },
];

/**
 * Title / price / commission / stage / close date — the block that is
 * identical in the create and the edit dialog. It lives here so the two cannot
 * drift; they used to be two copies of the same markup, which is how the edit
 * dialog would have been left behind by this change.
 */
const DealFields = ({
  deal,
  patch,
}: {
  deal: DealForm;
  patch: (p: Partial<DealForm>) => void;
}) => {
  // A legacy free-text title stays selectable so editing an old deal does not
  // silently relabel it.
  const titleOptions = deal.title && !DEAL_TITLES.includes(deal.title)
    ? [...DEAL_TITLES, deal.title]
    : DEAL_TITLES;

  const price = parseFloat(deal.house_price);
  const entered = parseFloat(deal.commission);
  const hasPrice = !!deal.house_price && !isNaN(price) && price > 0;
  const hasCommission = !!deal.commission && !isNaN(entered);

  // The equivalent in the other unit, so switching between them is never a
  // guess.
  const equivalent = !hasCommission
    ? null
    : deal.commission_type === 'percent'
      ? hasPrice
        ? `= ${formatCurrency((price * entered) / 100)}`
        : 'Enter a house price to turn this into an amount'
      : hasPrice
        ? `= ${((entered / price) * 100).toFixed(2)}% of the house price`
        : null;

  return (
    <>
      <div>
        <Label>Deal Type *</Label>
        <Select value={deal.title} onValueChange={(value) => patch({ title: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Buyer or seller?" />
          </SelectTrigger>
          <SelectContent>
            {titleOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>House Price</Label>
          {/*
            type="text" with inputMode="numeric", not type="number": a number
            input cannot show thousands separators, and at six and seven
            figures an unseparated string is where a mistyped digit hides. The
            state stays plain digits; only the display is grouped.
          */}
          <Input
            type="text"
            inputMode="numeric"
            value={groupThousands(deal.house_price)}
            onChange={(e) => patch({ house_price: digitsOnly(e.target.value) })}
            placeholder="850,000"
          />
        </div>
        <div>
          <Label>Commission</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              inputMode="decimal"
              value={
                deal.commission_type === 'flat'
                  ? groupThousands(deal.commission)
                  : deal.commission
              }
              onChange={(e) => patch({ commission: digitsOnly(e.target.value) })}
              placeholder={deal.commission_type === 'percent' ? '2.5' : '5,000'}
              className="flex-1"
            />
            <Select
              value={deal.commission_type}
              onValueChange={(value) => patch({ commission_type: value as CommissionType })}
            >
              <SelectTrigger className="w-[92px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">%</SelectItem>
                <SelectItem value="flat">$ flat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {equivalent && (
            <p className="mt-1 text-xs text-gray-500">{equivalent}</p>
          )}
        </div>
      </div>

      <div>
        <Label>Stage</Label>
        <Select
          value={deal.stage}
          onValueChange={(value) => patch({ stage: value as Deal['stage'] })}
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
          value={deal.expected_close_date}
          onChange={(e) => patch({ expected_close_date: e.target.value })}
        />
      </div>
    </>
  );
};

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
  const [newDeal, setNewDeal] = useState<DealForm>({
    title: '',
    contact_id: '',
    house_price: '',
    commission: '',
    commission_type: 'percent' as CommissionType,
    stage: 'lead' as Deal['stage'],
    expected_close_date: '',
    notes: INITIAL_CONSULTATION_TEMPLATE,
  });
  const [editDeal, setEditDeal] = useState<DealForm>({
    title: '',
    contact_id: '',
    house_price: '',
    commission: '',
    commission_type: 'flat' as CommissionType,
    stage: 'lead' as Deal['stage'],
    expected_close_date: '',
    notes: '',
  });
  // Inline contact creation, so a deal can be opened for someone who is not in
  // the CRM yet without leaving the dialog and losing the form.
  const [isNewContactOpen, setIsNewContactOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
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
      const updateData: Database['public']['Tables']['deals']['Update'] = { stage: newStage };
      
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
      
      const commissionAmount = resolveCommission(
        dealData.commission,
        dealData.house_price,
        dealData.commission_type,
      );

      // `probability` is deliberately absent — the field is gone from the UI
      // and the column carries a default.
      const updateData: Database['public']['Tables']['deals']['Update'] = {
        title: dealData.title,
        stage: dealData.stage,
        expected_close_date: dealData.expected_close_date || null,
        notes: dealData.notes || null,
        contact_id: dealData.contact_id ? parseInt(dealData.contact_id) : null,
      };

      // Cleared fields have to be written back as null, or clearing the box in
      // the form would silently leave the old number in the database.
      const housePrice = dealData.house_price ? parseFloat(dealData.house_price) : NaN;
      updateData.house_price = isNaN(housePrice) ? null : housePrice;
      updateData.value = isNaN(housePrice) ? null : housePrice; // backward compatibility
      updateData.commission = commissionAmount;

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

      const commissionAmount = resolveCommission(
        deal.commission,
        deal.house_price,
        deal.commission_type,
      );

      // Build insert object, only including fields that exist. `probability`
      // is deliberately absent — the column has a default, and the field is
      // gone from the UI.
      const insertData: Database['public']['Tables']['deals']['Insert'] = {
        user_id: user.id,
        title: deal.title,
        stage: deal.stage,
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
        commission_type: 'percent',
        stage: 'lead',
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
      toast.error('Choose whether this is a buyer or a seller deal');
      return;
    }
    if (!newDeal.contact_id) {
      toast.error('Please select a contact');
      return;
    }
    createDeal.mutate(newDeal);
  };

  /** Create a contact inline and attach it to the deal being drafted. */
  const handleCreateContact = async () => {
    try {
      const id = await createContact({ ...newContact, source: 'Deal' });
      // Refetch first, so the combobox can resolve the new id to a name
      // instead of falling back to "Select contact...".
      await queryClient.invalidateQueries({ queryKey: ['crm-contacts-for-deals'] });
      await queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      setNewDeal((prev) => ({ ...prev, contact_id: id.toString() }));
      setNewContact({ first_name: '', last_name: '', email: '', phone: '' });
      setIsNewContactOpen(false);
      toast.success('Contact created and attached to this deal');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create contact');
      console.error(err);
    }
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setEditDeal({
      title: deal.title,
      contact_id: deal.contact_id?.toString() || '',
      house_price: deal.house_price?.toString() || '',
      // Opened as a flat amount because that is exactly what is stored — the
      // database does not record whether it was originally entered as a
      // percentage. Saving an untouched deal writes back the same number, and
      // the equivalent percentage is shown under the field.
      commission: deal.commission != null ? String(deal.commission) : '',
      commission_type: 'flat',
      stage: deal.stage,
      expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date).toISOString().split('T')[0] : '',
      notes: deal.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEditDeal = () => {
    if (!editingDeal) return;
    if (!editDeal.title.trim()) {
      toast.error('Choose whether this is a buyer or a seller deal');
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

  // AdminShell owns the admin gate; this one is the data fetch.
  if (loading) return <AdminLoading />;
  if (!user) return null;

  return (
    <AdminShell
      eyebrow="CRM"
      links={CRM_LINKS}
      title="Deal Pipeline"
      description="Drag and drop deals to move them between stages."
    >
        <div className="mb-6">
          <div className="flex flex-wrap gap-4">
            <Card className="flex-1 min-w-[200px] border-champagne/40 bg-champagne/[0.07]">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm font-medium text-gray-600 mb-1">Commission earned (closed)</p>
                <p className="text-2xl font-semibold text-ink lining-nums tabular-nums">
                  ${commissionEarned.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[200px] border-champagne/40 bg-champagne/[0.07]">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm font-medium text-gray-600 mb-1">Commission potential (pipeline)</p>
                <p className="text-2xl font-semibold text-ink lining-nums tabular-nums">
                  ${commissionPotential.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="mb-8 flex justify-end">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-ink-deep text-white hover:bg-champagne hover:text-ink-deep">
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

                  {/*
                    Not every deal starts with a contact already in the CRM.
                    Before this the only way to attach one was to leave for the
                    contacts page and start the deal over, so this creates the
                    contact in place and selects it. The record it writes is the
                    same shape the contacts page writes — see lib/crmContacts.
                  */}
                  {!isNewContactOpen ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-auto p-0 text-sm text-champagne-ink hover:bg-transparent hover:underline hover:decoration-champagne hover:underline-offset-4"
                      onClick={() => setIsNewContactOpen(true)}
                    >
                      <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                      Not in the list? Add a new contact
                    </Button>
                  ) : (
                    <div className="mt-3 space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">First name *</Label>
                          <Input
                            value={newContact.first_name}
                            onChange={(e) =>
                              setNewContact({ ...newContact, first_name: e.target.value })
                            }
                            placeholder="Jane"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Last name *</Label>
                          <Input
                            value={newContact.last_name}
                            onChange={(e) =>
                              setNewContact({ ...newContact, last_name: e.target.value })
                            }
                            placeholder="Nguyen"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Email</Label>
                          <Input
                            type="email"
                            value={newContact.email}
                            onChange={(e) =>
                              setNewContact({ ...newContact, email: e.target.value })
                            }
                            placeholder="jane@example.com"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Phone</Label>
                          <Input
                            type="tel"
                            value={newContact.phone}
                            onChange={(e) =>
                              setNewContact({ ...newContact, phone: e.target.value })
                            }
                            placeholder="617-555-0140"
                          />
                        </div>
                      </div>
                      {/* One of the two is required: a contact with neither is
                          unreachable, and the CSV importer rejects it for the
                          same reason. */}
                      <p className="text-xs text-gray-500">Email or phone — at least one.</p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="bg-ink-deep text-white hover:bg-champagne hover:text-ink-deep"
                          onClick={handleCreateContact}
                          disabled={
                            !newContact.first_name.trim() ||
                            !newContact.last_name.trim() ||
                            (!newContact.email.trim() && !newContact.phone.trim())
                          }
                        >
                          Save contact
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsNewContactOpen(false);
                            setNewContact({ first_name: '', last_name: '', email: '', phone: '' });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <DealFields
                  deal={newDeal}
                  patch={(p) => setNewDeal((prev) => ({ ...prev, ...p }))}
                />
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
                  className="w-full bg-ink-deep text-white hover:bg-champagne hover:text-ink-deep"
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
              <DealFields
                deal={editDeal}
                patch={(p) => setEditDeal((prev) => ({ ...prev, ...p }))}
              />
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
                    className="flex-1 bg-ink-deep text-white hover:bg-champagne hover:text-ink-deep"
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
    </AdminShell>
  );
}
