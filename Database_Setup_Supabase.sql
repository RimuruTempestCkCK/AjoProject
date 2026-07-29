-- ====================================================================================
-- AJO TOPUP SYSTEM - SUPABASE (POSTGRESQL) DATABASE SETUP & SEED SCRIPT
-- Application: AjoTopup & AjoAPI
-- DBMS: PostgreSQL / Supabase
-- Description: Standard PostgreSQL schema definitions, constraints, indexes, views, and seed data.
-- ====================================================================================

-- ------------------------------------------------------------------------------------
-- 1. CLEANUP OLD OBJECTS IF EXISTS
-- ------------------------------------------------------------------------------------
DROP VIEW IF EXISTS vw_activeproductscatalog CASCADE;
DROP VIEW IF EXISTS vw_usertransactionstats CASCADE;
DROP VIEW IF EXISTS vw_providerperformance CASCADE;
DROP VIEW IF EXISTS vw_dailysalessummary CASCADE;
DROP VIEW IF EXISTS vw_transactionsummary CASCADE;

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS transaction_logs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS balance_history CASCADE;
DROP TABLE IF EXISTS user_balances CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Also drop PascalCase table names if created previously
DROP TABLE IF EXISTS "AuditLogs" CASCADE;
DROP TABLE IF EXISTS "TransactionLogs" CASCADE;
DROP TABLE IF EXISTS "Transactions" CASCADE;
DROP TABLE IF EXISTS "BalanceHistory" CASCADE;
DROP TABLE IF EXISTS "UserBalances" CASCADE;
DROP TABLE IF EXISTS "Products" CASCADE;
DROP TABLE IF EXISTS "ProductCategories" CASCADE;
DROP TABLE IF EXISTS "Providers" CASCADE;
DROP TABLE IF EXISTS "SystemSettings" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;
DROP TABLE IF EXISTS "Roles" CASCADE;

-- ------------------------------------------------------------------------------------
-- 2. CORE TABLE DEFINITIONS (Standard PostgreSQL Lowercase Naming)
-- ------------------------------------------------------------------------------------

-- 2.1 Roles Table
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_code VARCHAR(20) NOT NULL UNIQUE,
    role_name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NULL,
    phone_number VARCHAR(20) NULL,
    role_name VARCHAR(20) NOT NULL CHECK (role_name IN ('Admin', 'Operator', 'Manager', 'Finance', 'CS')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_date TIMESTAMPTZ NULL,
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NULL,
    updated_date TIMESTAMPTZ NULL,
    updated_by VARCHAR(50) NULL
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role_name ON users(role_name);
CREATE INDEX idx_users_is_active ON users(is_active);

-- 2.3 User Balances Table
CREATE TABLE user_balances (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    reserved_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 Balance History Table
CREATE TABLE balance_history (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    trx_type VARCHAR(20) NOT NULL CHECK (trx_type IN ('DEPOSIT', 'TOPUP_DEDUCTION', 'REFUND', 'COMMISSION')),
    amount DECIMAL(18,2) NOT NULL,
    balance_before DECIMAL(18,2) NOT NULL,
    balance_after DECIMAL(18,2) NOT NULL,
    description VARCHAR(255) NULL,
    ref_no VARCHAR(50) NULL,
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_balance_history_user_id ON balance_history(user_id);
CREATE INDEX idx_balance_history_created_date ON balance_history(created_date);

-- 2.5 Product Categories Table
CREATE TABLE product_categories (
    category_id SERIAL PRIMARY KEY,
    category_code VARCHAR(20) NOT NULL UNIQUE,
    category_name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 Providers Table
CREATE TABLE providers (
    provider_id SERIAL PRIMARY KEY,
    provider_code VARCHAR(20) NOT NULL UNIQUE,
    provider_name VARCHAR(50) NOT NULL,
    api_endpoint VARCHAR(255) NULL,
    api_key VARCHAR(255) NULL,
    balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'DISABLED')),
    callback_url VARCHAR(255) NULL,
    priority INT NOT NULL DEFAULT 1,
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_date TIMESTAMPTZ NULL
);

CREATE INDEX idx_providers_provider_code ON providers(provider_code);

-- 2.7 Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(20) NOT NULL UNIQUE,
    product_name VARCHAR(100) NOT NULL,
    category_code VARCHAR(20) NULL,
    provider_code VARCHAR(20) NULL,
    provider VARCHAR(50) NOT NULL,
    price DECIMAL(18,2) NOT NULL CHECK (price > 0),
    base_price DECIMAL(18,2) NULL DEFAULT 0,
    commission DECIMAL(18,2) NULL DEFAULT 0,
    admin_fee DECIMAL(18,2) NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50) NULL,
    updated_date TIMESTAMPTZ NULL,
    updated_by VARCHAR(50) NULL
);

