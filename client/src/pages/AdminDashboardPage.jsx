import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  UserPlus,
  FileSpreadsheet,
  RotateCcw,
  Settings,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileText,
  Search,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAuction } from '../context/AuctionSocketContext';
import { formatINR } from '../utils/formatters';

export default function AdminDashboardPage() {
  const { isSuperAdmin, isAuctioneer } = useAuth();
  const { tournament, teams, refreshState } = useAuction();

  const [activeTab, setActiveTab] = useState('import'); // Default to import or teams
  const [players, setPlayers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);

  // Tab 4: Import state
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [columnMapping, setColumnMapping] = useState({
    name: '',
    role: '',
    basePrice: '',
    department: '',
    academicYear: '',
    photoUrl: '',
    category: '',
    battingStyle: '',
    bowlingStyle: '',
    externalId: '',
  });

  // Tab 5: Reversal state
  const [reversalModal, setReversalModal] = useState(null);
  const [reversalReason, setReversalReason] = useState('');

  // Tab 2: Team Edit state
  const [editingTeam, setEditingTeam] = useState(null);

  // Tab 3: Player Create / Edit state
  const [playerModal, setPlayerModal] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'players') {
        const res = await api.get('/players?limit=100');
        if (res.data?.success) setPlayers(res.data.players || []);
      } else if (activeTab === 'teams') {
        const userRes = await api.get('/auth/demo-accounts');
        if (userRes.data?.success) setAllUsers(userRes.data.demoAccounts || []);
      } else if (activeTab === 'reversals') {
        const purRes = await api.get('/reports/purchases');
        if (purRes.data?.success) setPurchases(purRes.data.purchases || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ===================== IMPORT WORKFLOW (SECTION 6) =====================
  const handlePreviewImport = async (e) => {
    e.preventDefault();
    try {
      setImporting(true);
      const formData = new FormData();
      if (csvFile) formData.append('file', csvFile);
      if (googleSheetUrl) formData.append('googleSheetUrl', googleSheetUrl);
      formData.append('mapping', JSON.stringify(columnMapping));

      const res = await api.post('/players/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setImportPreview(res.data);
        // Auto-match common header names if not mapped yet
        const headers = res.data.headers || [];
        const newMapping = { ...columnMapping };
        headers.forEach((h) => {
          const lower = h.toLowerCase();
          if (!newMapping.name && (lower.includes('name') || lower.includes('player'))) newMapping.name = h;
          if (!newMapping.role && lower.includes('role')) newMapping.role = h;
          if (!newMapping.basePrice && (lower.includes('price') || lower.includes('base'))) newMapping.basePrice = h;
          if (!newMapping.department && (lower.includes('dept') || lower.includes('department'))) newMapping.department = h;
          if (!newMapping.academicYear && (lower.includes('year') || lower.includes('acad'))) newMapping.academicYear = h;
          if (!newMapping.photoUrl && (lower.includes('photo') || lower.includes('image') || lower.includes('url'))) newMapping.photoUrl = h;
          if (!newMapping.category && lower.includes('category')) newMapping.category = h;
          if (!newMapping.externalId && (lower.includes('id') || lower.includes('reg'))) newMapping.externalId = h;
        });
        setColumnMapping(newMapping);
      }
    } catch (err) {
      alert(`Preview failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview?.preview) return;
    try {
      setImporting(true);
      const res = await api.post('/players/import/confirm', {
        tournamentId: tournament?.id,
        mappedRows: importPreview.preview,
      });

      if (res.data?.success) {
        alert(res.data.message);
        setImportPreview(null);
        setCsvFile(null);
        setGoogleSheetUrl('');
        refreshState();
      }
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  // ===================== REVERSAL WORKFLOW (SECTION 11) =====================
  const handleExecuteReversal = async () => {
    if (!reversalModal || !reversalReason.trim()) {
      alert('Please provide a mandatory reason for reversing this transaction.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auction/reverse-sale', {
        purchaseId: reversalModal._id,
        reason: reversalReason.trim(),
      });

      if (res.data?.success) {
        alert('Transaction reversed successfully. Funds restored and player returned to available pool.');
        setReversalModal(null);
        setReversalReason('');
        fetchAdminData();
        refreshState();
      }
    } catch (err) {
      alert(`Reversal failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cpl-border">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-cpl-gold" />
            <h1 className="font-display font-black text-2xl text-white">
              ADMINISTRATION & TOURNAMENT CONTROL
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tournament configuration, player imports, 6 franchise assignments, and transaction audit desk.
          </p>
        </div>

        <button
          onClick={refreshState}
          className="px-3 py-1.5 rounded-lg bg-cpl-surface border border-cpl-border text-slate-300 text-xs font-bold hover:border-cpl-gold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh System</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-cpl-border gap-2">
        {[
          { id: 'import', label: 'Import Players (Sheets/CSV)', icon: FileSpreadsheet },
          { id: 'teams', label: '6 Franchises & Owners', icon: Users },
          { id: 'players', label: 'Player Directory', icon: UserPlus },
          { id: 'reversals', label: 'Audited Sale Reversals', icon: RotateCcw },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-cpl-gold bg-cpl-surface text-cpl-gold'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-cpl-surface/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================= TAB 1: IMPORT PLAYERS ======================= */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-cpl-border space-y-5">
            <div>
              <h3 className="font-display font-black text-lg text-white">
                Import Players from Google Sheets or CSV
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mt-1">
                Import collegiate players directly using an exported CSV or via Google Sheets URL.
                The system maps column headers, validates required player roles, detects duplicates,
                and guarantees existing SOLD records are never overwritten.
              </p>
            </div>

            <form onSubmit={handlePreviewImport} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Method A: Google Sheet URL */}
                <div className="p-4 rounded-xl bg-cpl-surface border border-cpl-border space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cpl-gold block">
                    Option A: Google Sheet URL
                  </span>
                  <input
                    type="url"
                    value={googleSheetUrl}
                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/..."
                    className="w-full bg-cpl-dark border border-cpl-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
                  />
                  <p className="text-[10px] text-slate-400">
                    Ensure sheet sharing is set to "Anyone with the link can view".
                  </p>
                </div>

                {/* Method B: CSV Upload */}
                <div className="p-4 rounded-xl bg-cpl-surface border border-cpl-border space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cpl-gold block">
                    Option B: Upload CSV File
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cpl-dark file:text-cpl-gold hover:file:bg-cpl-border"
                  />
                  <p className="text-[10px] text-slate-400">
                    Upload standard comma-separated spreadsheet export (.csv).
                  </p>
                </div>

              </div>

              <button
                type="submit"
                disabled={importing || (!googleSheetUrl && !csvFile)}
                className="gold-gradient-btn px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md hover:brightness-110 disabled:opacity-40 flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{importing ? 'Processing Spreadsheet...' : 'Inspect & Map Columns'}</span>
              </button>
            </form>
          </div>

          {/* Column Mapping & Preview Interface */}
          {importPreview && (
            <div className="glass-panel p-6 rounded-2xl border border-cpl-gold/50 shadow-gold space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-cpl-border">
                <div>
                  <h4 className="font-display font-black text-base text-white">
                    Header Column Mapping & Data Validation
                  </h4>
                  <p className="text-xs text-slate-400">
                    Match your spreadsheet columns with the tournament schema.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                    {importPreview.validCount} Valid
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                    {importPreview.errorCount} Errors
                  </span>
                </div>
              </div>

              {/* Column Selectors Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-cpl-surface/80 p-4 rounded-xl border border-cpl-border">
                {[
                  { key: 'name', label: 'Full Name *' },
                  { key: 'role', label: 'Playing Role *' },
                  { key: 'basePrice', label: 'Base Price (₹) *' },
                  { key: 'department', label: 'Department' },
                  { key: 'academicYear', label: 'Academic Year' },
                  { key: 'photoUrl', label: 'Photo URL' },
                  { key: 'category', label: 'Category' },
                  { key: 'externalId', label: 'Player ID / Reg No' },
                ].map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                      {field.label}
                    </label>
                    <select
                      value={columnMapping[field.key] || ''}
                      onChange={(e) => {
                        const next = { ...columnMapping, [field.key]: e.target.value };
                        setColumnMapping(next);
                      }}
                      className="w-full bg-cpl-dark border border-cpl-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cpl-gold"
                    >
                      <option value="">-- Match Header --</option>
                      {(importPreview.headers || []).map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview Rows Table */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Row-by-Row Validation ({importPreview.preview?.length || 0} rows)
                </span>
                <div className="overflow-x-auto max-h-72 border border-cpl-border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-cpl-surface sticky top-0 text-slate-400 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Base Price</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Status / Issues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cpl-border/50 text-slate-300 bg-cpl-dark/60">
                      {(importPreview.preview || []).map((row, idx) => (
                        <tr key={idx} className={row.isValid ? '' : 'bg-red-950/20'}>
                          <td className="p-3 text-slate-500">{row.rowIndex}</td>
                          <td className="p-3 font-bold text-white">{row.name || '<Empty>'}</td>
                          <td className="p-3">{row.role}</td>
                          <td className="p-3 font-mono">{formatINR(row.basePrice)}</td>
                          <td className="p-3">{row.department}</td>
                          <td className="p-3">
                            {row.isSoldAlready ? (
                              <span className="text-amber-400 font-bold">Already SOLD (Skipped)</span>
                            ) : row.isValid ? (
                              <span className="text-emerald-400 font-bold">Valid Ready</span>
                            ) : (
                              <span className="text-red-400">{row.issues?.join(', ')}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Confirm Import Action */}
              <div className="flex items-center justify-between pt-4 border-t border-cpl-border">
                <p className="text-xs text-slate-400">
                  Ready to store valid records into MongoDB.
                </p>
                <button
                  onClick={handleConfirmImport}
                  disabled={importing || importPreview.validCount === 0}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-black text-xs uppercase tracking-wider transition-colors shadow-md disabled:opacity-40"
                >
                  {importing ? 'Importing Records...' : `Confirm Import (${importPreview.validCount} Players)`}
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 2: TEAMS & OWNERS ======================= */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(teams || []).map((team) => (
              <div key={team._id} className="glass-panel p-5 rounded-2xl border border-cpl-border space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl overflow-hidden bg-cpl-dark border flex items-center justify-center p-0.5 shrink-0"
                    style={{ borderColor: team.primaryColor || '#F59E0B' }}
                  >
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="font-bold text-white text-xs">{team.shortCode}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-display font-black text-base text-white truncate">{team.name}</h4>
                    <span className="text-xs text-cpl-gold font-bold">{team.shortCode}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Initial Purse:</span>
                    <strong className="text-white">{formatINR(team.initialPurse)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Remaining:</span>
                    <strong className="text-cpl-gold">{formatINR(team.remainingPurse)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Assigned Owner:</span>
                    <strong className="text-slate-200">{team.ownerUserId?.name || 'Unassigned'}</strong>
                  </div>
                </div>

                {/* Owner Assign Select */}
                <div className="pt-3 border-t border-cpl-border space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">
                    Change Assigned Owner
                  </label>
                  <select
                    defaultValue={team.ownerUserId?._id || ''}
                    onChange={async (e) => {
                      if (!e.target.value) return;
                      try {
                        await api.post(`/teams/${team._id}/assign-owner`, { userId: e.target.value });
                        alert(`Assigned owner to ${team.name}`);
                        refreshState();
                      } catch (err) {
                        alert(err.message);
                      }
                    }}
                    className="w-full bg-cpl-dark border border-cpl-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cpl-gold"
                  >
                    <option value="">-- Assign Registered User --</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= TAB 3: PLAYERS DIRECTORY ======================= */}
      {activeTab === 'players' && (
        <div className="glass-panel rounded-2xl border border-cpl-border overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cpl-border">
            <h3 className="font-display font-black text-base text-white">Player Records in Database</h3>
            <span className="text-xs text-slate-400">{players.length} Total Players</span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-cpl-surface sticky top-0 text-slate-400 text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Base Price</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cpl-border/50 text-slate-300">
                {players.map((p) => (
                  <tr key={p._id} className="hover:bg-cpl-surface/50">
                    <td className="p-3 font-mono text-slate-500">{p.externalId || 'N/A'}</td>
                    <td className="p-3 font-bold text-white">{p.name}</td>
                    <td className="p-3">{p.role}</td>
                    <td className="p-3 font-mono">{formatINR(p.basePrice)}</td>
                    <td className="p-3">{p.department}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cpl-surface border border-cpl-border">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {p.status !== 'sold' ? (
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete player ${p.name}?`)) return;
                            try {
                              await api.delete(`/players/${p._id}`);
                              fetchAdminData();
                            } catch (err) {
                              alert(err.message);
                            }
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500">Locked (Sold)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================= TAB 5: REVERSALS ======================= */}
      {activeTab === 'reversals' && (
        <div className="glass-panel p-6 rounded-2xl border border-cpl-border space-y-6">
          <div>
            <h3 className="font-display font-black text-lg text-white">
              Audited Transaction Reversals
            </h3>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed mt-1">
              Correct erroneous transactions with full traceability. Reversing a purchase restores
              the winning team's purse, returns the player to the available pool, and permanently logs an audit record.
            </p>
          </div>

          <div className="overflow-x-auto border border-cpl-border rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-cpl-surface text-slate-400 text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-3">Player</th>
                  <th className="p-3">Purchasing Team</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Settlement Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cpl-border/50 text-slate-300">
                {purchases.map((pur) => {
                  const isReversed = pur.status === 'reversed';
                  return (
                    <tr key={pur._id} className={isReversed ? 'opacity-40' : 'hover:bg-cpl-surface/50'}>
                      <td className="p-3 font-bold text-white">{pur.playerId?.name || 'Player'}</td>
                      <td className="p-3 font-bold text-cpl-gold">{pur.winningTeamId?.name || 'Team'}</td>
                      <td className="p-3 font-display font-black">{formatINR(pur.finalPurchasePrice)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isReversed ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {pur.status}
                        </span>
                        {isReversed && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            Reason: {pur.reversalReason}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {!isReversed && (
                          <button
                            onClick={() => {
                              setReversalModal(pur);
                              setReversalReason('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold transition-colors"
                          >
                            Reverse Sale
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reversal Confirmation Modal */}
      {reversalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cpl-surface border border-red-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-500/20 text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-white">Reverse Sale Transaction</h3>
                <p className="text-xs text-slate-400">Restores {formatINR(reversalModal.finalPurchasePrice)} to team purse.</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Mandatory Reason for Audit Log *
              </label>
              <textarea
                rows={3}
                required
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="State the exact justification (e.g. Disputed countdown expiry, accidental bid)..."
                className="w-full bg-cpl-dark border border-cpl-border rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setReversalModal(null)}
                className="px-4 py-2 rounded-xl bg-cpl-surface border border-cpl-border text-slate-300 hover:text-white font-bold text-xs uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReversal}
                disabled={loading || !reversalReason.trim()}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-md disabled:opacity-40"
              >
                {loading ? 'Reversing...' : 'Confirm Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
