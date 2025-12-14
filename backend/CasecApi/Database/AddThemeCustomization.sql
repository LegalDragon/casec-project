-- Migration: Theme Customization System
-- Run this after AddClubsAndFamilyFeatures.sql

-- =====================================================
-- PART 1: CREATE THEME SETTINGS TABLE
-- =====================================================

CREATE TABLE ThemeSettings (
    ThemeId INT PRIMARY KEY IDENTITY(1,1),
    OrganizationName NVARCHAR(200) NOT NULL DEFAULT 'CASEC',
    LogoUrl NVARCHAR(500) NULL,
    FaviconUrl NVARCHAR(500) NULL,
    
    -- Color Scheme
    PrimaryColor NVARCHAR(50) NOT NULL DEFAULT '#047857',      -- Green-600 (Tailwind)
    PrimaryDarkColor NVARCHAR(50) NOT NULL DEFAULT '#065f46',  -- Green-700
    PrimaryLightColor NVARCHAR(50) NOT NULL DEFAULT '#d1fae5', -- Green-100
    
    AccentColor NVARCHAR(50) NOT NULL DEFAULT '#f59e0b',       -- Amber-500
    AccentDarkColor NVARCHAR(50) NOT NULL DEFAULT '#d97706',   -- Amber-600
    AccentLightColor NVARCHAR(50) NOT NULL DEFAULT '#fef3c7',  -- Amber-100
    
    SuccessColor NVARCHAR(50) NOT NULL DEFAULT '#10b981',      -- Green-500
    ErrorColor NVARCHAR(50) NOT NULL DEFAULT '#ef4444',        -- Red-500
    WarningColor NVARCHAR(50) NOT NULL DEFAULT '#f59e0b',      -- Amber-500
    InfoColor NVARCHAR(50) NOT NULL DEFAULT '#3b82f6',         -- Blue-500
    
    -- Text Colors
    TextPrimaryColor NVARCHAR(50) NOT NULL DEFAULT '#111827',  -- Gray-900
    TextSecondaryColor NVARCHAR(50) NOT NULL DEFAULT '#6b7280', -- Gray-500
    TextLightColor NVARCHAR(50) NOT NULL DEFAULT '#f9fafb',    -- Gray-50
    
    -- Background Colors
    BackgroundColor NVARCHAR(50) NOT NULL DEFAULT '#ffffff',   -- White
    BackgroundSecondaryColor NVARCHAR(50) NOT NULL DEFAULT '#f3f4f6', -- Gray-100
    
    -- Border & Shadow
    BorderColor NVARCHAR(50) NOT NULL DEFAULT '#e5e7eb',       -- Gray-200
    ShadowColor NVARCHAR(50) NOT NULL DEFAULT '#00000026',     -- Black with 15% opacity
    
    -- Typography
    FontFamily NVARCHAR(200) NOT NULL DEFAULT 'Inter, system-ui, sans-serif',
    HeadingFontFamily NVARCHAR(200) NOT NULL DEFAULT 'Playfair Display, serif',
    
    -- Custom CSS (optional)
    CustomCss NVARCHAR(MAX) NULL,
    
    -- Metadata
    IsActive BIT NOT NULL DEFAULT 1,
    UpdatedBy INT NULL,
    UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    
    FOREIGN KEY (UpdatedBy) REFERENCES Users(UserId)
);

GO

-- Create index for active theme lookup
CREATE INDEX IX_ThemeSettings_IsActive ON ThemeSettings(IsActive);

GO

-- =====================================================
-- PART 2: INSERT DEFAULT THEME
-- =====================================================

-- Insert default CASEC theme
INSERT INTO ThemeSettings (
    OrganizationName,
    PrimaryColor,
    PrimaryDarkColor,
    PrimaryLightColor,
    AccentColor,
    AccentDarkColor,
    AccentLightColor,
    IsActive
)
VALUES (
    'CASEC',
    '#047857',  -- Green-600
    '#065f46',  -- Green-700
    '#d1fae5',  -- Green-100
    '#f59e0b',  -- Amber-500
    '#d97706',  -- Amber-600
    '#fef3c7',  -- Amber-100
    1
);

