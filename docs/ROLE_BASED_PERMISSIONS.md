# Role-Based Permission System

This document describes the role-based permission system implemented in this project. It allows granular access control to admin areas without requiring full system admin rights.

## Overview

The system supports two types of admin access:

1. **Legacy Admin** (`user.IsAdmin = true`) - Full access to all admin features
2. **Role-Based Access** - Users assigned to roles that grant permissions to specific admin areas

## Database Schema

### Tables

```sql
-- Roles table - defines named roles
Roles (
    RoleId INT PRIMARY KEY,
    Name NVARCHAR(100),
    Description NVARCHAR(500),
    IsSystem BIT,      -- System roles cannot be deleted
    IsActive BIT,
    CreatedAt DATETIME2,
    UpdatedAt DATETIME2
)

-- Admin Areas table - defines available admin sections
AdminAreas (
    AreaId INT PRIMARY KEY,
    AreaKey NVARCHAR(50),     -- Unique key (e.g., 'users', 'events', 'programs')
    Name NVARCHAR(100),        -- Display name
    Description NVARCHAR(500),
    Category NVARCHAR(100),    -- Grouping (e.g., 'Content', 'Users & Membership')
    Route NVARCHAR(200),       -- Frontend route
    DisplayOrder INT
)

-- Role Area Permissions - links roles to areas with permission levels
RoleAreaPermissions (
    PermissionId INT PRIMARY KEY,
    RoleId INT FOREIGN KEY,
    AreaId INT FOREIGN KEY,
    CanView BIT,      -- Can view/read data
    CanEdit BIT,      -- Can create/update data
    CanDelete BIT,    -- Can delete data
    CreatedAt DATETIME2
)

-- User Roles - assigns roles to users
UserRoles (
    UserRoleId INT PRIMARY KEY,
    UserId INT FOREIGN KEY,
    RoleId INT FOREIGN KEY,
    AssignedAt DATETIME2,
    AssignedBy INT    -- UserId of admin who assigned the role
)
```

### Available Admin Areas

| Area Key | Name | Category |
|----------|------|----------|
| `dashboard` | Dashboard | Dashboard |
| `users` | Manage Users | Users & Membership |
| `membership-types` | Membership Types | Users & Membership |
| `payments` | Payments | Users & Membership |
| `payment-methods` | Payment Methods | Users & Membership |
| `clubs` | Manage Clubs | Content |
| `events` | Manage Events | Content |
| `event-types` | Event Types | Content |
| `programs` | Event Programs | Content |
| `performers` | Performers | Content |
| `content-cards` | Content Cards | Content |
| `polls` | Polls | Engagement |
| `surveys` | Surveys | Engagement |
| `raffles` | Raffles | Engagement |
| `slideshows` | SlideShows | Appearance |
| `theme` | Theme Settings | Appearance |
| `roles` | Role Management | System |

## Backend Implementation

### Helper Methods Pattern

Each controller that needs permission checking includes these helper methods:

```csharp
// Get user ID from JWT claims
private int? GetCurrentUserId()
{
    var userIdClaim = User.FindFirst("UserId")?.Value;
    return int.TryParse(userIdClaim, out var userId) ? userId : null;
}

// Check if user has permission for a specific admin area
private async Task<bool> HasAreaPermissionAsync(
    string areaKey,
    bool requireEdit = false,
    bool requireDelete = false)
{
    // Legacy admin check - full access
    if (User.IsInRole("Admin")) return true;

    var userId = GetCurrentUserId();
    if (userId == null) return false;

    // Check role-based permissions via database
    return await _context.UserRoles
        .Where(ur => ur.UserId == userId.Value)
        .Join(_context.RoleAreaPermissions,
            ur => ur.RoleId,
            rap => rap.RoleId,
            (ur, rap) => rap)
        .Join(_context.AdminAreas,
            rap => rap.AreaId,
            a => a.AreaId,
            (rap, a) => new { rap, a })
        .Where(x => x.a.AreaKey == areaKey && x.rap.CanView)
        .Where(x => !requireEdit || x.rap.CanEdit)
        .Where(x => !requireDelete || x.rap.CanDelete)
        .AnyAsync();
}

// Return standardized 403 Forbidden response
private ActionResult<T> ForbiddenResponse<T>(
    string message = "You do not have permission to perform this action")
{
    return StatusCode(403, new ApiResponse<T>
    {
        Success = false,
        Message = message
    });
}
```

### Usage in Controller Methods

```csharp
// View-only endpoint (CanView required)
[Authorize]
[HttpGet]
public async Task<ActionResult<ApiResponse<List<ItemDto>>>> GetItems()
{
    try
    {
        if (!await HasAreaPermissionAsync("area-key"))
            return ForbiddenResponse<List<ItemDto>>();

        // ... rest of implementation
    }
}

// Create/Update endpoint (CanEdit required)
[Authorize]
[HttpPost]
public async Task<ActionResult<ApiResponse<ItemDto>>> CreateItem([FromBody] Request request)
{
    try
    {
        if (!await HasAreaPermissionAsync("area-key", requireEdit: true))
            return ForbiddenResponse<ItemDto>();

        // ... rest of implementation
    }
}

// Delete endpoint (CanDelete required)
[Authorize]
[HttpDelete("{id}")]
public async Task<ActionResult<ApiResponse<bool>>> DeleteItem(int id)
{
    try
    {
        if (!await HasAreaPermissionAsync("area-key", requireDelete: true))
            return ForbiddenResponse<bool>();

        // ... rest of implementation
    }
}
```

### Key Changes from Legacy Authorization

