import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/mockData';

const CategoryContext = createContext(null);

export const CategoryProvider = ({ children }) => {
  const { user } = useAuth();

  const [incomeCategories, setIncomeCategories] = useState(INCOME_CATEGORIES);
  const [expenseCategories, setExpenseCategories] = useState(EXPENSE_CATEGORIES);
  const [loading, setLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    if (!user) return;
    setLoading(true);

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
  }, [user]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const addCategory = async (type, name) => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: 'Category name cannot be empty.' };
    const current = type === 'income' ? incomeCategories : expenseCategories;
    if (current.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      return { success: false, error: 'Category already exists.' };
    }
    const updated = [...current, trimmed];

    try {
      const { error } = await supabase.from('categories').insert([{ type, name: trimmed }]);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase categories insert failed:', err.message);
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

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: trimmed })
        .eq('type', type)
        .eq('name', oldName);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase categories update failed:', err.message);
    }
    type === 'income' ? setIncomeCategories(updated) : setExpenseCategories(updated);
    return { success: true };
  };

  const deleteCategory = async (type, name) => {
    const current = type === 'income' ? incomeCategories : expenseCategories;
    const updated = current.filter(c => c !== name);

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('type', type)
        .eq('name', name);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase categories delete failed:', err.message);
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