GO

-- =====================================================
-- PART 3: CREATE STORED PROCEDURE
-- =====================================================

-- Procedure: Get active theme
IF OBJECT_ID('sp_GetActiveTheme', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetActiveTheme;
GO

CREATE PROCEDURE sp_GetActiveTheme
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1
        ThemeId,
        OrganizationName,
        LogoUrl,
        FaviconUrl,
        PrimaryColor,
        PrimaryDarkColor,
        PrimaryLightColor,
        AccentColor,
        AccentDarkColor,
        AccentLightColor,
        SuccessColor,
        ErrorColor,
        WarningColor,
        InfoColor,
        TextPrimaryColor,
        TextSecondaryColor,
        TextLightColor,
        BackgroundColor,
        BackgroundSecondaryColor,
        BorderColor,
        ShadowColor,
        FontFamily,
        HeadingFontFamily,
        CustomCss,
        UpdatedAt
    FROM ThemeSettings
    WHERE IsActive = 1
    ORDER BY ThemeId DESC;
END;
GO

-- Procedure: Update theme
IF OBJECT_ID('sp_UpdateTheme', 'P') IS NOT NULL
    DROP PROCEDURE sp_UpdateTheme;
GO

CREATE PROCEDURE sp_UpdateTheme
    @ThemeId INT,
    @OrganizationName NVARCHAR(200) = NULL,
    @LogoUrl NVARCHAR(500) = NULL,
    @FaviconUrl NVARCHAR(500) = NULL,
    @PrimaryColor NVARCHAR(50) = NULL,
    @PrimaryDarkColor NVARCHAR(50) = NULL,
    @PrimaryLightColor NVARCHAR(50) = NULL,
    @AccentColor NVARCHAR(50) = NULL,
    @AccentDarkColor NVARCHAR(50) = NULL,
    @AccentLightColor NVARCHAR(50) = NULL,
    @SuccessColor NVARCHAR(50) = NULL,
    @ErrorColor NVARCHAR(50) = NULL,
    @WarningColor NVARCHAR(50) = NULL,
    @InfoColor NVARCHAR(50) = NULL,
    @TextPrimaryColor NVARCHAR(50) = NULL,
    @TextSecondaryColor NVARCHAR(50) = NULL,
    @TextLightColor NVARCHAR(50) = NULL,
    @BackgroundColor NVARCHAR(50) = NULL,
    @BackgroundSecondaryColor NVARCHAR(50) = NULL,
    @BorderColor NVARCHAR(50) = NULL,
    @ShadowColor NVARCHAR(50) = NULL,
    @FontFamily NVARCHAR(200) = NULL,
    @HeadingFontFamily NVARCHAR(200) = NULL,
    @CustomCss NVARCHAR(MAX) = NULL,
    @UpdatedBy INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE ThemeSettings
    SET 
        OrganizationName = ISNULL(@OrganizationName, OrganizationName),
        LogoUrl = ISNULL(@LogoUrl, LogoUrl),
        FaviconUrl = ISNULL(@FaviconUrl, FaviconUrl),
        PrimaryColor = ISNULL(@PrimaryColor, PrimaryColor),
        PrimaryDarkColor = ISNULL(@PrimaryDarkColor, PrimaryDarkColor),
        PrimaryLightColor = ISNULL(@PrimaryLightColor, PrimaryLightColor),
        AccentColor = ISNULL(@AccentColor, AccentColor),
        AccentDarkColor = ISNULL(@AccentDarkColor, AccentDarkColor),
        AccentLightColor = ISNULL(@AccentLightColor, AccentLightColor),
        SuccessColor = ISNULL(@SuccessColor, SuccessColor),
        ErrorColor = ISNULL(@ErrorColor, ErrorColor),
        WarningColor = ISNULL(@WarningColor, WarningColor),
        InfoColor = ISNULL(@InfoColor, InfoColor),
        TextPrimaryColor = ISNULL(@TextPrimaryColor, TextPrimaryColor),
        TextSecondaryColor = ISNULL(@TextSecondaryColor, TextSecondaryColor),
        TextLightColor = ISNULL(@TextLightColor, TextLightColor),
        BackgroundColor = ISNULL(@BackgroundColor, BackgroundColor),
        BackgroundSecondaryColor = ISNULL(@BackgroundSecondaryColor, BackgroundSecondaryColor),
        BorderColor = ISNULL(@BorderColor, BorderColor),
        ShadowColor = ISNULL(@ShadowColor, ShadowColor),
        FontFamily = ISNULL(@FontFamily, FontFamily),
        HeadingFontFamily = ISNULL(@HeadingFontFamily, HeadingFontFamily),
        CustomCss = ISNULL(@CustomCss, CustomCss),
        UpdatedBy = @UpdatedBy,
        UpdatedAt = GETDATE()
    WHERE ThemeId = @ThemeId;
    
    -- Log activity
    IF @UpdatedBy IS NOT NULL
    BEGIN
        INSERT INTO ActivityLogs (UserId, ActivityType, Description)
        VALUES (@UpdatedBy, 'ThemeUpdated', 'Updated theme settings');
    END
END;
GO

-- =====================================================
-- PART 4: SAMPLE THEME PRESETS
-- =====================================================

-- Create table for theme presets (optional)
CREATE TABLE ThemePresets (
    PresetId INT PRIMARY KEY IDENTITY(1,1),
    PresetName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    PrimaryColor NVARCHAR(50) NOT NULL,
    PrimaryDarkColor NVARCHAR(50) NOT NULL,
    PrimaryLightColor NVARCHAR(50) NOT NULL,
    AccentColor NVARCHAR(50) NOT NULL,
    AccentDarkColor NVARCHAR(50) NOT NULL,
    AccentLightColor NVARCHAR(50) NOT NULL,
    PreviewImage NVARCHAR(500) NULL,
    IsDefault BIT NOT NULL DEFAULT 0
);

GO

-- Insert theme presets
INSERT INTO ThemePresets (PresetName, Description, PrimaryColor, PrimaryDarkColor, PrimaryLightColor, AccentColor, AccentDarkColor, AccentLightColor, IsDefault)
VALUES 
('CASEC Green (Default)', 'Professional green and amber theme', '#047857', '#065f46', '#d1fae5', '#f59e0b', '#d97706', '#fef3c7', 1),
('Ocean Blue', 'Calm blue and teal theme', '#0284c7', '#0369a1', '#dbeafe', '#14b8a6', '#0d9488', '#ccfbf1', 0),
('Royal Purple', 'Elegant purple and pink theme', '#7c3aed', '#6d28d9', '#ede9fe', '#ec4899', '#db2777', '#fce7f3', 0),
('Sunset Orange', 'Warm orange and red theme', '#ea580c', '#c2410c', '#fed7aa', '#dc2626', '#b91c1c', '#fecaca', 0),
('Forest Green', 'Natural green theme', '#16a34a', '#15803d', '#dcfce7', '#84cc16', '#65a30d', '#ecfccb', 0),
('Professional Navy', 'Corporate navy and blue theme', '#1e40af', '#1e3a8a', '#dbeafe', '#3b82f6', '#2563eb', '#bfdbfe', 0);

GO

PRINT '========================================';
PRINT 'Theme System Migration Completed!';
PRINT '========================================';
PRINT 'New Features:';
PRINT '✓ ThemeSettings table created';
PRINT '✓ ThemePresets table created';
PRINT '✓ Default CASEC theme inserted';
PRINT '✓ 6 theme presets available';
PRINT '✓ Stored procedures created';
PRINT '✓ Logo & favicon support added';
PRINT '✓ 20+ customizable colors';
PRINT '✓ Custom CSS support';
PRINT '========================================';
PRINT 'Admin can now customize:';
PRINT '- Organization name';
PRINT '- Logo image';
PRINT '- Favicon';
PRINT '- Primary colors (main brand color)';
PRINT '- Accent colors (secondary highlights)';
PRINT '- Status colors (success, error, warning, info)';
PRINT '- Text colors';
PRINT '- Background colors';
PRINT '- Typography (font families)';
PRINT '- Custom CSS';
PRINT '========================================';
