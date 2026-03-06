import React, { useState, useCallback } from 'react';
import { useMutation, useQuery, useAction } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useToast } from '../../hooks/useToast';
import { Id } from 'convex/values';

interface ProductImportJobStatus {
  _id: Id<'productImportJobs'>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalProducts: number;
  processedProducts: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ product: string; error: string }>;
  startedAt: string;
  completedAt?: string;
}

interface ImportResult {
  success: boolean;
  jobId?: string;
  message: string;
}

interface ValidatedProductRow {
  data: ProductImportData;
  errors: ValidationError[];
  isValid: boolean;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ProductImportData {
  name: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  category?: string;
  description?: string;
  images?: string[];
  supplier_email?: string;
  supplier_business_name?: string;
}

export function ProductBulkImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ProductImportData[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedProductRow[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'importing' | 'results'>('upload');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [activeJobId, setActiveJobId] = useState<Id<'productImportJobs'> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const { showToast } = useToast();
  const startBulkImport = useAction(api.adminProductImport.startBulkProductImport);
  const dbCategories = useQuery(api.categories.getAllCategories) || [];
  
  // Poll for job status when importing
  const jobStatus = useQuery(
    api.adminProductImport.getProductImportJobStatus,
    activeJobId ? { jobId: activeJobId } : 'skip'
  );

  // Validate product data
  const validateProductData = useCallback((data: ProductImportData[], rows: any[]): ValidatedProductRow[] => {
    return data.map((row, index) => {
      const errors: ValidationError[] = [];
      
      // Name validation
      if (!row.name || row.name.trim() === '') {
        errors.push({ row: index + 1, field: 'name', message: 'Product name is required' });
      }
      
      // Price validation
      if (row.price === undefined || row.price === null || isNaN(row.price)) {
        errors.push({ row: index + 1, field: 'price', message: 'Valid price is required' });
      } else if (row.price < 0) {
        errors.push({ row: index + 1, field: 'price', message: 'Price cannot be negative' });
      }
      
      // Stock validation
      if (row.stock === undefined || row.stock === null || isNaN(row.stock)) {
        errors.push({ row: index + 1, field: 'stock', message: 'Valid stock quantity is required' });
      } else if (row.stock < 0) {
        errors.push({ row: index + 1, field: 'stock', message: 'Stock cannot be negative' });
      }
      
      // Status validation
      const validStatuses = ['active', 'inactive', 'out_of_stock'];
      if (row.status && !validStatuses.includes(row.status)) {
        errors.push({ row: index + 1, field: 'status', message: `Status must be one of: ${validStatuses.join(', ')}` });
      }
      
      // Category validation - if provided, check if it exists
      if (row.category && row.category.trim() !== '') {
        const categoryExists = dbCategories.some(
          cat => cat.name.toLowerCase() === row.category?.toLowerCase()
        );
        if (!categoryExists) {
          errors.push({ row: index + 1, field: 'category', message: `Category "${row.category}" does not exist` });
        }
      }
      
      // Either supplier_email or supplier_business_name is required
      if ((!row.supplier_email || row.supplier_email.trim() === '') && 
          (!row.supplier_business_name || row.supplier_business_name.trim() === '')) {
        errors.push({ row: index + 1, field: 'supplier', message: 'Either supplier email or business name is required' });
      }

      return {
        data: row,
        errors,
        isValid: errors.length === 0
      };
    });
  }, [dbCategories]);

  // Parse CSV file
  const parseCSV = useCallback((content: string): ProductImportData[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const headers: string[] = [];
    const data: ProductImportData[] = [];
    
    let headerFound = false;
    
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || line.trim() === '') continue;
      
      const values = parseCSVLine(line);
      
      if (!headerFound && values.length > 0) {
        // This is the header row
        headers.push(...values.map(h => h.trim().toLowerCase()));
        headerFound = true;
        continue;
      }
      
      if (headerFound && values.length > 0) {
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || '';
        });
        
        // Map to ProductImportData
        const productData: ProductImportData = {
          name: row.name || row.product_name || row.title || '',
          price: parseFloat(row.price || '0'),
          stock: parseInt(row.stock || row.quantity || '0', 10),
          status: (row.status || 'active') as 'active' | 'inactive' | 'out_of_stock',
          category: row.category || row.product_category || selectedCategory || undefined,
          description: row.description || row.desc || undefined,
          images: row.images ? row.images.split(',').map(i => i.trim()).filter(i => i) : undefined,
          supplier_email: row.supplier_email || row.email || undefined,
          supplier_business_name: row.supplier_business_name || row.business_name || row.company || undefined,
        };
        
        data.push(productData);
      }
    }
    
