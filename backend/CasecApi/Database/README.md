# Database Migrations

This folder contains SQL migration scripts for the CASEC database.

## Naming Convention

All migration scripts must use a **numbered prefix** for proper sorting and execution order:

```
XXX_DescriptiveName.sql
```

Where:
- `XXX` is a three-digit number (e.g., `001`, `002`, `017`)
- `DescriptiveName` briefly describes what the migration does

### Examples

- `001_CreateTables.sql` - Initial database schema
- `002_AddEventTypes.sql` - Adds event types
- `017_AddSlideShows.sql` - Adds slideshow feature

## Adding New Migrations

1. Find the highest numbered migration in this folder
2. Increment by 1 for your new migration number
3. Use descriptive name following the pattern above
4. Include a comment header in your SQL file:

```sql
-- Migration: Brief description
-- Date: YYYY-MM-DD
-- Description: More detailed explanation of what this migration does
```

## Current Migrations

| Number | File | Description |
|--------|------|-------------|
| 001 | CreateTables.sql | Initial database schema |
| 002 | AddEventTypes.sql | Event types table |
| 003 | AddClubsAndFamilyFeatures.sql | Club admin roles, family memberships |
| 004 | AddThemeCustomization.sql | Theme and color customization |
| 005 | AddBoardMembersAndAvatar.sql | Board member positions and avatars |
| 006 | AddEventTypes.sql | Additional event type updates |
| 007 | CreateAssets.sql | Asset management tables |
| 008 | CreateActivityLogs.sql | Activity logging |
| 009 | AddMissingColumns.sql | Schema patches for missing columns |
| 010 | AddHeroVideoUrls.sql | Hero video URL fields |
| 011 | AddAssetStatusSortOrder.sql | Asset status sorting |
| 012 | MembershipDurations.sql | Membership duration options |
| 013 | MembershipPaymentTracking.sql | Payment tracking for memberships |
| 014 | AddPolls.sql | Polling feature |
| 015 | AddSurveys.sql | Survey feature |
| 016 | AddPaymentMethods.sql | Admin-configurable payment methods |
| 017 | AddSlideShows.sql | Slideshow feature with shared media pools |

## Execution

Migrations should be run in numerical order. Each migration is idempotent (safe to run multiple times) using `IF NOT EXISTS` checks.

To run all migrations in order using sqlcmd:

```bash
for f in *.sql; do sqlcmd -S <server> -d CasecDB -i "$f"; done
```

Or run individually:

```bash
sqlcmd -S <server> -d CasecDB -i "001_CreateTables.sql"
sqlcmd -S <server> -d CasecDB -i "002_AddEventTypes.sql"
# ... etc
```
