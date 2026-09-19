import React, { useState, useEffect } from 'react';
import {
  Send,
  Mail,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Lock,
  Sparkles,
  Search,
  RefreshCw,
  HelpCircle,
  Check,
  UserPlus,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { api } from '../../services/api';
import { soundFX } from '../../utils/audio';

const PRESET_TEMPLATES = [
  {
    id: 'TPL_WELCOME',
    name: 'Privacy Welcome',
    subject: 'Welcome to Flyy.AI Zero-Plaintext Vault!',
    message:
      'Hello Abhishek!\n\nThis is a private, zero-exposure email dispatched directly from the Flyy.AI Privacy-Preserving Customer Data Platform.\n\nYour personal email address was never exposed to the marketing team; it was resolved strictly in RAM by the Privacy Gateway.\n\nEnjoy complete privacy!',
  },
  {
    id: 'TPL_OFFER_50',
    name: 'Special 50% Offer',
    subject: 'Exclusive 50% Welcome Discount for Premium Members!',
    message:
      'Hi there!\n\nAs a valued customer, we are excited to offer you an exclusive 50% discount on your next service.\n\nClaim your reward safely with zero data tracking.\n\nBest regards,\nThe Growth Team',
  },
  {
    id: 'TPL_PRODUCT_LAUNCH',
    name: 'Product Launch',
    subject: 'Announcing Flyy.AI Next-Gen Privacy CDP 2.0',
    message:
      'Exciting news!\n\nWe have officially released Flyy.AI 2.0 featuring Format-Preserving Encryption, Zero-Plaintext Blind Dispatch, and PBAC Exception Unmasking.\n\nCheck it out today!',
  },
];

export default function CampaignTab({ refreshKey, onOpenAddCustomer }) {
  const [tokens, setTokens] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  const [campaignId, setCampaignId] = useState('CMP_2026_FALL');
  const [templateId, setTemplateId] = useState('TPL_WELCOME');
  const [emailSubject, setEmailSubject] = useState(PRESET_TEMPLATES[0].subject);
  const [emailMessage, setEmailMessage] = useState(PRESET_TEMPLATES[0].message);
  const [sending, setSending] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [outgoingPayload, setOutgoingPayload] = useState(null);
  const [gatewayResponse, setGatewayResponse] = useState(null);
  const [error, setError] = useState(null);


  const loadTokens = async () => {
    setLoadingTokens(true);
    try {
      // Query up to 500 customers from PostgreSQL
      const data = await api.getCustomers({ limit: 500 });
      const list = (data.customers || []).map((c) => {
        const numId = parseInt(c.customer_id.replace(/\D/g, ''), 10) || 0;
        return {
          token: c.email_token,
          id: c.customer_id,
          numId: numId,
          city: c.city,
          segment: c.segment,
          isNew: numId > 50
        };
      });

      // Sort descending so newest additions (e.g. C053, C052) appear at the very top!
      list.sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));
      setTokens(list);

      if (list.length > 0) {
        // If current selectedToken is not in the new list, preselect the newest one
        if (!selectedToken || !list.some((item) => item.token === selectedToken)) {
          setSelectedToken(list[0].token);
        }
      }
    } catch (err) {
      console.error('Failed to load recipient tokens', err);
    } finally {
      setLoadingTokens(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, [refreshKey]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedToken) return;

    setSending(true);
    setError(null);
    setGatewayResponse(null);
    soundFX.playScanPing();

    const payload = {
      recipient_token: selectedToken,
      campaign_id: campaignId,
      template_id: templateId,
      subject: emailSubject,
      message: emailMessage,
      custom_message: emailMessage,
    };


    setOutgoingPayload(payload);

    try {
      const response = await api.sendCampaignEmail(payload);
      setGatewayResponse(response);
      soundFX.playSuccessChime();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Email dispatch failed.');
    } finally {
      setSending(false);
    }
  };

  const filteredTokens = tokens.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.token.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q) ||
      t.segment.toLowerCase().includes(q)
    );
  });

  const selectedCust = tokens.find((t) => t.token === selectedToken);

  return (
    <div className="space-y-5">
      {/* Header & Mailpit Access */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Send className="h-5 w-5 text-indigo-600" />
              Marketing Blind Campaign Execution
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
              Blind Token Proxy
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dispatch personalized emails via Mailpit SMTP using recipient tokens &bull; Zero plaintext email exposure
          </p>
        </div>

        {/* Live Mailpit Shortcut Badge */}
        <div className="flex items-center gap-2">
          {onOpenAddCustomer && (
            <button
              type="button"
              onClick={onOpenAddCustomer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
              <span>Add Customer</span>
            </button>
          )}

          <a
            href="http://localhost:8025"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
            title="Open simulated local SMTP inbox at localhost:8025"
          >
            <Mail className="h-3.5 w-3.5 text-white" />
            <span>Open Mailpit Inbox (:8025)</span>
            <ExternalLink className="h-3 w-3 text-white/80" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Dispatch Form Card */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl space-y-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs uppercase font-bold text-slate-800 tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>Campaign Dispatch Configuration</span>
            </h3>
            <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-bold">
              {tokens.length} Recipients in DB
            </span>
          </div>

          <form onSubmit={handleSend} className="space-y-3.5">
            {/* Smart Customer Profile Suggestion System */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-700">
                  Target Customer Profile
                </label>
                <button
                  type="button"
                  onClick={loadTokens}
                  disabled={loadingTokens}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors"
                  title="Reload customer list from PostgreSQL"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingTokens ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* 1-Click Quick Suggested Profiles */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Suggested Profiles (1-Click Access)
                </span>
                <div className="flex items-center flex-wrap gap-1.5">
                  {tokens.slice(0, 5).map((t) => {
                    const isSelected = selectedToken === t.token;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedToken(t.token);
                          soundFX.playClick();
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold transition-all flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs scale-[1.02]'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {t.isNew && <span className="text-amber-400">★</span>}
                        <span>{t.id}</span>
                        <span className={`text-[10px] font-sans font-normal ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                          ({t.city})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Autocomplete Search by Customer ID or City */}
              <div className="relative">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type Customer ID (e.g. C052) to suggest profile..."
                    className="w-full pl-8 pr-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Filtered Profile Dropdown Selector */}
                <select
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="w-full mt-1.5 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                >
                  {filteredTokens.length === 0 ? (
                    <option value="">No matching customer profiles found</option>
                  ) : (
                    filteredTokens.map((t) => (
                      <option key={t.token} value={t.token}>
                        {t.id} — {t.city} ({t.segment}){t.isNew ? ' ★ [RECENTLY ADDED]' : ''} &bull; {t.token}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Rich Active Customer Profile Snapshot Card */}
              {selectedCust && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/90 via-white to-blue-50/70 border border-indigo-200/90 shadow-2xs space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-mono font-extrabold text-xs flex items-center justify-center shadow-xs">
                        {selectedCust.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-slate-900">
                            Customer Profile {selectedCust.id}
                          </span>
                          {selectedCust.isNew && (
                            <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                              ★ Your Added Record
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          Location: <strong className="text-slate-700">{selectedCust.city}</strong> &bull; Segment: <strong className="text-slate-700">{selectedCust.segment}</strong>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Vault Protected
                    </span>
                  </div>

                  <div className="pt-2 border-t border-indigo-100/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Encrypted Token:</span>
                    <span className="text-indigo-700 font-bold bg-white px-2 py-0.5 rounded border border-indigo-200 shadow-2xs">
                      {selectedCust.token}
                    </span>
                  </div>
                </div>
              )}
            </div>


            {/* Customizable Email Subject & Message Editor */}
            <div className="space-y-3 pt-2.5 border-t border-slate-200/80">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Email Subject Line
                  </label>
                  <span className="text-[10px] text-indigo-600 font-medium">Customizable</span>
                </div>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="e.g. Exclusive Welcome Offer for You!"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Custom Message Content
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {emailMessage.length} characters
                  </span>
                </div>

                {/* Pre-made Template Selector Buttons */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Quick Presets:</span>
                  {PRESET_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        setTemplateId(tmpl.id);
                        setEmailSubject(tmpl.subject);
                        setEmailMessage(tmpl.message);
                        soundFX.playClick();
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                        templateId === tmpl.id
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>

                <textarea
                  required
                  rows={4}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Type your personalized message here..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y"
                />
              </div>

              {/* Collapsible Metadata: Campaign & Template Identifiers */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Campaign Identifier
                  </label>
                  <input
                    type="text"
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Template Identifier
                  </label>
                  <input
                    type="text"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-mono"
                  />
                </div>
              </div>
            </div>


            <button
              type="submit"
              disabled={sending || !selectedToken}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
            >
              {sending ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Routing via Gateway in RAM...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 fill-white" />
                  Dispatch Blind Message
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
        </div>


        {/* Right Column: Blind Execution Visualizer */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl space-y-4 border border-slate-200">
          <h3 className="text-xs uppercase font-bold text-slate-800 tracking-wider border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>Blind Execution Visualizer (Client-Gateway Wire Inspection)</span>
            <span className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded">SMTP: 127.0.0.1:1025</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Outgoing Request */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                    Outgoing Wire Payload
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-semibold">CLIENT REQUEST</span>
                </div>
                <pre className="text-[11px] font-mono text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 overflow-x-auto">
                  {outgoingPayload
                    ? JSON.stringify(outgoingPayload, null, 2)
                    : '// Awaiting campaign dispatch...'}
                </pre>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Contains only pseudonymous token. No personal data transmitted across the wire.
              </p>
            </div>

            {/* Gateway Response */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                    Gateway Response
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-semibold">STATUS 200 OK</span>
                </div>
                <pre className="text-[11px] font-mono text-emerald-800 bg-white p-2.5 rounded-lg border border-slate-200 overflow-x-auto">
                  {gatewayResponse
                    ? JSON.stringify(gatewayResponse, null, 2)
                    : '// Gateway acknowledgement will appear here'}
                </pre>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Decrypted destination resolved in RAM only; never reflected back in HTTP response.
              </p>
            </div>
          </div>

          {gatewayResponse && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Message successfully delivered to Mailpit! Recipient token: <strong className="font-mono text-emerald-950">{gatewayResponse.recipient_token}</strong>
                </span>
              </div>
              <a
                href="http://localhost:8025"
                target="_blank"
                rel="noreferrer"
                className="underline text-emerald-800 hover:text-emerald-950 text-[11px] font-bold shrink-0 ml-2"
              >
                Inspect Mailbox &rarr;
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Educational Architecture Explanation Card */}
      <div className="glass-panel p-5 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/60 via-blue-50/40 to-slate-50 space-y-3">
        <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>How Blind Token Dispatch Works (Sending an Email to Yourself)</span>
          </h4>
          <span className="text-[10px] font-mono text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded font-bold">
            Zero-Plaintext Architecture
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white/80 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono font-bold text-indigo-600">STEP 1</span>
            <h5 className="font-bold text-slate-900">Email Vaulted</h5>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              When you added customer record <strong className="text-indigo-900 font-mono">C052</strong>, your raw email was encrypted via AES-256-GCM into the PostgreSQL vault and assigned token <code className="text-indigo-800 font-mono font-semibold">EMAIL_627483E469</code>.
            </p>
          </div>

          <div className="p-3 bg-white/80 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono font-bold text-indigo-600">STEP 2</span>
            <h5 className="font-bold text-slate-900">Select &amp; Dispatch</h5>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Select <strong className="font-mono text-indigo-900">C052</strong> from the dropdown. Marketers and campaign operators only see tokens — zero email addresses are exposed in the browser.
            </p>
          </div>

          <div className="p-3 bg-white/80 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono font-bold text-indigo-600">STEP 3</span>
            <h5 className="font-bold text-slate-900">Private RAM Resolution</h5>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              When you click <em>Dispatch</em>, only the token travels over the network. The backend decrypts your destination email in temporary RAM and sends it to the SMTP gateway.
            </p>
          </div>

          <div className="p-3 bg-white/80 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono font-bold text-indigo-600">STEP 4</span>
            <h5 className="font-bold text-slate-900">Delivered to Mailbox</h5>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Open <a href="http://localhost:8025" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-bold">Mailpit (:8025)</a> to see your delivered email message with subject and body delivered to your email!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

