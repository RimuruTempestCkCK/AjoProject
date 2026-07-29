-- ====================================================================================
-- AJO TOPUP SYSTEM - COMPLETE DATABASE SETUP & INITIALIZATION SCRIPT
-- Application: AjoTopup (ASP.NET MVC Digital Topup & PPOB Management System)
-- DBMS: Microsoft SQL Server 2016+ / Azure SQL Database
-- Description: Full schema definitions, relations, indexes, stored procedures, 
--              views, functions, triggers, and comprehensive seed data.
-- ====================================================================================

-- ------------------------------------------------------------------------------------
-- 1. DATABASE CREATION & CONFIGURATION
-- ------------------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'AjoTopup')
BEGIN
    CREATE DATABASE AjoTopup;
END
GO

USE AjoTopup;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ------------------------------------------------------------------------------------
-- 2. DROP EXISTING OBJECTS (CLEAN RE-CREATION SETUP)
-- ------------------------------------------------------------------------------------
IF OBJECT_ID('vw_ActiveProductsCatalog', 'V') IS NOT NULL DROP VIEW vw_ActiveProductsCatalog;
IF OBJECT_ID('vw_UserTransactionStats', 'V') IS NOT NULL DROP VIEW vw_UserTransactionStats;
IF OBJECT_ID('vw_ProviderPerformance', 'V') IS NOT NULL DROP VIEW vw_ProviderPerformance;
IF OBJECT_ID('vw_DailySalesSummary', 'V') IS NOT NULL DROP VIEW vw_DailySalesSummary;
IF OBJECT_ID('vw_TransactionSummary', 'V') IS NOT NULL DROP VIEW vw_TransactionSummary;

IF OBJECT_ID('sp_SearchTransactions', 'P') IS NOT NULL DROP PROCEDURE sp_SearchTransactions;
IF OBJECT_ID('sp_LogIntegrationDetail', 'P') IS NOT NULL DROP PROCEDURE sp_LogIntegrationDetail;
IF OBJECT_ID('sp_ProcessUserBalanceTransaction', 'P') IS NOT NULL DROP PROCEDURE sp_ProcessUserBalanceTransaction;
IF OBJECT_ID('sp_GetUserBalance', 'P') IS NOT NULL DROP PROCEDURE sp_GetUserBalance;
IF OBJECT_ID('sp_GetDashboardAnalytics', 'P') IS NOT NULL DROP PROCEDURE sp_GetDashboardAnalytics;
IF OBJECT_ID('sp_UpdateTransactionStatus', 'P') IS NOT NULL DROP PROCEDURE sp_UpdateTransactionStatus;
IF OBJECT_ID('sp_CreateTransaction', 'P') IS NOT NULL DROP PROCEDURE sp_CreateTransaction;

IF OBJECT_ID('fn_FormatPhoneNumber', 'FN') IS NOT NULL DROP FUNCTION fn_FormatPhoneNumber;
IF OBJECT_ID('fn_CalculateCommission', 'FN') IS NOT NULL DROP FUNCTION fn_CalculateCommission;
IF OBJECT_ID('fn_GenerateTrxId', 'FN') IS NOT NULL DROP FUNCTION fn_GenerateTrxId;

IF OBJECT_ID('FK_TransactionLogs_Transactions', 'F') IS NOT NULL ALTER TABLE TransactionLogs DROP CONSTRAINT FK_TransactionLogs_Transactions;
IF OBJECT_ID('FK_Transactions_Products', 'F') IS NOT NULL ALTER TABLE Transactions DROP CONSTRAINT FK_Transactions_Products;
IF OBJECT_ID('FK_Transactions_Users', 'F') IS NOT NULL ALTER TABLE Transactions DROP CONSTRAINT FK_Transactions_Users;
IF OBJECT_ID('FK_BalanceHistory_Users', 'F') IS NOT NULL ALTER TABLE BalanceHistory DROP CONSTRAINT FK_BalanceHistory_Users;
IF OBJECT_ID('FK_UserBalances_Users', 'F') IS NOT NULL ALTER TABLE UserBalances DROP CONSTRAINT FK_UserBalances_Users;
IF OBJECT_ID('FK_Products_ProductCategories', 'F') IS NOT NULL ALTER TABLE Products DROP CONSTRAINT FK_Products_ProductCategories;
IF OBJECT_ID('FK_Products_Providers', 'F') IS NOT NULL ALTER TABLE Products DROP CONSTRAINT FK_Products_Providers;

IF OBJECT_ID('AuditLogs', 'U') IS NOT NULL DROP TABLE AuditLogs;
IF OBJECT_ID('TransactionLogs', 'U') IS NOT NULL DROP TABLE TransactionLogs;
IF OBJECT_ID('Transactions', 'U') IS NOT NULL DROP TABLE Transactions;
IF OBJECT_ID('BalanceHistory', 'U') IS NOT NULL DROP TABLE BalanceHistory;
IF OBJECT_ID('UserBalances', 'U') IS NOT NULL DROP TABLE UserBalances;
IF OBJECT_ID('Products', 'U') IS NOT NULL DROP TABLE Products;
IF OBJECT_ID('ProductCategories', 'U') IS NOT NULL DROP TABLE ProductCategories;
IF OBJECT_ID('Providers', 'U') IS NOT NULL DROP TABLE Providers;
IF OBJECT_ID('SystemSettings', 'U') IS NOT NULL DROP TABLE SystemSettings;
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
IF OBJECT_ID('Roles', 'U') IS NOT NULL DROP TABLE Roles;
GO

-- ------------------------------------------------------------------------------------
-- 3. CORE TABLE DEFINITIONS
-- ------------------------------------------------------------------------------------

