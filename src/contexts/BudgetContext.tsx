import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Income, Expense, BudgetPlan, BudgetSummary } from '@/types';

interface BudgetContextType {
  incomes: Income[];
  expenses: Expense[];
  activePlan: BudgetPlan | null;
  plans: BudgetPlan[];
  summary: BudgetSummary;
  addIncome: (income: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addPlan: (plan: Omit<BudgetPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  setActivePlan: (id: string) => void;
  deletePlan: (id: string) => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

const STORAGE_KEYS = {
  incomes: 'budget_app_incomes',
  expenses: 'budget_app_expenses',
  plans: 'budget_app_plans',
};

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [plans, setPlans] = useState<BudgetPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Load data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIncomes([]);
        setExpenses([]);
        setPlans([]);
        return;
      }

      setIsLoading(true);
      try {
        const headers = { 
          'Content-Type': 'application/json'
        };

        const [incomesRes, expensesRes, plansRes] = await Promise.all([
          fetch(`${API_URL}/api/income?user_id=${user.id}`, { headers }),
          fetch(`${API_URL}/api/expenses?user_id=${user.id}`, { headers }),
          fetch(`${API_URL}/api/budget-plans?user_id=${user.id}`, { headers })
        ]);

        if (incomesRes.ok) setIncomes(await incomesRes.json());
        if (expensesRes.ok) setExpenses(await expensesRes.json());
        if (plansRes.ok) setPlans(await plansRes.json());
      } catch (error) {
        console.error('Failed to fetch budget data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, API_URL]);

  const activePlan = plans.find(p => p.active) || null;

  const summary: BudgetSummary = React.useMemo(() => {
    const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const needsPercentage = Number(activePlan?.needs_percentage) || 50;
    const wantsPercentage = Number(activePlan?.wants_percentage) || 30;
    const savingsPercentage = Number(activePlan?.savings_percentage) || 20;

    const needsBudget = (totalIncome * needsPercentage) / 100;
    const wantsBudget = (totalIncome * wantsPercentage) / 100;
    const savingsBudget = (totalIncome * savingsPercentage) / 100;

    const needsSpent = expenses.filter(e => e.category === 'needs').reduce((sum, e) => sum + Number(e.amount), 0);
    const wantsSpent = expenses.filter(e => e.category === 'wants').reduce((sum, e) => sum + Number(e.amount), 0);

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
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ ...income, user_id: user.id }),
      });
      if (response.ok) {
        const newIncome = await response.json();
        setIncomes(prev => [newIncome, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add income:', error);
    }
  };

  const updateIncome = async (id: string, updates: Partial<Income>) => {
    try {
      const response = await fetch(`${API_URL}/api/income/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        setIncomes(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      }
    } catch (error) {
      console.error('Failed to update income:', error);
    }
  };

  const deleteIncome = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/income/${id}`, {
        method: 'DELETE',
        headers: { },
      });
      if (response.ok) {
        setIncomes(prev => prev.filter(i => i.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete income:', error);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ ...expense, user_id: user.id }),
      });
      if (response.ok) {
        const newExpense = await response.json();
        setExpenses(prev => [newExpense, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const response = await fetch(`${API_URL}/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
      }
    } catch (error) {
      console.error('Failed to update expense:', error);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { },
      });
      if (response.ok) {
        setExpenses(prev => prev.filter(e => e.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const addPlan = async (plan: Omit<BudgetPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/api/budget-plans`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ ...plan, user_id: user.id }),
      });
      if (response.ok) {
        const newPlan = await response.json();
        if (newPlan.active) {
          setPlans(prev => prev.map(p => ({ ...p, active: false })));
        }
        setPlans(prev => [newPlan, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add plan:', error);
    }
  };

  const setActivePlan = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/budget-plans/${id}/activate`, {
        method: 'POST',
        headers: { },
      });
      if (response.ok) {
        setPlans(prev => prev.map(p => ({
          ...p,
          active: p.id === id
        })));
      }
    } catch (error) {
      console.error('Failed to activate plan:', error);
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/budget-plans/${id}`, {
        method: 'DELETE',
        headers: { },
      });
      if (response.ok) {
        setPlans(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
  };

  return (
    <BudgetContext.Provider value={{
      incomes,
      expenses,
      activePlan,
      plans,
      summary,
      addIncome,
      updateIncome,
      deleteIncome,
      addExpense,
      updateExpense,
      deleteExpense,
      addPlan,
      setActivePlan,
      deletePlan,
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
