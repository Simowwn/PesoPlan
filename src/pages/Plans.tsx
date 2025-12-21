import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBudget } from '@/contexts/BudgetContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PlanForm } from '@/components/forms/PlanForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Settings,
  Loader2,
  Check,
  PieChart
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Plans() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { plans, activePlan, setActivePlan, deletePlan } = useBudget();
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

  const handleActivate = (id: string) => {
    setActivePlan(id);
    toast.success('Budget plan activated');
  };

  const handleDelete = (id: string) => {
    deletePlan(id);
    toast.success('Plan deleted');
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Budget Plans</h1>
            <p className="text-muted-foreground">
              Configure how your income is allocated
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>

        {/* Active Plan Summary */}
        {activePlan && (
          <Card className="bg-foreground text-background">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-background/20 text-background">Active</Badge>
                  </div>
                  <p className="text-background/70 text-sm">Current Budget Allocation</p>
                  <div className="flex items-center gap-6 mt-4">
                    <div>
                      <p className="text-3xl font-bold">{activePlan.needs_percentage}%</p>
                      <p className="text-background/60 text-sm">Needs</p>
                    </div>
                    <div className="h-12 w-px bg-background/20" />
                    <div>
                      <p className="text-3xl font-bold">{activePlan.wants_percentage}%</p>
                      <p className="text-background/60 text-sm">Wants</p>
                    </div>
                    <div className="h-12 w-px bg-background/20" />
                    <div>
                      <p className="text-3xl font-bold">{activePlan.savings_percentage}%</p>
                      <p className="text-background/60 text-sm">Savings</p>
                    </div>
                  </div>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-background/10 flex items-center justify-center">
                  <PieChart className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form */}
          {showForm && (
            <div className="lg:col-span-1">
              <PlanForm onClose={() => setShowForm(false)} />
            </div>
          )}

          {/* Plans List */}
          <div className={showForm ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">All Plans</CardTitle>
              </CardHeader>
              <CardContent>
                {plans.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
                      <Settings className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No budget plans created</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create a plan to start tracking your budget
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Plan
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => (
                      <Card 
                        key={plan.id}
                        className={cn(
                          "relative overflow-hidden transition-all",
                          plan.active && "ring-2 ring-foreground"
                        )}
                      >
                        <CardContent className="p-5">
                          {plan.active && (
                            <Badge className="absolute top-3 right-3 bg-foreground text-background">
                              Active
                            </Badge>
                          )}
                          
                          <div className="space-y-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Needs</span>
                                <span className="font-semibold">{plan.needs_percentage}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-accent overflow-hidden">
                                <div 
                                  className="h-full bg-foreground transition-all"
                                  style={{ width: `${plan.needs_percentage}%` }}
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Wants</span>
                                <span className="font-semibold">{plan.wants_percentage}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-accent overflow-hidden">
                                <div 
                                  className="h-full bg-foreground/60 transition-all"
                                  style={{ width: `${plan.wants_percentage}%` }}
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Savings</span>
                                <span className="font-semibold">{plan.savings_percentage}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-accent overflow-hidden">
                                <div 
                                  className="h-full bg-foreground/30 transition-all"
                                  style={{ width: `${plan.savings_percentage}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              {!plan.active && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => handleActivate(plan.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Activate
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(plan.id)}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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
