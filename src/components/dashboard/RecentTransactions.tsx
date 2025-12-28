import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Income, Expense, ExpenseSubcategory } from '@/types';
import { 
  TrendingUp, 
  RefreshCw,
  Utensils,
  Car,
  Shirt,
  Gamepad2,
  Smartphone,
  Plane,
  Zap,
  Home,
  Film,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface RecentTransactionsProps {
  incomes: Income[];
  expenses: Expense[];
}

type Transaction = (Income | Expense) & { type: 'income' | 'expense' };

const SUBCATEGORY_ICONS: Record<ExpenseSubcategory, React.ElementType> = {
  food: Utensils,
  transportation: Car,
  clothes: Shirt,
  toys: Gamepad2,
  gadgets: Smartphone,
  travel: Plane,
  utilities: Zap,
  rent: Home,
  entertainment: Film,
  other: MoreHorizontal,
};

const SUBCATEGORY_LABELS: Record<ExpenseSubcategory, string> = {
  food: 'Food',
  transportation: 'Transportation',
  clothes: 'Clothes',
  toys: 'Toys',
  gadgets: 'Gadgets',
  travel: 'Travel',
  utilities: 'Utilities',
  rent: 'Rent',
  entertainment: 'Entertainment',
  other: 'Other',
};

export function RecentTransactions({ incomes, expenses }: RecentTransactionsProps) {
  const transactions: Transaction[] = [
    ...incomes.map(i => ({ ...i, type: 'income' as const })),
    ...expenses.map(e => ({ ...e, type: 'expense' as const })),
  ].sort((a, b) => {
    const dateA = a.type === 'income' ? new Date(a.date_received) : new Date(a.created_at);
    const dateB = b.type === 'income' ? new Date(b.date_received) : new Date(b.created_at);
    return dateB.getTime() - dateA.getTime();
  }).slice(0, 8);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center mb-3">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add income or expenses to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === 'income';
              const incomeTransaction = transaction as Income;
              const expenseTransaction = transaction as Expense;
              
              const ExpenseIcon = !isIncome && expenseTransaction.subcategory 
                ? SUBCATEGORY_ICONS[expenseTransaction.subcategory] 
                : MoreHorizontal;
              
              return (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center",
                      isIncome ? "bg-accent" : "bg-foreground/5"
                    )}>
                      {isIncome ? (
                        <TrendingUp className="h-4 w-4 text-foreground" />
                      ) : (
                        <ExpenseIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{transaction.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isIncome 
                          ? incomeTransaction.source 
                          : `${expenseTransaction.subcategory ? SUBCATEGORY_LABELS[expenseTransaction.subcategory] : expenseTransaction.category} ${expenseTransaction.is_recurring ? '• Recurring' : ''}`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-semibold",
                      isIncome ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {isIncome ? '+' : '-'}₱{transaction.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        new Date(isIncome ? incomeTransaction.date_received : transaction.created_at), 
                        'MMM d'
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
