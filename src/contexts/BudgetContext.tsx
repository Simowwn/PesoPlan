import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Income, Expense, BudgetPlan, BudgetSummary } from '@/types';

interface BudgetContextType {
  incomes: Income[];
  expenses: Expense[];
  activePlan: BudgetPlan | null;
  plans: BudgetPlan[];
  summary: BudgetSummary;
  isLoading: boolean;
  addIncome: (income: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateIncome: (id: string, income: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addPlan: (plan: Omit<BudgetPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  setActivePlan: (id: string) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

// API base URL - use environment variable or default to local
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [plans, setPlans] = useState<BudgetPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from API
  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setIncomes([]);
      setExpenses([]);
      setPlans([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load incomes
      const incomesRes = await fetch(`${API_URL}/api/income?user_id=${user.id}`);
      if (incomesRes.ok) {
        const incomesData = await incomesRes.json();
        setIncomes(incomesData);
      }

      // Load expenses
      const expensesRes = await fetch(`${API_URL}/api/expenses?user_id=${user.id}`);
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData);
      }

      // Load budget plans
      const plansRes = await fetch(`${API_URL}/api/budget-plans?user_id=${user.id}`);
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const activePlan = plans.find(p => p.active) || null;

  const summary: BudgetSummary = React.useMemo(() => {
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const needsPercentage = activePlan?.needs_percentage || 50;
    const wantsPercentage = activePlan?.wants_percentage || 30;
    const savingsPercentage = activePlan?.savings_percentage || 20;

    const needsBudget = (totalIncome * needsPercentage) / 100;
    const wantsBudget = (totalIncome * wantsPercentage) / 100;
    const savingsBudget = (totalIncome * savingsPercentage) / 100;

    const needsSpent = expenses.filter(e => e.category === 'needs').reduce((sum, e) => sum + e.amount, 0);
    const wantsSpent = expenses.filter(e => e.category === 'wants').reduce((sum, e) => sum + e.amount, 0);

    return {
      totalIncome,
      needsBudget,
      wantsBudget,
      savingsBudget,
      needsSpent,
      wantsSpent,
      needsRemaining: needsBudget - needsSpent,
      wantsRemaining: wantsBudget - wantsSpent,
    };
  }, [incomes, expenses, activePlan]);

  const addIncome = async (income: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_URL}/api/income`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...income,
          user_id: user.id,
        }),
      });

      if (response.ok) {
        const newIncome = await response.json();
        setIncomes(prev => [...prev, newIncome]);
      } else {
        const error = await response.json();
        console.error('Error adding income:', error);
      }
    } catch (error) {
      console.error('Error adding income:', error);
    }
  };

  const updateIncome = async (id: string, updates: Partial<Income>) => {
    try {
      const response = await fetch(`${API_URL}/api/income/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedIncome = await response.json();
        setIncomes(prev => prev.map(i => i.id === id ? updatedIncome : i));
      }
    } catch (error) {
      console.error('Error updating income:', error);
    }
  };

  const deleteIncome = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/income/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setIncomes(prev => prev.filter(i => i.id !== id));
      }
    } catch (error) {
      console.error('Error deleting income:', error);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expense,
          user_id: user.id,
        }),
      });

      if (response.ok) {
        const newExpense = await response.json();
        setExpenses(prev => [...prev, newExpense]);
      } else {
        const error = await response.json();
        console.error('Error adding expense:', error);
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const response = await fetch(`${API_URL}/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedExpense = await response.json();
        setExpenses(prev => prev.map(e => e.id === id ? updatedExpense : e));
      }
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setExpenses(prev => prev.filter(e => e.id !== id));
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const addPlan = async (plan: Omit<BudgetPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_URL}/api/budget-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...plan,
          user_id: user.id,
        }),
      });

      if (response.ok) {
        const newPlan = await response.json();
        // If this plan is active, deactivate others
        if (newPlan.active) {
          setPlans(prev => prev.map(p => ({ ...p, active: false })));
        }
        setPlans(prev => [...prev, newPlan]);
      } else {
        const error = await response.json();
        console.error('Error adding plan:', error);
      }
    } catch (error) {
      console.error('Error adding plan:', error);
    }
  };

  const setActivePlan = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/budget-plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true }),
      });

      if (response.ok) {
        const updatedPlan = await response.json();
        setPlans(prev => prev.map(p => ({
          ...p,
          active: p.id === id,
        })));
      }
    } catch (error) {
      console.error('Error setting active plan:', error);
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/budget-plans/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPlans(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  return (
    <BudgetContext.Provider value={{
      incomes,
      expenses,
      activePlan,
      plans,
      summary,
      isLoading,
      addIncome,
      updateIncome,
      deleteIncome,
      addExpense,
      updateExpense,
      deleteExpense,
      addPlan,
      setActivePlan,
      deletePlan,
      refreshData: loadData,
    }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}
