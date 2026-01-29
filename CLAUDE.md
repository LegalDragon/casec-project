# Claude Code Project Notes

## Database
- **Database Engine**: Microsoft SQL Server 2014
- **SQL Syntax Notes**:
  - Use `IF NOT EXISTS (SELECT * FROM sys.columns WHERE ...)` pattern for conditional column additions
  - No `ADD COLUMN IF NOT EXISTS` syntax (that's PostgreSQL/MySQL)
  - Use `ALTER TABLE ... ADD column_name datatype NULL` for new columns
  - For boolean fields, use `BIT` type with default values

## Migration Script Template
```sql
-- Check if column exists before adding
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'TableName') AND name = 'ColumnName')
BEGIN
    ALTER TABLE TableName ADD ColumnName DATATYPE NULL;
END
```

## Project Structure
- Backend: ASP.NET Core with Entity Framework
- Frontend: React with Vite
- Database migrations: `/database/migrations/`
