import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useBudget } from '@/contexts/BudgetContext';
import { ExpenseSubcategory } from '@/types';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface ExpenseFormProps {
  onClose?: () => void;
}

const SUBCATEGORIES_BY_CATEGORY: Record<'needs' | 'wants', { value: ExpenseSubcategory; label: string }[]> = {
  needs: [
    { value: 'food', label: 'Food' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'rent', label: 'Rent' },
    { value: 'other', label: 'Other' },
  ],
  wants: [
    { value: 'food', label: 'Food' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'clothes', label: 'Clothes' },
    { value: 'toys', label: 'Toys' },
    { value: 'gadgets', label: 'Gadgets' },
    { value: 'travel', label: 'Travel' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'other', label: 'Other' },
  ],
};

export function ExpenseForm({ onClose }: ExpenseFormProps) {
  const { addExpense } = useBudget();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<'needs' | 'wants'>('needs');
  const [subcategory, setSubcategory] = useState<ExpenseSubcategory>('food');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset subcategory when category changes
  useEffect(() => {
    const defaultSub = SUBCATEGORIES_BY_CATEGORY[category][0].value;
    setSubcategory(defaultSub);
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !amount || !category || !subcategory) {
      toast.error('Please fill in all required fields');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addExpense({
        name: name.trim(),
        amount: parsedAmount,
        category,
        subcategory,
        is_recurring: isRecurring,
        recurring_interval: isRecurring ? recurringInterval : undefined,
        next_due_date: isRecurring ? calculateNextDueDate(recurringInterval) : undefined,
      });
      
      toast.success('Expense added successfully');
      setName('');
      setAmount('');
      setCategory('needs');
      setSubcategory('food');
      setIsRecurring(false);
      onClose?.();
    } catch (error) {
      toast.error('Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateNextDueDate = (interval: 'weekly' | 'monthly' | 'yearly'): string => {
    const now = new Date();
    switch (interval) {
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'yearly':
        now.setFullYear(now.getFullYear() + 1);
        break;
    }
    return now.toISOString();
  };

  const availableSubcategories = SUBCATEGORIES_BY_CATEGORY[category];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Add Expense</CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Description</Label>
            <Input
              id="name"
              placeholder="e.g., Rent, Netflix, Groceries"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₱)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as 'needs' | 'wants')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="needs">Needs (Essential)</SelectItem>
                <SelectItem value="wants">Wants (Non-essential)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <Select value={subcategory} onValueChange={(v) => setSubcategory(v as ExpenseSubcategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableSubcategories.map((sub) => (
                  <SelectItem key={sub.value} value={sub.value}>
                    {sub.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="recurring">Recurring Expense</Label>
              <p className="text-xs text-muted-foreground">
                Auto-track this expense periodically
              </p>
            </div>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>
          
          {isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="interval">Recurring Interval</Label>
              <Select 
                value={recurringInterval} 
                onValueChange={(v) => setRecurringInterval(v as 'weekly' | 'monthly' | 'yearly')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Expense'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
