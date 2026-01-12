import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
}

const variantStyles = {
  default: 'bg-card',
  primary: 'gradient-primary text-primary-foreground',
  success: 'gradient-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className,
}: StatsCardProps) {
  const isPrimary = variant !== 'default';

  return (
    <Card className={cn(
      'border-0 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group',
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={cn(
              'text-sm font-medium',
              isPrimary ? 'text-current opacity-80' : 'text-muted-foreground'
            )}>
              {title}
            </p>
            <p className={cn(
              'text-3xl font-display font-bold tracking-tight',
              isPrimary ? 'text-current' : 'text-foreground'
            )}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className={cn(
                'text-sm',
                isPrimary ? 'text-current opacity-70' : 'text-muted-foreground'
              )}>
                {subtitle}
              </p>
            )}
            {trend && (
              <div className={cn(
                'inline-flex items-center gap-1 text-sm font-medium rounded-full px-2 py-0.5',
                trend.isPositive
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
              )}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          <div className={cn(
            'p-3 rounded-xl transition-colors duration-300',
            isPrimary ? 'bg-white/20 group-hover:bg-white/30' : 'bg-primary/10 group-hover:bg-primary/20'
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
