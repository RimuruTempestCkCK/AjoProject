-- Database Initialization for AjoTopup
CREATE DATABASE AjoTopup;
GO

USE AjoTopup;
GO

-- 1. Create Users Table
CREATE TABLE Users
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NULL,
    PhoneNumber VARCHAR(20) NULL,
    RoleName VARCHAR(20) NOT NULL, -- Admin / Operator / Manager
    IsActive BIT NOT NULL DEFAULT 1,
    LastLoginDate DATETIME NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CreatedBy VARCHAR(50) NULL,
    UpdatedDate DATETIME NULL,
    UpdatedBy VARCHAR(50) NULL,
    CONSTRAINT CK_RoleName CHECK (RoleName IN ('Admin', 'Operator', 'Manager'))
);

CREATE INDEX IDX_Users_Username ON Users(Username);
CREATE INDEX IDX_Users_RoleName ON Users(RoleName);
CREATE INDEX IDX_Users_IsActive ON Users(IsActive);
GO

-- 2. Create Products Table
CREATE TABLE Products
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProductCode VARCHAR(20) NOT NULL UNIQUE,
    ProductName VARCHAR(100) NOT NULL,
    ProviderCode VARCHAR(20) NULL,
    Provider VARCHAR(50) NOT NULL, -- Telkomsel, Indosat, XL, Axis
    Price DECIMAL(18,2) NOT NULL,
    Commission DECIMAL(18,2) NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CreatedBy VARCHAR(50) NULL,
    UpdatedDate DATETIME NULL,
    UpdatedBy VARCHAR(50) NULL,
    CONSTRAINT CK_Provider CHECK (Provider IN ('Telkomsel', 'Indosat', 'XL', 'Axis')),
    CONSTRAINT CK_Price CHECK (Price > 0)
);

CREATE INDEX IDX_Products_ProductCode ON Products(ProductCode);
CREATE INDEX IDX_Products_IsActive ON Products(IsActive);
CREATE INDEX IDX_Products_Provider ON Products(Provider);
GO

-- 3. Create Transactions Table
CREATE TABLE Transactions
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TrxId VARCHAR(50) NOT NULL UNIQUE,
    ProductCode VARCHAR(20) NOT NULL,
    Destination VARCHAR(20) NOT NULL,
    Status VARCHAR(20) NOT NULL, -- PENDING / SUCCESS / FAILED
    ProviderStatus VARCHAR(20) NULL,
    ProviderMessage VARCHAR(255) NULL,
    SerialNumber VARCHAR(100) NULL,
    Amount DECIMAL(18,2) NOT NULL,
    Commission DECIMAL(18,2) NULL DEFAULT 0,
    RequestDate DATETIME NOT NULL DEFAULT GETDATE(),
    ResponseDate DATETIME NULL,
    ResponseTime INT NULL,
    CreatedBy VARCHAR(50) NOT NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedDate DATETIME NULL,
    CONSTRAINT CK_TrxStatus CHECK (Status IN ('PENDING', 'SUCCESS', 'FAILED')),
    CONSTRAINT FK_Transactions_Products FOREIGN KEY (ProductCode) 
        REFERENCES Products(ProductCode),
    CONSTRAINT FK_Transactions_Users FOREIGN KEY (CreatedBy) 
        REFERENCES Users(Username)
);

CREATE INDEX IDX_Transactions_TrxId ON Transactions(TrxId);
CREATE INDEX IDX_Transactions_Status ON Transactions(Status);
CREATE INDEX IDX_Transactions_CreatedBy ON Transactions(CreatedBy);
CREATE INDEX IDX_Transactions_RequestDate ON Transactions(RequestDate);
CREATE INDEX IDX_Transactions_Destination ON Transactions(Destination);
CREATE INDEX IDX_Transactions_ProductCode ON Transactions(ProductCode);
GO

