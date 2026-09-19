-- ====================================================================
-- Enterprise Privacy-Preserving Customer Data Platform (CDP)
-- Database Initialization & Multi-Schema Isolation
-- ====================================================================

-- 1. Create Isolated Schemas
CREATE SCHEMA IF NOT EXISTS source_store;
CREATE SCHEMA IF NOT EXISTS protected_store;
CREATE SCHEMA IF NOT EXISTS vault_store;
CREATE SCHEMA IF NOT EXISTS audit_store;
CREATE SCHEMA IF NOT EXISTS meta_store;

-- 2. Schema: source_store
-- Raw ingestion store. Downstream services and normal users have NO access to this schema.
CREATE TABLE IF NOT EXISTS source_store.customers (
    customer_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    city VARCHAR(64) NOT NULL,
    segment VARCHAR(32) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Schema: protected_store
-- De-identified, tokenized, and format-preserving encrypted store safe for analytics/campaigns.
CREATE TABLE IF NOT EXISTS protected_store.customers_protected (
    customer_id VARCHAR(32) PRIMARY KEY,
    name_token VARCHAR(64) NOT NULL,
    email_token VARCHAR(64) NOT NULL,
    mobile_fpe VARCHAR(15) NOT NULL,
    city VARCHAR(64) NOT NULL,
    segment VARCHAR(32) NOT NULL,
    bounce_status VARCHAR(32) DEFAULT 'CLEAN',
    bounce_reason VARCHAR(128) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Schema: vault_store
-- Secure mapping between reversible tokens/references and AES-GCM encrypted raw PII.
-- Highly restricted; strictly accessible only by the Privacy Gateway service.
CREATE TABLE IF NOT EXISTS vault_store.token_vault (
    token_id VARCHAR(64) PRIMARY KEY,
    token_value VARCHAR(64) UNIQUE NOT NULL,
    encrypted_original TEXT NOT NULL,
    pii_type VARCHAR(32) NOT NULL,
    key_reference VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Schema: audit_store
-- Tamper-evident operational audit trail tracking every PII access, detokenization, or ingestion.
CREATE TABLE IF NOT EXISTS audit_store.audit_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actor VARCHAR(64) NOT NULL,
    role VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    purpose VARCHAR(64) NOT NULL,
    reference VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64) NULL,
    outcome VARCHAR(32) NOT NULL
);

-- 6. Schema: meta_store
-- Batch processing state, data pipeline metrics, and job orchestrator metadata.
CREATE TABLE IF NOT EXISTS meta_store.batch_jobs (
    batch_id VARCHAR(64) PRIMARY KEY,
    source_name VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    total_records INT DEFAULT 0,
    processed_records INT DEFAULT 0,
    error_records INT DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);
