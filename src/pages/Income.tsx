import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBudget } from '@/contexts/BudgetContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { IncomeForm } from '@/components/forms/IncomeForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Trash2, 
  TrendingUp,
  Loader2,
  Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Income() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { incomes, deleteIncome, summary } = useBudget();
  const [showForm, setShowForm] = useState(false);

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

  const handleDelete = (id: string) => {
    deleteIncome(id);
    toast.success('Income deleted');
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Income</h1>
            <p className="text-muted-foreground">
              Manage your income sources
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Button>
        </div>

        {/* Total Card */}
        <Card className="bg-foreground text-background">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-background/70 text-sm font-medium">Total Income</p>
                <p className="text-3xl font-bold mt-1">
                  ₱{summary.totalIncome.toLocaleString()}
                </p>
                <p className="text-background/60 text-sm mt-1">
                  {incomes.length} income source{incomes.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-background/10 flex items-center justify-center">
                <Wallet className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form */}
          {showForm && (
            <div className="lg:col-span-1">
              <IncomeForm onClose={() => setShowForm(false)} />
            </div>
          )}

          {/* Income List */}
          <div className={showForm ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Income History</CardTitle>
              </CardHeader>
              <CardContent>
                {incomes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
                      <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No income recorded yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add your first income to get started
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Income
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incomes.map((income) => (
                      <div 
                        key={income.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{income.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {income.source} • {format(new Date(income.date_received), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-lg font-semibold">
                            ₱{income.amount.toLocaleString()}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(income.id)}
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
