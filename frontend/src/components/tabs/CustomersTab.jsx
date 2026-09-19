import React, { useState, useEffect } from 'react';
import { ShieldCheck, Download, Search, Filter, Lock, Shield, CheckCircle2, AlertOctagon, UserPlus, Database, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

export default function CustomersTab({ onOpenAddCustomer, refreshKey }) {
  const [customers, setCustomers] = useState([]);
  const [sourceCustomers, setSourceCustomers] = useState([]);
  const [showSourceStore, setShowSourceStore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cityFilter, setCityFilter] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (cityFilter) params.city = cityFilter;
      if (segmentFilter) params.segment = segmentFilter;
      const data = await api.getCustomers(params);
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch protected customers', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSourceCustomers = async () => {
    try {
      const data = await api.getSourceCustomers(50);
      setSourceCustomers(data || []);
    } catch (err) {
      console.error('Failed to fetch source customers', err);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchSourceCustomers();
  }, [cityFilter, segmentFilter, refreshKey]);


  const handleExportCSV = async () => {
    setDownloading(true);
    try {
      const params = {};
      if (cityFilter) params.city = cityFilter;
      if (segmentFilter) params.segment = segmentFilter;
      await api.downloadCustomersCSV(params);
    } catch (err) {
      alert('Failed to download CSV export');
    } finally {
      setDownloading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.customer_id.toLowerCase().includes(q) ||
      c.name_token.toLowerCase().includes(q) ||
      c.email_token.toLowerCase().includes(q) ||
      c.mobile_fpe.includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header with Prominent CSV Export */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Protected Customer Store
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Zero Plaintext
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Querying <code className="text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded font-mono font-semibold">protected_store.customers_protected</code> &bull; Tokens &amp; 10-digit FF1 phone integers
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={downloading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 text-white" />
            <span>{downloading ? 'Generating CSV...' : 'Export Protected CSV'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddCustomer}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold shadow-sm hover:shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Add customer permanently to PostgreSQL database"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Add New Customer</span>
          </button>


          <button
            type="button"
            onClick={() => setShowSourceStore(!showSourceStore)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
          >
            <Database className="h-3.5 w-3.5 text-slate-600" />
            <span>{showSourceStore ? 'Hide Source' : 'Compare Source'}</span>
          </button>
        </div>
      </div>

      {/* Quick Security Guarantee Micro-Badge */}
      <div className="px-4 py-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80 text-xs text-indigo-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 shrink-0 text-indigo-600" />
          <span className="text-[11px]">
            <strong>Zero Plaintext Guarantee:</strong> Relational joins use HMAC deterministic tokens. Mobile numbers preserve 10 digits via FF1 FPE.
          </span>
        </div>
        <span className="hidden sm:inline-block text-[10px] font-mono text-indigo-800 font-bold bg-indigo-100/80 px-2 py-0.5 rounded border border-indigo-200">
          Total: {total} Records
        </span>
      </div>

      {/* Optional Raw Source Store Comparison Box */}
      {showSourceStore && (
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl animate-in fade-in space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-amber-600" />
                Raw Source Database View: source_store.customers (Plaintext PII Comparison)
              </span>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Notice: Raw PII is isolated here and NEVER queryable by downstream analytics. Compare with the de-identified tokens below.
              </p>
            </div>
            <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
              Isolated Raw DB
            </span>
          </div>

          <div className="overflow-x-auto bg-white rounded-xl border border-amber-200 shadow-2xs">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-amber-100/50 text-[11px] uppercase font-bold text-amber-900 border-b border-amber-200">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Raw Name</th>
                  <th className="px-3 py-2">Raw Email (Plaintext)</th>
                  <th className="px-3 py-2">Raw Mobile (10 Digits)</th>
                  <th className="px-3 py-2">City</th>
                  <th className="px-3 py-2">Segment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 text-[11px]">
                {sourceCustomers.slice(0, 5).map((sc) => (
                  <tr key={sc.customer_id} className="hover:bg-amber-50/40">
                    <td className="px-3 py-2 font-bold">{sc.customer_id}</td>
                    <td className="px-3 py-2">{sc.name}</td>
                    <td className="px-3 py-2 text-amber-800 font-semibold">{sc.email}</td>
                    <td className="px-3 py-2 text-amber-800 font-semibold">{sc.mobile}</td>
                    <td className="px-3 py-2">{sc.city}</td>
                    <td className="px-3 py-2">{sc.segment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, token, FPE phone, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Cities</option>
            <option value="Chennai">Chennai</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Delhi">Delhi</option>
            <option value="Pune">Pune</option>
            <option value="Kolkata">Kolkata</option>
            <option value="Ahmedabad">Ahmedabad</option>
          </select>

          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Segments</option>
            <option value="Premium">Premium</option>
            <option value="Standard">Standard</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">
            Protected Records ({filteredCustomers.length} of {total})
          </span>
          <span className="font-mono text-slate-600">
            Target Schema: <span className="text-emerald-700 font-bold">protected_store</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 uppercase text-[11px] font-bold text-slate-600 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-4 py-3">Customer ID</th>
                <th className="px-4 py-3">Name Token (HMAC)</th>
                <th className="px-4 py-3">Email Token (HMAC)</th>
                <th className="px-4 py-3">10-Digit Mobile (FPE)</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Segment</th>
                <th className="px-4 py-3">Bounce Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-500 text-xs">
                    {loading ? 'Loading protected records...' : 'No customer records match the criteria.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.customer_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {c.customer_id}
                    </td>
                    <td className="px-4 py-3 font-mono text-indigo-700 font-medium">
                      {c.name_token}
                    </td>
                    <td className="px-4 py-3 font-mono text-indigo-700 font-medium">
                      {c.email_token}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold tracking-wider" title="Format-Preserving Encrypted (Exactly 10 Digits)">
                        {c.mobile_fpe}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800">{c.city}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        c.segment === 'Premium'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : c.segment === 'Enterprise'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {c.segment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.bounce_status === 'BOUNCED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                          <AlertOctagon className="h-3 w-3 text-rose-600" />
                          BOUNCED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          CLEAN
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
