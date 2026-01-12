import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, Check, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ParsedData {
  date: string;
  store_name: string;
  orders: number;
  sales: number;
}

export function ExcelUploader({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const parseExcelFile = (file: File): Promise<ParsedData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

          const parsedData: ParsedData[] = [];
          const stores = ['Dark store', 'Tagmo', 'Heliopolis', 'Maadi'];
          
          // Skip header rows (first 2 rows) and process data
          for (let i = 2; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || !row[0]) continue;
            
            const dateValue = row[0];
            let dateStr: string;
            
            // Skip non-date rows like "Total", summary rows, etc.
            if (typeof dateValue === 'string') {
              const lowerValue = dateValue.toLowerCase().trim();
              if (lowerValue === 'total' || lowerValue === 'sum' || lowerValue === 'average' || lowerValue === '') {
                continue;
              }
              // Try to validate it's a date-like string (contains numbers and separators)
              if (!/\d/.test(dateValue)) {
                continue;
              }
              dateStr = dateValue;
            } else if (typeof dateValue === 'number') {
              // Excel serial date
              const date = XLSX.SSF.parse_date_code(dateValue);
              dateStr = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            } else {
              continue;
            }

            // Parse each store's data (columns are in pairs: Orders, Sales)
            stores.forEach((store, idx) => {
              const ordersCol = 1 + (idx * 3); // Adjust based on column structure
              const salesCol = 2 + (idx * 3);
              
              const orders = Number(row[ordersCol]) || 0;
              const sales = Number(row[salesCol]) || 0;
              
              if (orders > 0 || sales > 0) {
                parsedData.push({
                  date: dateStr,
                  store_name: store,
                  orders,
                  sales,
                });
              }
            });
          }

          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const uploadData = async (parsedData: ParsedData[]) => {
    setIsUploading(true);
    
    try {
      // Delete existing data for the month being uploaded
      const firstDate = parsedData[0]?.date;
      if (firstDate) {
        const [year, month] = firstDate.split('-');
        const startDate = `${year}-${month}-01`;
        const endDate = `${year}-${month}-31`;
        
        await supabase
          .from('sales_data')
          .delete()
          .gte('date', startDate)
          .lte('date', endDate);
      }

      // Insert new data in batches
      const batchSize = 50;
      for (let i = 0; i < parsedData.length; i += batchSize) {
        const batch = parsedData.slice(i, i + batchSize);
        const { error } = await supabase
          .from('sales_data')
          .insert(batch);
        
        if (error) throw error;
      }

      toast({
        title: 'Upload Successful!',
        description: `${parsedData.length} records have been imported.`,
      });
      
      onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'There was an error uploading the data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setFileName(null);
    }
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an Excel file (.xlsx or .xls)',
        variant: 'destructive',
      });
      return;
    }

    setFileName(file.name);
    
    try {
      const parsedData = await parseExcelFile(file);
      
      if (parsedData.length === 0) {
        toast({
          title: 'No Data Found',
          description: 'The Excel file appears to be empty or in an unexpected format.',
          variant: 'destructive',
        });
        setFileName(null);
        return;
      }

      await uploadData(parsedData);
    } catch (error) {
      console.error('Parse error:', error);
      toast({
        title: 'Parse Error',
        description: 'Could not parse the Excel file. Please check the format.',
        variant: 'destructive',
      });
      setFileName(null);
    }
  }, [toast, onUploadSuccess]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Card className="border-0 shadow-card">
      <CardHeader>
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          Upload Sales Data
        </CardTitle>
        <CardDescription>
          Upload an Excel file to update the sales numbers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50',
            isUploading && 'opacity-50 pointer-events-none'
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading {fileName}...</p>
            </div>
          ) : fileName ? (
            <div className="flex flex-col items-center gap-3">
              <Check className="w-10 h-10 text-success" />
              <p className="text-sm font-medium">{fileName}</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your Excel file here, or click to browse
              </p>
              <label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Button type="button" variant="outline" className="cursor-pointer" asChild>
                  <span>Choose File</span>
                </Button>
              </label>
            </>
          )}
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Expected format: Date, Store columns with Orders and Sales. 
            Uploading will replace existing data for the same month.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
