import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  UserPlus,
  AlertCircle,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';
import { formatINR } from '../../utils/formatters';

export const GOOGLE_FORM_FIELDS = [
  {
    title: 'Full Name',
    type: 'Short answer',
    required: true,
    description: 'First and last name as per college ID (e.g., Rudra Pratap Sengupta)',
    csvHeader: 'Full Name',
  },
  {
    title: 'Phone Number / WhatsApp',
    type: 'Short answer (10 digits)',
    required: true,
    description: '10-digit mobile number for unique 4-factor duplicate detection',
    csvHeader: 'Phone Number',
  },
  {
    title: 'Primary Playing Role',
    type: 'Multiple choice',
    options: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'],
    required: true,
    description: 'Core specialty on the cricket field',
    csvHeader: 'Playing Role',
  },
  {
    title: 'Batting Style',
    type: 'Multiple choice',
    options: ['Right-hand bat', 'Left-hand bat'],
    required: true,
    description: 'Batting orientation',
    csvHeader: 'Batting Style',
  },
  {
    title: 'Bowling Style',
    type: 'Multiple choice',
    options: [
      'Right-arm fast',
      'Right-arm medium',
      'Right-arm offbreak',
      'Right-arm leg spin',
      'Left-arm fast',
      'Left-arm orthodox spin',
      'None',
    ],
    required: true,
    description: 'Bowling discipline and action',
    csvHeader: 'Bowling Style',
  },
  {
    title: 'Department / College / Branch',
    type: 'Short answer',
    required: true,
    description: 'Academic department or campus branch (e.g., Computer Science)',
    csvHeader: 'Department',
  },
  {
    title: 'Academic Year',
    type: 'Multiple choice',
    options: ['1st Year (Freshman)', '2nd Year', '3rd Year', '4th Year', 'Alumni / Staff'],
    required: true,
    description: 'Current standing in university',
    csvHeader: 'Academic Year',
  },
  {
    title: 'Player Category',
    type: 'Multiple choice',
    options: ['Marquee', 'Category A', 'Category B', 'Emerging'],
    required: true,
    description: 'Tournament auction tier based on experience',
    csvHeader: 'Category',
  },
  {
    title: 'Base Price (Credits)',
    type: 'Number',
    required: true,
    description: 'Minimum opening bid in tournament credits (e.g. 2, 3, 5, 8, 10 Credits)',
    csvHeader: 'Base Price Credits',
  },
  {
    title: 'Player Photograph URL',
    type: 'Short answer (URL)',
    required: false,
    description: 'Direct link to high-res profile picture (Google Drive, Imgur, or direct URL)',
    csvHeader: 'Photo URL',
  },
  {
    title: 'Registration / Player ID',
    type: 'Short answer',
    required: false,
    description: 'Custom ID or roll number (e.g., MKS-P01)',
    csvHeader: 'Player ID',
  },
];

