import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBudget } from '@/contexts/BudgetContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  TrendingDown,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Expenses() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { expenses, deleteExpense, summary } = useBudget();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'needs' | 'wants'>('all');

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

  const filteredExpenses = expenses.filter(e => 
    filter === 'all' ? true : e.category === filter
  );

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleDelete = (id: string) => {
    deleteExpense(id);
    toast.success('Expense deleted');
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
            <p className="text-muted-foreground">
              Track and manage your spending
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold mt-1">₱{totalExpenses.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Needs Spent</p>
              <p className="text-2xl font-bold mt-1">₱{summary.needsSpent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Budget: ₱{summary.needsBudget.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Wants Spent</p>
              <p className="text-2xl font-bold mt-1">₱{summary.wantsSpent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Budget: ₱{summary.wantsBudget.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'needs', 'wants'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
              {f !== 'all' && (
                <Badge variant="secondary" className="ml-2 bg-background/20">
                  {expenses.filter(e => e.category === f).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form */}
          {showForm && (
            <div className="lg:col-span-1">
              <ExpenseForm onClose={() => setShowForm(false)} />
            </div>
          )}

          {/* Expenses List */}
          <div className={showForm ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  {filter === 'all' ? 'All Expenses' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Expenses`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredExpenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
                      <TrendingDown className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No expenses recorded</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add your expenses to track your spending
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredExpenses.map((expense) => (
                      <div 
                        key={expense.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            expense.category === 'needs' ? "bg-foreground/10" : "bg-accent"
                          )}>
                            {expense.is_recurring ? (
                              <RefreshCw className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{expense.name}</p>
                              {expense.is_recurring && (
                                <Badge variant="secondary" className="text-xs">
                                  {expense.recurring_interval}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">
                              {expense.category} • {format(new Date(expense.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-lg font-semibold">
                            ₱{expense.amount.toLocaleString()}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