    return data;
  }, [selectedCategory]);

  // Parse a single CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
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

  // Parse Excel file
  const parseExcel = useCallback(async (arrayBuffer: ArrayBuffer): Promise<ProductImportData[]> => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (jsonData.length < 2) {
      throw new Error('Excel file must contain at least a header row and one data row');
    }
    
    const headers = (jsonData[0] as string[]).map(h => String(h).trim().toLowerCase());
    const data: ProductImportData[] = [];
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      
      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        const value = row[index];
        rowData[header] = value !== undefined && value !== null ? String(value).trim() : '';
      });
      
      const productData: ProductImportData = {
        name: rowData.name || rowData.product_name || rowData.title || '',
        price: parseFloat(rowData.price || '0'),
        stock: parseInt(rowData.stock || rowData.quantity || '0', 10),
        status: (rowData.status || 'active') as 'active' | 'inactive' | 'out_of_stock',
        category: rowData.category || rowData.product_category || selectedCategory || undefined,
        description: rowData.description || rowData.desc || undefined,
        images: rowData.images ? rowData.images.split(',').map(i => i.trim()).filter(i => i) : undefined,
        supplier_email: rowData.supplier_email || rowData.email || undefined,
        supplier_business_name: rowData.supplier_business_name || rowData.business_name || rowData.company || undefined,
      };
      
      data.push(productData);
    }
    
    return data;
  }, [selectedCategory]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setImportResult(null);
    setCurrentStep('upload');
    
    const fileExtension = selectedFile.name.toLowerCase().split('.').pop();
    
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (arrayBuffer) {
          try {
            const data = await parseExcel(arrayBuffer);
            if (data.length === 0) {
              showToast('warning', 'No data found in the Excel file');
              return;
            }
            
            setParsedData(data);
            const validated = validateProductData(data, []);
            setValidatedRows(validated);
            setCurrentStep('preview');
            setSelectedRows(new Set(data.map((_, i) => i)));
            showToast('success', `${data.length} products detected in Excel file`);
          } catch (error: any) {
            showToast('error', `Excel parsing error: ${error.message}`);
          }
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          try {
            const data = parseCSV(content);
            setParsedData(data);
            const validated = validateProductData(data, []);
            setValidatedRows(validated);
            setCurrentStep('preview');
            setSelectedRows(new Set(data.map((_, i) => i)));
            showToast('success', `${data.length} products detected in CSV file`);
          } catch (error: any) {
            showToast('error', `CSV parsing error: ${error.message}`);
          }
        }
      };
      reader.readAsText(selectedFile);
    }
  }, [parseCSV, parseExcel, showToast, validateProductData]);

  // Effect to poll job status updates
  React.useEffect(() => {
    if (jobStatus && activeJobId) {
      const total = jobStatus.totalProducts;
      const processed = jobStatus.processedProducts;
      const success = jobStatus.successCount;
      const failed = jobStatus.errorCount;
      
      // If job is complete, show results
      if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
        const results: ImportResult = {
          success: jobStatus.status === 'completed',
          jobId: activeJobId,
          message: `${success} imported, ${failed} failed out of ${total} products`,
        };
        
        setImportResult(results);
        setCurrentStep('results');
        setActiveJobId(null);
        setIsUploading(false);
        
        if (success > 0 && failed === 0) {
          showToast('success', `${success} products imported successfully`);
        } else if (success > 0 && failed > 0) {
          showToast('warning', `${success} imported, ${failed} failed (${Math.round((failed / total) * 100)}% errors)`);
        } else if (failed > 0) {
          showToast('error', `Import failed: ${failed} products could not be imported`);
        }
      }
    }
  }, [jobStatus, activeJobId, showToast]);

  const handleImport = async () => {
    const rowsToImport = validatedRows
      .filter((_, index) => selectedRows.has(index))
      .filter(row => row.isValid)
      .map(row => ({
        ...row.data,
        category: row.data.category || selectedCategory || undefined,
      }));
    
    if (rowsToImport.length === 0) {
      showToast('error', 'No valid data selected for import');
      return;
    }

    setIsUploading(true);
    setCurrentStep('importing');

    try {
      const result = await startBulkImport({ 
        products: rowsToImport
      });
      
      if (result.success && result.jobId) {
        setActiveJobId(result.jobId);
      } else {
        throw new Error('Failed to start import job');
      }
    } catch (error: any) {
      showToast('error', `Error starting import: ${error.message}`);
      setIsUploading(false);
      setCurrentStep('preview');
    }
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
    const template = `# Product Import Template
name,price,stock,status,category,description,images,supplier_email,supplier_business_name

# Example: Basic product
Sample Product,1000.00,50,active,Electronics,A sample product description,https://example.com/image1.jpg,supplier@example.com,Sample Company

# Example: Product with multiple images
Premium Product,5000.00,25,active,Electronics,High-end product with features,"https://example.com/img1.jpg,https://example.com/img2.jpg",supplier2@example.com,Premium Supplier Ltd

# Status options: active, inactive, out_of_stock
# Images: comma-separated URLs
# Either supplier_email OR supplier_business_name is required (for product-to-supplier linking)
`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'products_import_template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Product Bulk Import</h3>
            <p className="text-sm text-gray-600 mt-1">
              Import test products associated with categories for supplier referencing.
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <i className="ri-download-line"></i>
            Download Template
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
          <div className={`flex items-center ${currentStep === 'importing' ? 'text-green-600' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'importing' ? 'bg-green-600 text-white' : 
              currentStep === 'results' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Import</span>
          </div>
          <div className="w-12 h-px bg-gray-300 mx-2"></div>
          <div className={`flex items-center ${currentStep === 'results' ? 'text-green-600' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'results' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}>
              4
            </div>
            <span className="ml-2 text-sm font-medium">Results</span>
          </div>
        </div>

        {/* Upload Step */}
        {currentStep === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="product-file-upload"
              />
              <label
                htmlFor="product-file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <i className="ri-upload-cloud-2-line text-5xl text-gray-400 mb-4"></i>
                <span className="text-lg font-medium text-gray-700 mb-2">
                  Click to upload or drag and drop
                </span>
                <span className="text-sm text-gray-500">
                  CSV or Excel files supported
                </span>
              </label>
            </div>

            {/* Default Category Selection */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Category (optional - can be overridden per product)
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select a category...</option>
                {dbCategories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">
                <i className="ri-information-line mr-1"></i>
                CSV Format Requirements
              </h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Required columns: name, price, stock</li>
                <li>Optional columns: status, category, description, images, supplier_email, supplier_business_name</li>
                <li>Price should be a number (e.g., 1000.00)</li>
                <li>Stock should be a whole number</li>
                <li>Images: comma-separated URLs</li>
                <li>Either supplier_email OR supplier_business_name required for supplier linking</li>
                <li>First row should be column headers</li>
              </ul>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {currentStep === 'preview' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">
                Preview ({validatedRows.length} products)
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={selectAllValid}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Select All Valid
                </button>
                <button
                  onClick={deselectAll}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === validatedRows.filter(r => r.isValid).length && validatedRows.filter(r => r.isValid).length > 0}
                        onChange={(e) => e.target.checked ? selectAllValid() : deselectAll()}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">Product Name</th>
                    <th className="px-4 py-3 text-left">Price</th>
                    <th className="px-4 py-3 text-left">Stock</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Supplier</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {validatedRows.map((row, index) => (
                    <tr
                      key={index}
                      className={`${!row.isValid ? 'bg-red-50' : selectedRows.has(index) ? 'bg-green-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(index)}
                          onChange={() => toggleRowSelection(index)}
                          disabled={!row.isValid}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {row.data.name}
                        {row.errors.length > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            {row.errors.map(e => e.message).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">₦{row.data.price.toLocaleString()}</td>
                      <td className="px-4 py-3">{row.data.stock}</td>
                      <td className="px-4 py-3">{row.data.category || '-'}</td>
                      <td className="px-4 py-3">{row.data.supplier_business_name || row.data.supplier_email || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          row.data.status === 'active' ? 'bg-green-100 text-green-800' :
                          row.data.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {row.data.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between">
              <button
                onClick={resetUpload}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={selectedRows.size === 0 || isUploading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Starting Import...
                  </>
                ) : (
                  <>
                    <i className="ri-upload-line mr-2"></i>
                    Import {selectedRows.size} Products
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Importing Step */}
        {currentStep === 'importing' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Importing Products...</h4>
            <p className="text-gray-600">
              {jobStatus ? (
                <>Processed {jobStatus.processedProducts} of {jobStatus.totalProducts} products</>
              ) : (
                'Preparing import...'
              )}
            </p>
            {jobStatus && (
              <div className="mt-4 max-w-md mx-auto">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${(jobStatus.processedProducts / jobStatus.totalProducts) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Step */}
        {currentStep === 'results' && importResult && (
          <div className="space-y-4">
            <div className={`p-6 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <i className={`text-3xl ${importResult.success ? 'ri-check-circle-line text-green-600' : 'ri-error-warning-line text-red-600'}`}></i>
                <h4 className={`text-lg font-semibold ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {importResult.success ? 'Import Completed' : 'Import Failed'}
                </h4>
              </div>
              <p className="text-gray-700">{importResult.message}</p>
              {jobStatus && jobStatus.errors && jobStatus.errors.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-red-800 mb-2">Errors:</h5>
                  <ul className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                    {jobStatus.errors.map((error, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <i className="ri-error-warning-line mt-0.5"></i>
                        <span>{error.product}: {error.error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={resetUpload}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Import More Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
