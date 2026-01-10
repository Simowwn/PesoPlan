import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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
        <CardTitle className="text-base font-semibold">
          Budget Allocation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map((category) => {
          // Round values to avoid floating-point errors
          const roundedBudget = Math.round(category.budget * 100) / 100;
          const roundedSpent = Math.round(category.spent * 100) / 100;

          // Calculate percentage used - ensure we handle division by zero
          const usedPercentage =
            roundedBudget > 0
              ? Math.min(Math.round((roundedSpent / roundedBudget) * 100), 100)
              : 0;

          const isOverBudget = roundedSpent > roundedBudget;

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
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isOverBudget && "text-foreground"
                    )}
                  >
                    ₱
                    {roundedSpent.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of ₱
                    {roundedBudget.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <div className="relative">
                <Progress
                  value={usedPercentage}
                  className={cn("h-2", isOverBudget && "[&>div]:bg-foreground")}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{Math.round(usedPercentage)}% used</span>
                <span>
                  {isOverBudget
                    ? `₱${(
                        Math.round((roundedSpent - roundedBudget) * 100) / 100
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} over`
                    : `₱${(
                        Math.round((roundedBudget - roundedSpent) * 100) / 100
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} left`}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
