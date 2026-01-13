import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

interface StoreData {
  name: string;
  sales: number;
  orders: number;
  target: number;
  progress: number;
}

interface StorePerformanceProps {
  stores: StoreData[];
}

export function StorePerformance({ stores }: StorePerformanceProps) {
  const navigate = useNavigate();

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display">Store Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {stores.map((store, index) => (
            <div
              key={store.name}
              className="group space-y-2 animate-slide-up cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate(`/branch/${store.name.toLowerCase().replace(/\s+/g, '-')}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    index === 0 ? 'bg-primary' :
                      index === 1 ? 'bg-success' :
                        index === 2 ? 'bg-warning' : 'bg-info'
                  )} />
                  <span className="font-medium text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                    {store.name}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-sm">{store.sales.toLocaleString()} EGP</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({store.orders} orders)
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Progress
                  value={store.progress}
                  className={cn(
                    "h-2.5 transition-all duration-1000",
                    index === 0 ? "[&>div]:bg-primary" :
                      index === 1 ? "[&>div]:bg-success" :
                        index === 2 ? "[&>div]:bg-warning" : "[&>div]:bg-info"
                  )}
                />
                <div className="flex justify-between text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  <span>{store.progress.toFixed(0)}% of target</span>
                  <span>Target: {store.target.toLocaleString()} EGP</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
