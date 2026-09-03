import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { User, Mail, Phone, Shield, Camera, Save, CheckCircle, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';

const Profile = () => {
  const { user, role, refreshProfile } = useAuth();

  // Profile form
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    avatar_url: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Password form
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

  // Load profile from Supabase profiles table
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, phone, avatar_url')
          .eq('id', user.id)
          .single();

        if (data && !error) {
          setProfile({
            full_name: data.full_name || '',
            phone: data.phone || '',
            avatar_url: data.avatar_url || '',
          });
        } else {
          // Pre-fill from auth metadata if profile row doesn't have these
          setProfile(prev => ({
            ...prev,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          }));
        }
      } catch {
        // silently fail
      } finally {
        setProfileLoading(false);
      }
    };
    load();
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profile.full_name.trim()) {
      setProfileMsg({ type: 'error', text: 'Full name is required.' });
      return;
    }
    setProfileSaving(true);
    setProfileMsg({ type: '', text: '' });

    try {
      // Update profiles table
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name.trim(),
          phone: profile.phone.trim(),
          avatar_url: profile.avatar_url.trim(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Also update Supabase auth user metadata
      await supabase.auth.updateUser({
        data: { full_name: profile.full_name.trim() }
      });

      // Refresh the global profile state so Navbar updates immediately
      await refreshProfile();

      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setProfileMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });

    if (passwords.newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      });
      if (error) throw error;

      setPasswords({ newPassword: '', confirmPassword: '' });
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setTimeout(() => setPwMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setPwSaving(false);
    }
  };

  // Initials for avatar
  const initials = (profile.full_name || user?.email || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
      
      {/* Page Header */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">My Profile</h2>
        <p className="text-xs text-slate-400">Manage your account details and security settings</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        
        {/* Banner + Avatar */}
        <div className="relative h-28 bg-gradient-to-r from-primary via-primary-dark to-primary">
          <div className="absolute -bottom-10 left-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-primary text-white text-2xl font-bold shadow-lg dark:border-slate-900">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full rounded-xl object-cover" />
              ) : (
                initials
              )}
            </div>
          </div>
        </div>

        {/* Info below banner */}
        <div className="pt-14 px-6 pb-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {profile.full_name || user?.email?.split('@')[0]}
          </h3>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Mail className="h-3 w-3" />{user?.email}
            </span>
            <span className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary dark:bg-primary/20 dark:text-primary-light">
              <Shield className="h-3 w-3 mr-1" />{role === 'admin' ? 'Administrator' : 'Accountant'}
            </span>
          </div>
        </div>

        <hr className="mx-6 mt-4 border-slate-100 dark:border-slate-800" />

        {/* Profile Edit Form */}
        <form onSubmit={handleProfileSave} className="p-6 space-y-5">
          {profileMsg.text && (
            <div className={`flex items-center gap-2 rounded-lg p-3 text-xs font-semibold ${
              profileMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400'
                : 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400'
            }`}>
              {profileMsg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {profileMsg.text}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleProfileChange}
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-500 outline-none opacity-60 cursor-not-allowed dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Avatar URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Avatar URL</label>
              <div className="relative">
                <Camera className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="url"
                  name="avatar_url"
                  value={profile.avatar_url}
                  onChange={handleProfileChange}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Role (read-only) */}
          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Role</label>
            <div className="relative">
              <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={role === 'admin' ? 'Administrator' : 'Accountant'}
                readOnly
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-500 outline-none opacity-60 cursor-not-allowed dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-400">Role can only be changed by an administrator.</p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileSaving || profileLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-white hover:bg-primary-dark shadow-md shadow-primary/20 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-400" />
            Change Password
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Update your password to keep your account secure</p>
        </div>

        <form onSubmit={handlePasswordChange} className="p-6 space-y-5">
          {pwMsg.text && (
            <div className={`flex items-center gap-2 rounded-lg p-3 text-xs font-semibold ${
              pwMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400'
                : 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400'
            }`}>
              {pwMsg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {pwMsg.text}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Min. 6 characters"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-10 text-xs text-slate-700 outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Re-enter password"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-10 text-xs text-slate-700 outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={pwSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-700 shadow-md disabled:opacity-50 transition-colors dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              <Lock className="h-4 w-4" />
              {pwSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Account Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400">User ID</span>
            <p className="font-mono text-slate-600 dark:text-slate-300 mt-0.5 truncate">{user?.id}</p>
          </div>
          <div>
            <span className="text-slate-400">Last Sign In</span>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5">
              {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Account Created</span>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5">
              {user?.created_at ? new Date(user.created_at).toLocaleString() : '—'}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Auth Provider</span>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5 capitalize">
              {user?.app_metadata?.provider || 'email'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
