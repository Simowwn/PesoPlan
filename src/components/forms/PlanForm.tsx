import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useBudget } from '@/contexts/BudgetContext';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface PlanFormProps {
  onClose?: () => void;
}

const presets = [
  { name: 'Conservative', needs: 60, wants: 20, savings: 20 },
  { name: 'Balanced', needs: 50, wants: 30, savings: 20 },
  { name: 'Aggressive Savings', needs: 50, wants: 25, savings: 25 },
  { name: 'Minimalist', needs: 40, wants: 20, savings: 40 },
];

export function PlanForm({ onClose }: PlanFormProps) {
  const { addPlan } = useBudget();
  const [needs, setNeeds] = useState('50');
  const [wants, setWants] = useState('30');
  const [savings, setSavings] = useState('20');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = (parseFloat(needs) || 0) + (parseFloat(wants) || 0) + (parseFloat(savings) || 0);

  const applyPreset = (preset: typeof presets[0]) => {
    setNeeds(preset.needs.toString());
    setWants(preset.wants.toString());
    setSavings(preset.savings.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const needsNum = parseFloat(needs);
    const wantsNum = parseFloat(wants);
    const savingsNum = parseFloat(savings);
    
    if (isNaN(needsNum) || isNaN(wantsNum) || isNaN(savingsNum)) {
      toast.error('Please enter valid percentages');
      return;
    }

    if (needsNum + wantsNum + savingsNum !== 100) {
      toast.error('Percentages must add up to 100%');
      return;
    }

    setIsSubmitting(true);
    
    try {
      addPlan({
        needs_percentage: needsNum,
        wants_percentage: wantsNum,
        savings_percentage: savingsNum,
        active: true,
      });
      
      toast.success('Budget plan created and activated');
      onClose?.();
    } catch (error) {
      toast.error('Failed to create plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Create Budget Plan</CardTitle>
          <CardDescription>
            Define how to allocate your income
          </CardDescription>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Presets */}
          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="text-xs"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="needs">Needs (%)</Label>
              <Input
                id="needs"
                type="number"
                placeholder="50"
                min="0"
                max="100"
                value={needs}
                onChange={(e) => setNeeds(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Essential expenses: rent, utilities, food, insurance
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wants">Wants (%)</Label>
              <Input
                id="wants"
                type="number"
                placeholder="30"
                min="0"
                max="100"
                value={wants}
                onChange={(e) => setWants(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Non-essential: entertainment, dining out, subscriptions
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="savings">Savings (%)</Label>
              <Input
                id="savings"
                type="number"
                placeholder="20"
                min="0"
                max="100"
                value={savings}
                onChange={(e) => setSavings(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Savings, investments, emergency fund
              </p>
            </div>

            <div className={`p-3 rounded-lg ${total === 100 ? 'bg-accent' : 'bg-destructive/10'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className={`text-sm font-bold ${total !== 100 ? 'text-destructive' : ''}`}>
                  {total}%
                </span>
              </div>
              {total !== 100 && (
                <p className="text-xs text-destructive mt-1">
                  Must equal 100%
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || total !== 100}
            >
              {isSubmitting ? 'Creating...' : 'Create & Activate Plan'}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
