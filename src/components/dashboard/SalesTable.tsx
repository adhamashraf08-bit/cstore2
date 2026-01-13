import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

interface SalesRecord {
  id: string;
  date: string;
  store_name: string;
  orders: number;
  sales: number;
}

interface SalesTableProps {
  data: SalesRecord[];
}

export function SalesTable({ data }: SalesTableProps) {
  // Group data by date
  const groupedData = data.reduce((acc, record) => {
    const dateKey = record.date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(record);
    return acc;
  }, {} as Record<string, SalesRecord[]>);

  const sortedDates = Object.keys(groupedData).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display">Recent Sales Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Store</TableHead>
                <TableHead className="text-right font-semibold">Orders</TableHead>
                <TableHead className="text-right font-semibold">Sales (EGP)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDates.slice(0, 10).flatMap((dateKey) =>
                groupedData[dateKey].map((record, idx) => (
                  <TableRow key={record.id} className="animate-fade-in">
                    <TableCell className="font-medium">
                      {idx === 0 ? format(new Date(record.date), 'MMM d, yyyy') : ''}
                    </TableCell>
                    <TableCell>{record.store_name}</TableCell>
                    <TableCell className="text-right">{record.orders}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {record.sales.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No sales data available. Upload an Excel file to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