CREATE INDEX idx_products_product_code ON products(product_code);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_provider ON products(provider);
CREATE INDEX idx_products_category_code ON products(category_code);

-- 2.8 Transactions Table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    trx_id VARCHAR(50) NOT NULL UNIQUE,
    ref_no VARCHAR(50) NULL,
    product_code VARCHAR(20) NOT NULL REFERENCES products(product_code),
    destination VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED')),
    provider_status VARCHAR(20) NULL,
    provider_message VARCHAR(255) NULL,
    serial_number VARCHAR(100) NULL,
    amount DECIMAL(18,2) NOT NULL,
    selling_price DECIMAL(18,2) NULL DEFAULT 0,
    commission DECIMAL(18,2) NULL DEFAULT 0,
    admin_fee DECIMAL(18,2) NULL DEFAULT 0,
    request_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_date TIMESTAMPTZ NULL,
    response_time INT NULL,
    created_by VARCHAR(50) NOT NULL REFERENCES users(username),
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_date TIMESTAMPTZ NULL
);

CREATE INDEX idx_transactions_trx_id ON transactions(trx_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);
CREATE INDEX idx_transactions_request_date ON transactions(request_date);
CREATE INDEX idx_transactions_destination ON transactions(destination);
CREATE INDEX idx_transactions_product_code ON transactions(product_code);

