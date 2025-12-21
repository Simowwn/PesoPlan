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

  // Load data from localStorage
  useEffect(() => {
    if (user) {
      const storedIncomes = JSON.parse(localStorage.getItem(STORAGE_KEYS.incomes) || '[]');
      const storedExpenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.expenses) || '[]');
      const storedPlans = JSON.parse(localStorage.getItem(STORAGE_KEYS.plans) || '[]');
      
      setIncomes(storedIncomes.filter((i: Income) => i.user_id === user.id));
      setExpenses(storedExpenses.filter((e: Expense) => e.user_id === user.id));
      setPlans(storedPlans.filter((p: BudgetPlan) => p.user_id === user.id));
    } else {
      setIncomes([]);
      setExpenses([]);
      setPlans([]);
    }
  }, [user]);

  // Save data to localStorage
  useEffect(() => {
    if (user) {
      const allIncomes = JSON.parse(localStorage.getItem(STORAGE_KEYS.incomes) || '[]');
      const otherIncomes = allIncomes.filter((i: Income) => i.user_id !== user.id);
      localStorage.setItem(STORAGE_KEYS.incomes, JSON.stringify([...otherIncomes, ...incomes]));
    }
  }, [incomes, user]);

  useEffect(() => {
    if (user) {
      const allExpenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.expenses) || '[]');
      const otherExpenses = allExpenses.filter((e: Expense) => e.user_id !== user.id);
      localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify([...otherExpenses, ...expenses]));
    }
  }, [expenses, user]);

  useEffect(() => {
    if (user) {
      const allPlans = JSON.parse(localStorage.getItem(STORAGE_KEYS.plans) || '[]');
      const otherPlans = allPlans.filter((p: BudgetPlan) => p.user_id !== user.id);
      localStorage.setItem(STORAGE_KEYS.plans, JSON.stringify([...otherPlans, ...plans]));
    }
  }, [plans, user]);

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

  const addIncome = (income: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    const newIncome: Income = {
      ...income,
      id: crypto.randomUUID(),
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setIncomes(prev => [...prev, newIncome]);
  };

  const updateIncome = (id: string, updates: Partial<Income>) => {
    setIncomes(prev => prev.map(i => 
      i.id === id ? { ...i, ...updates, updated_at: new Date().toISOString() } : i
    ));
  };

  const deleteIncome = (id: string) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setExpenses(prev => [...prev, newExpense]);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => 
      e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
    ));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addPlan = (plan: Omit<BudgetPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    const newPlan: BudgetPlan = {
      ...plan,
      id: crypto.randomUUID(),
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // If this plan is active, deactivate others
    if (newPlan.active) {
      setPlans(prev => prev.map(p => ({ ...p, active: false })));
    }
    
    setPlans(prev => [...prev, newPlan]);
  };

  const setActivePlan = (id: string) => {
    setPlans(prev => prev.map(p => ({
      ...p,
      active: p.id === id,
      updated_at: new Date().toISOString(),
    })));
  };

  const deletePlan = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
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