-- 4. Create TransactionLogs Table
CREATE TABLE TransactionLogs
(
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TrxId VARCHAR(50) NOT NULL,
    LogType VARCHAR(50) NOT NULL, -- MVC_TO_API / API_TO_PROVIDER / API_RESPONSE
    RequestUrl VARCHAR(255) NULL,
    RequestHeaders NVARCHAR(MAX) NULL,
    RequestBody NVARCHAR(MAX) NOT NULL,
    ResponseStatusCode INT NULL,
    ResponseHeaders NVARCHAR(MAX) NULL,
    ResponseBody NVARCHAR(MAX) NULL,
    ExecutionTime INT NULL,
    ErrorMessage NVARCHAR(MAX) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_TransactionLogs_Transactions FOREIGN KEY (TrxId) 
        REFERENCES Transactions(TrxId),
    CONSTRAINT CK_LogType CHECK (LogType IN ('MVC_TO_API', 'API_TO_PROVIDER', 'API_RESPONSE'))
);

CREATE INDEX IDX_TransactionLogs_TrxId ON TransactionLogs(TrxId);
CREATE INDEX IDX_TransactionLogs_LogType ON TransactionLogs(LogType);
CREATE INDEX IDX_TransactionLogs_CreatedDate ON TransactionLogs(CreatedDate);
GO

-- 5. Seed Initial Data
-- Note: password hashes are generated as SHA-256 hash representation of: Admin123!, Operator123!, Manager123!
-- We'll store precomputed uppercase hex strings:
-- Admin123! -> 04A6B63B6CE1C2D90200EF72FF363BF029B854449D0FE99BCBE554BF180CE4D1 (or lowercase hex)
-- Let's just use string values first, or hash using SQL HASHBYTES. 
-- HASHBYTES returns varbinary, we can convert it to varchar if we want, but since PasswordHash is VARCHAR(255),
-- let's use CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Admin123!'), 2)
-- CONVERT with style 2 returns the hex string without leading 0x.
INSERT INTO Users (Username, PasswordHash, FullName, Email, PhoneNumber, RoleName, IsActive, CreatedBy)
VALUES 
    ('admin1', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Admin123!'), 2), 'Administrator', 'admin@ajotopup.com', '081234567890', 'Admin', 1, 'System'),
    ('operator1', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Operator123!'), 2), 'Operator 1', 'op1@ajotopup.com', '081234567891', 'Operator', 1, 'System'),
    ('operator2', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Operator123!'), 2), 'Operator 2', 'op2@ajotopup.com', '081234567892', 'Operator', 1, 'System'),
    ('manager1', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Manager123!'), 2), 'Manager', 'manager@ajotopup.com', '081234567893', 'Manager', 1, 'System');

INSERT INTO Products (ProductCode, ProductName, ProviderCode, Provider, Price, Commission, IsActive, CreatedBy)
VALUES 
    ('TSEL5', 'Telkomsel 5.000', 'TSEL5', 'Telkomsel', 5000, 100, 1, 'System'),
    ('TSEL10', 'Telkomsel 10.000', 'TSEL10', 'Telkomsel', 10000, 250, 1, 'System'),
    ('TSEL20', 'Telkomsel 20.000', 'TSEL20', 'Telkomsel', 20000, 500, 1, 'System'),
    ('ISAT5', 'Indosat 5.000', 'ISAT5', 'Indosat', 5000, 100, 1, 'System'),
    ('ISAT10', 'Indosat 10.000', 'ISAT10', 'Indosat', 10000, 250, 1, 'System'),
    ('XL10', 'XL 10.000', 'XL10', 'XL', 10000, 250, 1, 'System'),
    ('AXIS25', 'Axis 25.000', 'AXIS25', 'Axis', 25000, 600, 1, 'System');
GO

-- 6. Create View
CREATE VIEW vw_TransactionSummary AS
SELECT 
    t.TrxId,
    t.ProductCode,
    p.ProductName,
    p.Provider,
    t.Destination,
    t.Status,
    t.Amount,
    t.SerialNumber,
    t.RequestDate,
    t.ResponseDate,
    DATEDIFF(MILLISECOND, t.RequestDate, ISNULL(t.ResponseDate, GETDATE())) AS ProcessingTime,
    u.FullName AS OperatorName
FROM Transactions t
INNER JOIN Products p ON t.ProductCode = p.ProductCode
INNER JOIN Users u ON t.CreatedBy = u.Username;
GO
