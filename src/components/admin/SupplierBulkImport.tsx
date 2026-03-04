import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import * as XLSX from 'xlsx';
import { api } from '../../../convex/_generated/api';
import { useToast } from '../../hooks/useToast';

interface ImportResult {
  success: Array<{
    success: boolean;
    userId: string;
    supplierId: string;
    message: string;
  }>;
  errors: Array<{
    supplier: string;
    email: string;
    error: string;
  }>;
  total: number;
  created: number;
  failed: number;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ValidatedRow {
  data: any;
  errors: ValidationError[];
  isValid: boolean;
}

export function SupplierBulkImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'importing' | 'results'>('upload');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  
  const { showToast } = useToast();
  const bulkImportSuppliers = useMutation(api.adminImport.bulkImportSuppliers);
  const dbCategories = useQuery(api.categories.getAllCategories) || [];

  // Validate data - category comes from user selection, not file
  const validateData = useCallback((data: any[]): ValidatedRow[] => {
    return data.map((row, index) => {
      const errors: ValidationError[] = [];
      
      // Contact validation: at least one contact method required (email OR phone)
      const hasEmail = row.user_email && row.user_email.trim() !== '';
      const hasPhone = row.user_phone && row.user_phone.trim() !== '';
      
      if (!hasEmail && !hasPhone) {
        errors.push({ row: index + 1, field: 'contact', message: 'Au moins un contact requis (email ou téléphone)' });
      } else if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.user_email)) {
        errors.push({ row: index + 1, field: 'user_email', message: "Format d'email invalide" });
      }
      
      if (!row.supplier_business_name || row.supplier_business_name.trim() === '') {
        errors.push({ row: index + 1, field: 'supplier_business_name', message: 'Nom de l\'entreprise requis' });
      }
      
      // Category is now selected by user, not from file
      // We validate it separately before import
      
      if (!row.supplier_city || row.supplier_city.trim() === '') {
        errors.push({ row: index + 1, field: 'supplier_city', message: 'Ville requise' });
      }
      
      if (!row.supplier_state || row.supplier_state.trim() === '') {
        errors.push({ row: index + 1, field: 'supplier_state', message: 'État requis' });
      }
      
      // Optional validation for URLs
      if (row.supplier_website && row.supplier_website.trim() !== '') {
        try {
          new URL(row.supplier_website);
        } catch {
          errors.push({ row: index + 1, field: 'supplier_website', message: 'URL invalide' });
        }
      }
      
      // Phone validation (basic)
      if (row.user_phone && row.user_phone.trim() !== '') {
        const phoneRegex = /^[\d\s\+\-\(\)]{10,20}$/;
        if (!phoneRegex.test(row.user_phone.replace(/\s/g, ''))) {
          errors.push({ row: index + 1, field: 'user_phone', message: 'Format de téléphone suspect' });
        }
      }
      
      return {
        data: row,
        errors,
        isValid: errors.length === 0
      };
    });
  }, []);

  // Column mapping configuration
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [showMappingModal, setShowMappingModal] = useState(false);

  // Standard field names we need
  const standardFields = [
    { key: 'email', label: 'Email utilisateur', required: false },
    { key: 'firstName', label: 'Prénom', required: false },
    { key: 'lastName', label: 'Nom', required: false },
    { key: 'phone', label: 'Téléphone', required: false },
    { key: 'business_name', label: "Nom de l'entreprise", required: true },
    { key: 'category', label: 'Catégorie (optionnel)', required: false },
    { key: 'city', label: 'Ville', required: true },
    { key: 'state', label: 'État/Région', required: true },
    { key: 'address', label: 'Adresse', required: false },
    { key: 'country', label: 'Pays', required: false },
    { key: 'website', label: 'Site web', required: false },
    { key: 'description', label: 'Description', required: false },
    { key: 'latitude', label: 'Latitude', required: false },
    { key: 'longitude', label: 'Longitude', required: false },
  ];

  // Common column name variations for auto-mapping
  const columnVariations: Record<string, string[]> = {
    email: ['email', 'user_email', 'e-mail', 'mail', 'email address', 'adresse email', 'courriel', 'useremail'],
    firstName: ['firstname', 'first_name', 'first name', 'prénom', 'prenom', 'given name', 'user_firstname', 'userfirstName'],
    lastName: ['lastname', 'last_name', 'last name', 'nom', 'family name', 'surname', 'user_lastname', 'userlastName'],
    phone: ['phone', 'telephone', 'tel', 'mobile', 'cell', 'téléphone', 'portable', 'user_phone', 'userphone', 'contact', 'company_phone'],
    business_name: ['business_name', 'business name', 'company', 'company name', 'entreprise', 'nom entreprise', 'nom de l\'entreprise', 'supplier_business_name', 'hotel', 'name', 'nom', 'businessname', 'company_name', 'owner_title'],
    category: ['category', 'type', 'categorie', 'catégorie', 'supplier_category', 'secteur', 'industry', 'business type'],
    city: ['city', 'town', 'ville', 'localité', 'supplier_city'],
    state: ['state', 'region', 'province', 'état', 'etat', 'supplier_state', 'departement', 'département'],
    address: ['address', 'adresse', 'street', 'rue', 'supplier_address', 'full address'],
    country: ['country', 'pays', 'nation', 'supplier_country'],
    website: ['website', 'site', 'url', 'site web', 'siteweb', 'web', 'supplier_website', 'domain', 'company_linkedin', 'company_facebook', 'company_instagram', 'company_x', 'company_youtube'],
    description: ['description', 'desc', 'about', 'à propos', 'a propos', 'supplier_description', 'notes', 'commentaires', 'range', 'prices'],
    latitude: ['latitude', 'lat', 'supplier_latitude', 'gps_lat', 'location_lat', 'y'],
    longitude: ['longitude', 'lng', 'long', 'supplier_longitude', 'gps_lng', 'location_lng', 'x'],
  };

  // Auto-detect column mapping based on header names
  const autoDetectMapping = useCallback((headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};
    const usedHeaders = new Set<string>();
    
    // Priority order for fields that might conflict (most important first)
    const priorityOrder = ['business_name', 'category', 'city', 'state', 'email', 'phone', 'address', 'country', 'website', 'description', 'latitude', 'longitude'];
    
    // First pass: exact matches only
    headers.forEach((header) => {
      const normalizedHeader = header.toLowerCase().trim();
      
      for (const fieldKey of priorityOrder) {
        if (mapping[fieldKey]) continue; // Already mapped
        
        const variations = columnVariations[fieldKey];
        const normalizedVariations = variations.map(v => v.toLowerCase().trim());
        
        // Exact match first
        if (normalizedVariations.includes(normalizedHeader)) {
          mapping[fieldKey] = header;
          usedHeaders.add(header);
          break;
        }
      }
    });
    
    // Second pass: contains match (but be more restrictive)
    headers.forEach((header) => {
      if (usedHeaders.has(header)) return; // Skip already used
      
      const normalizedHeader = header.toLowerCase().trim().replace(/[_-]/g, ' ').replace(/\s+/g, ' ');
      
      // Skip URL/link columns for non-website fields
      const isUrlColumn = normalizedHeader.includes('url') || 
                          normalizedHeader.includes('link') || 
                          normalizedHeader.includes('http');
      
      for (const fieldKey of priorityOrder) {
        if (mapping[fieldKey]) continue;
        
        const variations = columnVariations[fieldKey];
        
        for (const variation of variations) {
          const normalizedVariation = variation.toLowerCase().trim();
          
          // For city/address, avoid URL columns
          if ((fieldKey === 'city' || fieldKey === 'address') && isUrlColumn) {
            continue;
          }
          
          // Check if header contains the variation (word boundary)
          if (normalizedHeader === normalizedVariation || 
              normalizedHeader.startsWith(normalizedVariation + ' ') ||
              normalizedHeader.endsWith(' ' + normalizedVariation) ||
              normalizedHeader.includes(' ' + normalizedVariation + ' ')) {
            mapping[fieldKey] = header;
            usedHeaders.add(header);
            break;
          }
        }
        if (mapping[fieldKey]) break;
      }
    });
    
    // Third pass: remaining fields
    headers.forEach((header) => {
      if (usedHeaders.has(header)) return;
      
      const normalizedHeader = header.toLowerCase().trim().replace(/[_-]/g, ' ').replace(/\s+/g, ' ');
      
      for (const [fieldKey, variations] of Object.entries(columnVariations)) {
        if (mapping[fieldKey]) continue;
        
        const normalizedVariations = variations.map(v => v.toLowerCase().trim());
        
        if (normalizedVariations.includes(normalizedHeader) || 
            normalizedVariations.some(v => normalizedHeader.includes(v))) {
          mapping[fieldKey] = header;
          usedHeaders.add(header);
          break;
        }
      }
    });
    
    return mapping;
  }, []);

  // Extract data using the column mapping
  const extractRowData = (row: any[], headers: string[], mapping: Record<string, string>): Record<string, any> => {
    const rowData: Record<string, any> = {};
    
    standardFields.forEach(field => {
      const mappedColumn = mapping[field.key];
      if (mappedColumn) {
        const columnIndex = headers.indexOf(mappedColumn);
        if (columnIndex !== -1) {
          const value = row[columnIndex];
          rowData[field.key] = value !== undefined && value !== '' ? String(value).trim() : undefined;
        }
      }
    });
    
    return rowData;
  };
  // Parse Excel file with flexible column detection
  const parseExcel = useCallback((arrayBuffer: ArrayBuffer): { data: any[]; headers: string[]; mapping: Record<string, string> } => {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (jsonData.length < 2) {
      throw new Error('Le fichier Excel doit contenir au moins une ligne d\'en-tête et une ligne de données');
    }
    
    const headers = jsonData[0] as string[];
    const data: any[] = [];
    
    // Auto-detect column mapping
    const mapping = autoDetectMapping(headers);
    console.log('Detected columns:', headers);
    console.log('Auto-mapping:', mapping);
    
    // Start from index 1 to skip header
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      
      // Extract data using mapping
      const rowData = extractRowData(row, headers, mapping);
      
      // Also try to get any additional supplier_ prefixed fields
      headers.forEach((header, index) => {
        if (header.startsWith('supplier_') || header.startsWith('user_')) {
          const value = row[index];
          if (value !== undefined && value !== '') {
            const fieldName = header.replace('supplier_', '').replace('user_', '');
            if (!rowData[fieldName]) {
              rowData[fieldName] = String(value).trim();
            }
          }
        }
      });
      
      // Extract additional fields specific to Google Business Profile export
      const getValue = (headerName: string): string | undefined => {
        const idx = headers.indexOf(headerName);
        if (idx !== -1 && row[idx] !== undefined && row[idx] !== '') {
          return String(row[idx]).trim();
        }
        return undefined;
      };
      
      // DIRECT EXTRACTION: Get critical fields directly by column name
      // This ensures we get the right data regardless of mapping
      const name = getValue('name');
      const city = getValue('city');
      const state = getValue('state');
      const address = getValue('address');
      const phone = getValue('phone');
      const website = getValue('website');
      const country = getValue('country');
      
      // Override mapped values with direct extractions if available
      if (name) rowData.business_name = name;
      if (city) rowData.city = city;
      if (state) rowData.state = state;
      if (address) rowData.address = address;
      if (phone) rowData.phone = phone;
      if (website) rowData.website = website;
      if (country) rowData.country = country;
      
      // Get rating and reviews
      const rating = getValue('rating');
      const reviews = getValue('reviews');
      const verified = getValue('verified');
      const photo = getValue('photo');
      const latitude = getValue('latitude');
      const longitude = getValue('longitude');
      const ownerTitle = getValue('owner_title');
      const placeId = getValue('place_id');
      
      // Parse about/description from JSON if present
      let description = rowData.description;
      const about = getValue('about');
      if (about && about.startsWith('{')) {
        try {
          const aboutData = JSON.parse(about);
          // Extract meaningful info from about field
          const features: string[] = [];
          if (aboutData.Other) {
            Object.entries(aboutData.Other).forEach(([key, val]) => {
              if (val === true) features.push(key);
              else if (typeof val === 'string' && val !== 'null') features.push(`${key}: ${val}`);
            });
          }
          if (aboutData.Amenities) {
            Object.entries(aboutData.Amenities).forEach(([key, val]) => {
              if (val === true) features.push(key);
            });
          }
          if (features.length > 0) {
            description = description ? `${description}. ${features.join(', ')}` : features.join(', ');
          }
        } catch {
          // If JSON parsing fails, use raw value
          description = description || about;
        }
      }
      
      // Build social links from company fields
      const socialLinks: Record<string, string> = {};
      const linkedin = getValue('company_linkedin');
      const facebook = getValue('company_facebook');
      const instagram = getValue('company_instagram');
      const twitter = getValue('company_x');
      const youtube = getValue('company_youtube');
      
      if (linkedin) socialLinks.linkedin = linkedin;
      if (facebook) socialLinks.facebook = facebook;
      if (instagram) socialLinks.instagram = instagram;
      if (twitter) socialLinks.twitter = twitter;
      if (youtube) socialLinks.youtube = youtube;
      
      // Determine user name from owner or business name
      let firstName = rowData.firstName;
      let lastName = rowData.lastName;
      if (!firstName && ownerTitle) {
        const nameParts = ownerTitle.split(' ');
        firstName = nameParts[0] || 'Manager';
        lastName = nameParts.slice(1).join(' ') || 'Hotel';
      }
      if (!firstName) {
        firstName = 'Manager';
        lastName = 'Hotel';
      }
      
      // Build final supplier object
      data.push({
        user_email: rowData.email,
        user_firstName: firstName,
        user_lastName: lastName,
        user_phone: rowData.phone,
        supplier_business_name: rowData.business_name,
        supplier_email: rowData.email,
        supplier_phone: rowData.phone,
        supplier_category: rowData.category || '',
        supplier_description: description,
        supplier_address: rowData.address,
        supplier_city: rowData.city,
        supplier_state: rowData.state,
        supplier_country: rowData.country || 'Nigeria',
        supplier_website: rowData.website,
        supplier_image: photo,
        supplier_latitude: latitude ? parseFloat(latitude) : undefined,
        supplier_longitude: longitude ? parseFloat(longitude) : undefined,
        supplier_verified: verified?.toLowerCase() === 'true' || false,
        supplier_approved: true,
        supplier_featured: false,
        supplier_rating: rating ? parseFloat(rating) : undefined,
        supplier_reviews: reviews ? parseInt(reviews, 10) : undefined,
        supplier_social_links: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      });
    }
    
    return { data, headers, mapping };
  }, [autoDetectMapping]);
  const parseCSV = useCallback((content: string): any[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const headers: string[] = [];
    const data: any[] = [];
    
    let headerFound = false;
    
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || line.trim() === '') continue;
      
      const values = parseCSVLine(line);
      
      if (!headerFound && values.length > 0 && values[0].includes('_')) {
        // This is the header row
        headers.push(...values);
        headerFound = true;
        continue;
      }
      
      if (headerFound && values.length > 0) {
        const row: Record<string, any> = {};
        headers.forEach((header, index) => {
          let value = values[index]?.trim() || '';
          
          // Convert specific fields
          if (header.startsWith('supplier_')) {
            const fieldName = header.replace('supplier_', '');
            
            // Boolean fields
            if (['verified', 'approved', 'featured'].includes(fieldName)) {
              row[fieldName] = value.toLowerCase() === 'true';
            }
            // Number fields
            else if (['latitude', 'longitude'].includes(fieldName)) {
              row[fieldName] = value ? parseFloat(value) : undefined;
            }
            // Array fields (imageGallery)
            else if (fieldName === 'imageGallery' && value) {
              try {
                row[fieldName] = JSON.parse(value);
              } catch {
                row[fieldName] = value ? [value] : undefined;
              }
            }
            // JSON fields (business_hours, social_links)
            else if (['business_hours', 'social_links'].includes(fieldName) && value) {
              try {
                row[fieldName] = JSON.parse(value);
              } catch {
                row[fieldName] = undefined;
              }
            }
            // String fields
            else {
              row[fieldName] = value || undefined;
            }
          } else if (header.startsWith('user_')) {
            const fieldName = header.replace('user_', '');
            row[fieldName] = value || undefined;
          }
        });
        
        // Build final supplier object with proper structure
        if (row.email && row.business_name) {
          data.push({
            user_email: row.email,
            user_firstName: row.firstName,
            user_lastName: row.lastName,
            user_phone: row.phone,
            supplier_business_name: row.business_name,
            supplier_email: row.email,
            supplier_phone: row.supplier_phone,
            supplier_category: row.category,
            supplier_description: row.description,
            supplier_address: row.address,
            supplier_city: row.city,
            supplier_state: row.state,
            supplier_country: row.country,
            supplier_website: row.website,
            supplier_business_type: row.business_type,
            supplier_verified: row.verified ?? false,
            supplier_approved: row.approved ?? true,
            supplier_featured: row.featured ?? false,
            supplier_image: row.image,
            supplier_imageGallery: row.imageGallery,
            supplier_business_hours: row.business_hours,
            supplier_social_links: row.social_links,
            supplier_latitude: row.latitude,
            supplier_longitude: row.longitude,
          });
        }
      }
    }
    
    return data;
  }, []);

  // Parse a single CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setImportResult(null);
    setCurrentStep('upload');
    
    const fileExtension = selectedFile.name.toLowerCase().split('.').pop();
    
    // Read and parse file based on type
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Excel file
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (arrayBuffer) {
          try {
            const { data, headers, mapping } = parseExcel(arrayBuffer);
            console.log('Parsed data:', data);
            console.log('Headers:', headers);
            console.log('Mapping:', mapping);
            
            if (data.length === 0) {
              showToast('warning', 'Aucune donnée trouvée. Vérifiez le mapping des colonnes.');
              setDetectedColumns(headers);
              setColumnMapping(mapping);
              setShowMappingModal(true);
              return;
            }
            
            setParsedData(data);
            setDetectedColumns(headers);
            setColumnMapping(mapping);
            const validated = validateData(data);
            setValidatedRows(validated);
            setCurrentStep('preview');
            setSelectedRows(new Set(data.map((_, i) => i)));
            showToast('success', `${data.length} fournisseurs détectés dans le fichier Excel`);
          } catch (error: any) {
            showToast('error', `Erreur de parsing Excel: ${error.message}`);
          }
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      // CSV file
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          try {
            const data = parseCSV(content);
            setParsedData(data);
            const validated = validateData(data);
            setValidatedRows(validated);
            setCurrentStep('preview');
            setSelectedRows(new Set(data.map((_, i) => i)));
            showToast('success', `${data.length} fournisseurs détectés dans le fichier CSV`);
          } catch (error: any) {
            showToast('error', `Erreur de parsing CSV: ${error.message}`);
          }
        }
      };
      reader.readAsText(selectedFile);
    }
  }, [parseCSV, parseExcel, showToast]);

  const handleImport = async () => {
    // Validate that a category is selected
    if (!selectedCategory) {
      showToast('error', 'Veuillez sélectionner une catégorie pour les fournisseurs à importer');
      return;
    }
    
    const rowsToImport = validatedRows
      .filter((_, index) => selectedRows.has(index))
      .filter(row => row.isValid)
      .map(row => ({
        ...row.data,
        supplier_category: selectedCategory // Use the user-selected category
      }));
    
    if (rowsToImport.length === 0) {
      showToast('error', 'Aucune donnée valide sélectionnée pour l\'import');
      return;
    }

    setIsUploading(true);
    setCurrentStep('importing');
    setImportProgress({ current: 0, total: rowsToImport.length, success: 0, failed: 0 });

    const results: ImportResult = {
      success: [],
      errors: [],
      total: rowsToImport.length,
      created: 0,
      failed: 0,
    };

    // Track partial progress within current batch
    let processedCount = 0;
    let successCount = 0;
    let failCount = 0;

    // Process in batches of 25 (half of backend limit for safety margin)
    const batchSize = 25;
    const totalBatches = Math.ceil(rowsToImport.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const i = batchIndex * batchSize;
      const batch = rowsToImport.slice(i, i + batchSize);
      
      try {
        const batchResult = await bulkImportSuppliers({ 
          suppliers: batch,
          skipNotifications: true  // Skip notifications for bulk imports to save bandwidth
        });
        
        // Handle partial results - some may succeed, some may fail
        results.success.push(...batchResult.success);
        results.errors.push(...batchResult.errors);
        results.created += batchResult.created;
        results.failed += batchResult.failed;
        
        successCount += batchResult.created;
        failCount += batchResult.failed;
        processedCount += batch.length;
        
        // Update progress with detailed counts
        setImportProgress({ 
          current: processedCount, 
          total: rowsToImport.length,
          success: successCount,
          failed: failCount,
          batch: batchIndex + 1,
          totalBatches: totalBatches
        });
        
      } catch (error: any) {
        // Network/server error - entire batch failed
        const batchErrors = batch.map((row: any) => ({
          supplier: row.supplier_business_name,
          email: row.user_email,
          error: error.message || 'Erreur réseau lors de l\'import',
        }));
        
        results.errors.push(...batchErrors);
        results.failed += batch.length;
        failCount += batch.length;
        processedCount += batch.length;
        
        setImportProgress({ 
          current: processedCount, 
          total: rowsToImport.length,
          success: successCount,
          failed: failCount,
          batch: batchIndex + 1,
          totalBatches: totalBatches
        });
        
        // Continue with next batch despite error (don't stop entire import)
        console.error(`Batch ${batchIndex + 1}/${totalBatches} failed:`, error);
      }
    }

    setImportResult(results);
    setCurrentStep('results');
    setImportProgress(null);
    
    // Summary toast with detailed counts
    if (results.created > 0 && results.failed === 0) {
      showToast('success', `${results.created} fournisseurs importés avec succès`);
    } else if (results.created > 0 && results.failed > 0) {
      showToast('warning', `${results.created} importés, ${results.failed} échecs (${Math.round((results.failed / results.total) * 100)}% erreurs)`);
    } else if (results.failed > 0) {
      showToast('error', `Échec total: ${results.failed} fournisseurs n'ont pas pu être importés`);
    }
    
    setIsUploading(false);
  };

  const toggleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const selectAllValid = () => {
    const validIndices = validatedRows
      .map((row, index) => row.isValid ? index : -1)
      .filter(i => i !== -1);
    setSelectedRows(new Set(validIndices));
  };

  const deselectAll = () => {
    setSelectedRows(new Set());
  };

  const resetUpload = () => {
    setFile(null);
    setParsedData([]);
    setValidatedRows([]);
    setImportResult(null);
    setCurrentStep('upload');
    setSelectedRows(new Set());
    setSelectedCategory('');
  };

  const downloadTemplate = () => {
    const template = `# Template d'Import Bulk - Suppliers & Users
user_email,user_firstName,user_lastName,user_phone,supplier_business_name,supplier_email,supplier_phone,supplier_category,supplier_description,supplier_address,supplier_city,supplier_state,supplier_country,supplier_website,supplier_business_type,supplier_verified,supplier_approved,supplier_featured,supplier_image,supplier_imageGallery,supplier_business_hours,supplier_social_links,supplier_latitude,supplier_longitude

# Exemple: Fournisseur minimal
john@example.com,John,Doe,+2348012345678,ABC Business Ltd,contact@abcbusiness.com,+2348099988877,Electronics,Une description,123 Main St,Lagos,Lagos,Nigeria,,products,false,true,false,,,,,,,

# Exemple: Fournisseur complet avec options
jane@example.com,Jane,Smith,+2348098765432,XYZ Services,info@xyzservices.com,+2348011122233,Services,Services professionnels,456 Business Ave,Abuja,FCT,Nigeria,https://xyzservices.com,services,true,true,true,https://example.com/logo.jpg,"[""https://example.com/img1.jpg"",""https://example.com/img2.jpg""]","{""monday"":""08:00-18:00"",""tuesday"":""08:00-18:00"",""wednesday"":""08:00-18:00"",""thursday"":""08:00-18:00"",""friday"":""08:00-18:00"",""saturday"":""09:00-17:00"",""sunday"":""closed""}","{""facebook"":""https://fb.com/xyz"",""instagram"":""https://ig.com/xyz""}",9.0765,7.3986
`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'suppliers_import_template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Import Bulk des Fournisseurs</h3>
            <p className="text-sm text-gray-600 mt-1">
              Importez plusieurs fournisseurs avec leurs utilisateurs associés depuis un fichier CSV.
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <i className="ri-download-line"></i>
            Télécharger le template
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center mb-6">
          <div className={`flex items-center ${currentStep === 'upload' ? 'text-green-600' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'upload' ? 'bg-green-600 text-white' : 
              currentStep === 'preview' || currentStep === 'importing' || currentStep === 'results' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Upload</span>
          </div>
          <div className="w-12 h-px bg-gray-300 mx-2"></div>
          <div className={`flex items-center ${currentStep === 'preview' ? 'text-green-600' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'preview' ? 'bg-green-600 text-white' : 
              currentStep === 'importing' || currentStep === 'results' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Preview</span>
          </div>
          <div className="w-12 h-px bg-gray-300 mx-2"></div>
          <div className={`flex items-center ${currentStep === 'results' ? 'text-green-600' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'results' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Résultats</span>
          </div>
        </div>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <i className="ri-upload-cloud-line text-4xl text-gray-400 mb-3"></i>
            <span className="text-sm font-medium text-gray-700">
              {file ? file.name : 'Cliquez pour sélectionner un fichier (CSV ou Excel)'}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Formats acceptés: CSV, XLSX, XLS
            </span>
          </label>
        </div>

        {/* Category Selector - Required before import */}
        {currentStep === 'preview' && dbCategories.length > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <label className="block text-sm font-medium text-yellow-800 mb-2">
              <i className="ri-folder-line mr-2"></i>
              Sélectionnez la catégorie pour tous les fournisseurs à importer *
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
              required
            >
              <option value="">-- Choisir une catégorie --</option>
              {dbCategories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-yellow-600 mt-2">
              * Obligatoire. Tous les fournisseurs importés seront assignés à cette catégorie.
            </p>
          </div>
        )}

        {/* Import Progress */}
        {currentStep === 'importing' && importProgress && (
          <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <i className="ri-loader-4-line animate-spin text-blue-600 text-xl"></i>
                <div>
                  <h4 className="font-medium text-blue-800">Importation en cours...</h4>
                  <p className="text-sm text-blue-600">
                    Batch {importProgress.batch} / {importProgress.totalBatches} • {importProgress.current} / {importProgress.total} traités
                  </p>
                </div>
              </div>
              <span className="text-lg font-semibold text-blue-700">
                {Math.round((importProgress.current / importProgress.total) * 100)}%
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden mb-3">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              ></div>
            </div>
            
            {/* Success/Failed counts */}
            <div className="flex gap-4 text-sm">
              <span className="inline-flex items-center gap-1 text-green-700">
                <i className="ri-check-line"></i>
                {importProgress.success || 0} succès
              </span>
              {importProgress.failed > 0 && (
                <span className="inline-flex items-center gap-1 text-red-600">
                  <i className="ri-error-warning-line"></i>
                  {importProgress.failed} échecs
                </span>
              )}
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && validatedRows.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Preview - {validatedRows.length} fournisseurs détectés
                  </h3>
                  <p className="text-sm text-gray-600">
                    {validatedRows.filter(r => r.isValid).length} valides, {validatedRows.filter(r => !r.isValid).length} avec erreurs
                  </p>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-auto p-4">
                {/* Summary Actions */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={selectAllValid}
                    className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-200 rounded"
                  >
                    Sélectionner tous les valides
                  </button>
                  <button
                    onClick={deselectAll}
                    className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 border border-gray-200 rounded"
                  >
                    Tout désélectionner
                  </button>
                </div>

                {/* Validation Alert */}
                {validatedRows.some(r => !r.isValid) && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <i className="ri-alert-line text-yellow-600 mt-0.5"></i>
                      <div>
                        <p className="font-medium text-yellow-800">Validation requise</p>
                        <p className="text-sm text-yellow-700">
                          Certaines lignes contiennent des erreurs. Vous pouvez corriger le fichier et le recharger, ou importer uniquement les lignes valides.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Table */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 w-10">
                          <input
                            type="checkbox"
                            checked={selectedRows.size === validatedRows.length && validatedRows.length > 0}
                            onChange={(e) => e.target.checked ? setSelectedRows(new Set(validatedRows.map((_, i) => i))) : deselectAll()}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Statut</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Email</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Entreprise</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Catégorie</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Ville</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">État</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">GPS (Lat, Long)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validatedRows.map((row, index) => (
                        <tr 
                          key={index} 
                          className={`border-t ${!row.isValid ? 'bg-red-50' : ''} ${selectedRows.has(index) ? 'bg-green-50' : ''}`}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(index)}
                              onChange={() => toggleRowSelection(index)}
                              disabled={!row.isValid}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-3 py-2">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-green-600">
                                <i className="ri-check-line"></i>
                                <span className="text-xs">Valide</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600" title={row.errors.map(e => `${e.field}: ${e.message}`).join('\n')}>
                                <i className="ri-error-warning-line"></i>
                                <span className="text-xs">{row.errors.length} erreur(s)</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">{row.data.user_email}</td>
                          <td className="px-3 py-2">{row.data.supplier_business_name}</td>
                          <td className="px-3 py-2">{row.data.supplier_category}</td>
                          <td className="px-3 py-2">{row.data.supplier_city}</td>
                          <td className="px-3 py-2">{row.data.supplier_state}</td>
                          <td className="px-3 py-2">
                            {row.data.supplier_latitude && row.data.supplier_longitude ? (
                              <span className="text-green-600 text-xs">
                                {row.data.supplier_latitude.toFixed(6)}, {row.data.supplier_longitude.toFixed(6)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs italic">Non disponible</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Error Details for invalid rows */}
                {validatedRows.some(r => !r.isValid) && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h5 className="font-medium text-red-800 mb-2">Détails des erreurs</h5>
                    <div className="max-h-40 overflow-y-auto">
                      {validatedRows
                        .filter(r => !r.isValid)
                        .map((row, idx) => (
                          <div key={idx} className="text-sm text-red-700 mb-1">
                            <span className="font-medium">Ligne {row.errors[0]?.row}:</span>{' '}
                            {row.errors.map(e => `${e.field}: ${e.message}`).join(', ')}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t flex gap-3">
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    resetUpload();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <i className="ri-arrow-left-line mr-2"></i>
                  Changer de fichier
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleImport();
                  }}
                  disabled={isUploading || selectedRows.size === 0}
                  className="flex-[2] bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <i className="ri-upload-line"></i>
                      Importer {selectedRows.size} fournisseur(s)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Old Preview Section - Remove inline preview */}
        {currentStep === 'preview' && validatedRows.length > 0 && !showPreviewModal && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-800">
                  {validatedRows.length} fournisseurs prêts à importer
                </h4>
                <p className="text-sm text-green-600">
                  {validatedRows.filter(r => r.isValid).length} valides, {validatedRows.filter(r => !r.isValid).length} avec erreurs
                </p>
              </div>
              <button
                onClick={() => setShowPreviewModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <i className="ri-eye-line"></i>
                Voir le preview
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {currentStep === 'results' && importResult && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <i className="ri-check-line text-green-600 text-xl"></i>
                  <div>
                    <p className="font-medium text-green-800">{importResult.created} créés</p>
                    <p className="text-sm text-green-600">Fournisseurs importés avec succès</p>
                  </div>
                </div>
              </div>
              {importResult.failed > 0 && (
                <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <i className="ri-error-warning-line text-red-600 text-xl"></i>
                    <div>
                      <p className="font-medium text-red-800">{importResult.failed} erreurs</p>
                      <p className="text-sm text-red-600">Échecs lors de l&apos;import</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Details */}
            {importResult.errors.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-red-50 px-4 py-2 border-b">
                  <h5 className="font-medium text-red-800">Détails des erreurs</h5>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Entreprise</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Email</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Erreur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.errors.map((error, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{error.supplier}</td>
                          <td className="px-3 py-2">{error.email}</td>
                          <td className="px-3 py-2 text-red-600">{error.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Success Details */}
            {importResult.success.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-green-50 px-4 py-2 border-b">
                  <h5 className="font-medium text-green-800">Fournisseurs créés</h5>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Entreprise</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.success.map((success, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{success.message}</td>
                          <td className="px-3 py-2 text-green-600">
                            <i className="ri-check-line"></i> OK
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button
              onClick={resetUpload}
              className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Importer un autre fichier
            </button>
          </div>
        )}
      </div>

      {/* Documentation Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-medium text-blue-900 mb-2">Format du fichier</h4>
        <p className="text-sm text-blue-700 mb-4">
          Le fichier doit contenir les colonnes suivantes (fichier Excel ou CSV):
        </p>
        <div className="text-sm text-blue-600 space-y-1">
          <p><strong>Champs obligatoires:</strong> user_email, supplier_business_name, supplier_email, supplier_category, supplier_city, supplier_state</p>
          <p><strong>Champs optionnels:</strong> firstName, lastName, phone, description, address, country, website, etc.</p>
          <p><strong>Booléens:</strong> Utilisez &quot;true&quot; ou &quot;false&quot; pour verified, approved, featured</p>
          <p><strong>JSON:</strong> business_hours et social_links doivent être au format JSON valide</p>
        </div>
        <a 
          href="/scripts/suppliers_import_template.csv" 
          download
          className="inline-flex items-center gap-1 mt-4 text-sm text-blue-600 hover:text-blue-800"
        >
          <i className="ri-file-download-line"></i>
          Voir le fichier template complet
        </a>
      </div>
    </div>
  );
}