-- 3.1 Roles Master Table
CREATE TABLE Roles
(
    RoleId INT IDENTITY(1,1) PRIMARY KEY,
    RoleCode VARCHAR(20) NOT NULL UNIQUE,
    RoleName VARCHAR(50) NOT NULL,
    Description VARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 3.2 Users Table
CREATE TABLE Users
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NULL,
    PhoneNumber VARCHAR(20) NULL,
    RoleName VARCHAR(20) NOT NULL, -- Admin / Manager / Operator / Finance / CS
    IsActive BIT NOT NULL DEFAULT 1,
    LastLoginDate DATETIME NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CreatedBy VARCHAR(50) NULL,
    UpdatedDate DATETIME NULL,
    UpdatedBy VARCHAR(50) NULL,
    CONSTRAINT CK_RoleName CHECK (RoleName IN ('Admin', 'Operator', 'Manager', 'Finance', 'CS'))
);

CREATE INDEX IDX_Users_Username ON Users(Username);
CREATE INDEX IDX_Users_RoleName ON Users(RoleName);
CREATE INDEX IDX_Users_IsActive ON Users(IsActive);
GO

-- 3.3 User Balances Table
CREATE TABLE UserBalances
(
    UserId INT PRIMARY KEY,
    Balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    ReservedBalance DECIMAL(18,2) NOT NULL DEFAULT 0,
    LastUpdated DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_UserBalances_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);
GO

-- 3.4 Balance History Ledger Table
CREATE TABLE BalanceHistory
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    TrxType VARCHAR(20) NOT NULL, -- DEPOSIT / TOPUP_DEDUCTION / REFUND / COMMISSION
    Amount DECIMAL(18,2) NOT NULL,
    BalanceBefore DECIMAL(18,2) NOT NULL,
    BalanceAfter DECIMAL(18,2) NOT NULL,
    Description VARCHAR(255) NULL,
    RefNo VARCHAR(50) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_BalanceHistory_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
    CONSTRAINT CK_TrxType CHECK (TrxType IN ('DEPOSIT', 'TOPUP_DEDUCTION', 'REFUND', 'COMMISSION'))
);

CREATE INDEX IDX_BalanceHistory_UserId ON BalanceHistory(UserId);
CREATE INDEX IDX_BalanceHistory_CreatedDate ON BalanceHistory(CreatedDate);
GO

-- 3.5 Product Categories Master Table
CREATE TABLE ProductCategories
(
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    CategoryCode VARCHAR(20) NOT NULL UNIQUE,
    CategoryName VARCHAR(50) NOT NULL,
    Description VARCHAR(255) NULL,
    DisplayOrder INT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 3.6 Providers Master Table
CREATE TABLE Providers
(
    ProviderId INT IDENTITY(1,1) PRIMARY KEY,
    ProviderCode VARCHAR(20) NOT NULL UNIQUE,
    ProviderName VARCHAR(50) NOT NULL,
    ApiEndpoint VARCHAR(255) NULL,
    ApiKey VARCHAR(255) NULL,
    Balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    Status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE / MAINTENANCE / DISABLED
    CallbackUrl VARCHAR(255) NULL,
    Priority INT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL,
    CONSTRAINT CK_ProviderStatus CHECK (Status IN ('ACTIVE', 'MAINTENANCE', 'DISABLED'))
);

CREATE INDEX IDX_Providers_ProviderCode ON Providers(ProviderCode);
GO

-- 3.7 Products Table
CREATE TABLE Products
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProductCode VARCHAR(20) NOT NULL UNIQUE,
    ProductName VARCHAR(100) NOT NULL,
    CategoryCode VARCHAR(20) NULL,
    ProviderCode VARCHAR(20) NULL,
    Provider VARCHAR(50) NOT NULL, -- Telkomsel, Indosat, XL, Axis, Smartfren, PLN, Dana, Ovo, GoPay
    Price DECIMAL(18,2) NOT NULL,
    BasePrice DECIMAL(18,2) NULL DEFAULT 0,
    Commission DECIMAL(18,2) NULL DEFAULT 0,
    AdminFee DECIMAL(18,2) NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CreatedBy VARCHAR(50) NULL,
    UpdatedDate DATETIME NULL,
    UpdatedBy VARCHAR(50) NULL,
    CONSTRAINT CK_Price CHECK (Price > 0)
);

CREATE INDEX IDX_Products_ProductCode ON Products(ProductCode);
CREATE INDEX IDX_Products_IsActive ON Products(IsActive);
CREATE INDEX IDX_Products_Provider ON Products(Provider);
CREATE INDEX IDX_Products_CategoryCode ON Products(CategoryCode);
GO

-- 3.8 Transactions Table
CREATE TABLE Transactions
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TrxId VARCHAR(50) NOT NULL UNIQUE,
    RefNo VARCHAR(50) NULL,
    ProductCode VARCHAR(20) NOT NULL,
    Destination VARCHAR(20) NOT NULL,
    Status VARCHAR(20) NOT NULL, -- PENDING / PROCESSING / SUCCESS / FAILED / CANCELLED
    ProviderStatus VARCHAR(20) NULL,
    ProviderMessage VARCHAR(255) NULL,
    SerialNumber VARCHAR(100) NULL,
    Amount DECIMAL(18,2) NOT NULL,
    SellingPrice DECIMAL(18,2) NULL DEFAULT 0,
    Commission DECIMAL(18,2) NULL DEFAULT 0,
    AdminFee DECIMAL(18,2) NULL DEFAULT 0,
    RequestDate DATETIME NOT NULL DEFAULT GETDATE(),
    ResponseDate DATETIME NULL,
    ResponseTime INT NULL, -- Milliseconds
    CreatedBy VARCHAR(50) NOT NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL,
    CONSTRAINT CK_TrxStatus CHECK (Status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED')),
    CONSTRAINT FK_Transactions_Products FOREIGN KEY (ProductCode) REFERENCES Products(ProductCode),
    CONSTRAINT FK_Transactions_Users FOREIGN KEY (CreatedBy) REFERENCES Users(Username)
);

