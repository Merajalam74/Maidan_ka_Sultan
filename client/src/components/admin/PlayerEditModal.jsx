import React, { useState, useEffect } from 'react';
import { X, User, DollarSign, Award, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function PlayerEditModal({ isOpen, onClose, player, onSaved }) {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    role: 'Batsman',
    category: 'Category A',
    basePrice: 2,
    department: '',
    academicYear: '',
    battingStyle: '',
    bowlingStyle: '',
    photoUrl: '',
    externalId: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isSold = player?.status === 'sold';

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name || '',
        phoneNumber: player.phoneNumber || '',
        role: player.role || 'Batsman',
        category: player.category || 'Category A',
        basePrice: player.basePrice ?? 2,
        department: player.department || '',
        academicYear: player.academicYear || '',
        battingStyle: player.battingStyle || 'Right-hand bat',
        bowlingStyle: player.bowlingStyle || 'Right-arm medium',
        photoUrl: player.photoUrl || '',
        externalId: player.externalId || '',
      });
      setError('');
      setSuccess('');
    }
  }, [player, isOpen]);

  if (!isOpen || !player) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Player name is required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.put(`/players/${player._id}`, {
        ...formData,
        name: formData.name.trim(),
        basePrice: Number(formData.basePrice),
      });

      if (res.data?.success) {
        setSuccess('Player profile updated successfully!');
        if (onSaved) onSaved(res.data.player);
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update player.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-cpl-border p-6 shadow-2xl space-y-6 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cpl-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cpl-surface border border-cpl-border flex items-center justify-center text-cpl-gold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-lg text-white">
                  Edit Player Profile
                </h3>
                {isSold && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    SOLD (Financials Locked)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Update player demographics, playing role, base price, and photos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-cpl-surface hover:bg-cpl-border text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Name */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Mobile Number *
              </label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="10-digit mobile"
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
              />
            </div>

            {/* Role */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Playing Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cpl-gold"
              >
                <option value="Batsman">Batsman</option>
                <option value="Bowler">Bowler</option>
                <option value="All-Rounder">All-Rounder</option>
                <option value="Wicket-Keeper">Wicket-Keeper</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Auction Tier / Category
              </label>
              <select
                disabled={isSold}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cpl-gold disabled:opacity-40"
              >
                <option value="Marquee">Marquee</option>
                <option value="Category A">Category A</option>
                <option value="Category B">Category B</option>
                <option value="Emerging">Emerging</option>
              </select>
            </div>

            {/* Base Price in Credits */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Base Price (Credits) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                disabled={isSold}
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold font-mono disabled:opacity-40"
              />
            </div>

            {/* Player ID */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Registration / Player ID
              </label>
              <input
                type="text"
                value={formData.externalId}
                onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold font-mono"
              />
            </div>

            {/* Department */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Department / Branch
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Computer Science"
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
              />
            </div>

            {/* Academic Year */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Academic Year
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="e.g. 3rd Year"
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
              />
            </div>

            {/* Batting Style */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Batting Style
              </label>
              <input
                type="text"
                value={formData.battingStyle}
                onChange={(e) => setFormData({ ...formData, battingStyle: e.target.value })}
                placeholder="e.g. Right-hand bat"
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
              />
            </div>

            {/* Bowling Style */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Bowling Style
              </label>
              <input
                type="text"
                value={formData.bowlingStyle}
                onChange={(e) => setFormData({ ...formData, bowlingStyle: e.target.value })}
                placeholder="e.g. Right-arm medium"
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
              />
            </div>

            {/* Photo URL */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Photo URL
              </label>
              <input
                type="url"
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                placeholder="https://..."
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
              />
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cpl-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-cpl-surface hover:bg-cpl-border text-slate-300 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="gold-gradient-btn px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-gold hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Update Player Profile'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
