"""
Role service for managing roles and permissions.
"""

from typing import Optional
from sqlalchemy.orm import Session
from app.models.role import Role, RoleType
from app.models.user import User


class RoleService:
    """Service for role management operations."""
    
    @staticmethod
    def create_default_roles(db: Session) -> None:
        """Create default system roles if they don't exist."""
        default_roles = [
            {"name": RoleType.ADMIN, "description": "System administrator with full access"},
            {"name": RoleType.USER, "description": "Standard user with basic access"},
            {"name": RoleType.MODERATOR, "description": "Content moderator with limited admin access"},
            {"name": RoleType.VIEWER, "description": "Read-only access to the system"},
        ]
        
        for role_data in default_roles:
            existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
            if not existing_role:
                role = Role(**role_data)
                db.add(role)
        
        db.commit()
    
    @staticmethod
    def get_role_by_name(db: Session, name: str) -> Optional[Role]:
        """Get role by name."""
        return db.query(Role).filter(Role.name == name).first()
    
    @staticmethod
    def get_all_roles(db: Session) -> list[Role]:
        """Get all roles."""
        return db.query(Role).all()
    
    @staticmethod
    def assign_role_to_user(db: Session, user: User, role_name: str) -> bool:
        """Assign a role to a user."""
        role = RoleService.get_role_by_name(db, role_name)
        if not role:
            return False
        
        if role not in user.roles:
            user.roles.append(role)
            db.commit()
        
        return True
    
    @staticmethod
    def remove_role_from_user(db: Session, user: User, role_name: str) -> bool:
        """Remove a role from a user."""
        role = RoleService.get_role_by_name(db, role_name)
        if not role:
            return False
        
        if role in user.roles:
            user.roles.remove(role)
            db.commit()
        
        return True
    
    @staticmethod
    def assign_default_role(db: Session, user: User) -> None:
        """Assign default USER role to a new user."""
        RoleService.assign_role_to_user(db, user, RoleType.USER)
        
        # If user is marked as admin, also assign ADMIN role
        if user.is_admin:
            RoleService.assign_role_to_user(db, user, RoleType.ADMIN)