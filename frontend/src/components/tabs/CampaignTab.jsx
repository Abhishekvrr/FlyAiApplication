import React, { useState, useEffect } from 'react';
import { Send, Mail, ExternalLink, ShieldAlert, CheckCircle2, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

export default function CampaignTab() {
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState('');
  const [campaignId, setCampaignId] = useState('CMP_2026_FALL');
  const [templateId, setTemplateId] = useState('TPL_PRODUCT_LAUNCH');
  const [sending, setSending] = useState(false);
  const [outgoingPayload, setOutgoingPayload] = useState(null);
  const [gatewayResponse, setGatewayResponse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTokens() {
      try {
        const data = await api.getCustomers({ limit: 50 });
        const list = (data.customers || []).map((c) => ({
          token: c.email_token,
          id: c.customer_id,
          city: c.city,
          segment: c.segment
        }));
        setTokens(list);
        if (list.length > 0) {
          setSelectedToken(list[0].token);
        }
      } catch (err) {
        console.error('Failed to load recipient tokens', err);
      }
    }
    loadTokens();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedToken) return;

    setSending(true);
    setError(null);
    setGatewayResponse(null);

    const payload = {
      recipient_token: selectedToken,
      campaign_id: campaignId,
      template_id: templateId,
    };

    setOutgoingPayload(payload);

    try {
      const response = await api.sendCampaignEmail(payload);
      setGatewayResponse(response);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Email dispatch failed.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Mailpit Access */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Send className="h-5 w-5 text-indigo-600" />
            Blind Marketing Campaign Execution Engine
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Enables marketing specialists and automation systems to dispatch personalized emails <strong>without ever seeing or possessing plaintext email addresses</strong>.
          </p>
        </div>

        <a
          href="http://localhost:8025"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-2xs transition-all"
        >
          <Mail className="h-4 w-4 text-indigo-600" />
          <span>Open Mailpit Inbox (:8025)</span>
          <ExternalLink className="h-3.5 w-3.5 text-indigo-600" />
        </a>
      </div>

      {/* Zero Plaintext Leakage Alert Banner */}
      <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-3">
        <Lock className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-indigo-900">
            Zero Plaintext Leakage Guarantee
          </h4>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
            The marketing specialist specifies solely the pseudonymous <code className="text-indigo-700 font-bold font-mono">recipient_token</code>.
            The Privacy Gateway securely decrypts the address in volatile memory, connects via SMTP to Mailpit, and returns a sanitized acknowledgement.
            <strong> The raw email address is NEVER returned to this interface or stored in application logs.</strong>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dispatch Form */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl space-y-4 border border-slate-200">
          <h3 className="text-xs uppercase font-bold text-slate-800 tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            Campaign Dispatch Configuration
          </h3>

          <form onSubmit={handleSend} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Select Blind Recipient Token
              </label>
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              >
                {tokens.map((t) => (
                  <option key={t.token} value={t.token}>
                    {t.id} — {t.token} ({t.city}, {t.segment})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Campaign Identifier
              </label>
              <input
                type="text"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Message Template ID
              </label>
              <input
                type="text"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={sending || !selectedToken}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {sending ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Routing via Gateway...
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
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
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
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>
                  Message successfully delivered to Mailpit! Recipient token: <strong className="font-mono text-emerald-950">{gatewayResponse.recipient_token}</strong>
                </span>
              </div>
              <a
                href="http://localhost:8025"
                target="_blank"
                rel="noreferrer"
                className="underline text-emerald-800 hover:text-emerald-950 text-[11px] font-bold"
              >
                Inspect Mailbox &rarr;
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
