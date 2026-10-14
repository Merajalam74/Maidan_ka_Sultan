import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Crown,
  Shield,
  Palette,
  Image as ImageIcon,
  DollarSign,
  Users,
  Sparkles,
  Trash2,
  KeyRound,
  Lock,
} from 'lucide-react';
import api from '../../services/api';
import { formatINR } from '../../utils/formatters';

const PRESET_COLORS = [
  { name: 'Crimson', primary: '#EF4444', secondary: '#991B1B' },
  { name: 'Emerald', primary: '#10B981', secondary: '#064E3B' },
  { name: 'Violet', primary: '#8B5CF6', secondary: '#5B21B6' },
  { name: 'Orange', primary: '#F97316', secondary: '#C2410C' },
  { name: 'Cyan', primary: '#06B6D4', secondary: '#0E7490' },
  { name: 'Gold', primary: '#EAB308', secondary: '#854D0E' },
  { name: 'Rose', primary: '#F43F5E', secondary: '#9F1239' },
  { name: 'Blue', primary: '#3B82F6', secondary: '#1E40AF' },
];

export default function TeamFormModal({ isOpen, onClose, team = null, onSaved }) {
  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#EF4444');
  const [secondaryColor, setSecondaryColor] = useState('#991B1B');
  const [initialPurse, setInitialPurse] = useState(100);
  const [maxSquadSize, setMaxSquadSize] = useState(15);
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = Boolean(team && team._id);

  useEffect(() => {
    if (team) {
      setName(team.name || '');
      setShortCode(team.shortCode || '');
      setCaptainName(team.captainName || '');
      setLogoUrl(team.logoUrl || '');
      setPrimaryColor(team.primaryColor || '#EF4444');
      setSecondaryColor(team.secondaryColor || '#991B1B');
      setInitialPurse(team.initialPurse ?? 100);
      setMaxSquadSize(team.maxSquadSize || 15);
      setOwnerName(team.ownerUserId?.name || '');
      setOwnerEmail(team.ownerUserId?.email || '');
      setOwnerPassword('');
    } else {
      setName('');
      setShortCode('');
      setCaptainName('');
      setLogoUrl('');
      setPrimaryColor('#EF4444');
      setSecondaryColor('#991B1B');
      setInitialPurse(100);
      setMaxSquadSize(15);
      setOwnerName('');
      setOwnerEmail('');
      setOwnerPassword('');
    }
    setError('');
    setUploadMessage(null);
  }, [team, isOpen]);

  if (!isOpen) return null;

  // Handle Cloudinary logo file upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      setError('');
      setUploadMessage(null);

      const formData = new FormData();
      formData.append('logo', file);

      const uploadUrl = isEditing
        ? `/teams/${team._id}/upload-logo`
        : '/teams/upload-logo';

      const res = await api.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data.url) {
        setLogoUrl(res.data.url);
        setUploadMessage({
          type: 'success',
          text: res.data.isConfigured
            ? 'Uploaded to Cloudinary CDN successfully!'
            : 'Logo preview loaded (Cloudinary credentials not set in .env, preview active).',
        });
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Team name is required.');
      return;
    }

    if (!shortCode.trim()) {
      setError('Team short code is required (e.g. JBK, MQX).');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        shortCode: shortCode.trim().toUpperCase(),
        captainName: captainName.trim(),
        logoUrl: logoUrl.trim(),
        primaryColor,
        secondaryColor,
        initialPurse: Number(initialPurse) >= 0 ? Number(initialPurse) : 100,
        maxSquadSize: Number(maxSquadSize) || 15,
      };

      if (ownerName.trim()) payload.ownerName = ownerName.trim();
      if (ownerEmail.trim()) payload.ownerEmail = ownerEmail.trim().toLowerCase();
      if (ownerPassword.trim()) {
        if (ownerPassword.trim().length < 6) {
          setError('Team owner password must be at least 6 characters.');
          setSubmitting(false);
          return;
        }
        payload.ownerPassword = ownerPassword.trim();
      }

      let res;
      if (isEditing) {
        res = await api.put(`/teams/${team._id}`, payload);
      } else {
        res = await api.post('/teams', payload);
      }

      if (res.data?.success) {
        onSaved(res.data.team);
        onClose();
      }
    } catch (err) {
      console.error('Save team error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save team.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-cpl-border p-6 shadow-2xl space-y-6 my-8 animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cpl-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cpl-gold to-cpl-gold-dark p-0.5 shadow-gold">
              <div className="w-full h-full bg-cpl-dark rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-cpl-gold" />
              </div>
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white">
                {isEditing ? `Edit Team: ${team.name}` : 'Add New Tournament Team'}
              </h3>
              <p className="text-xs text-slate-400">
                Configure team identity, captain, purse allocation, and Cloudinary logo.
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

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Live Badge Preview Card */}
          <div
            className="p-4 rounded-2xl border transition-all flex items-center justify-between"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}22 0%, #0D1527 100%)`,
              borderColor: `${primaryColor}66`,
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl overflow-hidden bg-cpl-dark border-2 flex items-center justify-center shrink-0 shadow-lg"
                style={{ borderColor: primaryColor }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span className="font-display font-black text-xl text-white">
                    {shortCode || 'NEW'}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cpl-dark text-cpl-gold border border-cpl-border">
                    {shortCode || 'CODE'}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    Purse: {formatINR(initialPurse)}
                  </span>
                </div>
                <h4 className="font-display font-black text-lg text-white mt-0.5">
                  {name || 'Team Name Preview'}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold mt-0.5">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Captain: {captainName || 'Not Announced'}</span>
                </div>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400">
              <span className="block text-white font-bold">{maxSquadSize} Slots</span>
              <span>Squad Limit</span>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Team Name */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                Team Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Strikers"
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
              />
            </div>

            {/* Short Code */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                Short Code (3-5 Letters) *
              </label>
              <input
                type="text"
                required
                maxLength={5}
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                placeholder="e.g. RST"
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white uppercase font-mono placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
              />
            </div>

            {/* Captain Name */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Crown className="w-3.5 h-3.5 text-cpl-gold" />
                <span>Team Captain Name</span>
              </label>
              <input
                type="text"
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                placeholder="e.g. Rohit Sharma / Sarah Khan"
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
              />
            </div>

            {/* Logo Upload through Cloudinary */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-cpl-surface/80 border border-cpl-border space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-cpl-gold flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4" />
                  <span>Team Logo (Upload via Cloudinary)</span>
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Logo</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* File picker button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={uploadingLogo}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cpl-dark hover:bg-cpl-border border border-cpl-border hover:border-cpl-gold/50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0"
                >
                  <UploadCloud className="w-4 h-4 text-cpl-gold" />
                  <span>{uploadingLogo ? 'Uploading to Cloudinary...' : 'Choose Logo File'}</span>
                </button>

                <div className="w-full">
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Or paste Cloudinary / direct image URL"
                    className="w-full bg-cpl-dark border border-cpl-border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
                  />
                </div>
              </div>

              {uploadMessage && (
                <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{uploadMessage.text}</span>
                </div>
              )}
            </div>

            {/* Color Selection with Presets */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cpl-gold" />
                <span>Franchise Colors</span>
              </label>

              {/* Preset Chips */}
              <div className="flex flex-wrap gap-2 pb-1">
                {PRESET_COLORS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setPrimaryColor(p.primary);
                      setSecondaryColor(p.secondary);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cpl-surface border border-cpl-border hover:border-cpl-gold/50 text-[11px] text-white transition-all"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: p.primary }}
                    />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-8 h-8 rounded border border-cpl-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full bg-cpl-surface border border-cpl-border rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-8 h-8 rounded border border-cpl-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-full bg-cpl-surface border border-cpl-border rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Initial Purse */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-1.5">
                <DollarSign className="w-3.5 h-3.5 text-cpl-gold" />
                <span>Initial Purse (Credits / CR)</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={initialPurse}
                onChange={(e) => setInitialPurse(Number(e.target.value))}
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold font-mono"
              />
            </div>

            {/* Max Squad Size */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Users className="w-3.5 h-3.5 text-cpl-gold" />
                <span>Max Squad Slots</span>
              </label>
              <input
                type="number"
                min="11"
                max="25"
                value={maxSquadSize}
                onChange={(e) => setMaxSquadSize(Number(e.target.value))}
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold font-mono"
              />
            </div>

            {/* Franchise Owner Account & Login Credentials */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-cpl-surface/80 border border-cpl-border space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cpl-gold" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Franchise Owner Account & Login Credentials
                </h4>
              </div>
              <p className="text-[11px] text-slate-400">
                Provide login credentials for the team owner. The owner will use these credentials to log in and place bids during the auction. Once logged in, the owner can also update their password.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-300 block mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-cpl-dark border border-cpl-border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-300 block mb-1">
                    Login Email
                  </label>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="e.g. owner@jebkatre.com"
                    className="w-full bg-cpl-dark border border-cpl-border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-300 block mb-1">
                    {isEditing ? 'New Password (Optional)' : 'Login Password *'}
                  </label>
                  <input
                    type="password"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder={isEditing ? 'Keep existing password' : 'Min 6 characters'}
                    className="w-full bg-cpl-dark border border-cpl-border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
                  />
                </div>
              </div>
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
              disabled={submitting || uploadingLogo}
              className="gold-gradient-btn px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-gold hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'Saving Team...' : isEditing ? 'Update Team' : 'Create Team'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
