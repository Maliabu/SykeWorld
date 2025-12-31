# Roles and Permissions Guide

## Overview

The Syke World Hotel management system uses a **role-based access control (RBAC)** system where:
- **Roles** define job positions (e.g., Manager, Housekeeper, Receptionist)
- **Permissions** define access to specific pages and features
- **Staff members** are assigned roles, which automatically grant them the permissions associated with that role

## How It Works

### 1. **Roles**
Roles are job positions that staff members can have. Examples:
- Manager
- Housekeeper
- Receptionist
- Chef
- Waiter

### 2. **Permissions**
Permissions define access to specific pages and features. Each permission has:
- **Name**: Internal identifier (e.g., `pos_menu_categories`)
- **Display Name**: Human-readable name (e.g., "POS Menu Categories")
- **Page Path**: The dashboard page path (e.g., `/admin/dashboard/pos/menu-categories`)
- **Category**: Grouping (e.g., "POS", "Rooms", "Bookings")

### 3. **Role Permissions**
When you assign permissions to a role, **all staff members with that role** automatically get those permissions.

### 4. **User Permissions** (Optional)
You can also grant permissions directly to individual users, overriding or supplementing their role permissions.

## How to Use

### Step 1: Create Roles
1. Go to **Staff → Roles**
2. Click **"Add Role"**
3. Enter role name and description
4. Click **"Create Role"**

### Step 2: Assign Permissions to Roles
1. In the **Roles** page, click the **Settings icon** (⚙️) next to a role
2. In the dialog, check/uncheck permissions to grant/revoke access
3. Permissions are saved automatically

### Step 3: Assign Roles to Staff
1. Go to **Staff → All Staff**
2. Click **"Edit"** next to a staff member
3. Select a role from the dropdown
4. Click **"Update"**

**That's it!** The staff member now has all permissions assigned to their role.

## Permission Checking

The system automatically checks permissions when:
- Staff members try to access dashboard pages
- Server actions are called (e.g., creating rooms, managing bookings)
- Navigation menu items are displayed

### How Permissions Are Checked

1. **Admins** (`isSuperuser: true` or `userType: "admin"`) have **all permissions** automatically
2. **Staff members** get permissions from:
   - Their assigned role (via `rolePermissions` table)
   - Direct user permissions (via `userPermissions` table)
3. If a permission doesn't exist in the database yet, staff members are allowed access (for backward compatibility)

## Creating Permission Definitions

To create new permission definitions, you can use the server action:

```typescript
import { createPermissionDefinition } from "@/lib/actions/permissions";

await createPermissionDefinition({
  name: "pos_menu_categories",
  displayName: "POS Menu Categories",
  description: "Access to manage POS menu categories",
  pagePath: "/admin/dashboard/pos/menu-categories",
  category: "POS",
});
```

## Example Workflow

### Example: Creating a "Housekeeper" Role

1. **Create the Role**:
   - Name: "Housekeeper"
   - Description: "Responsible for room cleaning and maintenance"

2. **Assign Permissions**:
   - ✅ View Rooms
   - ✅ View Bookings
   - ✅ View Tasks
   - ❌ Add Rooms (no access)
   - ❌ Manage Payments (no access)
   - ❌ POS System (no access)

3. **Assign to Staff**:
   - Edit a staff member
   - Select "Housekeeper" role
   - Save

Now that staff member can only access the pages you've granted permissions for!

## Tips

1. **Start with broad permissions**: Create roles with common permission sets first
2. **Use categories**: Group related permissions by category for easier management
3. **Test permissions**: After assigning roles, test that staff members can/cannot access the intended pages
4. **Direct user permissions**: Use sparingly - it's better to create a new role if many users need the same custom permission set

## Troubleshooting

### Staff member can't access a page
1. Check if they have a role assigned (Staff → All Staff → Edit)
2. Check if the role has the required permission (Staff → Roles → Settings icon)
3. Check if the permission definition exists and is active
4. Verify the page path matches the permission's `pagePath`

### Permission not working
1. Ensure the server action uses `requirePermission()` or `checkUserPermission()`
2. Check that the permission name matches exactly (case-sensitive)
3. Verify the user has a staff profile with an assigned role

## Technical Details

### Database Tables
- `roles`: Stores role definitions
- `staff_profiles`: Links users to roles
- `permission_definitions`: Stores available permissions
- `role_permissions`: Links roles to permissions
- `user_permissions`: Direct user-to-permission assignments (optional)

### Server Actions
- `requirePermission(permissionName)`: Throws error if user doesn't have permission
- `checkUserPermission(permissionName)`: Returns boolean
- `hasPermission(userId, permissionName)`: Internal permission check
- `getUserPermissions(userId)`: Get all permissions for a user

### Client-Side Checking
- `checkUserPermission(permissionName)`: Server action for client-side checks
- Use in React components to conditionally render UI elements