-- 2.9 Transaction Logs Table
CREATE TABLE transaction_logs (
    id SERIAL PRIMARY KEY,
    trx_id VARCHAR(50) NOT NULL REFERENCES transactions(trx_id) ON DELETE CASCADE,
    log_type VARCHAR(50) NOT NULL CHECK (log_type IN ('MVC_TO_API', 'API_TO_PROVIDER', 'API_RESPONSE', 'PROVIDER_CALLBACK', 'SYSTEM_ERROR')),
    request_url VARCHAR(255) NULL,
    request_headers TEXT NULL,
    request_body TEXT NULL,
    response_status_code INT NULL,
    response_headers TEXT NULL,
    response_body TEXT NULL,
    execution_time INT NULL,
    error_message TEXT NULL,
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transaction_logs_trx_id ON transaction_logs(trx_id);
CREATE INDEX idx_transaction_logs_log_type ON transaction_logs(log_type);
CREATE INDEX idx_transaction_logs_created_date ON transaction_logs(created_date);

-- 2.10 System Settings Table
CREATE TABLE system_settings (
    setting_id SERIAL PRIMARY KEY,
    setting_group VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    setting_key VARCHAR(50) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description VARCHAR(255) NULL,
    data_type VARCHAR(20) NOT NULL DEFAULT 'STRING',
    is_editable BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by VARCHAR(50) NULL,
    updated_date TIMESTAMPTZ NULL
);

CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- 2.11 Audit Logs Table
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(50) NULL,
    action_name VARCHAR(100) NOT NULL,
    module_name VARCHAR(50) NOT NULL,
    description TEXT NULL,
    ip_address VARCHAR(50) NULL,
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_username ON audit_logs(username);
CREATE INDEX idx_audit_logs_created_date ON audit_logs(created_date);

-- ------------------------------------------------------------------------------------
-- 3. VIEWS FOR REPORTING & ANALYTICS
-- ------------------------------------------------------------------------------------

CREATE OR REPLACE VIEW vw_transactionsummary AS
SELECT 
    t.trx_id,
    t.ref_no,
    t.product_code,
    p.product_name,
    p.provider,
    p.category_code,
    t.destination,
    t.status,
    t.provider_status,
    t.provider_message,
    t.amount,
    t.commission,
    t.serial_number,
    t.request_date,
    t.response_date,
    COALESCE(t.response_time, 0) AS processing_time_ms,
    u.full_name AS operator_name,
    u.role_name AS operator_role
FROM transactions t
INNER JOIN products p ON t.product_code = p.product_code
INNER JOIN users u ON t.created_by = u.username;

CREATE OR REPLACE VIEW vw_dailysalessummary AS
SELECT 
    CAST(t.request_date AS DATE) AS sales_date,
    p.provider,
    COUNT(*) AS total_transactions,
    SUM(CASE WHEN t.status = 'SUCCESS' THEN 1 ELSE 0 END) AS success_count,
    SUM(CASE WHEN t.status = 'FAILED' THEN 1 ELSE 0 END) AS failed_count,
    SUM(CASE WHEN t.status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
    COALESCE(SUM(CASE WHEN t.status = 'SUCCESS' THEN t.amount ELSE 0 END), 0) AS gross_volume,
    COALESCE(SUM(CASE WHEN t.status = 'SUCCESS' THEN t.commission ELSE 0 END), 0) AS total_commission_profit
FROM transactions t
INNER JOIN products p ON t.product_code = p.product_code
GROUP BY CAST(t.request_date AS DATE), p.provider;

CREATE OR REPLACE VIEW vw_providerperformance AS
SELECT 
    p.provider_code,
    p.provider_name,
    COUNT(t.id) AS total_requests,
    SUM(CASE WHEN t.status = 'SUCCESS' THEN 1 ELSE 0 END) AS success_count,
    SUM(CASE WHEN t.status = 'FAILED' THEN 1 ELSE 0 END) AS failed_count,
    ROUND(COALESCE(AVG(COALESCE(t.response_time, 0)), 0)::NUMERIC, 2) AS avg_response_time_ms,
    ROUND(COALESCE((SUM(CASE WHEN t.status = 'SUCCESS' THEN 1.0 ELSE 0 END) / NULLIF(COUNT(t.id), 0)) * 100, 0)::NUMERIC, 2) AS success_rate_pct
FROM providers p
LEFT JOIN products prod ON p.provider_name = prod.provider
LEFT JOIN transactions t ON prod.product_code = t.product_code
GROUP BY p.provider_code, p.provider_name;

CREATE OR REPLACE VIEW vw_usertransactionstats AS
SELECT 
    u.username,
    u.full_name,
    u.role_name,
    COUNT(t.id) AS total_submitted,
    SUM(CASE WHEN t.status = 'SUCCESS' THEN 1 ELSE 0 END) AS successful_trx,
    COALESCE(SUM(CASE WHEN t.status = 'SUCCESS' THEN t.amount ELSE 0 END), 0) AS total_turnover,
    MAX(t.request_date) AS last_transaction_time
FROM users u
LEFT JOIN transactions t ON u.username = t.created_by
GROUP BY u.username, u.full_name, u.role_name;

CREATE OR REPLACE VIEW vw_activeproductscatalog AS
SELECT 
    p.product_code,
    p.product_name,
    pc.category_name,
    p.provider,
    p.price,
    p.commission,
    p.is_active,
    pr.status AS provider_status
FROM products p
LEFT JOIN product_categories pc ON p.category_code = pc.category_code
LEFT JOIN providers pr ON p.provider = pr.provider_name
WHERE p.is_active = TRUE;

-- ------------------------------------------------------------------------------------
-- 4. SEED DATA (INITIAL & MASTER DATA)
-- ------------------------------------------------------------------------------------

-- 4.1 Roles Seed
INSERT INTO roles (role_code, role_name, description) VALUES
    ('SA', 'Admin', 'Full System Administrator Access'),
    ('MGR', 'Manager', 'Managerial & Reporting Access'),
    ('OP', 'Operator', 'Frontline Transaction Operator'),
    ('FIN', 'Finance', 'Financial Ledger & Deposit Management'),
    ('CS', 'Customer Service', 'Customer Support & Transaction Inquiries')
ON CONFLICT (role_code) DO NOTHING;

-- 4.2 Users Seed
INSERT INTO users (username, password_hash, full_name, email, phone_number, role_name, is_active, created_by) VALUES
    ('admin1', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'System Administrator', 'admin@ajotopup.com', '081234567890', 'Admin', TRUE, 'System'),
    ('operator1', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'Frontline Operator 1', 'op1@ajotopup.com', '081234567891', 'Operator', TRUE, 'System'),
    ('operator2', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'Frontline Operator 2', 'op2@ajotopup.com', '081234567892', 'Operator', TRUE, 'System'),
    ('manager1', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'Operations Manager', 'manager@ajotopup.com', '081234567893', 'Manager', TRUE, 'System'),
    ('finance1', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'Finance Staff', 'finance@ajotopup.com', '081234567894', 'Finance', TRUE, 'System'),
    ('cs1', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'Customer Care Staff', 'cs@ajotopup.com', '081234567895', 'CS', TRUE, 'System')
ON CONFLICT (username) DO NOTHING;

-- 4.3 User Balances Seed
INSERT INTO user_balances (user_id, balance, reserved_balance)
SELECT id, 10000000.00, 0.00 FROM users
ON CONFLICT (user_id) DO NOTHING;

-- 4.4 Product Categories Seed
INSERT INTO product_categories (category_code, category_name, description, display_order) VALUES
    ('PULSA', 'Pulsa Reguler', 'Isi ulang pulsa reguler semua operator seluler', 1),
    ('DATA', 'Paket Data Internet', 'Isi ulang kuota & paket data internet operator', 2),
    ('PLN', 'Token Listrik PLN', 'Pembelian token listrik PLN Prepaid & Postpaid', 3),
    ('EWALLET', 'E-Wallet & E-Money', 'Topup Saldo Dana, OVO, GoPay, ShopeePay, LinkAja', 4),
    ('GAME', 'Voucher Game Online', 'Topup Diamond Mobile Legends, Free Fire, PUBG Mobile', 5),
    ('PPOB', 'Tagihan PPOB', 'Pembayaran tagihan air, BPJS, Telkom, Multifinance', 6)
ON CONFLICT (category_code) DO NOTHING;

-- 4.5 Providers Seed
INSERT INTO providers (provider_code, provider_name, api_endpoint, balance, status, priority) VALUES
    ('TSEL', 'Telkomsel', 'https://api.provider-telkomsel.com/v2/topup', 50000000.00, 'ACTIVE', 1),
    ('ISAT', 'Indosat', 'https://api.provider-indosat.com/v1/topup', 35000000.00, 'ACTIVE', 1),
    ('XL', 'XL', 'https://api.provider-xl.com/v1/topup', 30000000.00, 'ACTIVE', 1),
    ('AXIS', 'Axis', 'https://api.provider-axis.com/v1/topup', 20000000.00, 'ACTIVE', 1),
    ('SMART', 'Smartfren', 'https://api.provider-smartfren.com/v1/topup', 15000000.00, 'ACTIVE', 2),
    ('PLN', 'PLN', 'https://api.pln-postpaid.co.id/v1/token', 100000000.00, 'ACTIVE', 1),
    ('DANA', 'Dana', 'https://api.wallet-dana.id/v1/topup', 40000000.00, 'ACTIVE', 1),
    ('OVO', 'Ovo', 'https://api.wallet-ovo.id/v1/topup', 40000000.00, 'ACTIVE', 1),
    ('GOPAY', 'GoPay', 'https://api.wallet-gopay.id/v1/topup', 50000000.00, 'ACTIVE', 1)
ON CONFLICT (provider_code) DO NOTHING;

-- 4.6 Products Seed
INSERT INTO products (product_code, product_name, category_code, provider_code, provider, price, base_price, commission, is_active, created_by) VALUES
    ('TSEL5', 'Telkomsel 5.000', 'PULSA', 'TSEL', 'Telkomsel', 5500.00, 5200.00, 150.00, TRUE, 'System'),
    ('TSEL10', 'Telkomsel 10.000', 'PULSA', 'TSEL', 'Telkomsel', 10500.00, 10150.00, 250.00, TRUE, 'System'),
    ('TSEL20', 'Telkomsel 20.000', 'PULSA', 'TSEL', 'Telkomsel', 20300.00, 19800.00, 400.00, TRUE, 'System'),
    ('TSEL25', 'Telkomsel 25.000', 'PULSA', 'TSEL', 'Telkomsel', 25300.00, 24700.00, 500.00, TRUE, 'System'),
    ('TSEL50', 'Telkomsel 50.000', 'PULSA', 'TSEL', 'Telkomsel', 50100.00, 49200.00, 750.00, TRUE, 'System'),
    ('TSEL100', 'Telkomsel 100.000', 'PULSA', 'TSEL', 'Telkomsel', 99500.00, 98000.00, 1200.00, TRUE, 'System'),
    ('TSEL150', 'Telkomsel 150.000', 'PULSA', 'TSEL', 'Telkomsel', 148500.00, 146500.00, 1500.00, TRUE, 'System'),
    
    ('ISAT5', 'Indosat 5.000', 'PULSA', 'ISAT', 'Indosat', 5450.00, 5150.00, 150.00, TRUE, 'System'),
    ('ISAT10', 'Indosat 10.000', 'PULSA', 'ISAT', 'Indosat', 10450.00, 10100.00, 250.00, TRUE, 'System'),
    ('ISAT25', 'Indosat 25.000', 'PULSA', 'ISAT', 'Indosat', 25150.00, 24600.00, 500.00, TRUE, 'System'),
    ('ISAT50', 'Indosat 50.000', 'PULSA', 'ISAT', 'Indosat', 49850.00, 49000.00, 750.00, TRUE, 'System'),
    ('ISAT100', 'Indosat 100.000', 'PULSA', 'ISAT', 'Indosat', 98900.00, 97500.00, 1200.00, TRUE, 'System'),

    ('XL5', 'XL 5.000', 'PULSA', 'XL', 'XL', 5500.00, 5200.00, 150.00, TRUE, 'System'),
    ('XL10', 'XL 10.000', 'PULSA', 'XL', 'XL', 10450.00, 10100.00, 250.00, TRUE, 'System'),
    ('XL25', 'XL 25.000', 'PULSA', 'XL', 'XL', 25200.00, 24650.00, 500.00, TRUE, 'System'),
    ('XL50', 'XL 50.000', 'PULSA', 'XL', 'XL', 50000.00, 49100.00, 750.00, TRUE, 'System'),
    ('XL100', 'XL 100.000', 'PULSA', 'XL', 'XL', 99200.00, 97800.00, 1200.00, TRUE, 'System'),

    ('AXIS5', 'Axis 5.000', 'PULSA', 'AXIS', 'Axis', 5450.00, 5150.00, 150.00, TRUE, 'System'),
    ('AXIS10', 'Axis 10.000', 'PULSA', 'AXIS', 'Axis', 10400.00, 10050.00, 250.00, TRUE, 'System'),
    ('AXIS25', 'Axis 25.000', 'PULSA', 'AXIS', 'Axis', 25100.00, 24500.00, 600.00, TRUE, 'System'),
    ('AXIS50', 'Axis 50.000', 'PULSA', 'AXIS', 'Axis', 49900.00, 49000.00, 800.00, TRUE, 'System'),

    ('SMART10', 'Smartfren 10.000', 'PULSA', 'SMART', 'Smartfren', 10300.00, 9950.00, 250.00, TRUE, 'System'),
    ('SMART25', 'Smartfren 25.000', 'PULSA', 'SMART', 'Smartfren', 25100.00, 24500.00, 500.00, TRUE, 'System'),
    ('SMART50', 'Smartfren 50.000', 'PULSA', 'SMART', 'Smartfren', 49800.00, 48900.00, 750.00, TRUE, 'System'),

    ('PLN20', 'Token PLN 20.000', 'PLN', 'PLN', 'PLN', 20500.00, 20100.00, 300.00, TRUE, 'System'),
    ('PLN50', 'Token PLN 50.000', 'PLN', 'PLN', 'PLN', 50500.00, 50100.00, 300.00, TRUE, 'System'),
    ('PLN100', 'Token PLN 100.000', 'PLN', 'PLN', 'PLN', 100500.00, 100100.00, 300.00, TRUE, 'System'),
    ('PLN200', 'Token PLN 200.000', 'PLN', 'PLN', 'PLN', 200500.00, 200100.00, 300.00, TRUE, 'System'),

    ('DANA10', 'Saldo DANA 10.000', 'EWALLET', 'DANA', 'Dana', 10500.00, 10100.00, 200.00, TRUE, 'System'),
    ('DANA25', 'Saldo DANA 25.000', 'EWALLET', 'DANA', 'Dana', 25500.00, 25100.00, 300.00, TRUE, 'System'),
    ('DANA50', 'Saldo DANA 50.000', 'EWALLET', 'DANA', 'Dana', 50500.00, 50100.00, 300.00, TRUE, 'System'),
    ('OVO20', 'Saldo OVO 20.000', 'EWALLET', 'OVO', 'Ovo', 20500.00, 20100.00, 200.00, TRUE, 'System'),
    ('OVO50', 'Saldo OVO 50.000', 'EWALLET', 'OVO', 'Ovo', 50500.00, 50100.00, 300.00, TRUE, 'System'),
    ('GOPAY25', 'Saldo GoPay 25.000', 'EWALLET', 'GOPAY', 'GoPay', 25500.00, 25100.00, 300.00, TRUE, 'System'),
    ('GOPAY50', 'Saldo GoPay 50.000', 'EWALLET', 'GOPAY', 'GoPay', 50500.00, 50100.00, 300.00, TRUE, 'System')
ON CONFLICT (product_code) DO NOTHING;

-- 4.7 System Settings Seed
INSERT INTO system_settings (setting_group, setting_key, setting_value, description, data_type) VALUES
    ('SYSTEM', 'APP_NAME', 'AjoTopup Management Portal', 'Name of the application', 'STRING'),
    ('SYSTEM', 'API_TIMEOUT_SECONDS', '40', 'Timeout for upstream provider HTTP requests in seconds', 'NUMBER'),
    ('SYSTEM', 'DEFAULT_CURRENCY', 'IDR', 'System default base currency code', 'STRING'),
    ('MAINTENANCE', 'IS_MAINTENANCE_MODE', 'false', 'Flag to enable/disable system-wide maintenance mode', 'BOOLEAN'),
    ('MAINTENANCE', 'MAINTENANCE_MSG', 'System sedang dalam perawatan rutin.', 'Message displayed during maintenance', 'STRING'),
    ('SECURITY', 'MAX_LOGIN_ATTEMPTS', '5', 'Max failed login attempts before lockout', 'NUMBER'),
    ('NOTIF', 'ADMIN_ALERT_EMAIL', 'alert@ajotopup.com', 'Notification email address for failed transaction spikes', 'STRING')
ON CONFLICT (setting_key) DO NOTHING;

-- 4.8 Historical Transactions Seed
INSERT INTO transactions 
    (trx_id, ref_no, product_code, destination, status, provider_status, provider_message, serial_number, amount, commission, request_date, response_date, response_time, created_by)
VALUES
    ('TRX2026072900001', 'REF8812901', 'TSEL10', '081234567890', 'SUCCESS', 'SUCCESS', 'Topup berhasil', 'SN89210982310', 10500.00, 250.00, NOW() - INTERVAL '240 minutes', NOW() - INTERVAL '240 minutes', 320, 'operator1'),
    ('TRX2026072900002', 'REF8812902', 'ISAT25', '085712345678', 'SUCCESS', 'SUCCESS', 'Topup berhasil', 'SN89210982311', 25150.00, 500.00, NOW() - INTERVAL '210 minutes', NOW() - INTERVAL '210 minutes', 450, 'operator1'),
    ('TRX2026072900003', 'REF8812903', 'XL50', '081898765432', 'SUCCESS', 'SUCCESS', 'Topup berhasil', 'SN89210982312', 50000.00, 750.00, NOW() - INTERVAL '180 minutes', NOW() - INTERVAL '180 minutes', 280, 'operator2'),
    ('TRX2026072900004', 'REF8812904', 'PLN50', '532109876543', 'SUCCESS', 'SUCCESS', 'Token PLN generated', '1823-9082-1273-9012', 50500.00, 300.00, NOW() - INTERVAL '150 minutes', NOW() - INTERVAL '150 minutes', 610, 'operator1'),
    ('TRX2026072900005', 'REF8812905', 'DANA25', '081298761234', 'FAILED', 'FAILED', 'Nomor tujuan tidak valid', NULL, 25500.00, 0.00, NOW() - INTERVAL '120 minutes', NOW() - INTERVAL '120 minutes', 190, 'operator2'),
    ('TRX2026072900006', 'REF8812906', 'TSEL100', '081390123456', 'SUCCESS', 'SUCCESS', 'Topup berhasil', 'SN89210982315', 99500.00, 1200.00, NOW() - INTERVAL '90 minutes', NOW() - INTERVAL '90 minutes', 340, 'operator1'),
    ('TRX2026072900007', 'REF8812907', 'AXIS25', '083812345678', 'SUCCESS', 'SUCCESS', 'Topup berhasil', 'SN89210982316', 25100.00, 600.00, NOW() - INTERVAL '60 minutes', NOW() - INTERVAL '60 minutes', 410, 'operator2'),
    ('TRX2026072900008', 'REF8812908', 'TSEL5', '082198765432', 'PENDING', 'PENDING', 'Sedang diproses provider', NULL, 5500.00, 0.00, NOW() - INTERVAL '15 minutes', NULL, NULL, 'operator1')
ON CONFLICT (trx_id) DO NOTHING;

-- 4.9 Integration Logs Seed
INSERT INTO transaction_logs 
    (trx_id, log_type, request_url, request_body, response_status_code, response_body, execution_time, created_date)
VALUES
    ('TRX2026072900001', 'MVC_TO_API', 'http://localhost/AjoTopup/api/transaction', '{"productCode":"TSEL10","destination":"081234567890"}', 200, NULL, NULL, NOW() - INTERVAL '240 minutes'),
    ('TRX2026072900001', 'API_TO_PROVIDER', '/api/provider/topup', '{"TrxId":"TRX2026072900001","ProductCode":"TSEL10","Destination":"081234567890"}', NULL, NULL, NULL, NOW() - INTERVAL '240 minutes'),
    ('TRX2026072900001', 'API_RESPONSE', '/api/provider/topup', NULL, 200, '{"TrxId":"TRX2026072900001","Status":"SUCCESS","Message":"Topup berhasil","Sn":"SN89210982310"}', 320, NOW() - INTERVAL '240 minutes'),
    
    ('TRX2026072900005', 'MVC_TO_API', 'http://localhost/AjoTopup/api/transaction', '{"productCode":"DANA25","destination":"081298761234"}', 200, NULL, NULL, NOW() - INTERVAL '120 minutes'),
    ('TRX2026072900005', 'API_TO_PROVIDER', '/api/provider/topup', '{"TrxId":"TRX2026072900005","ProductCode":"DANA25","Destination":"081298761234"}', NULL, NULL, NULL, NOW() - INTERVAL '120 minutes'),
    ('TRX2026072900005', 'API_RESPONSE', '/api/provider/topup', NULL, 200, '{"TrxId":"TRX2026072900005","Status":"FAILED","Message":"Nomor tujuan tidak valid","Sn":null}', 190, NOW() - INTERVAL '120 minutes');

-- 4.10 Audit Trail Seed
INSERT INTO audit_logs (user_id, username, action_name, module_name, description, ip_address) VALUES
    (1, 'admin1', 'DATABASE_INITIALIZATION', 'SYSTEM', 'Supabase PostgreSQL Database Setup Executed Successfully', '127.0.0.1');
