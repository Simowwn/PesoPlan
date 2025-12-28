import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  variant?: 'default' | 'inverted';
}

export function StatCard({ 
  title, 
  value, 
  subtitle,
  icon, 
  trend,
  className,
  variant = 'default'
}: StatCardProps) {
  const isInverted = variant === 'inverted';

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 hover:shadow-elevated",
      isInverted && "bg-foreground text-background",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={cn(
              "text-sm font-medium",
              isInverted ? "text-background/70" : "text-muted-foreground"
            )}>
              {title}
            </p>
            <p className={cn(
              "text-3xl font-bold tracking-tight",
              isInverted ? "text-background" : "text-foreground"
            )}>
              {typeof value === 'number' ? `₱${value.toLocaleString()}` : value}
            </p>
            {subtitle && (
              <p className={cn(
                "text-sm",
                isInverted ? "text-background/60" : "text-muted-foreground"
              )}>
                {subtitle}
              </p>
            )}
            {trend && (
              <div className="flex items-center gap-1 pt-1">
                <span className={cn(
                  "text-sm font-medium",
                  trend.value >= 0 
                    ? "text-success" 
                    : "text-destructive"
                )}>
                  {trend.value >= 0 ? '+' : ''}{trend.value}%
                </span>
                <span className={cn(
                  "text-sm",
                  isInverted ? "text-background/60" : "text-muted-foreground"
                )}>
                  {trend.label}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className={cn(
              "p-3 rounded-xl",
              isInverted ? "bg-background/10" : "bg-accent"
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