CREATE INDEX IDX_Transactions_TrxId ON Transactions(TrxId);
CREATE INDEX IDX_Transactions_Status ON Transactions(Status);
CREATE INDEX IDX_Transactions_CreatedBy ON Transactions(CreatedBy);
CREATE INDEX IDX_Transactions_RequestDate ON Transactions(RequestDate);
CREATE INDEX IDX_Transactions_Destination ON Transactions(Destination);
CREATE INDEX IDX_Transactions_ProductCode ON Transactions(ProductCode);
GO

-- 3.9 Transaction Logs Table (API & Provider Integration Audit Trail)
CREATE TABLE TransactionLogs
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TrxId VARCHAR(50) NOT NULL,
    LogType VARCHAR(50) NOT NULL, -- MVC_TO_API / API_TO_PROVIDER / API_RESPONSE / PROVIDER_CALLBACK / SYSTEM_ERROR
    RequestUrl VARCHAR(255) NULL,
    RequestHeaders NVARCHAR(MAX) NULL,
    RequestBody NVARCHAR(MAX) NULL,
    ResponseStatusCode INT NULL,
    ResponseHeaders NVARCHAR(MAX) NULL,
    ResponseBody NVARCHAR(MAX) NULL,
    ExecutionTime INT NULL, -- Milliseconds
    ErrorMessage NVARCHAR(MAX) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_TransactionLogs_Transactions FOREIGN KEY (TrxId) REFERENCES Transactions(TrxId) ON DELETE CASCADE,
    CONSTRAINT CK_LogType CHECK (LogType IN ('MVC_TO_API', 'API_TO_PROVIDER', 'API_RESPONSE', 'PROVIDER_CALLBACK', 'SYSTEM_ERROR'))
);

CREATE INDEX IDX_TransactionLogs_TrxId ON TransactionLogs(TrxId);
CREATE INDEX IDX_TransactionLogs_LogType ON TransactionLogs(LogType);
CREATE INDEX IDX_TransactionLogs_CreatedDate ON TransactionLogs(CreatedDate);
GO

-- 3.10 System Settings Table
CREATE TABLE SystemSettings
(
    SettingId INT IDENTITY(1,1) PRIMARY KEY,
    SettingGroup VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    SettingKey VARCHAR(50) NOT NULL UNIQUE,
    SettingValue NVARCHAR(MAX) NOT NULL,
    Description VARCHAR(255) NULL,
    DataType VARCHAR(20) NOT NULL DEFAULT 'STRING', -- STRING / NUMBER / BOOLEAN / JSON
    IsEditable BIT NOT NULL DEFAULT 1,
    UpdatedBy VARCHAR(50) NULL,
    UpdatedDate DATETIME NULL
);

CREATE INDEX IDX_SystemSettings_Key ON SystemSettings(SettingKey);
GO