**Before (Legacy Admin Only):**
```csharp
[Authorize(Roles = "Admin")]
[HttpPost]
public async Task<ActionResult<ApiResponse<ItemDto>>> CreateItem(...)
{
    // Only users with IsAdmin=true could access
}
```

**After (Role-Based):**
```csharp
[Authorize]  // Just requires authentication
[HttpPost]
public async Task<ActionResult<ApiResponse<ItemDto>>> CreateItem(...)
{
    // Check for either legacy admin OR role-based permission
    if (!await HasAreaPermissionAsync("area-key", requireEdit: true))
        return ForbiddenResponse<ItemDto>();

    // Users with IsAdmin=true OR appropriate role can access
}
```

## Frontend Implementation

### Store (useStore.js)

```javascript
// In useAuthStore:

// Check if user has any admin access
hasAdminAccess: () => {
    const { user } = get();
    if (!user) return false;
    return user.isAdmin || (user.allowedAdminAreas && user.allowedAdminAreas.length > 0);
}

// Check access to a specific admin area
canAccessArea: (areaKey) => {
    const { user } = get();
    if (!user) return false;
    if (user.isAdmin) return true;  // Legacy admins can access everything
    return user.allowedAdminAreas?.includes(areaKey) || false;
}
```

### User Object Structure

The user object returned from login includes:
```javascript
{
    userId: 123,
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    isAdmin: false,  // Legacy admin flag
    allowedAdminAreas: ["programs", "performers", "events"]  // Role-based permissions
}
```

### Route Protection (App.jsx)

```jsx
function AdminRoute({ children }) {
    const { isAuthenticated, hasAdminAccess } = useAuthStore();
    return isAuthenticated && hasAdminAccess()
        ? children
        : <Navigate to="/dashboard" />;
}
```

### Admin Layout Menu Filtering (AdminLayout.jsx)

```javascript
// Filter menu items based on user permissions
const adminLinks = allAdminLinks.filter((link) => {
    if (link.divider) {
        // Handle dividers...
    }
    return canAccessArea(link.areaKey);
});
```

### Dashboard Access Card (Dashboard.jsx)

```jsx
// Show admin panel card for users with any admin access
{hasAdminAccess() && (
    <div className="card">
        <h3>Admin Panel</h3>
        <p>
            {user?.isAdmin
                ? "Manage users, payments, events, and customize the site."
                : "Access your assigned admin areas and manage content."}
        </p>
        <Link to="/admin">Open Admin</Link>
    </div>
)}
```

## Permission Merging

When a user has multiple roles, permissions are merged (highest permission wins):

```csharp
// If user has Role A with CanView=true, CanEdit=false
// and Role B with CanView=true, CanEdit=true
// Result: CanView=true, CanEdit=true (highest wins)

existing.CanView = existing.CanView || perm.CanView;
existing.CanEdit = existing.CanEdit || perm.CanEdit;
existing.CanDelete = existing.CanDelete || perm.CanDelete;
```

## API Endpoints for Role Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/roles` | GET | Get all roles with permissions |
| `/roles/{id}` | GET | Get single role details |
| `/roles` | POST | Create new role |
| `/roles/{id}` | PUT | Update role and permissions |
| `/roles/{id}` | DELETE | Delete role |
| `/roles/assign` | POST | Assign role to user |
| `/roles/unassign/{userRoleId}` | DELETE | Remove role from user |
| `/roles/user/{userId}/permissions` | GET | Get user's merged permissions |
| `/roles/my-permissions` | GET | Get current user's permissions |
| `/roles/areas` | GET | Get all available admin areas |

## Adding a New Admin Area

1. **Add to Database Migration:**
```sql
INSERT INTO [AdminAreas] ([AreaKey], [Name], [Description], [Category], [Route], [DisplayOrder])
VALUES (N'new-area', N'New Area', N'Description', N'Category', N'/admin/new-area', 60);
```

2. **Create Controller with Permission Checking:**
```csharp
[ApiController]
[Route("[controller]")]
public class NewAreaController : ControllerBase
{
    // Add the three helper methods (GetCurrentUserId, HasAreaPermissionAsync, ForbiddenResponse)

    [Authorize]
    [HttpGet]
    public async Task<ActionResult<...>> GetItems()
    {
        if (!await HasAreaPermissionAsync("new-area"))
            return ForbiddenResponse<...>();
        // ...
    }
}
```

3. **Add Frontend Route:**
```jsx
// In App.jsx
<Route path="/admin/new-area" element={
    <AdminRoute><NewAreaPage /></AdminRoute>
} />
```

4. **Add to Admin Menu:**
```javascript
// In AdminLayout.jsx
{ name: 'New Area', path: '/admin/new-area', icon: NewIcon, areaKey: 'new-area' }
```

## Security Considerations

1. **JWT Token:** Legacy admin status is encoded in the JWT token as a role claim. Role-based permissions are fetched from the database at runtime.

2. **Database Queries:** Permission checks query the database each time to ensure real-time permission updates.

3. **Fail-Safe:** If no permission is found, access is denied (fail-closed).

4. **Role Management:** Only system admins (IsAdmin=true) can manage roles and permissions (RolesController uses `[Authorize(Roles = "Admin")]`).

## Testing Role-Based Access

1. Create a test user (not a system admin)
2. Create a role with specific area permissions
3. Assign the role to the test user
4. Log in as the test user
5. Verify they can access assigned areas and are blocked from others

## Migration from Legacy Admin

Existing users with `IsAdmin=true` continue to have full access. No migration is required. Role-based permissions layer on top of the legacy system.
