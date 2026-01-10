import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Income, Expense, BudgetPlan, BudgetSummary } from "@/types";

interface BudgetContextType {
  incomes: Income[];
  expenses: Expense[];
  activePlan: BudgetPlan | null;
  plans: BudgetPlan[];
  summary: BudgetSummary;
  isLoading: boolean;
  addIncome: (
    income: Omit<Income, "id" | "user_id" | "created_at" | "updated_at">
  ) => Promise<void>;
  updateIncome: (id: string, income: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  addExpense: (
    expense: Omit<Expense, "id" | "user_id" | "created_at" | "updated_at">
  ) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addPlan: (
    plan: Omit<BudgetPlan, "id" | "user_id" | "created_at" | "updated_at">
  ) => Promise<void>;
  setActivePlan: (id: string) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

// Helper to transform database row to Income type
const transformIncome = (row: Record<string, unknown>): Income => ({
  id: String(row.id),
  user_id: String(row.user_id),
  name: String(row.name),
  amount: parseFloat(String(row.amount)),
  source: String(row.source),
  date_received: String(row.date_received),
  created_at: String(row.created_at),
  updated_at: String(row.updated_at),
});

// Helper to transform database row to Expense type
const transformExpense = (row: Record<string, unknown>): Expense => ({
  id: String(row.id),
  user_id: String(row.user_id),
  name: String(row.name),
  amount: parseFloat(String(row.amount)),
  category: row.category as "needs" | "wants",
  subcategory: row.subcategory as Expense["subcategory"],
  is_recurring: Boolean(row.is_recurring),
  recurring_interval: row.recurring_interval
    ? (row.recurring_interval as "weekly" | "monthly" | "yearly")
    : undefined,
  next_due_date: row.next_due_date ? String(row.next_due_date) : undefined,
  created_at: String(row.created_at),
  updated_at: String(row.updated_at),
});

// Helper to transform database row to BudgetPlan type
const transformBudgetPlan = (row: Record<string, unknown>): BudgetPlan => ({
  id: String(row.id),
  user_id: String(row.user_id),
  needs_percentage: parseFloat(String(row.needs_percentage)),
  wants_percentage: parseFloat(String(row.wants_percentage)),
  savings_percentage: parseFloat(String(row.savings_percentage)),
  active: Boolean(row.active),
  created_at: String(row.created_at),
  updated_at: String(row.updated_at),
});

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [plans, setPlans] = useState<BudgetPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to ensure user exists in public.users table
  // This is a fallback in case the database trigger hasn't synced the user yet
  const ensureUserExists = useCallback(
    async (userId: string, email: string) => {
      try {
        // Check if user exists
        // @ts-expect-error - Supabase types not generated yet
        const { data: existingUser, error: checkError } = await supabase
          .from("users")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        // If user doesn't exist, try to create it
        // Note: This may fail if RLS policies prevent client-side inserts
        // In that case, the database trigger should handle user creation
        if (checkError || !existingUser) {
          // @ts-expect-error - Supabase types not generated yet
          const { error: insertError } = await supabase
            .from("users")
            .insert({
              id: userId,
              email: email,
              created_at: new Date().toISOString(),
            })
            .select()
            .maybeSingle();

          if (insertError) {
            // If it's a conflict error (23505), user was created between check and insert (race condition) - this is OK
            // If it's a permission error (42501), RLS is blocking - trigger should handle it, but we'll log it
            if (insertError.code === "23505") {
              // User exists now, which is fine
              return;
            } else if (insertError.code === "42501") {
              // RLS blocking - this means the trigger should handle user creation
              // Log a warning but don't throw - the database trigger should sync the user
              console.warn(
                "⚠️ Cannot create user from client (RLS blocked). " +
                  "Ensure the sync trigger is set up. Run SYNC_SUPABASE_AUTH_USERS.sql in Supabase SQL Editor."
              );
              // Don't throw - let the operation proceed and see if the user exists
              // If the foreign key constraint fails, it will be caught by the calling function
              return;
            } else {
              // Other error - log and throw
              console.error("Error ensuring user exists:", insertError);
              throw insertError;
            }
          }
        }
      } catch (error) {
        console.error("Error ensuring user exists:", error);
        // Don't throw - let the operation proceed
        // If the user truly doesn't exist, the foreign key constraint will catch it
      }
    },
    []
  );

  const loadData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load incomes
      // @ts-ignore - Supabase types not generated yet
      const { data: incomesData, error: incomesError } = await supabase
        .from("income")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (incomesError) {
        console.error("Error loading incomes:", incomesError);
        if (
          incomesError.code === "42501" ||
          incomesError.message.includes("permission denied")
        ) {
          console.error(
            "❌ RLS Policy Error: Set up Row Level Security policies. See SUPABASE_RLS_SETUP.sql"
          );
        }
      } else {
        setIncomes((incomesData || []).map(transformIncome));
      }

      // Load expenses
      // @ts-ignore - Supabase types not generated yet
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (expensesError) {
        console.error("Error loading expenses:", expensesError);
        if (
          expensesError.code === "42501" ||
          expensesError.message.includes("permission denied")
        ) {
          console.error(
            "❌ RLS Policy Error: Set up Row Level Security policies. See SUPABASE_RLS_SETUP.sql"
          );
        }
      } else {
        setExpenses((expensesData || []).map(transformExpense));
      }

      // Load budget plans
      // @ts-ignore - Supabase types not generated yet
      const { data: plansData, error: plansError } = await supabase
        .from("budget_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (plansError) {
        console.error("Error loading plans:", plansError);
        if (
          plansError.code === "42501" ||
          plansError.message.includes("permission denied")
        ) {
          console.error(
            "❌ RLS Policy Error: Set up Row Level Security policies. See SUPABASE_RLS_SETUP.sql"
          );
        }
      } else {
        setPlans((plansData || []).map(transformBudgetPlan));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load data from Supabase
  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setIncomes([]);
      setExpenses([]);
      setPlans([]);
      setIsLoading(false);
    }
  }, [user, loadData]);

  const activePlan = plans.find((p) => p.active) || null;

  const summary: BudgetSummary = React.useMemo(() => {
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const needsPercentage = activePlan?.needs_percentage || 50;
    const wantsPercentage = activePlan?.wants_percentage || 30;
    const savingsPercentage = activePlan?.savings_percentage || 20;

    const needsBudget = (totalIncome * needsPercentage) / 100;
    const wantsBudget = (totalIncome * wantsPercentage) / 100;
    const savingsBudget = (totalIncome * savingsPercentage) / 100;

    const needsSpent = expenses
      .filter((e) => e.category === "needs")
      .reduce((sum, e) => sum + e.amount, 0);
    const wantsSpent = expenses
      .filter((e) => e.category === "wants")
      .reduce((sum, e) => sum + e.amount, 0);

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

  const addIncome = async (
    income: Omit<Income, "id" | "user_id" | "created_at" | "updated_at">
  ) => {
    if (!user) return;

    try {
      // Ensure user exists in public.users table
      await ensureUserExists(user.id, user.email);

      // @ts-ignore - Supabase types not generated yet
      const { data, error } = await supabase
        .from("income")
        .insert({
          user_id: user.id,
          name: income.name,
          amount: income.amount,
          source: income.source,
          date_received: income.date_received,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding income:", error);
      } else if (data) {
        setIncomes((prev) => [...prev, transformIncome(data)]);
      }
    } catch (error) {
      console.error("Error adding income:", error);
    }
  };

  const updateIncome = async (id: string, updates: Partial<Income>) => {
    try {
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.source !== undefined) updateData.source = updates.source;
      if (updates.date_received !== undefined)
        updateData.date_received = updates.date_received;

      // @ts-ignore - Supabase types not generated yet
      const { data, error } = await supabase
        .from("income")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating income:", error);
      } else if (data) {
        setIncomes((prev) =>
          prev.map((i) => (i.id === id ? transformIncome(data) : i))
        );
      }
    } catch (error) {
      console.error("Error updating income:", error);
    }
  };

  const deleteIncome = async (id: string) => {
    try {
      // @ts-ignore - Supabase types not generated yet
      const { error } = await supabase.from("income").delete().eq("id", id);

      if (error) {
        console.error("Error deleting income:", error);
      } else {
        setIncomes((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (error) {
      console.error("Error deleting income:", error);
    }
  };

  const addExpense = async (
    expense: Omit<Expense, "id" | "user_id" | "created_at" | "updated_at">
  ) => {
    if (!user) return;

    try {
      // Ensure user exists in public.users table
      await ensureUserExists(user.id, user.email);

      // @ts-ignore - Supabase types not generated yet
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          user_id: user.id,
          name: expense.name,
          amount: expense.amount,
          category: expense.category,
          subcategory: expense.subcategory,
          is_recurring: expense.is_recurring || false,
          recurring_interval: expense.recurring_interval || null,
          next_due_date: expense.next_due_date || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding expense:", error);
      } else if (data) {
        setExpenses((prev) => [...prev, transformExpense(data)]);
      }
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.category !== undefined)
        updateData.category = updates.category;
      if (updates.subcategory !== undefined)
        updateData.subcategory = updates.subcategory;
      if (updates.is_recurring !== undefined)
        updateData.is_recurring = updates.is_recurring;
      if (updates.recurring_interval !== undefined)
        updateData.recurring_interval = updates.recurring_interval || null;
      if (updates.next_due_date !== undefined)
        updateData.next_due_date = updates.next_due_date || null;

      // @ts-ignore - Supabase types not generated yet
      const { data, error } = await supabase
        .from("expenses")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating expense:", error);
      } else if (data) {
        setExpenses((prev) =>
          prev.map((e) => (e.id === id ? transformExpense(data) : e))
        );
      }
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      // @ts-ignore - Supabase types not generated yet
      const { error } = await supabase.from("expenses").delete().eq("id", id);

      if (error) {
        console.error("Error deleting expense:", error);
      } else {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const addPlan = async (
    plan: Omit<BudgetPlan, "id" | "user_id" | "created_at" | "updated_at">
  ) => {
    if (!user) return;

    try {
      // Ensure user exists in public.users table
      await ensureUserExists(user.id, user.email);

      // If this plan is active, deactivate others first
      if (plan.active !== false) {
        // @ts-ignore - Supabase types not generated yet
        await supabase
          .from("budget_plans")
          .update({ active: false })
          .eq("user_id", user.id)
          .eq("active", true);
      }

      // @ts-ignore - Supabase types not generated yet
      const { data, error } = await supabase
        .from("budget_plans")
        .insert({
          user_id: user.id,
          needs_percentage: plan.needs_percentage,
          wants_percentage: plan.wants_percentage,
          savings_percentage: plan.savings_percentage,
          active: plan.active !== false,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding plan:", error);
        console.error("Error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        // Show user-friendly error
        if (
          error.code === "42501" ||
          error.message.includes("permission denied") ||
          error.message.includes("403")
        ) {
          alert(
            "Permission denied. Please set up Row Level Security (RLS) policies in Supabase.\n\n" +
              "Go to: Supabase Dashboard > Table Editor > budget_plans > RLS Policies\n" +
              "Or run the SQL commands provided in the console."
          );
        } else if (error.code === "23503") {
          // Foreign key constraint violation - user doesn't exist in users table
          alert(
            "User not found in database. Please sync your Supabase Auth users.\n\n" +
              "1. Go to Supabase Dashboard > SQL Editor\n" +
              "2. Run the SQL from: SYNC_SUPABASE_AUTH_USERS.sql\n" +
              "3. This will create a trigger to automatically sync users.\n\n" +
              "Or manually sync existing users by running the INSERT statement in that file."
          );
          throw error; // Re-throw so the UI can handle it
        }
        throw error; // Re-throw so the UI can handle it
      } else if (data) {
        const newPlan = transformBudgetPlan(data);
        // If this plan is active, deactivate others in state
        if (newPlan.active) {
          setPlans((prev) => prev.map((p) => ({ ...p, active: false })));
        }
        setPlans((prev) => [...prev, newPlan]);
      }
    } catch (error) {
      console.error("Error adding plan:", error);
    }
  };

  const setActivePlan = async (id: string) => {
    try {
      // Deactivate all plans for this user
      // @ts-ignore - Supabase types not generated yet
      await supabase
        .from("budget_plans")
        .update({ active: false })
        .eq("user_id", user?.id);

      // Activate the selected plan
      // @ts-ignore - Supabase types not generated yet
      const { data, error } = await supabase
        .from("budget_plans")
        .update({ active: true })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error setting active plan:", error);
      } else {
        setPlans((prev) =>
          prev.map((p) => ({
            ...p,
            active: p.id === id,
          }))
        );
      }
    } catch (error) {
      console.error("Error setting active plan:", error);
    }
  };

  const deletePlan = async (id: string) => {
    try {
      // @ts-ignore - Supabase types not generated yet
      const { error } = await supabase
        .from("budget_plans")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting plan:", error);
      } else {
        setPlans((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };

  return (
    <BudgetContext.Provider
      value={{
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
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
}
