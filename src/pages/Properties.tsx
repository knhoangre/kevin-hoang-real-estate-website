import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Property {
  id: number;
  mlsnum: string;
  property_type: string;
  address: string;
  town: string;
  zip_code: string;
  sale_price: number | null;
  bedrooms: number | null;
  full_baths: number | null;
  half_baths: number | null;
  living_area: number | null;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

const Properties = () => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCsvDialogOpen, setIsCsvDialogOpen] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<number>>(new Set());
  const [bulkEditData, setBulkEditData] = useState({
    property_type: '',
    town: '',
    zip_code: '',
    sale_price: '',
    bedrooms: '',
    full_baths: '',
    half_baths: '',
    living_area: '',
  });
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [headerMapping, setHeaderMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    mlsnum: '',
    property_type: '',
    address: '',
    town: '',
    zip_code: '',
    sale_price: '',
    bedrooms: '',
    full_baths: '',
    half_baths: '',
    living_area: '',
    image_urls: [] as string[],
  });

  // Handle admin check
  useEffect(() => {
    if (loading) return;
    
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  // Fetch properties
  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: 'Error',
        description: 'Failed to load properties',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProperties();
    }
  }, [isAdmin]);

  const uploadPropertyImages = async (files: File[], mlsnum: string) => {
    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${mlsnum}/${Date.now()}-${i}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(data.publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload images',
        variant: 'destructive',
      });
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const mlsnum = formData.mlsnum || `temp-${Date.now()}`;
    console.log('Uploading images for MLS:', mlsnum, 'Files:', files.length);
    
    const uploadedUrls = await uploadPropertyImages(Array.from(files), mlsnum);
    
    console.log('Uploaded URLs:', uploadedUrls);
    
    const newImages = [...propertyImages, ...uploadedUrls];
    setPropertyImages(newImages);
    setFormData({ ...formData, image_urls: newImages });
    
    console.log('Updated formData.image_urls:', newImages);
    
    // Reset file input
    e.target.value = '';
  };

  const handleRemoveImage = async (index: number) => {
    const imageUrl = propertyImages[index];
    
    // Try to delete from storage if it's a Supabase URL
    try {
      // Extract file path from URL
      // Supabase URLs look like: https://[project].supabase.co/storage/v1/object/public/property-images/[path]
      const urlParts = imageUrl.split('/property-images/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage
          .from('property-images')
          .remove([filePath]);
      }
    } catch (error) {
      console.error('Error deleting image from storage:', error);
      // Continue anyway - remove from UI even if storage delete fails
    }
    
    const newImages = propertyImages.filter((_, i) => i !== index);
    setPropertyImages(newImages);
    setFormData({ ...formData, image_urls: newImages });
  };

  const handleAdd = () => {
    setSelectedProperty(null);
    setPropertyImages([]);
    setFormData({
      mlsnum: '',
      property_type: '',
      address: '',
      town: '',
      zip_code: '',
      sale_price: '',
      bedrooms: '',
      full_baths: '',
      half_baths: '',
      living_area: '',
      image_urls: [],
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (property: Property) => {
    setSelectedProperty(property);
    const imageUrls = property.image_urls || [];
    setPropertyImages(imageUrls);
    setFormData({
      mlsnum: property.mlsnum,
      property_type: property.property_type,
      address: property.address,
      town: property.town,
      zip_code: property.zip_code,
      sale_price: property.sale_price?.toString() || '',
      bedrooms: property.bedrooms?.toString() || '',
      full_baths: property.full_baths?.toString() || '',
      half_baths: property.half_baths?.toString() || '',
      living_area: property.living_area?.toString() || '',
      image_urls: imageUrls,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (property: Property) => {
    setSelectedProperty(property);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const dataToSave = {
        mlsnum: formData.mlsnum,
        property_type: formData.property_type,
        address: formData.address,
        town: formData.town,
        zip_code: formData.zip_code,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        full_baths: formData.full_baths ? parseInt(formData.full_baths) : null,
        half_baths: formData.half_baths ? parseInt(formData.half_baths) : null,
        living_area: formData.living_area ? parseInt(formData.living_area) : null,
        image_urls: propertyImages,
        updated_at: new Date().toISOString(),
      };

      // Debug: Log what we're saving
      console.log('Saving property with image_urls:', {
        mlsnum: dataToSave.mlsnum,
        image_urls_count: dataToSave.image_urls.length,
        image_urls: dataToSave.image_urls,
      });

      if (selectedProperty) {
        // Update
        const { error } = await supabase
          .from('properties')
          .update(dataToSave)
          .eq('id', selectedProperty.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Property updated successfully',
        });
      } else {
        // Insert
        const { error } = await supabase
          .from('properties')
          .insert([dataToSave]);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Property added successfully',
        });
      }

      setIsDialogOpen(false);
      fetchProperties();
    } catch (error: any) {
      console.error('Error saving property:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save property',
        variant: 'destructive',
      });
    }
  };

  const handleSelectProperty = (propertyId: number, checked: boolean) => {
    setSelectedPropertyIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(propertyId);
      } else {
        newSet.delete(propertyId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPropertyIds(new Set(properties.map(p => p.id)));
    } else {
      setSelectedPropertyIds(new Set());
    }
  };

  const confirmDelete = async () => {
    const idsToDelete = selectedPropertyIds.size > 0 
      ? Array.from(selectedPropertyIds)
      : selectedProperty 
        ? [selectedProperty.id]
        : [];

    if (idsToDelete.length === 0) return;

    try {
      const { error } = await supabase
        .from('properties')
        .update({ is_active: false })
        .in('id', idsToDelete);

      if (error) throw error;
      
      const count = idsToDelete.length;
      toast({
        title: 'Success',
        description: `${count} propert${count === 1 ? 'y' : 'ies'} deleted successfully`,
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedPropertyIds(new Set());
      setSelectedProperty(null);
      fetchProperties();
    } catch (error: any) {
      console.error('Error deleting properties:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete properties',
        variant: 'destructive',
      });
    }
  };

  const handleBulkEdit = async () => {
    if (selectedPropertyIds.size === 0) return;

    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Only include fields that have values
      if (bulkEditData.property_type) updateData.property_type = bulkEditData.property_type;
      if (bulkEditData.town) updateData.town = bulkEditData.town;
      if (bulkEditData.zip_code) updateData.zip_code = bulkEditData.zip_code;
      if (bulkEditData.sale_price) updateData.sale_price = parseFloat(bulkEditData.sale_price);
      if (bulkEditData.bedrooms) updateData.bedrooms = parseInt(bulkEditData.bedrooms);
      if (bulkEditData.full_baths) updateData.full_baths = parseInt(bulkEditData.full_baths);
      if (bulkEditData.half_baths) updateData.half_baths = parseInt(bulkEditData.half_baths);
      if (bulkEditData.living_area) updateData.living_area = parseInt(bulkEditData.living_area);

      const idsToUpdate = Array.from(selectedPropertyIds);

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .in('id', idsToUpdate);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Successfully updated ${idsToUpdate.length} propert${idsToUpdate.length === 1 ? 'y' : 'ies'}`,
      });

      setIsBulkEditDialogOpen(false);
      setSelectedPropertyIds(new Set());
      fetchProperties();
    } catch (error: any) {
      console.error('Error bulk editing properties:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update properties',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Database column options
  const dbColumns = [
    { value: 'skip', label: '-- Skip --' },
    { value: 'mlsnum', label: 'MLS Number' },
    { value: 'property_type', label: 'Property Type' },
    { value: 'address', label: 'Address' },
    { value: 'town', label: 'Town' },
    { value: 'zip_code', label: 'Zip Code' },
    { value: 'sale_price', label: 'Sale Price' },
    { value: 'bedrooms', label: 'Bedrooms' },
    { value: 'full_baths', label: 'Full Baths' },
    { value: 'half_baths', label: 'Half Baths' },
    { value: 'living_area', label: 'Living Area' },
  ];

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
          i++; // Skip next quote
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
          i++; // Skip \n after \r
        }
      } else {
        currentField += char;
      }
    }

    // Add last field and line
    if (currentField || currentLine.length > 0) {
      currentLine.push(currentField.trim());
      lines.push(currentLine);
    }

    return lines;
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Error',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      
      if (parsed.length === 0) {
        toast({
          title: 'Error',
          description: 'CSV file is empty',
          variant: 'destructive',
        });
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
          const value = row[index].trim();
          
          // Convert to appropriate type
          if (dbColumn === 'sale_price' || dbColumn === 'bedrooms' || 
              dbColumn === 'full_baths' || dbColumn === 'half_baths' || 
              dbColumn === 'living_area') {
            const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
            mapped[dbColumn] = isNaN(num) ? null : num;
          } else {
            mapped[dbColumn] = value;
          }
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

  const handleCsvImport = async () => {
    try {
      const requiredFields = ['mlsnum', 'property_type', 'address', 'town', 'zip_code'];
      const mappedFields = Object.values(headerMapping);
      
      // Check if all required fields are mapped
      const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
      if (missingFields.length > 0) {
        toast({
          title: 'Error',
          description: `Missing required field mappings: ${missingFields.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }

      // Process all rows
      const propertiesToInsert = csvData.map((row) => {
        const property: any = {};
        csvHeaders.forEach((header, index) => {
          const dbColumn = headerMapping[header];
          if (dbColumn && row[index]) {
            const value = row[index].trim();
            
            if (dbColumn === 'sale_price' || dbColumn === 'bedrooms' || 
                dbColumn === 'full_baths' || dbColumn === 'half_baths' || 
                dbColumn === 'living_area') {
              const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
              property[dbColumn] = isNaN(num) ? null : num;
            } else {
              property[dbColumn] = value;
            }
          }
        });
        
        // Set defaults
        property.is_active = true;
        
        return property;
      }).filter(p => p.mlsnum); // Filter out rows without MLS number

      if (propertiesToInsert.length === 0) {
        toast({
          title: 'Error',
          description: 'No valid properties to import',
          variant: 'destructive',
        });
        return;
      }

      // Insert in batches to avoid overwhelming the database
      const batchSize = 100;
      for (let i = 0; i < propertiesToInsert.length; i += batchSize) {
        const batch = propertiesToInsert.slice(i, i + batchSize);
        const { error } = await supabase
          .from('properties')
          .insert(batch);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `Successfully imported ${propertiesToInsert.length} properties`,
      });

      setIsCsvDialogOpen(false);
      setCsvData([]);
      setCsvHeaders([]);
      setHeaderMapping({});
      setPreviewData([]);
      fetchProperties();
    } catch (error: any) {
      console.error('Error importing CSV:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to import properties',
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
          <h1 className="text-3xl font-bold">Properties</h1>
          <div className="flex gap-2">
            {selectedPropertyIds.size > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBulkEditData({
                      property_type: '',
                      town: '',
                      zip_code: '',
                      sale_price: '',
                      bedrooms: '',
                      full_baths: '',
                      half_baths: '',
                      living_area: '',
                    });
                    setIsBulkEditDialogOpen(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Selected ({selectedPropertyIds.size})
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedPropertyIds.size})
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setIsCsvDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={properties.length > 0 && selectedPropertyIds.size === properties.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>MLS #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Town</TableHead>
                <TableHead>Zip Code</TableHead>
                <TableHead>Sale Price</TableHead>
                <TableHead>Bedrooms</TableHead>
                <TableHead>Full Baths</TableHead>
                <TableHead>Half Baths</TableHead>
                <TableHead>Living Area</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                    No properties found. Click "Add Property" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPropertyIds.has(property.id)}
                        onCheckedChange={(checked) => handleSelectProperty(property.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{property.mlsnum}</TableCell>
                    <TableCell>{property.property_type}</TableCell>
                    <TableCell>{property.address}</TableCell>
                    <TableCell>{property.town}</TableCell>
                    <TableCell>{property.zip_code}</TableCell>
                    <TableCell>{formatCurrency(property.sale_price)}</TableCell>
                    <TableCell>{property.bedrooms ?? '-'}</TableCell>
                    <TableCell>{property.full_baths ?? '-'}</TableCell>
                    <TableCell>{property.half_baths ?? '-'}</TableCell>
                    <TableCell>
                      {property.living_area ? `${property.living_area.toLocaleString()} sq ft` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(property)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(property)}
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
                {selectedProperty ? 'Edit Property' : 'Add Property'}
              </DialogTitle>
              <DialogDescription>
                {selectedProperty
                  ? 'Update the property information below.'
                  : 'Fill in the property information below.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">MLS Number *</label>
                <Input
                  value={formData.mlsnum}
                  onChange={(e) => setFormData({ ...formData, mlsnum: e.target.value })}
                  placeholder="MLS-123456"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Property Type *</label>
                <Input
                  value={formData.property_type}
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                  placeholder="Single Family, Condo, etc."
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Address *</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Town *</label>
                <Input
                  value={formData.town}
                  onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                  placeholder="Boston"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Zip Code *</label>
                <Input
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  placeholder="02101"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sale Price</label>
                <Input
                  type="number"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  placeholder="500000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bedrooms</label>
                <Input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  placeholder="3"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Baths</label>
                <Input
                  type="number"
                  value={formData.full_baths}
                  onChange={(e) => setFormData({ ...formData, full_baths: e.target.value })}
                  placeholder="2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Half Baths</label>
                <Input
                  type="number"
                  value={formData.half_baths}
                  onChange={(e) => setFormData({ ...formData, half_baths: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Living Area (sq ft)</label>
                <Input
                  type="number"
                  value={formData.living_area}
                  onChange={(e) => setFormData({ ...formData, living_area: e.target.value })}
                  placeholder="2000"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Property Images</label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImages || !formData.mlsnum}
                />
                {!formData.mlsnum && (
                  <p className="text-xs text-gray-500">Please enter MLS number first</p>
                )}
                {uploadingImages && <p className="text-sm text-gray-500">Uploading...</p>}
                
                {/* Display uploaded images */}
                {propertyImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {propertyImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url} 
                          alt={`Property ${index + 1}`} 
                          className="w-full h-24 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {selectedProperty ? 'Update' : 'Add'} Property
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Edit Dialog */}
        <Dialog open={isBulkEditDialogOpen} onOpenChange={setIsBulkEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bulk Edit Properties ({selectedPropertyIds.size})</DialogTitle>
              <DialogDescription>
                Update the fields below to apply changes to all selected properties. Leave fields empty to keep existing values.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Property Type</label>
                <Input
                  value={bulkEditData.property_type}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, property_type: e.target.value })}
                  placeholder="Leave empty to keep existing"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Town</label>
                <Input
                  value={bulkEditData.town}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, town: e.target.value })}
                  placeholder="Leave empty to keep existing"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Zip Code</label>
                <Input
                  value={bulkEditData.zip_code}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, zip_code: e.target.value })}
                  placeholder="Leave empty to keep existing"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sale Price</label>
                <Input
                  type="number"
                  value={bulkEditData.sale_price}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, sale_price: e.target.value })}
                  placeholder="Leave empty to keep existing"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bedrooms</label>
                <Input
                  type="number"
                  value={bulkEditData.bedrooms}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, bedrooms: e.target.value })}
                  placeholder="Leave empty to keep existing"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Baths</label>
                <Input
                  type="number"
                  value={bulkEditData.full_baths}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, full_baths: e.target.value })}
                  placeholder="Leave empty to keep existing"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Half Baths</label>
                <Input
                  type="number"
                  value={bulkEditData.half_baths}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, half_baths: e.target.value })}
                  placeholder="Leave empty to keep existing"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Living Area (sq ft)</label>
                <Input
                  type="number"
                  value={bulkEditData.living_area}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, living_area: e.target.value })}
                  placeholder="Leave empty to keep existing"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBulkEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkEdit}>
                Update {selectedPropertyIds.size} Propert{selectedPropertyIds.size === 1 ? 'y' : 'ies'}
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
                {selectedPropertyIds.size > 0
                  ? `This will delete ${selectedPropertyIds.size} propert${selectedPropertyIds.size === 1 ? 'y' : 'ies'}. This action cannot be undone.`
                  : `This will delete the property with MLS #${selectedProperty?.mlsnum}. This action cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* CSV Import Dialog */}
        <Dialog open={isCsvDialogOpen} onOpenChange={setIsCsvDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import Properties from CSV</DialogTitle>
              <DialogDescription>
                Upload a CSV file and map the columns to database fields. The first row should contain headers.
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
                    <h3 className="text-lg font-semibold mb-2">Map CSV Headers to Database Columns</h3>
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
                                <SelectValue placeholder="Select database column" />
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
                Import {csvData.length > 0 ? `${csvData.length} ` : ''}Properties
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Properties;
