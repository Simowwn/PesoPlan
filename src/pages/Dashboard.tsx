import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBudget } from '@/contexts/BudgetContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { BudgetProgress } from '@/components/dashboard/BudgetProgress';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank,
  Plus,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { incomes, expenses, activePlan, summary } = useBudget();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const budgetCategories = [
    {
      name: 'Needs',
      budget: summary.needsBudget,
      spent: summary.needsSpent,
      percentage: activePlan?.needs_percentage || 50,
    },
    {
      name: 'Wants',
      budget: summary.wantsBudget,
      spent: summary.wantsSpent,
      percentage: activePlan?.wants_percentage || 30,
    },
    {
      name: 'Savings',
      budget: summary.savingsBudget,
      spent: 0,
      percentage: activePlan?.savings_percentage || 20,
    },
  ];

  const upcomingRecurring = expenses
    .filter(e => e.is_recurring && e.next_due_date)
    .sort((a, b) => new Date(a.next_due_date!).getTime() - new Date(b.next_due_date!).getTime())
    .slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your financial health
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/income">
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Link>
            </Button>
            <Button asChild>
              <Link to="/expenses">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Link>
            </Button>
          </div>
        </div>

        {/* No Plan Warning */}
        {!activePlan && (
          <Card className="border-border bg-accent/50">
            <CardContent className="flex items-center gap-4 p-4">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">No budget plan active</p>
                <p className="text-xs text-muted-foreground">
                  Create a budget plan to start tracking your spending
                </p>
              </div>
              <Button size="sm" asChild>
                <Link to="/plans">Create Plan</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Income"
            value={summary.totalIncome}
            icon={<Wallet className="h-5 w-5" />}
            variant="inverted"
          />
          <StatCard
            title="Needs Budget"
            value={`₱${summary.needsRemaining.toLocaleString()}`}
            subtitle={`of ₱${summary.needsBudget.toLocaleString()}`}
            icon={<TrendingDown className="h-5 w-5 text-red-500" />}
          />
          <StatCard
            title="Wants Budget"
            value={`₱${summary.wantsRemaining.toLocaleString()}`}
            subtitle={`of ₱${summary.wantsBudget.toLocaleString()}`}
            icon={<TrendingUp className="h-5 w-5 text-red-400" />}
          />
          <StatCard
            title="Savings Target"
            value={summary.savingsBudget}
            subtitle={`${activePlan?.savings_percentage || 20}% of income`}
            icon={<PiggyBank className="h-5 w-5 text-green-500" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Budget Progress */}
          <div className="lg:col-span-1">
            <BudgetProgress categories={budgetCategories} />
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <RecentTransactions incomes={incomes} expenses={expenses} />
          </div>
        </div>

        {/* Upcoming Recurring */}
        {upcomingRecurring.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Upcoming Recurring Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingRecurring.map((expense) => (
                  <div 
                    key={expense.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{expense.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {expense.recurring_interval} • {expense.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₱{expense.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        Due {new Date(expense.next_due_date!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
