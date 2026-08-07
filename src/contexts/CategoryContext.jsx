import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/mockData';

const CategoryContext = createContext(null);

const LS_KEY_INCOME = 'openskools_income_categories';
const LS_KEY_EXPENSE = 'openskools_expense_categories';

export const CategoryProvider = ({ children }) => {
  const { user, isDemoMode } = useAuth();

  const [incomeCategories, setIncomeCategories] = useState(INCOME_CATEGORIES);
  const [expenseCategories, setExpenseCategories] = useState(EXPENSE_CATEGORIES);
  const [loading, setLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    if (isDemoMode) {
      const savedIncome = localStorage.getItem(LS_KEY_INCOME);
      const savedExpense = localStorage.getItem(LS_KEY_EXPENSE);
      setIncomeCategories(savedIncome ? JSON.parse(savedIncome) : INCOME_CATEGORIES);
      setExpenseCategories(savedExpense ? JSON.parse(savedExpense) : EXPENSE_CATEGORIES);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setIncomeCategories(data.filter(c => c.type === 'income').map(c => c.name));
        setExpenseCategories(data.filter(c => c.type === 'expense').map(c => c.name));
      } else {
        setIncomeCategories(INCOME_CATEGORIES);
        setExpenseCategories(EXPENSE_CATEGORIES);
      }
    } catch (err) {
      console.warn('categories table not available, using defaults:', err.message);
      setIncomeCategories(INCOME_CATEGORIES);
      setExpenseCategories(EXPENSE_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, [user, isDemoMode]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const persistLocal = (type, list) => {
    const key = type === 'income' ? LS_KEY_INCOME : LS_KEY_EXPENSE;
    localStorage.setItem(key, JSON.stringify(list));
  };

  const addCategory = async (type, name) => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: 'Category name cannot be empty.' };
    const current = type === 'income' ? incomeCategories : expenseCategories;
    if (current.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      return { success: false, error: 'Category already exists.' };
    }
    const updated = [...current, trimmed];

    if (isDemoMode) {
      type === 'income' ? setIncomeCategories(updated) : setExpenseCategories(updated);
      persistLocal(type, updated);
      return { success: true };
    }
    try {
      const { error } = await supabase.from('categories').insert([{ type, name: trimmed }]);
      if (error) throw error;
    } catch (err) {
      // Table may not exist yet — persist locally as fallback
      console.warn('Supabase categories insert failed, using localStorage:', err.message);
      persistLocal(type, updated);
    }
    type === 'income' ? setIncomeCategories(updated) : setExpenseCategories(updated);
    return { success: true };
  };

  const renameCategory = async (type, oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return { success: false, error: 'Category name cannot be empty.' };
    const current = type === 'income' ? incomeCategories : expenseCategories;
    if (
      current.map(c => c.toLowerCase()).includes(trimmed.toLowerCase()) &&
      trimmed.toLowerCase() !== oldName.toLowerCase()
    ) {
      return { success: false, error: 'Category already exists.' };
    }
    const updated = current.map(c => (c === oldName ? trimmed : c));

    if (isDemoMode) {
      type === 'income' ? setIncomeCategories(updated) : setExpenseCategories(updated);
      persistLocal(type, updated);
      return { success: true };
    }
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: trimmed })
        .eq('type', type)
        .eq('name', oldName);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase categories update failed, using localStorage:', err.message);
      persistLocal(type, updated);
    }
    type === 'income' ? setIncomeCategories(updated) : setExpenseCategories(updated);
    return { success: true };
  };

  const deleteCategory = async (type, name) => {
    const current = type === 'income' ? incomeCategories : expenseCategories;
    const updated = current.filter(c => c !== name);

    if (isDemoMode) {
      type === 'income' ? setIncomeCategories(updated) : setExpenseCategories(updated);
      persistLocal(type, updated);
      return { success: true };
    }
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('type', type)
        .eq('name', name);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase categories delete failed, using localStorage:', err.message);
      persistLocal(type, updated);
    }
    type === 'income' ? setIncomeCategories(updated) : setExpenseCategories(updated);
    return { success: true };
  };

  return (
    <CategoryContext.Provider
      value={{
        incomeCategories,
        expenseCategories,
        loading,
        addCategory,
        renameCategory,
        deleteCategory,
        refreshCategories: loadCategories,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => useContext(CategoryContext);