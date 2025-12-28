import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface BudgetCategory {
  name: string;
  budget: number;
  spent: number;
  percentage: number;
}

interface BudgetProgressProps {
  categories: BudgetCategory[];
}

export function BudgetProgress({ categories }: BudgetProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Budget Allocation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map((category) => {
          const usedPercentage = category.budget > 0 
            ? Math.min((category.spent / category.budget) * 100, 100) 
            : 0;
          const isOverBudget = category.spent > category.budget;
          
          return (
            <div key={category.name} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {category.percentage}% of income
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-semibold",
                    isOverBudget ? "text-destructive" : "text-success"
                  )}>
                    ₱{category.spent.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of ₱{category.budget.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="relative">
                <Progress 
                  value={usedPercentage} 
                  className={cn(
                    "h-2",
                    isOverBudget 
                      ? "[&>div]:bg-destructive" 
                      : "[&>div]:bg-success"
                  )}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={cn(
                  isOverBudget ? "text-destructive" : "text-muted-foreground"
                )}>
                  {usedPercentage.toFixed(0)}% used
                </span>
                <span className={cn(
                  isOverBudget ? "text-destructive" : "text-success"
                )}>
                  {isOverBudget 
                    ? `₱${(category.spent - category.budget).toLocaleString()} over`
                    : `₱${(category.budget - category.spent).toLocaleString()} left`
                  }
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
