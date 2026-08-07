import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { INITIAL_TRANSACTIONS } from '../utils/mockData';

const FinanceContext = createContext(null);

export const FinanceProvider = ({ children }) => {
  const { user, isDemoMode } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load transactions when user or demo mode status changes
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      if (isDemoMode) {
        // Load from local storage or pre-populate with mock data
        const localData = localStorage.getItem('openskools_transactions');
        if (localData) {
          setTransactions(JSON.parse(localData).sort((a, b) => new Date(b.date) - new Date(a.date)));
        } else {
          localStorage.setItem('openskools_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
          setTransactions([...INITIAL_TRANSACTIONS].sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
        setLoading(false);
      } else {
        // Fetch from Supabase
        try {
          const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });

          if (error) {
            console.error('Supabase query error:', error);
            setError(error.message);
            // Auto fallback to local storage if tables do not exist
            if (error.code === 'P0001' || error.message.includes('relation "public.transactions" does not exist')) {
              setError('Supabase transactions table not found. Using local sandbox fallback.');
              const localData = localStorage.getItem('openskools_transactions') 
                ? JSON.parse(localStorage.getItem('openskools_transactions'))
                : INITIAL_TRANSACTIONS;
              setTransactions(localData.sort((a, b) => new Date(b.date) - new Date(a.date)));
            }
          } else {
            setTransactions(data || []);
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [user, isDemoMode]);

  // Save local storage transactions helper
  const saveLocalTransactions = (newTxList) => {
    localStorage.setItem('openskools_transactions', JSON.stringify(newTxList));
    setTransactions(newTxList.sort((a, b) => new Date(b.date) - new Date(a.date)));
  };

  const generateTrackingId = (type) => {
    const prefix = type === 'income' ? 'REC' : 'VOU';
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomHex = Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
    return `${prefix}-${dateStr}-${randomHex}`;
  };

  // Add Transaction
  const addTransaction = async (txData) => {
    setLoading(true);
    setError(null);
    try {
      const trackingId = generateTrackingId(txData.type);
      const trackingField = txData.type === 'income' ? 'receipt_no' : 'voucher_no';
      if (isDemoMode) {
        const newTx = {
          ...txData,
          id: `tx-${Date.now()}`,
          created_at: new Date().toISOString(),
          created_by: user.id,
          [trackingField]: trackingId
        };
        const updated = [...transactions, newTx];
        saveLocalTransactions(updated);
        setLoading(false);
        return { success: true, data: newTx };
      } else {
        // Prepare data for Supabase
        const dbTx = {
          type: txData.type,
          date: txData.date,
          category: txData.category,
          amount: parseFloat(txData.amount),
          payment_mode: txData.payment_mode,
          notes: txData.notes || '',
          student_name: txData.type === 'income' ? txData.student_name : null,
          course: txData.type === 'income' ? txData.course : null,
          transaction_id: txData.type === 'income' ? txData.transaction_id : null,
          whatsapp: txData.type === 'income' ? (txData.whatsapp || null) : null,
          email: txData.type === 'income' ? (txData.email || null) : null,
          vendor: txData.type === 'expense' ? txData.vendor : null,
          bill_upload_url: txData.type === 'expense' ? txData.bill_upload_url : null,
          created_by: user.id,
          [trackingField]: trackingId
        };

        const { data, error } = await supabase
          .from('transactions')
          .insert([dbTx])
          .select()
          .single();

        if (error) throw error;
        
        setTransactions(prev => [data, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
        setLoading(false);
        return { success: true, data };
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Update Transaction
  const updateTransaction = async (id, txData) => {
    setLoading(true);
    setError(null);
    try {
      if (isDemoMode) {
        const updated = transactions.map(t => {
          if (t.id === id) {
            return { ...t, ...txData, amount: parseFloat(txData.amount) };
          }
          return t;
        });
        saveLocalTransactions(updated);
        setLoading(false);
        return { success: true };
      } else {
        const dbTx = {
          date: txData.date,
          category: txData.category,
          amount: parseFloat(txData.amount),
          payment_mode: txData.payment_mode,
          notes: txData.notes || '',
          student_name: txData.type === 'income' ? txData.student_name : null,
          course: txData.type === 'income' ? txData.course : null,
          transaction_id: txData.type === 'income' ? txData.transaction_id : null,
          whatsapp: txData.type === 'income' ? (txData.whatsapp || null) : null,
          email: txData.type === 'income' ? (txData.email || null) : null,
          vendor: txData.type === 'expense' ? txData.vendor : null,
          bill_upload_url: txData.type === 'expense' ? txData.bill_upload_url : null,
        };

        const { data, error } = await supabase
          .from('transactions')
          .update(dbTx)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        setTransactions(prev => prev.map(t => t.id === id ? data : t).sort((a, b) => new Date(b.date) - new Date(a.date)));
        setLoading(false);
        return { success: true, data };
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Delete Transaction
  const deleteTransaction = async (id) => {
    setLoading(true);
    setError(null);
    try {
      if (isDemoMode) {
        const updated = transactions.filter(t => t.id !== id);
        saveLocalTransactions(updated);
        setLoading(false);
        return { success: true };
      } else {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setTransactions(prev => prev.filter(t => t.id !== id));
        setLoading(false);
        return { success: true };
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Bill Upload Handler — uses Cloudinary unsigned upload
  const uploadBill = async (file) => {
    if (isDemoMode) {
      // Simulate file upload with Base64 URL for offline storage
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    } else {
      try {
        const cloudName   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', 'openskools/bills');
        formData.append('access_mode', 'public');
        formData.append('type', 'upload');

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          { method: 'POST', body: formData }
        );
        if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.statusText}`);
        const data = await res.json();
        return data.secure_url;
      } catch (err) {
        console.error('Bill upload failed, using local fallback:', err);
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }
    }
  };

  // Receipt PDF Upload Handler — uploads PDF to Cloudinary as raw type for proper PDF serving
  const uploadReceiptPdf = async (base64Pdf, filename) => {
    if (isDemoMode) {
      throw new Error('PDF sharing is not available in Demo Mode. Please log in with a real account.');
    }

    const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    // Convert base64 to Blob → File so Cloudinary receives a valid binary PDF
    const byteChars = atob(base64Pdf);
    const byteNums  = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
    const pdfBlob = new Blob([byteNums], { type: 'application/pdf' });
    const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

    // Strip .pdf from public_id — /raw/upload takes the extension from the uploaded file,
    // so keeping .pdf in public_id would cause double extension: filename.pdf.pdf
    const publicId = `${Date.now()}_${filename.replace(/\.pdf$/i, '')}`;

    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'openskools/receipts');
    formData.append('public_id', publicId);

    // /raw/upload keeps the original PDF binary and serves it with correct Content-Type
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
      { method: 'POST', body: formData }
    );
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`Cloudinary PDF upload failed: ${errData.error?.message || res.statusText}`);
    }
    const data = await res.json();
    if (!data.secure_url) {
      throw new Error('Could not get public URL for the uploaded PDF.');
    }
    return data.secure_url;
  };

  return (
    <FinanceContext.Provider value={{
      transactions,
      loading,
      error,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      uploadBill,
      uploadReceiptPdf
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
