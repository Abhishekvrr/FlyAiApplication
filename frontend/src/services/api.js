import axios from 'axios';

// Base API configuration: use proxy or direct backend URL
const API_BASE_URL = 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const api = {
  // 1. Health & Status
  async checkHealth() {
    const res = await client.get('/health');
    return res.data;
  },

  // 2. PII Discovery
  async discoverPII(sampleSize = 20) {
    const res = await client.post(`/api/discover?sample_size=${sampleSize}`);
    return res.data;
  },

  // 3. Batch Pipeline
  async runBatch(chunkSize = 500, sourceTable = 'customers') {
    const res = await client.post('/api/batch/run', {
      chunk_size: chunkSize,
      source_table: sourceTable,
    });
    return res.data;
  },

  async getBatchList() {
    const res = await client.get('/api/batch');
    return res.data;
  },

  async getBatchJob(batchId) {
    const res = await client.get(`/api/batch/${batchId}`);
    return res.data;
  },

  // 4. Protected Customers
  async getCustomers(params = {}) {
    const res = await client.get('/api/customers', { params });
    return res.data;
  },

  async getCustomer(customerId) {
    const res = await client.get(`/api/customers/${customerId}`);
    return res.data;
  },

  async downloadCustomersCSV(params = {}) {
    const res = await client.get('/api/customers/export-csv', {
      params,
      responseType: 'blob',
    });
    // Create client-side download link
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'customers_protected.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // 5. Sandbox & Policies
  async protectSandbox(value, policy, piiType = 'GENERAL') {
    const res = await client.post('/api/protect', {
      value,
      policy,
      pii_type: piiType,
    });
    return res.data;
  },

  async getPolicies() {
    const res = await client.get('/api/policies');
    return res.data;
  },

  async updatePolicies(policies) {
    const res = await client.post('/api/policies', { policies });
    return res.data;
  },

  async getSourceCustomers(limit = 20) {
    const res = await client.get(`/api/source/customers?limit=${limit}`);
    return res.data;
  },

  // 6. Actions & Webhooks
  async sendCampaignEmail(payload) {
    const res = await client.post('/api/actions/send-email', payload);
    return res.data;
  },

  async sendBounceWebhook(payload) {
    const res = await client.post('/api/webhooks/email', payload);
    return res.data;
  },

  // 6. Controlled Reveal (PBAC)
  async requestReveal(payload) {
    const res = await client.post('/api/reveal', payload);
    return res.data;
  },

  // 7. Audit & Analytics
  async getAuditLogs(params = {}) {
    const res = await client.get('/api/audit', { params });
    return res.data;
  },

  async getAnalyticsSummary() {
    const res = await client.get('/api/analytics/summary');
    return res.data;
  },

  // 8. Authentication & 2FA
  async login(email, password) {
    const res = await client.post('/api/auth/login', { email, password });
    return res.data;
  },

  async verify2FA(challengeId, code) {
    const res = await client.post('/api/auth/verify-2fa', { challenge_id: challengeId, code });
    return res.data;
  },

  async register(payload) {
    const res = await client.post('/api/auth/register', payload);
    return res.data;
  },

  async getAuthUsers() {
    const res = await client.get('/api/auth/users');
    return res.data;
  },

  // 9. Source Customer Ingestion
  async createSourceCustomer(customerData) {
    const res = await client.post('/api/source/customers', customerData);
    return res.data;
  },

  // 10. Privacy & Security Settings
  async getPrivacySettings() {
    const res = await client.get('/api/privacy/settings');
    return res.data;
  },

  async updatePrivacySettings(settings) {
    const res = await client.post('/api/privacy/settings', settings);
    return res.data;
  },
};

