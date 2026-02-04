import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import CRMLayout from "@/components/CRMLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Mail, Phone, Calendar, MessageSquare, Upload, Download, Edit, Save, X, ArrowUpDown, ArrowUp, ArrowDown, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type Address = {
  id: number;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  is_primary?: boolean;
};

type Tag = {
  id: number;
  tag: string;
  color?: string;
};

type Contact = {
  contact_id: number; // Now it's the contacts.id
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  last_contact_at: string;
  source: string; // Changed from sources to source (singular)
  message_count: number;
  open_house_count: number;
  birthday?: string;
  home_anniversary?: string;
  addresses?: Address[] | string; // Can be JSON string or array
  tags?: Tag[] | string; // Can be JSON string or array
};

export default function CRMContacts() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Contact | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    sources: '',
    birthday: '',
    home_anniversary: '',
    addresses: [] as Address[],
    tags: [] as Tag[],
  });
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [isCsvDialogOpen, setIsCsvDialogOpen] = useState(false);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [headerMapping, setHeaderMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Fetch contacts
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['crm-contacts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('contacts_view')
        .select('*')
        .order('last_contact_at', { ascending: false });
      if (error) throw error;
      return data as Contact[];
    },
  });

  // Filter contacts by search query and source
  const filteredContacts = contacts?.filter((contact) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        contact.first_name?.toLowerCase().includes(query) ||
        contact.last_name?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.includes(query) ||
        contact.source?.toLowerCase().includes(query) ||
        (contact.birthday && format(new Date(contact.birthday), 'MMM d, yyyy').toLowerCase().includes(query)) ||
        (contact.home_anniversary && format(new Date(contact.home_anniversary), 'MMM d, yyyy').toLowerCase().includes(query))
      );
      if (!matchesSearch) return false;
    }
    
    // Source filter
    if (sourceFilter !== 'all') {
      return contact.source === sourceFilter;
    }
    
    return true;
  }) || [];

  // Sort contacts
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];
    
    // Handle date fields
    if (sortField === 'last_contact_at' || sortField === 'birthday' || sortField === 'home_anniversary') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    }
    
    // Handle string fields
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
    }
    if (typeof bValue === 'string') {
      bValue = bValue.toLowerCase();
    }
    
    // Handle null/undefined
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof Contact) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Selection handlers
  const handleSelectContact = (contactId: number, checked: boolean) => {
    if (checked) {
      setSelectedContactIds([...selectedContactIds, contactId]);
    } else {
      setSelectedContactIds(selectedContactIds.filter(id => id !== contactId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContactIds(sortedContacts.map(c => c.contact_id));
    } else {
      setSelectedContactIds([]);
    }
  };

  const isAllSelected = sortedContacts.length > 0 && selectedContactIds.length === sortedContacts.length;
  const isSomeSelected = selectedContactIds.length > 0 && selectedContactIds.length < sortedContacts.length;

  // Reset selection when contacts change
  useEffect(() => {
    // Clear selection if selected contacts are no longer in the filtered list
    // Use contacts instead of sortedContacts to avoid infinite loop
    if (contacts) {
      const contactIds = new Set(contacts.map(c => c.contact_id));
      setSelectedContactIds(prev => 
        prev.filter(id => contactIds.has(id))
      );
    }
  }, [contacts]);

  // Delete handlers
  const handleDeleteContact = async (contactId: number) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      toast.success('Contact deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSelectedContact(null);
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      toast.error(error.message || 'Failed to delete contact');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', selectedContactIds);

      if (error) throw error;

      toast.success(`Successfully deleted ${selectedContactIds.length} contact(s)`);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSelectedContactIds([]);
      setBulkDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Error deleting contacts:', error);
      toast.error(error.message || 'Failed to delete contacts');
    }
  };

  // Get unique sources for filter
  const uniqueSources = Array.from(
    new Set(
      contacts?.map((c) => c.source).filter(Boolean) || []
    )
  );

  // Database columns for mapping
  const dbColumns = [
    { value: 'skip', label: 'Skip this column' },
    { value: 'first_name', label: 'First Name' },
    { value: 'last_name', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'sources', label: 'Sources' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'home_anniversary', label: 'Home Anniversary' },
    { value: 'address_line1', label: 'Address Line 1' },
    { value: 'address_line2', label: 'Address Line 2' },
    { value: 'city', label: 'City' },
    { value: 'state', label: 'State' },
    { value: 'zip_code', label: 'ZIP Code' },
    { value: 'country', label: 'Country' },
    { value: 'tags', label: 'Tags (comma-separated)' },
  ];

  // Parse CSV file
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let currentLine: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentLine.push(currentField.trim());
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (currentField || currentLine.length > 0) {
          currentLine.push(currentField.trim());
          lines.push(currentLine);
          currentLine = [];
          currentField = '';
        }
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
    }

    if (currentField || currentLine.length > 0) {
      currentLine.push(currentField.trim());
      lines.push(currentLine);
    }

    return lines;
  };

  // Process uploaded file
  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      
      if (parsed.length === 0) {
        toast.error('CSV file is empty');
        return;
      }

      const headers = parsed[0];
      const data = parsed.slice(1);
      
      setCsvHeaders(headers);
      setCsvData(data);
      setHeaderMapping({});
      setPreviewData([]);
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleMappingChange = (csvHeader: string, dbColumn: string) => {
    setHeaderMapping((prev) => {
      const newMapping = { ...prev };
      if (dbColumn === 'skip' || dbColumn === '') {
        delete newMapping[csvHeader];
      } else {
        newMapping[csvHeader] = dbColumn;
      }
      return newMapping;
    });
  };

  const generatePreview = () => {
    if (csvData.length === 0) return;

    const preview = csvData.slice(0, 5).map((row) => {
      const mapped: any = {};
      csvHeaders.forEach((header, index) => {
        const dbColumn = headerMapping[header];
        if (dbColumn && row[index]) {
          mapped[dbColumn] = row[index].trim();
        }
      });
      return mapped;
    });

    setPreviewData(preview);
  };

  useEffect(() => {
    if (Object.keys(headerMapping).length > 0 && csvData.length > 0) {
      generatePreview();
    }
  }, [headerMapping]);

  // Export contacts to CSV
  const handleExport = () => {
    if (!filteredContacts || filteredContacts.length === 0) {
      toast.error('No contacts to export');
      return;
    }

    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Sources', 'Birthday', 'Home Anniversary', 'Last Contact'];
    const rows = filteredContacts.map(contact => [
      contact.first_name || '',
      contact.last_name || '',
      contact.email || '',
      contact.phone || '',
      contact.sources || '',
      contact.birthday ? format(new Date(contact.birthday), 'MMM d, yyyy') : '',
      contact.home_anniversary ? format(new Date(contact.home_anniversary), 'MMM d, yyyy') : '',
      contact.last_contact_at ? format(new Date(contact.last_contact_at), 'yyyy-MM-dd') : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${filteredContacts.length} contacts`);
  };

  // Import contacts from CSV
  const handleCsvImport = async () => {
    try {
      const requiredFields = ['first_name', 'last_name'];
      const mappedFields = Object.values(headerMapping);
      
      const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
      if (missingFields.length > 0) {
        toast.error(`Missing required field mappings: ${missingFields.join(', ')}`);
        return;
      }

      // Check that at least email or phone is mapped
      const hasEmail = mappedFields.includes('email');
      const hasPhone = mappedFields.includes('phone');
      if (!hasEmail && !hasPhone) {
        toast.error('At least one of Email or Phone must be mapped');
        return;
      }

      // Process all rows and create contact entries
      const contactsToImport = csvData.map((row) => {
        const contact: any = {};
        csvHeaders.forEach((header, index) => {
          const dbColumn = headerMapping[header];
          if (dbColumn && row[index]) {
            contact[dbColumn] = row[index].trim();
          }
        });
        return contact;
      }).filter(c => c.first_name && c.last_name && (c.email || c.phone));

      if (contactsToImport.length === 0) {
        toast.error('No valid contacts to import');
        return;
      }

      // Import contacts directly into contacts table
      let importedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      const batchSize = 50;

      for (let i = 0; i < contactsToImport.length; i += batchSize) {
        const batch = contactsToImport.slice(i, i + batchSize);
        
        for (const contact of batch) {
          try {
            // Get or create first name
            let firstNameId;
            const { data: existingFirstName } = await supabase
              .from('contact_first_names')
              .select('id')
              .eq('first_name', contact.first_name)
              .single();
            
            if (existingFirstName) {
              firstNameId = existingFirstName.id;
            } else {
              const { data: newFirstName, error: fnError } = await supabase
                .from('contact_first_names')
                .insert({ first_name: contact.first_name })
                .select('id')
                .single();
              if (fnError) throw fnError;
              firstNameId = newFirstName.id;
            }

            // Get or create last name
            let lastNameId;
            const { data: existingLastName } = await supabase
              .from('contact_last_names')
              .select('id')
              .eq('last_name', contact.last_name)
              .single();
            
            if (existingLastName) {
              lastNameId = existingLastName.id;
            } else {
              const { data: newLastName, error: lnError } = await supabase
                .from('contact_last_names')
                .insert({ last_name: contact.last_name })
                .select('id')
                .single();
              if (lnError) throw lnError;
              lastNameId = newLastName.id;
            }

            // Get or create email (if provided)
            let emailId = null;
            if (contact.email) {
              const { data: existingEmail } = await supabase
                .from('contact_emails')
                .select('id')
                .eq('email', contact.email)
                .single();
              
              if (existingEmail) {
                emailId = existingEmail.id;
              } else {
                const { data: newEmail, error: eError } = await supabase
                  .from('contact_emails')
                  .insert({ email: contact.email })
                  .select('id')
                  .single();
                if (eError) throw eError;
                emailId = newEmail.id;
              }
            }

            // Get or create phone (if provided)
            let phoneId = null;
            if (contact.phone) {
              // Format phone number if provided
              let formattedPhone = contact.phone;
              const numbers = formattedPhone.replace(/\D/g, "");
              if (numbers.length === 10) {
                formattedPhone = `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
              }
              
              // Try to find existing phone
              const { data: existingPhone, error: lookupError } = await supabase
                .from('contact_phones')
                .select('id')
                .eq('phone', formattedPhone)
                .maybeSingle();
              
              if (existingPhone) {
                phoneId = existingPhone.id;
              } else if (lookupError && lookupError.code !== 'PGRST116') {
                // PGRST116 is "not found" which is fine, other errors are problems
                throw lookupError;
              } else {
                // Phone doesn't exist, try to insert it
                const { data: newPhone, error: pError } = await supabase
                  .from('contact_phones')
                  .insert({ phone: formattedPhone })
                  .select('id')
                  .single();
                
                if (pError) {
                  // If it's a duplicate constraint error, try to fetch it again
                  if (pError.code === '23505' || pError.message?.includes('unique constraint')) {
                    const { data: retryPhone } = await supabase
                      .from('contact_phones')
                      .select('id')
                      .eq('phone', formattedPhone)
                      .maybeSingle();
                    if (retryPhone) {
                      phoneId = retryPhone.id;
                    } else {
                      throw pError;
                    }
                  } else {
                    throw pError;
                  }
                } else if (newPhone) {
                  phoneId = newPhone.id;
                }
              }
            }

            // Get or create source (if provided, otherwise use "Imported")
            let sourceId = null;
            const sourceName = contact.sources || 'Imported';
            const { data: existingSource } = await supabase
              .from('contact_sources')
              .select('id')
              .eq('source', sourceName)
              .single();
            
            if (existingSource) {
              sourceId = existingSource.id;
            } else {
              const { data: newSource, error: sError } = await supabase
                .from('contact_sources')
                .insert({ source: sourceName })
                .select('id')
                .single();
              if (!sError && newSource) sourceId = newSource.id;
            }

            // Check if contact already exists
            // Handle NULL phone_id properly - PostgreSQL NULL != NULL, so we need special handling
            let existingContact = null;
            
            if (phoneId) {
              // If phone exists, check by both email and phone
              const { data: contactByBoth } = await supabase
                .from('contacts')
                .select('id')
                .eq('email_id', emailId)
                .eq('phone_id', phoneId)
                .maybeSingle();
              existingContact = contactByBoth;
            } else {
              // If phone is null, check by email where phone_id is also null
              const { data: contactByEmailNull } = await supabase
                .from('contacts')
                .select('id')
                .eq('email_id', emailId)
                .is('phone_id', null)
                .maybeSingle();
              existingContact = contactByEmailNull;
            }
            
            // If still not found, check by email only (might have different phone)
            if (!existingContact) {
              const { data: contactByEmail } = await supabase
                .from('contacts')
                .select('id')
                .eq('email_id', emailId)
                .maybeSingle();
              existingContact = contactByEmail;
            }

            let contactRecordId;
            if (existingContact) {
              // Skip if contact already exists (don't update, just skip)
              skippedCount++;
              continue; // Skip to next contact
            } else {
              // Create new contact - ensure at least email or phone is provided
              if (!emailId && !phoneId) {
                throw new Error('Contact must have at least email or phone');
              }
              
              const { data: newContact, error: contactError } = await supabase
                .from('contacts')
                .insert({
                  first_name_id: firstNameId,
                  last_name_id: lastNameId,
                  email_id: emailId,
                  phone_id: phoneId,
                  source_id: sourceId,
                  is_active: true,
                })
                .select('id')
                .single();
              if (contactError) throw contactError;
              contactRecordId = newContact.id;
            }

            // Add birthday if provided
            if (contact.birthday) {
              await supabase
                .from('contact_birthdays')
                .upsert({
                  contact_id: contactRecordId,
                  birthday: contact.birthday,
                }, {
                  onConflict: 'contact_id'
                });
            }

            // Add home anniversary if provided
            if (contact.home_anniversary) {
              await supabase
                .from('contact_home_anniversaries')
                .upsert({
                  contact_id: contactRecordId,
                  home_anniversary: contact.home_anniversary,
                }, {
                  onConflict: 'contact_id'
                });
            }

            // Add address if any address fields are provided
            if (contact.address_line1 || contact.city || contact.state || contact.zip_code) {
              await supabase
                .from('contact_addresses')
                .insert({
                  contact_id: contactRecordId,
                  address_line1: contact.address_line1 || null,
                  address_line2: contact.address_line2 || null,
                  city: contact.city || null,
                  state: contact.state || null,
                  zip_code: contact.zip_code || null,
                  country: contact.country || 'USA',
                  is_primary: true, // First address is primary
                });
            }

            // Add tags if provided (comma-separated)
            if (contact.tags) {
              const tagNames = contact.tags.split(',').map(t => t.trim()).filter(t => t);
              for (const tagName of tagNames) {
                // Get or create tag
                let tagId;
                const { data: existingTag } = await supabase
                  .from('contact_tags')
                  .select('id')
                  .eq('tag', tagName)
                  .single();
                
                if (existingTag) {
                  tagId = existingTag.id;
                } else {
                  const { data: newTag, error: tagError } = await supabase
                    .from('contact_tags')
                    .insert({ tag: tagName, color: '#9b87f5' })
                    .select('id')
                    .single();
                  if (!tagError && newTag) {
                    tagId = newTag.id;
                  }
                }

                // Assign tag to contact
                if (tagId) {
                  await supabase
                    .from('contact_tag_assignments')
                    .insert({
                      contact_id: contactRecordId,
                      tag_id: tagId,
                    });
                }
              }
            }

            importedCount++;
          } catch (err: any) {
            errorCount++;
            const errorMsg = `Failed to import ${contact.first_name} ${contact.last_name} (${contact.email}): ${err.message || err}`;
            console.error('Error importing contact:', contact, err);
            errors.push(errorMsg);
            // Continue with next contact instead of stopping
          }
        }
      }

      if (importedCount === 0) {
        let errorMessage = 'No contacts were imported.';
        if (skippedCount > 0) {
          errorMessage += ` ${skippedCount} contact${skippedCount !== 1 ? 's' : ''} already exist${skippedCount !== 1 ? '' : 's'}.`;
        }
        if (errorCount > 0) {
          errorMessage += ` ${errorCount} contact${errorCount !== 1 ? 's' : ''} had errors.`;
        }
        toast.error(errorMessage);
        if (errors.length > 0) {
          console.error('Import errors:', errors);
        }
      } else {
        let successMessage = `Successfully imported ${importedCount} contact${importedCount !== 1 ? 's' : ''}`;
        if (skippedCount > 0) {
          successMessage += `. ${skippedCount} contact${skippedCount !== 1 ? 's' : ''} already exist${skippedCount !== 1 ? 's' : ''} and were skipped.`;
        }
        if (errorCount > 0) {
          successMessage += `. ${errorCount} contact${errorCount !== 1 ? 's' : ''} had errors.`;
        }
        toast.success(successMessage);
        if (errors.length > 0) {
          console.error('Import errors:', errors);
        }
        setIsCsvDialogOpen(false);
        setCsvData([]);
        setCsvHeaders([]);
        setHeaderMapping({});
        setPreviewData([]);
        queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      }
    } catch (error: any) {
      console.error('Error importing CSV:', error);
      toast.error(error.message || 'Failed to import contacts');
    }
  };

  // Fetch available tags
  const { data: tagsData } = useQuery({
    queryKey: ['contact-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_tags')
        .select('*')
        .order('tag');
      if (error) throw error;
      return data as Tag[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (tagsData) {
      setAvailableTags(tagsData);
    }
  }, [tagsData]);

  // Initialize edit form when contact is selected
  useEffect(() => {
    if (selectedContact) {
      // Parse addresses and tags if they're JSON strings
      let addresses: Address[] = [];
      let tags: Tag[] = [];
      
      if (selectedContact.addresses) {
        if (typeof selectedContact.addresses === 'string') {
          try {
            addresses = JSON.parse(selectedContact.addresses);
          } catch (e) {
            addresses = [];
          }
        } else {
          addresses = selectedContact.addresses;
        }
      }
      
      if (selectedContact.tags) {
        if (typeof selectedContact.tags === 'string') {
          try {
            tags = JSON.parse(selectedContact.tags);
          } catch (e) {
            tags = [];
          }
        } else {
          tags = selectedContact.tags;
        }
      }

      setEditFormData({
        first_name: selectedContact.first_name || '',
        last_name: selectedContact.last_name || '',
        email: selectedContact.email || '',
        phone: selectedContact.phone || '',
        sources: selectedContact.source || '',
        birthday: selectedContact.birthday || '',
        home_anniversary: selectedContact.home_anniversary || '',
        addresses: addresses,
        tags: tags,
      });
      setIsEditing(false);
    }
  }, [selectedContact]);

  // Create or update contact
  const handleUpdateContact = async () => {
    if (!selectedContact) return;

    const isNewContact = selectedContact.contact_id === 0;

    try {
      // Format phone if provided
      let formattedPhone = editFormData.phone;
      if (formattedPhone) {
        const numbers = formattedPhone.replace(/\D/g, "");
        if (numbers.length === 10) {
          formattedPhone = `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
        }
      }

      // Get or create first name
      let firstNameId;
      const { data: existingFirstName } = await supabase
        .from('contact_first_names')
        .select('id')
        .eq('first_name', editFormData.first_name)
        .single();
      
      if (existingFirstName) {
        firstNameId = existingFirstName.id;
      } else {
        const { data: newFirstName, error: fnError } = await supabase
          .from('contact_first_names')
          .insert({ first_name: editFormData.first_name })
          .select('id')
          .single();
        if (fnError) throw fnError;
        firstNameId = newFirstName.id;
      }

      // Get or create last name
      let lastNameId;
      const { data: existingLastName } = await supabase
        .from('contact_last_names')
        .select('id')
        .eq('last_name', editFormData.last_name)
        .single();
      
      if (existingLastName) {
        lastNameId = existingLastName.id;
      } else {
        const { data: newLastName, error: lnError } = await supabase
          .from('contact_last_names')
          .insert({ last_name: editFormData.last_name })
          .select('id')
          .single();
        if (lnError) throw lnError;
        lastNameId = newLastName.id;
      }

      // Get or create email
      let emailId;
      const { data: existingEmail } = await supabase
        .from('contact_emails')
        .select('id')
        .eq('email', editFormData.email)
        .single();
      
      if (existingEmail) {
        emailId = existingEmail.id;
      } else {
        const { data: newEmail, error: eError } = await supabase
          .from('contact_emails')
          .insert({ email: editFormData.email })
          .select('id')
          .single();
        if (eError) throw eError;
        emailId = newEmail.id;
      }

      // Get or create phone
      let phoneId = null;
      if (formattedPhone) {
        const { data: existingPhone } = await supabase
          .from('contact_phones')
          .select('id')
          .eq('phone', formattedPhone)
          .single();
        
        if (existingPhone) {
          phoneId = existingPhone.id;
        } else {
          const { data: newPhone, error: pError } = await supabase
            .from('contact_phones')
            .insert({ phone: formattedPhone })
            .select('id')
            .single();
          if (pError) throw pError;
          phoneId = newPhone.id;
        }
      }

      // Get or create source
      let sourceId = null;
      if (editFormData.sources) {
        const sourceName = editFormData.sources.split(',')[0].trim(); // Use first source
        const { data: existingSource } = await supabase
          .from('contact_sources')
          .select('id')
          .eq('source', sourceName)
          .single();
        
        if (existingSource) {
          sourceId = existingSource.id;
        } else {
          const { data: newSource, error: sError } = await supabase
            .from('contact_sources')
            .insert({ source: sourceName })
            .select('id')
            .single();
          if (!sError && newSource) sourceId = newSource.id;
        }
      }

      // For new contacts, create a contact entry directly
      // For existing contacts, update the contact record
      let contactIdToUse: number;
      
      if (isNewContact) {
        // Create a new contact
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            first_name_id: firstNameId,
            last_name_id: lastNameId,
            email_id: emailId,
            phone_id: phoneId,
            source_id: sourceId,
            is_active: true,
          })
          .select('id')
          .single();
        if (contactError) throw contactError;
        contactIdToUse = newContact.id;
      } else {
        // Update the contact record directly
        const { error: updateError } = await supabase
          .from('contacts')
          .update({
            first_name_id: firstNameId,
            last_name_id: lastNameId,
            email_id: emailId,
            phone_id: phoneId,
            source_id: sourceId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedContact.contact_id);
        if (updateError) throw updateError;
        
        contactIdToUse = selectedContact.contact_id;
      }

      // Update birthday
      if (editFormData.birthday) {
        const { error: bdError } = await supabase
          .from('contact_birthdays')
          .upsert({
            contact_id: contactIdToUse,
            birthday: editFormData.birthday,
          }, {
            onConflict: 'contact_id'
          });
        if (bdError) throw bdError;
      } else {
        // Delete birthday if empty
        const { error: bdError } = await supabase
          .from('contact_birthdays')
          .delete()
          .eq('contact_id', contactIdToUse);
        if (bdError && bdError.code !== 'PGRST116') throw bdError; // Ignore if not found
      }

      // Update home anniversary
      if (editFormData.home_anniversary) {
        const { error: haError } = await supabase
          .from('contact_home_anniversaries')
          .upsert({
            contact_id: contactIdToUse,
            home_anniversary: editFormData.home_anniversary,
          }, {
            onConflict: 'contact_id'
          });
        if (haError) throw haError;
      } else {
        // Delete home anniversary if empty
        const { error: haError } = await supabase
          .from('contact_home_anniversaries')
          .delete()
          .eq('contact_id', contactIdToUse);
        if (haError && haError.code !== 'PGRST116') throw haError; // Ignore if not found
      }

      // Update addresses
      // Delete existing addresses
      const { error: delAddrError } = await supabase
        .from('contact_addresses')
        .delete()
        .eq('contact_id', contactIdToUse);
      if (delAddrError) throw delAddrError;

      // Insert new addresses
      if (editFormData.addresses && editFormData.addresses.length > 0) {
        const addressesToInsert = editFormData.addresses.map(addr => ({
          contact_id: contactIdToUse,
          address_line1: addr.address_line1 || null,
          address_line2: addr.address_line2 || null,
          city: addr.city || null,
          state: addr.state || null,
          zip_code: addr.zip_code || null,
          country: addr.country || 'USA',
          is_primary: addr.is_primary || false,
        }));

        const { error: addrError } = await supabase
          .from('contact_addresses')
          .insert(addressesToInsert);
        if (addrError) throw addrError;
      }

      // Update tags
      // Delete existing tag assignments
      const { error: delTagError } = await supabase
        .from('contact_tag_assignments')
        .delete()
        .eq('contact_id', contactIdToUse);
      if (delTagError) throw delTagError;

      // Insert new tag assignments
      if (editFormData.tags && editFormData.tags.length > 0) {
        const tagAssignments = editFormData.tags.map(tag => ({
          contact_id: contactIdToUse,
          tag_id: tag.id,
        }));

        const { error: tagError } = await supabase
          .from('contact_tag_assignments')
          .insert(tagAssignments);
        if (tagError) throw tagError;
      }

      toast.success(isNewContact ? 'Contact created successfully' : 'Contact updated successfully');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      setSelectedContact(null);
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast.error(error.message || 'Failed to update contact');
    }
  };

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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Contacts
            </h1>
            <p className="text-gray-600">
              Manage and view all your contacts
            </p>
          </div>
          <div className="flex gap-2">
            {selectedContactIds.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedContactIds.length})
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
              }}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => setIsCsvDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={() => {
              setSelectedContact({
                contact_id: 0, // Use 0 to indicate new contact
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                last_contact_at: '',
                source: '',
                message_count: 0,
                open_house_count: 0,
              });
              setIsEditing(true);
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {uniqueSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contacts Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Contacts ({sortedContacts.length})
            </CardTitle>
            <CardDescription>
              Click on a contact to view details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-600">
                Loading contacts...
              </div>
            ) : sortedContacts.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No contacts found
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={(checked) => handleSelectAll(checked === true)}
                        />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('first_name')}
                      >
                        <div className="flex items-center gap-1">
                          Name
                          {sortField === 'first_name' && (
                            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                          {sortField !== 'first_name' && <ArrowUpDown className="h-3 w-3 text-gray-400" />}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('phone')}
                      >
                        <div className="flex items-center gap-1">
                          Phone
                          {sortField === 'phone' && (
                            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                          {sortField !== 'phone' && <ArrowUpDown className="h-3 w-3 text-gray-400" />}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center gap-1">
                          Email
                          {sortField === 'email' && (
                            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                          {sortField !== 'email' && <ArrowUpDown className="h-3 w-3 text-gray-400" />}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('birthday')}
                      >
                        <div className="flex items-center gap-1">
                          Birthday
                          {sortField === 'birthday' && (
                            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                          {sortField !== 'birthday' && <ArrowUpDown className="h-3 w-3 text-gray-400" />}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('home_anniversary')}
                      >
                        <div className="flex items-center gap-1">
                          Home Anniversary
                          {sortField === 'home_anniversary' && (
                            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                          {sortField !== 'home_anniversary' && <ArrowUpDown className="h-3 w-3 text-gray-400" />}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('source')}
                      >
                        <div className="flex items-center gap-1">
                          Source
                          {sortField === 'source' && (
                            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                          {sortField !== 'source' && <ArrowUpDown className="h-3 w-3 text-gray-400" />}
                        </div>
                      </TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('last_contact_at')}
                      >
                        <div className="flex items-center gap-1">
                          Last Contact
                          {sortField === 'last_contact_at' && (
                            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                          {sortField !== 'last_contact_at' && <ArrowUpDown className="h-3 w-3 text-gray-400" />}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedContacts.map((contact) => (
                      <TableRow
                        key={contact.contact_id}
                        className="cursor-pointer"
                        onClick={() => setSelectedContact(contact)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedContactIds.includes(contact.contact_id)}
                            onCheckedChange={(checked) => handleSelectContact(contact.contact_id, checked === true)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {contact.first_name || contact.last_name
                            ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {contact.phone ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-blue-600 hover:text-blue-800 cursor-pointer whitespace-nowrap"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const digits = contact.phone.replace(/\D/g, '');
                                      const phoneNumber = digits.length === 10 ? `+1${digits}` : contact.phone;
                                      window.location.href = `tel:${phoneNumber}`;
                                    }}
                                    title="Call">
                                {contact.phone}
                              </span>
                              <div className="flex gap-1">
                                <a
                                  href={`tel:${(() => {
                                    const digits = contact.phone.replace(/\D/g, '');
                                    return digits.length === 10 ? `+1${digits}` : contact.phone;
                                  })()}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                                  title="Call"
                                >
                                  <Phone className="h-3 w-3" />
                                </a>
                                <a
                                  href={`sms:${(() => {
                                    const digits = contact.phone.replace(/\D/g, '');
                                    return digits.length === 10 ? `+1${digits}` : contact.phone;
                                  })()}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"
                                  title="Text"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.email ? (
                            <a
                              href={`mailto:${contact.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                              title="Send email"
                            >
                              {contact.email}
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.birthday
                            ? format(new Date(contact.birthday), 'MMM d, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {contact.home_anniversary
                            ? format(new Date(contact.home_anniversary), 'MMM d, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {contact.source || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            let tags: Tag[] = [];
                            if (contact.tags) {
                              if (typeof contact.tags === 'string') {
                                try {
                                  tags = JSON.parse(contact.tags);
                                } catch (e) {
                                  tags = [];
                                }
                              } else {
                                tags = contact.tags;
                              }
                            }
                            return tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {tags.map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="px-2 py-0.5 text-xs rounded-full"
                                    style={{
                                      backgroundColor: tag.color || '#9b87f5',
                                      color: 'white',
                                    }}
                                  >
                                    {tag.tag}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              'N/A'
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {contact.last_contact_at
                            ? format(new Date(contact.last_contact_at), 'MMM d, yyyy')
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Detail Dialog */}
        <Dialog open={!!selectedContact} onOpenChange={() => {
          setSelectedContact(null);
          setIsEditing(false);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <DialogTitle className="pr-8">
                    {selectedContact && selectedContact.contact_id === 0
                      ? 'Add New Contact'
                      : selectedContact
                      ? `${selectedContact.first_name || ''} ${selectedContact.last_name || ''}`.trim() || 'Contact Details'
                      : 'Contact Details'}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    {isEditing ? 'Edit contact information' : 'View detailed information about this contact'}
                  </DialogDescription>
                </div>
                {!isEditing && selectedContact && selectedContact.contact_id !== 0 && (
                  <div className="flex gap-2 shrink-0 mr-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDeleteTargetId(selectedContact.contact_id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </DialogHeader>
            {selectedContact && (
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">First Name *</Label>
                        <Input
                          value={editFormData.first_name}
                          onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                          placeholder="First Name"
                          className="mt-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Last Name *</Label>
                        <Input
                          value={editFormData.last_name}
                          onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                          placeholder="Last Name"
                          className="mt-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email *
                      </Label>
                      <Input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="mt-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </Label>
                      <Input
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        placeholder="860-682-2251"
                        className="mt-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Sources</Label>
                      <Input
                        value={editFormData.sources}
                        onChange={(e) => setEditFormData({ ...editFormData, sources: e.target.value })}
                        placeholder="Website, Open House, etc."
                        className="mt-0"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Birthday</Label>
                        <Input
                          type="date"
                          value={editFormData.birthday}
                          onChange={(e) => setEditFormData({ ...editFormData, birthday: e.target.value })}
                          className="mt-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Home Anniversary</Label>
                        <Input
                          type="date"
                          value={editFormData.home_anniversary}
                          onChange={(e) => setEditFormData({ ...editFormData, home_anniversary: e.target.value })}
                          className="mt-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Addresses</Label>
                      <div className="space-y-2 mt-2">
                        {editFormData.addresses.map((addr, idx) => (
                          <div key={idx} className="grid grid-cols-2 gap-2 p-2 border rounded">
                            <Input
                              placeholder="Address Line 1"
                              value={addr.address_line1 || ''}
                              onChange={(e) => {
                                const newAddresses = [...editFormData.addresses];
                                newAddresses[idx] = { ...addr, address_line1: e.target.value };
                                setEditFormData({ ...editFormData, addresses: newAddresses });
                              }}
                            />
                            <Input
                              placeholder="Address Line 2"
                              value={addr.address_line2 || ''}
                              onChange={(e) => {
                                const newAddresses = [...editFormData.addresses];
                                newAddresses[idx] = { ...addr, address_line2: e.target.value };
                                setEditFormData({ ...editFormData, addresses: newAddresses });
                              }}
                            />
                            <Input
                              placeholder="City"
                              value={addr.city || ''}
                              onChange={(e) => {
                                const newAddresses = [...editFormData.addresses];
                                newAddresses[idx] = { ...addr, city: e.target.value };
                                setEditFormData({ ...editFormData, addresses: newAddresses });
                              }}
                            />
                            <Input
                              placeholder="State"
                              value={addr.state || ''}
                              onChange={(e) => {
                                const newAddresses = [...editFormData.addresses];
                                newAddresses[idx] = { ...addr, state: e.target.value };
                                setEditFormData({ ...editFormData, addresses: newAddresses });
                              }}
                            />
                            <Input
                              placeholder="ZIP Code"
                              value={addr.zip_code || ''}
                              onChange={(e) => {
                                const newAddresses = [...editFormData.addresses];
                                newAddresses[idx] = { ...addr, zip_code: e.target.value };
                                setEditFormData({ ...editFormData, addresses: newAddresses });
                              }}
                            />
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={addr.is_primary || false}
                                  onChange={(e) => {
                                    const newAddresses = editFormData.addresses.map((a, i) => ({
                                      ...a,
                                      is_primary: i === idx ? e.target.checked : false,
                                    }));
                                    setEditFormData({ ...editFormData, addresses: newAddresses });
                                  }}
                                />
                                Primary
                              </label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newAddresses = editFormData.addresses.filter((_, i) => i !== idx);
                                  setEditFormData({ ...editFormData, addresses: newAddresses });
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditFormData({
                              ...editFormData,
                              addresses: [...editFormData.addresses, {} as Address],
                            });
                          }}
                        >
                          + Add Address
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tags</Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {editFormData.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="px-2 py-1 text-xs rounded-full flex items-center gap-1"
                              style={{
                                backgroundColor: tag.color || '#9b87f5',
                                color: 'white',
                              }}
                            >
                              {tag.tag}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditFormData({
                                    ...editFormData,
                                    tags: editFormData.tags.filter((t) => t.id !== tag.id),
                                  });
                                }}
                                className="ml-1 hover:opacity-70"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value=""
                            onValueChange={(tagId) => {
                              const tag = availableTags.find((t) => t.id.toString() === tagId);
                              if (tag && !editFormData.tags.find((t) => t.id === tag.id)) {
                                setEditFormData({
                                  ...editFormData,
                                  tags: [...editFormData.tags, tag],
                                });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Add tag" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTags
                                .filter((tag) => !editFormData.tags.find((t) => t.id === tag.id))
                                .map((tag) => (
                                  <SelectItem key={tag.id} value={tag.id.toString()}>
                                    {tag.tag}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Input
                              placeholder="New tag name"
                              value={newTagName}
                              onChange={(e) => setNewTagName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newTagName.trim()) {
                                  e.preventDefault();
                                  // Create new tag
                                  supabase
                                    .from('contact_tags')
                                    .insert({ tag: newTagName.trim(), color: '#9b87f5' })
                                    .select()
                                    .single()
                                    .then(({ data, error }) => {
                                      if (!error && data) {
                                        setAvailableTags([...availableTags, data]);
                                        setEditFormData({
                                          ...editFormData,
                                          tags: [...editFormData.tags, data],
                                        });
                                        setNewTagName('');
                                        queryClient.invalidateQueries({ queryKey: ['contact-tags'] });
                                      }
                                    });
                                }
                              }}
                            />
                            {newTagName.trim() && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  supabase
                                    .from('contact_tags')
                                    .insert({ tag: newTagName.trim(), color: '#9b87f5' })
                                    .select()
                                    .single()
                                    .then(({ data, error }) => {
                                      if (!error && data) {
                                        setAvailableTags([...availableTags, data]);
                                        setEditFormData({
                                          ...editFormData,
                                          tags: [...editFormData.tags, data],
                                        });
                                        setNewTagName('');
                                        queryClient.invalidateQueries({ queryKey: ['contact-tags'] });
                                      }
                                    });
                                }}
                              >
                                Create
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleUpdateContact}
                        className="flex-1"
                        disabled={!editFormData.first_name || !editFormData.last_name || !editFormData.email}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">First Name</p>
                        <p className="text-gray-600">
                          {selectedContact.first_name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Last Name</p>
                        <p className="text-gray-600">
                          {selectedContact.last_name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </p>
                      <p className="text-gray-600">
                        {selectedContact.email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </p>
                      <p className="text-gray-600">
                        {selectedContact.phone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Source</p>
                      <p className="text-gray-600">
                        {selectedContact.source || 'N/A'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Birthday
                        </p>
                        <p className="text-gray-600">
                          {selectedContact.birthday
                            ? format(new Date(selectedContact.birthday), 'PP')
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Home Anniversary
                        </p>
                        <p className="text-gray-600">
                          {selectedContact.home_anniversary
                            ? format(new Date(selectedContact.home_anniversary), 'PP')
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Addresses</p>
                      {(() => {
                        let addresses: Address[] = [];
                        if (selectedContact.addresses) {
                          if (typeof selectedContact.addresses === 'string') {
                            try {
                              addresses = JSON.parse(selectedContact.addresses);
                            } catch (e) {
                              addresses = [];
                            }
                          } else {
                            addresses = selectedContact.addresses;
                          }
                        }
                        return addresses.length > 0 ? (
                          <div className="space-y-2">
                            {addresses.map((addr, idx) => (
                              <div key={idx} className="p-2 border rounded text-sm">
                                {addr.is_primary && (
                                  <span className="text-xs font-semibold text-[#9b87f5] mr-2">PRIMARY</span>
                                )}
                                <p className="text-gray-600">
                                  {addr.address_line1}
                                  {addr.address_line2 && `, ${addr.address_line2}`}
                                  {addr.city && `, ${addr.city}`}
                                  {addr.state && `, ${addr.state}`}
                                  {addr.zip_code && ` ${addr.zip_code}`}
                                  {addr.country && `, ${addr.country}`}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-600">N/A</p>
                        );
                      })()}
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Tags</p>
                      {(() => {
                        let tags: Tag[] = [];
                        if (selectedContact.tags) {
                          if (typeof selectedContact.tags === 'string') {
                            try {
                              tags = JSON.parse(selectedContact.tags);
                            } catch (e) {
                              tags = [];
                            }
                          } else {
                            tags = selectedContact.tags;
                          }
                        }
                        return tags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                              <span
                                key={tag.id}
                                className="px-2 py-1 text-xs rounded-full"
                                style={{
                                  backgroundColor: tag.color || '#9b87f5',
                                  color: 'white',
                                }}
                              >
                                {tag.tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-600">N/A</p>
                        );
                      })()}
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Last Contact
                      </p>
                      <p className="text-gray-600">
                        {selectedContact.last_contact_at
                          ? format(new Date(selectedContact.last_contact_at), 'PPpp')
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Messages</p>
                        <p className="text-gray-600">
                          {selectedContact.message_count || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Open Houses</p>
                        <p className="text-gray-600">
                          {selectedContact.open_house_count || 0}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* CSV Import Dialog */}
        <Dialog 
          open={isCsvDialogOpen} 
          onOpenChange={(open) => {
            setIsCsvDialogOpen(open);
            if (!open) {
              // Clear CSV data when dialog is closed
              setCsvData([]);
              setCsvHeaders([]);
              setHeaderMapping({});
              setPreviewData([]);
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import Contacts from CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file and map the columns to contact fields. The first row should contain headers.
                Required fields: First Name, Last Name, Email
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* File Upload with Drag and Drop */}
              <div className="space-y-2">
                <label className="text-sm font-medium">CSV File</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  <Upload className={`mx-auto h-12 w-12 mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className="text-sm text-gray-600 mb-2">
                    {isDragging ? 'Drop your CSV file here' : 'Drag and drop your CSV file here, or click to browse'}
                  </p>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="cursor-pointer hidden"
                    id="csv-file-input"
                  />
                  <label
                    htmlFor="csv-file-input"
                    className="inline-block cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Browse files
                  </label>
                </div>
              </div>

              {/* Header Mapping */}
              {csvHeaders.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Map CSV Headers to Contact Fields</h3>
                    <div className="space-y-2">
                      {csvHeaders.map((header) => (
                        <div key={header} className="flex items-center gap-4">
                          <div className="w-48 text-sm font-medium">{header}</div>
                          <div className="flex-1">
                            <Select
                              value={headerMapping[header] || 'skip'}
                              onValueChange={(value) => handleMappingChange(header, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                {dbColumns.map((col) => (
                                  <SelectItem key={col.value} value={col.value}>
                                    {col.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  {previewData.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Preview (First 5 rows)</h3>
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {Object.keys(previewData[0] || {}).map((key) => (
                                <TableHead key={key}>{key}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.map((row, idx) => (
                              <TableRow key={idx}>
                                {Object.values(row).map((value: any, cellIdx) => (
                                  <TableCell key={cellIdx}>
                                    {value !== null && value !== undefined ? String(value) : '-'}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Total rows to import: {csvData.length}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCsvDialogOpen(false);
                setCsvData([]);
                setCsvHeaders([]);
                setHeaderMapping({});
                setPreviewData([]);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCsvImport}
                disabled={csvData.length === 0 || Object.keys(headerMapping).length === 0}
              >
                Import {csvData.length > 0 ? `${csvData.length} ` : ''}Contacts
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the contact and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteTargetId(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteTargetId !== null) {
                    handleDeleteContact(deleteTargetId);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete {selectedContactIds.length} contact(s) and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBulkDeleteDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete {selectedContactIds.length} Contact(s)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CRMLayout>
  );
}