export default function GoogleFormCsvBuilder({ onPlayerCreated }) {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('form-spec'); // 'form-spec' | 'direct-register'
  
  // Direct Registration State
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    role: 'Batsman',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm medium',
    department: 'Computer Science',
    academicYear: '3rd Year',
    category: 'Category A',
    basePrice: 2,
    photoUrl: '',
    externalId: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Copy Google Form Blueprint to Clipboard
  const handleCopyFormSpec = () => {
    const text = GOOGLE_FORM_FIELDS.map((f, i) => {
      let line = `${i + 1}. [${f.title}] (${f.type}${f.required ? ', Required' : ', Optional'})\n   - Description: ${f.description}`;
      if (f.options) {
        line += `\n   - Options: ${f.options.join(' | ')}`;
      }
      return line;
    }).join('\n\n');

    navigator.clipboard.writeText(
      `MAIDAN KE SULTAN (SEASON 5) — GOOGLE FORM PLAYER REGISTRATION BLUEPRINT\n` +
      `========================================================================\n\n` +
      text
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Download Google Form CSV Template
  const handleDownloadTemplate = () => {
    const headers = GOOGLE_FORM_FIELDS.map((f) => f.csvHeader).join(',');
    const sampleRow1 = [
      '"Rudra Pratap Sengupta"',
      '"+91 98765 11001"',
      '"Batsman"',
      '"Right-hand bat"',
      '"Right-arm medium"',
      '"Computer Science"',
      '"4th Year"',
      '"Marquee"',
      '10',
      '"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"',
      '"MKS-P01"',
    ].join(',');
    const sampleRow2 = [
      '"Tariq Al-Mansoor"',
      '"+91 98765 11006"',
      '"Bowler"',
      '"Right-hand bat"',
      '"Left-arm orthodox spin"',
      '"Civil Engg"',
      '"4th Year"',
      '"Category A"',
      '5',
      '"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300"',
      '"MKS-P02"',
    ].join(',');

    const csvContent = `${headers}\n${sampleRow1}\n${sampleRow2}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'maidan_ke_sultan_players_registration_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export current live database players
  const handleExportLiveCsv = () => {
    window.open('/api/players/export/csv', '_blank');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.role) return;

    try {
      setSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      const res = await api.post('/players/register', formData);

      if (res.data?.success) {
        setSubmitSuccess(true);
        setFormData({
          name: '',
          phoneNumber: '',
          role: 'Batsman',
          battingStyle: 'Right-hand bat',
          bowlingStyle: 'Right-arm medium',
          department: 'Computer Science',
          academicYear: '3rd Year',
          category: 'Category A',
          basePrice: 2,
          photoUrl: '',
          externalId: '',
        });
        if (onPlayerCreated) onPlayerCreated(res.data.player);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-cpl-border overflow-hidden shadow-xl">
      
      {/* Top Header */}
      <div className="p-6 bg-gradient-to-r from-cpl-surface via-cpl-dark to-cpl-surface border-b border-cpl-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cpl-gold/15 text-cpl-gold border border-cpl-gold/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-display font-extrabold text-lg text-white">
              Google Form & CSV Player Registration Kit
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Collect player nominations through Google Forms or direct entry. Robust 4-factor
            composite verification (Mobile Number + Full Name + Academic Year + Branch) automatically
            prevents duplicate registrations.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 rounded-xl bg-cpl-surface border border-cpl-gold/40 text-cpl-gold hover:bg-cpl-gold hover:text-black transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Template</span>
          </button>

          <button
            onClick={handleExportLiveCsv}
            className="px-3.5 py-2 rounded-xl bg-cpl-surface border border-cpl-border text-white hover:border-cpl-gold/50 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Roster CSV</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-cpl-border px-6 pt-3 bg-cpl-surface/40 gap-4">
        <button
          onClick={() => setActiveSubTab('form-spec')}
          className={`pb-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'form-spec'
              ? 'border-cpl-gold text-cpl-gold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Google Form Question Blueprint</span>
        </button>

        <button
          onClick={() => setActiveSubTab('direct-register')}
          className={`pb-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'direct-register'
              ? 'border-cpl-gold text-cpl-gold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Direct Player Registration</span>
        </button>
      </div>

      {/* Tab 1 Content: Google Form Question Blueprint */}
      {activeSubTab === 'form-spec' && (
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-semibold">
              Copy these {GOOGLE_FORM_FIELDS.length} fields directly into your Google Form. When responses are exported as CSV, headers match automatically!
            </span>
            <button
              onClick={handleCopyFormSpec}
              className="px-3 py-1.5 rounded-lg bg-cpl-surface border border-cpl-border hover:border-cpl-gold text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Blueprint!' : 'Copy Form Blueprint'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {GOOGLE_FORM_FIELDS.map((field, idx) => (
              <div
                key={field.title}
                className="p-3.5 rounded-xl bg-cpl-surface/70 border border-cpl-border/80 flex flex-col justify-between space-y-2 hover:border-cpl-gold/30 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500">#{idx + 1}</span>
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                        field.required
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {field.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <h4 className="font-display font-black text-sm text-white mt-1">
                    {field.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {field.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-cpl-border/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-mono">Type: {field.type}</span>
                  <span className="text-cpl-gold font-mono font-bold">CSV: {field.csvHeader}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-cpl-gold/10 border border-cpl-gold/30 flex items-start gap-3 text-xs text-slate-300">
            <Sparkles className="w-5 h-5 text-cpl-gold shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-bold mb-0.5">
                Google Form to Live Website Integration Steps:
              </strong>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Create your Google Form using the blueprint fields above.</li>
                <li>Link the form to a Google Sheet (Form Responses &gt; Link to Sheets).</li>
                <li>Either export as <code className="text-cpl-gold">.csv</code> and upload below, or paste the Google Sheet URL directly.</li>
                <li>The system automatically validates entries and skips duplicates using the 4-factor composite key.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2 Content: Direct Player Registration */}
      {activeSubTab === 'direct-register' && (
        <form onSubmit={handleRegisterSubmit} className="p-6 space-y-5">
          {submitSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Player registered successfully into tournament pool!</span>
            </div>
          )}

          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Player Name */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rudra Sengupta"
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Phone Number / WhatsApp *
              </label>
              <input
                type="text"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="10-digit Mobile (e.g. 9876543210)"
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
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cpl-gold"
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
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cpl-gold"
              />
            </div>

            {/* Base Price */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Base Price (Credits) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cpl-gold"
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
                placeholder="e.g. Mechanical Engg"
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cpl-gold"
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
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cpl-gold"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Player Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cpl-gold"
              >
                <option value="Marquee">Marquee</option>
                <option value="Category A">Category A</option>
                <option value="Category B">Category B</option>
                <option value="Emerging">Emerging</option>
              </select>
            </div>

            {/* Photo URL */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Photo URL (Optional)
              </label>
              <input
                type="url"
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                placeholder="https://..."
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
              />
            </div>

            {/* Custom External ID */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Player ID / Reg No (Optional)
              </label>
              <input
                type="text"
                value={formData.externalId}
                onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
                placeholder="Auto-assigned (e.g. MKS-P16)"
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
              />
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !formData.name}
              className="gold-gradient-btn px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md hover:brightness-110 disabled:opacity-40 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'Registering Player...' : 'Save & Register Player'}</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
