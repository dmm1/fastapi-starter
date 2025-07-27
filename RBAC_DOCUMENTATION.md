# Role-Based Access Control (RBAC) System

## Overview

The FastAPI Starter now includes a comprehensive Role-Based Access Control (RBAC) system that replaces the simple boolean `is_admin` field with a flexible role management system.

## Role System

### Available Roles

The system includes four default roles:

- **admin**: System administrator with full access
- **user**: Standard user with basic access  
- **moderator**: Content moderator with limited admin access
- **viewer**: Read-only access to the system

### Role Assignment

Users can have multiple roles assigned simultaneously. The system maintains backward compatibility with the `is_admin` boolean field.

## Token System Enhancements

### JWT Payload

Access tokens now include role information:

```json
{
  "sub": "1",
  "email": "user@example.com", 
  "roles": ["admin", "user"],
  "is_admin": true,
  "exp": 1753632784,
  "type": "access",
  "iat": 1753630984,
  "token_version": 1
}
```

### Token Security Features

- **Token versioning**: Future token invalidation support
- **Enhanced payload**: Includes roles and timestamps
- **Backward compatibility**: `is_admin` flag still included

## API Endpoints

### Role Management

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/api/v1/roles/` | Get all available roles | Any authenticated user |
| POST | `/api/v1/roles/assign` | Assign roles to user | Admin |
| GET | `/api/v1/roles/user/{user_id}` | Get user's roles | Self or Admin |

### Authentication 

All existing auth endpoints remain the same but now return tokens with role information:

- `/api/v1/auth/login` - Returns tokens with user roles
- `/api/v1/auth/refresh` - Refreshes tokens with current roles
- `/api/v1/auth/register` - Creates user with default "user" role

## Security Enhancements

### Password Policy

New users must have passwords that meet these requirements:

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one digit
- At least one special character

### Security Headers

All responses include security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

## Using Role-Based Dependencies

### Built-in Dependencies

```python
from app.api.deps import require_admin, require_moderator, require_user

@router.get("/admin-only")
def admin_endpoint(current_user: User = Depends(require_admin())):
    """Admin only endpoint"""
    return {"message": "Admin access granted"}

@router.get("/moderator-access") 
def moderator_endpoint(current_user: User = Depends(require_moderator())):
    """Moderator or admin access"""
    return {"message": "Moderator access granted"}
```

### Custom Role Requirements

```python
from app.api.deps import require_roles

@router.get("/custom-access")
def custom_endpoint(current_user: User = Depends(require_roles(["admin", "moderator"]))):
    """Custom role requirements"""
    return {"message": "Custom access granted"}
```

## Migration from v1.0

### Backward Compatibility

Existing code using `is_admin` checks will continue to work:

```python
# This still works
if current_user.is_admin:
    # Admin logic

# But this is preferred now
if current_user.has_role("admin"):
    # Admin logic
```

### Database Migration

The system automatically:

1. Creates the new roles table
2. Creates default roles
3. Assigns roles to existing users based on `is_admin` flag
4. Maintains the `is_admin` field for compatibility

## Example Usage

### Creating a User with Specific Roles

```python
from app.schemas.user import UserCreate
from app.models.role import RoleType

user_data = UserCreate(
    email="moderator@example.com",
    username="moderator", 
    password="StrongPass123!",
    roles=[RoleType.MODERATOR, RoleType.USER]
)
```

### Checking User Roles

```python
# Check if user has specific role
if user.has_role("admin"):
    print("User is admin")

# Get all user roles
roles = user.get_role_names()
print(f"User roles: {roles}")
```

### Token Role Verification

```python
from app.core.security import verify_token

payload = verify_token(access_token)
if "admin" in payload.get("roles", []):
    print("Token has admin role")
```

This RBAC system provides a flexible foundation for implementing complex authorization requirements while maintaining backward compatibility with existing code.