-- 3.11 Audit Logs Table
CREATE TABLE AuditLogs
(
    LogId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NULL,
    Username VARCHAR(50) NULL,
    ActionName VARCHAR(100) NOT NULL,
    ModuleName VARCHAR(50) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    IpAddress VARCHAR(50) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE INDEX IDX_AuditLogs_Username ON AuditLogs(Username);
CREATE INDEX IDX_AuditLogs_CreatedDate ON AuditLogs(CreatedDate);
GO

-- ------------------------------------------------------------------------------------
-- 4. USER DEFINED FUNCTIONS (UDF)
-- ------------------------------------------------------------------------------------

-- 4.1 Function to Generate Next Unique Transaction ID (TRXyyyyMMddXXXX)
CREATE FUNCTION dbo.fn_GenerateTrxId
(
    @Prefix VARCHAR(10) = 'TRX'
)
RETURNS VARCHAR(50)
AS
BEGIN
    DECLARE @TodayStr VARCHAR(8) = CONVERT(VARCHAR(8), GETDATE(), 112);
    DECLARE @Count INT;
    
    SELECT @Count = ISNULL(COUNT(*), 0) + 1 
    FROM Transactions 
    WHERE CAST(RequestDate AS DATE) = CAST(GETDATE() AS DATE);
    
    RETURN @Prefix + @TodayStr + RIGHT('00000' + CAST(@Count AS VARCHAR(5)), 5);
END;
GO

-- 4.2 Function to Calculate Net Commission
CREATE FUNCTION dbo.fn_CalculateCommission
(
    @Price DECIMAL(18,2),
    @BasePrice DECIMAL(18,2)
)
RETURNS DECIMAL(18,2)
AS
BEGIN
    IF @Price IS NULL OR @BasePrice IS NULL OR @Price <= @BasePrice
        RETURN 0;
        
    RETURN (@Price - @BasePrice);
END;
GO

-- 4.3 Function to Format Mobile Phone Numbers to Standard 08xx Format
CREATE FUNCTION dbo.fn_FormatPhoneNumber
(
    @RawNumber VARCHAR(50)
)
RETURNS VARCHAR(20)
AS
BEGIN
    DECLARE @CleanNumber VARCHAR(50);
    SET @CleanNumber = LTRIM(RTRIM(@RawNumber));
    
    IF @CleanNumber LIKE '+62%'
        SET @CleanNumber = '0' + SUBSTRING(@CleanNumber, 4, LEN(@CleanNumber));
    ELSE IF @CleanNumber LIKE '62%'
        SET @CleanNumber = '0' + SUBSTRING(@CleanNumber, 3, LEN(@CleanNumber));
        
    RETURN @CleanNumber;
END;
GO

-- ------------------------------------------------------------------------------------
-- 5. STORED PROCEDURES
-- ------------------------------------------------------------------------------------

-- 5.1 Stored Procedure: Create New Topup Transaction
CREATE PROCEDURE sp_CreateTransaction
    @ProductCode VARCHAR(20),
    @Destination VARCHAR(20),
    @CreatedBy VARCHAR(50),
    @TrxId VARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Format destination
    SET @Destination = dbo.fn_FormatPhoneNumber(@Destination);
    
    -- Validate Product
    DECLARE @Amount DECIMAL(18,2);
    DECLARE @Commission DECIMAL(18,2);
    DECLARE @IsActive BIT;
    
    SELECT @Amount = Price, @Commission = ISNULL(Commission, 0), @IsActive = IsActive
    FROM Products 
    WHERE ProductCode = @ProductCode;
    
    IF @Amount IS NULL
    BEGIN
        RAISERROR('Kode produk tidak ditemukan.', 16, 1);
        RETURN;
    END
    
    IF @IsActive = 0
    BEGIN
        RAISERROR('Produk sedang tidak aktif.', 16, 1);
        RETURN;
    END
    
    -- Generate TrxId
    SET @TrxId = dbo.fn_GenerateTrxId('TRX');
    
    INSERT INTO Transactions 
        (TrxId, ProductCode, Destination, Status, Amount, Commission, CreatedBy, RequestDate, CreatedDate)
    VALUES 
        (@TrxId, @ProductCode, @Destination, 'PENDING', @Amount, @Commission, @CreatedBy, GETDATE(), GETDATE());
        
    SELECT @TrxId AS GeneratedTrxId;
END;
GO

-- 5.2 Stored Procedure: Update Transaction Status from Provider Callback/Response
CREATE PROCEDURE sp_UpdateTransactionStatus
    @TrxId VARCHAR(50),
    @Status VARCHAR(20),
    @ProviderStatus VARCHAR(20),
    @ProviderMessage VARCHAR(255),
    @SerialNumber VARCHAR(100),
    @ResponseTime INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Transactions 
    SET Status = @Status,
        ProviderStatus = @ProviderStatus,
        ProviderMessage = @ProviderMessage,
        SerialNumber = @SerialNumber,
        ResponseDate = GETDATE(),
        ResponseTime = @ResponseTime,
        UpdatedDate = GETDATE()
    WHERE TrxId = @TrxId;
    
    SELECT @@ROWCOUNT AS RowsUpdated;
END;
GO

-- 5.3 Stored Procedure: Get Dashboard Analytics
CREATE PROCEDURE sp_GetDashboardAnalytics
    @TargetDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @TargetDate IS NULL
        SET @TargetDate = CAST(GETDATE() AS DATE);
        
    -- Aggregate Summary
    SELECT 
        COUNT(*) AS TotalCount,
        ISNULL(SUM(Amount), 0) AS TotalAmount,
        SUM(CASE WHEN Status = 'SUCCESS' THEN 1 ELSE 0 END) AS SuccessCount,
        SUM(CASE WHEN Status = 'FAILED' THEN 1 ELSE 0 END) AS FailedCount,
        SUM(CASE WHEN Status = 'PENDING' THEN 1 ELSE 0 END) AS PendingCount,
        ISNULL(SUM(CASE WHEN Status = 'SUCCESS' THEN Commission ELSE 0 END), 0) AS TotalCommission
    FROM Transactions
    WHERE CAST(RequestDate AS DATE) = @TargetDate;
    
    -- Top 5 Best Selling Products
    SELECT TOP 5 
        t.ProductCode, 
        p.ProductName, 
        COUNT(*) AS TrxCount,
        SUM(t.Amount) AS TotalRevenue
    FROM Transactions t
    INNER JOIN Products p ON t.ProductCode = p.ProductCode
    WHERE CAST(t.RequestDate AS DATE) = @TargetDate
    GROUP BY t.ProductCode, p.ProductName
    ORDER BY TrxCount DESC;
    
    -- Hourly Distribution
    SELECT 
        DATEPART(HOUR, RequestDate) AS TrxHour,
        COUNT(*) AS TrxCount,
        SUM(CASE WHEN Status = 'SUCCESS' THEN 1 ELSE 0 END) AS SuccessCount
    FROM Transactions
    WHERE CAST(RequestDate AS DATE) = @TargetDate
    GROUP BY DATEPART(HOUR, RequestDate)
    ORDER BY TrxHour;
END;
GO

-- 5.4 Stored Procedure: Log Integration Detail
CREATE PROCEDURE sp_LogIntegrationDetail
    @TrxId VARCHAR(50),
    @LogType VARCHAR(50),
    @RequestUrl VARCHAR(255) = NULL,
    @RequestBody NVARCHAR(MAX) = NULL,
    @ResponseStatusCode INT = NULL,
    @ResponseBody NVARCHAR(MAX) = NULL,
    @ExecutionTime INT = NULL,
    @ErrorMessage NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO TransactionLogs
        (TrxId, LogType, RequestUrl, RequestBody, ResponseStatusCode, ResponseBody, ExecutionTime, ErrorMessage, CreatedDate)
    VALUES
        (@TrxId, @LogType, @RequestUrl, @RequestBody, @ResponseStatusCode, @ResponseBody, @ExecutionTime, @ErrorMessage, GETDATE());
END;
GO

-- 5.5 Stored Procedure: Search & Filter Transactions with Paging
CREATE PROCEDURE sp_SearchTransactions
    @Status VARCHAR(20) = NULL,
    @ProductCode VARCHAR(20) = NULL,
    @StartDate DATETIME = NULL,
    @EndDate DATETIME = NULL,
    @Username VARCHAR(50) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT 
        t.TrxId,
        t.ProductCode,
        p.ProductName,
        p.Provider,
        t.Destination,
        t.Status,
        t.Amount,
        t.Commission,
        t.SerialNumber,
        t.ProviderMessage,
        t.RequestDate,
        t.ResponseDate,
        t.CreatedBy
    FROM Transactions t
    INNER JOIN Products p ON t.ProductCode = p.ProductCode
    WHERE (@Status IS NULL OR t.Status = @Status)
      AND (@ProductCode IS NULL OR t.ProductCode = @ProductCode)
      AND (@StartDate IS NULL OR t.RequestDate >= @StartDate)
      AND (@EndDate IS NULL OR t.RequestDate <= @EndDate)
      AND (@Username IS NULL OR t.CreatedBy = @Username)
    ORDER BY t.RequestDate DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    -- Total count query for pagination metadata
    SELECT COUNT(*) AS TotalRecords
    FROM Transactions t
    WHERE (@Status IS NULL OR t.Status = @Status)
      AND (@ProductCode IS NULL OR t.ProductCode = @ProductCode)
      AND (@StartDate IS NULL OR t.RequestDate >= @StartDate)
      AND (@EndDate IS NULL OR t.RequestDate <= @EndDate)
      AND (@Username IS NULL OR t.CreatedBy = @Username);
END;
GO

-- ------------------------------------------------------------------------------------
-- 6. VIEWS FOR REPORTING & ANALYTICS
-- ------------------------------------------------------------------------------------

-- 6.1 View: Transaction Detailed Summary
CREATE VIEW vw_TransactionSummary AS
SELECT 
    t.TrxId,
    t.RefNo,
    t.ProductCode,
    p.ProductName,
    p.Provider,
    p.CategoryCode,
    t.Destination,
    t.Status,
    t.ProviderStatus,
    t.ProviderMessage,
    t.Amount,
    t.Commission,
    t.SerialNumber,
    t.RequestDate,
    t.ResponseDate,
    DATEDIFF(MILLISECOND, t.RequestDate, ISNULL(t.ResponseDate, GETDATE())) AS ProcessingTimeMs,
    u.FullName AS OperatorName,
    u.RoleName AS OperatorRole
FROM Transactions t
INNER JOIN Products p ON t.ProductCode = p.ProductCode
INNER JOIN Users u ON t.CreatedBy = u.Username;
GO

-- 6.2 View: Daily Sales Performance Summary
CREATE VIEW vw_DailySalesSummary AS
SELECT 
    CAST(RequestDate AS DATE) AS SalesDate,
    p.Provider,
    COUNT(*) AS TotalTransactions,
    SUM(CASE WHEN t.Status = 'SUCCESS' THEN 1 ELSE 0 END) AS SuccessCount,
    SUM(CASE WHEN t.Status = 'FAILED' THEN 1 ELSE 0 END) AS FailedCount,
    SUM(CASE WHEN t.Status = 'PENDING' THEN 1 ELSE 0 END) AS PendingCount,
    ISNULL(SUM(CASE WHEN t.Status = 'SUCCESS' THEN t.Amount ELSE 0 END), 0) AS GrossVolume,
    ISNULL(SUM(CASE WHEN t.Status = 'SUCCESS' THEN t.Commission ELSE 0 END), 0) AS TotalCommissionProfit
FROM Transactions t
INNER JOIN Products p ON t.ProductCode = p.ProductCode
GROUP BY CAST(RequestDate AS DATE), p.Provider;
GO

-- 6.3 View: Provider Performance & SLA Monitor
CREATE VIEW vw_ProviderPerformance AS
SELECT 
    p.ProviderCode,
    p.ProviderName,
    COUNT(t.Id) AS TotalRequests,
    SUM(CASE WHEN t.Status = 'SUCCESS' THEN 1 ELSE 0 END) AS SuccessCount,
    SUM(CASE WHEN t.Status = 'FAILED' THEN 1 ELSE 0 END) AS FailedCount,
    CAST(ROUND(AVG(CAST(ISNULL(t.ResponseTime, 0) AS FLOAT)), 2) AS DECIMAL(18,2)) AS AvgResponseTimeMs,
    CAST(ROUND((SUM(CASE WHEN t.Status = 'SUCCESS' THEN 1.0 ELSE 0 END) / NULLIF(COUNT(t.Id), 0)) * 100, 2) AS DECIMAL(5,2)) AS SuccessRatePct
FROM Providers p
LEFT JOIN Products prod ON p.ProviderName = prod.Provider
LEFT JOIN Transactions t ON prod.ProductCode = t.ProductCode
GROUP BY p.ProviderCode, p.ProviderName;
GO

-- 6.4 View: User Transaction Performance Statistics
CREATE VIEW vw_UserTransactionStats AS
SELECT 
    u.Username,
    u.FullName,
    u.RoleName,
    COUNT(t.Id) AS TotalSubmitted,
    SUM(CASE WHEN t.Status = 'SUCCESS' THEN 1 ELSE 0 END) AS SuccessfulTrx,
    ISNULL(SUM(CASE WHEN t.Status = 'SUCCESS' THEN t.Amount ELSE 0 END), 0) AS TotalTurnover,
    MAX(t.RequestDate) AS LastTransactionTime
FROM Users u
LEFT JOIN Transactions t ON u.Username = t.CreatedBy
GROUP BY u.Username, u.FullName, u.RoleName;
GO

-- 6.5 View: Active Products Catalog View
CREATE VIEW vw_ActiveProductsCatalog AS
SELECT 
    p.ProductCode,
    p.ProductName,
    pc.CategoryName,
    p.Provider,
    p.Price,
    p.Commission,
    p.IsActive,
    pr.Status AS ProviderStatus
FROM Products p
LEFT JOIN ProductCategories pc ON p.CategoryCode = pc.CategoryCode
LEFT JOIN Providers pr ON p.Provider = pr.ProviderName
WHERE p.IsActive = 1;
GO

-- ------------------------------------------------------------------------------------
-- 7. DATABASE TRIGGERS
-- ------------------------------------------------------------------------------------

-- 7.1 Trigger: Auto update Users UpdatedDate
CREATE TRIGGER trg_Users_UpdateTimestamp
ON Users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users
    SET UpdatedDate = GETDATE()
    FROM Users u
    INNER JOIN inserted i ON u.Id = i.Id;
END;
GO

-- 7.2 Trigger: Auto update Products UpdatedDate
CREATE TRIGGER trg_Products_UpdateTimestamp
ON Products
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Products
    SET UpdatedDate = GETDATE()
    FROM Products p
    INNER JOIN inserted i ON p.Id = i.Id;
END;
GO

-- 7.3 Trigger: Auto update Transactions UpdatedDate
CREATE TRIGGER trg_Transactions_UpdateTimestamp
ON Transactions
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Transactions
    SET UpdatedDate = GETDATE()
    FROM Transactions t
    INNER JOIN inserted i ON t.Id = i.Id;
END;
GO

-- ------------------------------------------------------------------------------------
-- 8. EXTENSIVE DATA SEEDING (INITIAL & MASTER DATA)
-- ------------------------------------------------------------------------------------

-- 8.1 Seed Roles
INSERT INTO Roles (RoleCode, RoleName, Description) VALUES
    ('SA', 'Admin', 'Full System Administrator Access'),
    ('MGR', 'Manager', 'Managerial & Reporting Access'),
    ('OP', 'Operator', 'Frontline Transaction Operator'),
    ('FIN', 'Finance', 'Financial Ledger & Deposit Management'),
    ('CS', 'Customer Service', 'Customer Support & Transaction Inquiries');
GO

-- 8.2 Seed System Users
-- Passwords: SHA-256 Hashes for: Admin123!, Operator123!, Manager123!, Finance123!, Cs123!
INSERT INTO Users (Username, PasswordHash, FullName, Email, PhoneNumber, RoleName, IsActive, CreatedBy) VALUES
    ('admin1', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Admin123!'), 2), 'System Administrator', 'admin@ajotopup.com', '081234567890', 'Admin', 1, 'System'),
    ('operator1', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Operator123!'), 2), 'Frontline Operator 1', 'op1@ajotopup.com', '081234567891', 'Operator', 1, 'System'),
    ('operator2', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Operator123!'), 2), 'Frontline Operator 2', 'op2@ajotopup.com', '081234567892', 'Operator', 1, 'System'),
    ('manager1', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Manager123!'), 2), 'Operations Manager', 'manager@ajotopup.com', '081234567893', 'Manager', 1, 'System'),
    ('finance1', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Finance123!'), 2), 'Finance Staff', 'finance@ajotopup.com', '081234567894', 'Finance', 1, 'System'),
    ('cs1', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Cs123!'), 2), 'Customer Care Staff', 'cs@ajotopup.com', '081234567895', 'CS', 1, 'System');
GO

-- 8.3 Seed User Balances
INSERT INTO UserBalances (UserId, Balance, ReservedBalance)
SELECT Id, 10000000.00, 0.00 FROM Users;
GO

-- 8.4 Seed Product Categories
INSERT INTO ProductCategories (CategoryCode, CategoryName, Description, DisplayOrder) VALUES
    ('PULSA', 'Pulsa Reguler', 'Isi ulang pulsa reguler semua operator seluler', 1),
    ('DATA', 'Paket Data Internet', 'Isi ulang kuota & paket data internet operator', 2),
    ('PLN', 'Token Listrik PLN', 'Pembelian token listrik PLN Prepaid & Postpaid', 3),
    ('EWALLET', 'E-Wallet & E-Money', 'Topup Saldo Dana, OVO, GoPay, ShopeePay, LinkAja', 4),
    ('GAME', 'Voucher Game Online', 'Topup Diamond Mobile Legends, Free Fire, PUBG Mobile', 5),
    ('PPOB', 'Tagihan PPOB', 'Pembayaran tagihan air, BPJS, Telkom, Multifinance', 6);
GO

-- 8.5 Seed Providers Configuration
INSERT INTO Providers (ProviderCode, ProviderName, ApiEndpoint, Balance, Status, Priority) VALUES
    ('TSEL', 'Telkomsel', 'https://api.provider-telkomsel.com/v2/topup', 50000000.00, 'ACTIVE', 1),
    ('ISAT', 'Indosat', 'https://api.provider-indosat.com/v1/topup', 35000000.00, 'ACTIVE', 1),
    ('XL', 'XL', 'https://api.provider-xl.com/v1/topup', 30000000.00, 'ACTIVE', 1),
    ('AXIS', 'Axis', 'https://api.provider-axis.com/v1/topup', 20000000.00, 'ACTIVE', 1),
    ('SMART', 'Smartfren', 'https://api.provider-smartfren.com/v1/topup', 15000000.00, 'ACTIVE', 2),
    ('PLN', 'PLN', 'https://api.pln-postpaid.co.id/v1/token', 100000000.00, 'ACTIVE', 1),
    ('DANA', 'Dana', 'https://api.wallet-dana.id/v1/topup', 40000000.00, 'ACTIVE', 1),
    ('OVO', 'Ovo', 'https://api.wallet-ovo.id/v1/topup', 40000000.00, 'ACTIVE', 1),
    ('GOPAY', 'GoPay', 'https://api.wallet-gopay.id/v1/topup', 50000000.00, 'ACTIVE', 1);
GO

-- 8.6 Seed Master Products (Comprehensive List across All Operator Categories)
INSERT INTO Products (ProductCode, ProductName, CategoryCode, ProviderCode, Provider, Price, BasePrice, Commission, IsActive, CreatedBy) VALUES
    -- Telkomsel Pulsa Reguler
    ('TSEL5', 'Telkomsel 5.000', 'PULSA', 'TSEL', 'Telkomsel', 5500.00, 5200.00, 150.00, 1, 'System'),
    ('TSEL10', 'Telkomsel 10.000', 'PULSA', 'TSEL', 'Telkomsel', 10500.00, 10150.00, 250.00, 1, 'System'),
    ('TSEL20', 'Telkomsel 20.000', 'PULSA', 'TSEL', 'Telkomsel', 20300.00, 19800.00, 400.00, 1, 'System'),
    ('TSEL25', 'Telkomsel 25.000', 'PULSA', 'TSEL', 'Telkomsel', 25300.00, 24700.00, 500.00, 1, 'System'),
    ('TSEL50', 'Telkomsel 50.000', 'PULSA', 'TSEL', 'Telkomsel', 50100.00, 49200.00, 750.00, 1, 'System'),
    ('TSEL100', 'Telkomsel 100.000', 'PULSA', 'TSEL', 'Telkomsel', 99500.00, 98000.00, 1200.00, 1, 'System'),
    ('TSEL150', 'Telkomsel 150.000', 'PULSA', 'TSEL', 'Telkomsel', 148500.00, 146500.00, 1500.00, 1, 'System'),
    
    -- Indosat Ooredoo Pulsa
    ('ISAT5', 'Indosat 5.000', 'PULSA', 'ISAT', 'Indosat', 5450.00, 5150.00, 150.00, 1, 'System'),
    ('ISAT10', 'Indosat 10.000', 'PULSA', 'ISAT', 'Indosat', 10450.00, 10100.00, 250.00, 1, 'System'),
    ('ISAT25', 'Indosat 25.000', 'PULSA', 'ISAT', 'Indosat', 25150.00, 24600.00, 500.00, 1, 'System'),
    ('ISAT50', 'Indosat 50.000', 'PULSA', 'ISAT', 'Indosat', 49850.00, 49000.00, 750.00, 1, 'System'),
    ('ISAT100', 'Indosat 100.000', 'PULSA', 'ISAT', 'Indosat', 98900.00, 97500.00, 1200.00, 1, 'System'),

    -- XL Axiata Pulsa
    ('XL5', 'XL 5.000', 'PULSA', 'XL', 'XL', 5500.00, 5200.00, 150.00, 1, 'System'),
    ('XL10', 'XL 10.000', 'PULSA', 'XL', 'XL', 10450.00, 10100.00, 250.00, 1, 'System'),
    ('XL25', 'XL 25.000', 'PULSA', 'XL', 'XL', 25200.00, 24650.00, 500.00, 1, 'System'),
    ('XL50', 'XL 50.000', 'PULSA', 'XL', 'XL', 50000.00, 49100.00, 750.00, 1, 'System'),
    ('XL100', 'XL 100.000', 'PULSA', 'XL', 'XL', 99200.00, 97800.00, 1200.00, 1, 'System'),

    -- Axis Pulsa
    ('AXIS5', 'Axis 5.000', 'PULSA', 'AXIS', 'Axis', 5450.00, 5150.00, 150.00, 1, 'System'),
    ('AXIS10', 'Axis 10.000', 'PULSA', 'AXIS', 'Axis', 10400.00, 10050.00, 250.00, 1, 'System'),
    ('AXIS25', 'Axis 25.000', 'PULSA', 'AXIS', 'Axis', 25100.00, 24500.00, 600.00, 1, 'System'),
    ('AXIS50', 'Axis 50.000', 'PULSA', 'AXIS', 'Axis', 49900.00, 49000.00, 800.00, 1, 'System'),

    -- Smartfren Pulsa
    ('SMART10', 'Smartfren 10.000', 'PULSA', 'SMART', 'Smartfren', 10300.00, 9950.00, 250.00, 1, 'System'),
    ('SMART25', 'Smartfren 25.000', 'PULSA', 'SMART', 'Smartfren', 25100.00, 24500.00, 500.00, 1, 'System'),
    ('SMART50', 'Smartfren 50.000', 'PULSA', 'SMART', 'Smartfren', 49800.00, 48900.00, 750.00, 1, 'System'),

    -- Token Listrik PLN
    ('PLN20', 'Token PLN 20.000', 'PLN', 'PLN', 'PLN', 20500.00, 20100.00, 300.00, 1, 'System'),
    ('PLN50', 'Token PLN 50.000', 'PLN', 'PLN', 'PLN', 50500.00, 50100.00, 300.00, 1, 'System'),
    ('PLN100', 'Token PLN 100.000', 'PLN', 'PLN', 'PLN', 100500.00, 100100.00, 300.00, 1, 'System'),
    ('PLN200', 'Token PLN 200.000', 'PLN', 'PLN', 'PLN', 200500.00, 200100.00, 300.00, 1, 'System'),

    -- E-Wallet Topup
    ('DANA10', 'Saldo DANA 10.000', 'EWALLET', 'DANA', 'Dana', 10500.00, 10100.00, 200.00, 1, 'System'),
    ('DANA25', 'Saldo DANA 25.000', 'EWALLET', 'DANA', 'Dana', 25500.00, 25100.00, 300.00, 1, 'System'),
    ('DANA50', 'Saldo DANA 50.000', 'EWALLET', 'DANA', 'Dana', 50500.00, 50100.00, 300.00, 1, 'System'),
    ('OVO20', 'Saldo OVO 20.000', 'EWALLET', 'OVO', 'Ovo', 20500.00, 20100.00, 200.00, 1, 'System'),
    ('OVO50', 'Saldo OVO 50.000', 'EWALLET', 'OVO', 'Ovo', 50500.00, 50100.00, 300.00, 1, 'System'),
    ('GOPAY25', 'Saldo GoPay 25.000', 'EWALLET', 'GOPAY', 'GoPay', 25500.00, 25100.00, 300.00, 1, 'System'),
    ('GOPAY50', 'Saldo GoPay 50.000', 'EWALLET', 'GOPAY', 'GoPay', 50500.00, 50100.00, 300.00, 1, 'System');
GO

-- 8.7 Seed System Settings
INSERT INTO SystemSettings (SettingGroup, SettingKey, SettingValue, Description, DataType) VALUES
    ('SYSTEM', 'APP_NAME', 'AjoTopup Management Portal', 'Name of the application', 'STRING'),
    ('SYSTEM', 'API_TIMEOUT_SECONDS', '40', 'Timeout for upstream provider HTTP requests in seconds', 'NUMBER'),
    ('SYSTEM', 'DEFAULT_CURRENCY', 'IDR', 'System default base currency code', 'STRING'),
    ('MAINTENANCE', 'IS_MAINTENANCE_MODE', 'false', 'Flag to enable/disable system-wide maintenance mode', 'BOOLEAN'),
    ('MAINTENANCE', 'MAINTENANCE_MSG', 'System sedang dalam perawatan rutin.', 'Message displayed during maintenance', 'STRING'),
    ('SECURITY', 'MAX_LOGIN_ATTEMPTS', '5', 'Max failed login attempts before lockout', 'NUMBER'),
    ('NOTIF', 'ADMIN_ALERT_EMAIL', 'alert@ajotopup.com', 'Notification email address for failed transaction spikes', 'STRING');
GO

-- 8.8 Seed Sample Historical Transactions for Analytics Demonstration
INSERT INTO Transactions 
    (TrxId, RefNo, ProductCode, Destination, Status, ProviderStatus, ProviderMessage, SerialNumber, Amount, Commission, RequestDate, ResponseDate, ResponseTime, CreatedBy)
VALUES
    ('TRX2026072900001', 'REF8812901', 'TSEL10', '081234567890', 'SUCCESS', 'SUCCESS', 'Topup berhasil', 'SN89210982310', 10500.00, 250.00, DATEADD(MINUTE, -240, GETDATE()), DATEADD(MINUTE, -240, GETDATE()), 320, 'operator1'),
    ('TRX2026072900002', 'REF8812902', 'ISAT25', '085712345678', 'SUCCESS', 'SUCCESS', 'Topup berhasil', 'SN89210982311', 25150.00, 500.00, DATEADD(MINUTE, -210, GETDATE()), DATEADD(MINUTE, -210, GETDATE()), 450, 'operator1'),
    ('TRX2026072900003', 'REF8812903', 'XL50', '081898765432', 'SUCCESS', 'SUCCESS', 'Topup berhasil', 'SN89210982312', 50000.00, 750.00, DATEADD(MINUTE, -180, GETDATE()), DATEADD(MINUTE, -180, GETDATE()), 280, 'operator2'),
    ('TRX2026072900004', 'REF8812904', 'PLN50', '532109876543', 'SUCCESS', 'SUCCESS', 'Token PLN generated', '1823-9082-1273-9012', 50500.00, 300.00, DATEADD(MINUTE, -150, GETDATE()), DATEADD(MINUTE, -150, GETDATE()), 610, 'operator1'),
    ('TRX2026072900005', 'REF8812905', 'DANA25', '081298761234', 'FAILED', 'FAILED', 'Nomor tujuan tidak valid', NULL, 25500.00, 0.00, DATEADD(MINUTE, -120, GETDATE()), DATEADD(MINUTE, -120, GETDATE()), 190, 'operator2'),
    ('TRX2026072900006', 'REF8812906', 'TSEL100', '081390123456', 'SUCCESS', 'SUCCESS', 'Topup berhasil', 'SN89210982315', 99500.00, 1200.00, DATEADD(MINUTE, -90, GETDATE()), DATEADD(MINUTE, -90, GETDATE()), 340, 'operator1'),
    ('TRX2026072900007', 'REF8812907', 'AXIS25', '083812345678', 'SUCCESS', 'SUCCESS', 'Topup berhasil', 'SN89210982316', 25100.00, 600.00, DATEADD(MINUTE, -60, GETDATE()), DATEADD(MINUTE, -60, GETDATE()), 410, 'operator2'),
    ('TRX2026072900008', 'REF8812908', 'TSEL5', '082198765432', 'PENDING', 'PENDING', 'Sedang diproses provider', NULL, 5500.00, 0.00, DATEADD(MINUTE, -15, GETDATE()), NULL, NULL, 'operator1');
GO

-- 8.9 Seed Sample Transaction Integration Logs
INSERT INTO TransactionLogs 
    (TrxId, LogType, RequestUrl, RequestBody, ResponseStatusCode, ResponseBody, ExecutionTime, CreatedDate)
VALUES
    ('TRX2026072900001', 'MVC_TO_API', 'http://localhost/AjoTopup/api/transaction', '{"productCode":"TSEL10","destination":"081234567890"}', 200, NULL, NULL, DATEADD(MINUTE, -240, GETDATE())),
    ('TRX2026072900001', 'API_TO_PROVIDER', '/api/provider/topup', '{"TrxId":"TRX2026072900001","ProductCode":"TSEL10","Destination":"081234567890"}', NULL, NULL, NULL, DATEADD(MINUTE, -240, GETDATE())),
    ('TRX2026072900001', 'API_RESPONSE', '/api/provider/topup', NULL, 200, '{"TrxId":"TRX2026072900001","Status":"SUCCESS","Message":"Topup berhasil","Sn":"SN89210982310"}', 320, DATEADD(MINUTE, -240, GETDATE())),
    
    ('TRX2026072900005', 'MVC_TO_API', 'http://localhost/AjoTopup/api/transaction', '{"productCode":"DANA25","destination":"081298761234"}', 200, NULL, NULL, DATEADD(MINUTE, -120, GETDATE())),
    ('TRX2026072900005', 'API_TO_PROVIDER', '/api/provider/topup', '{"TrxId":"TRX2026072900005","ProductCode":"DANA25","Destination":"081298761234"}', NULL, NULL, NULL, DATEADD(MINUTE, -120, GETDATE())),
    ('TRX2026072900005', 'API_RESPONSE', '/api/provider/topup', NULL, 200, '{"TrxId":"TRX2026072900005","Status":"FAILED","Message":"Nomor tujuan tidak valid","Sn":null}', 190, DATEADD(MINUTE, -120, GETDATE()));
GO

-- 8.10 Seed Audit Trail Logs
INSERT INTO AuditLogs (UserId, Username, ActionName, ModuleName, Description, IpAddress) VALUES
    (1, 'admin1', 'DATABASE_INITIALIZATION', 'SYSTEM', 'Complete Database Setup & Seed Execution', '127.0.0.1'),
    (1, 'admin1', 'LOGIN_SUCCESS', 'AUTH', 'User admin1 logged into system', '127.0.0.1'),
    (2, 'operator1', 'LOGIN_SUCCESS', 'AUTH', 'User operator1 logged into system', '127.0.0.1');
GO

-- ====================================================================================
-- END OF SCRIPT - AJO TOPUP DATABASE SETUP COMPLETED SUCCESSFULLY
-- ====================================================================================
