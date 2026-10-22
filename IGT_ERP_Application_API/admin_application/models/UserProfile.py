from django.db import models
from django.contrib.auth.models import User
from .Department import Department
from .Designation import Designation
from .RolePermission import RolePermission, get_saved_role_permissions


class UserProfile(models.Model):
    ROLE_ADMIN = 'Admin'
    ROLE_TECHNICAL = 'Technical'
    ROLE_SALES = 'Sales'
    ROLE_HR = 'HR'
    ROLE_STUDENT = 'Student'

    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Admin'),
        (ROLE_TECHNICAL, 'Technical'),
        (ROLE_SALES, 'Sales'),
        (ROLE_HR, 'HR'),
        (ROLE_STUDENT, 'Student'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default=ROLE_STUDENT)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='user_profiles')
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, blank=True, related_name='user_profiles')
    permissions = models.JSONField(default=dict, blank=True)
    custom_permissions = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profile'

    def __str__(self):
        return f"{self.user.username} ({self.role})"

    def get_effective_permissions(self):
        """
        Computes effective permissions for this user:
        1. Starts with the role's current default permissions from database.
        2. Merges any individual user overrides (custom_permissions).
        """
        role_defaults = get_saved_role_permissions(self.role)
        effective = {}
        for menu, act_dict in role_defaults.items():
            if isinstance(act_dict, dict):
                effective[menu] = dict(act_dict)
            else:
                effective[menu] = {'view': bool(act_dict), 'add': False, 'edit': False, 'delete': False}

        # Apply individual overrides if present
        if isinstance(self.custom_permissions, dict):
            for menu, act_dict in self.custom_permissions.items():
                if menu in effective and isinstance(act_dict, dict):
                    effective[menu].update(act_dict)
                elif isinstance(act_dict, dict):
                    effective[menu] = dict(act_dict)

        # Baseline: profile view is always permitted
        if 'profile' not in effective:
            effective['profile'] = {'view': True, 'add': False, 'edit': True, 'delete': False}
        else:
            effective['profile']['view'] = True

        return effective


def get_or_create_user_profile(user):
    """
    Retrieves or initializes a UserProfile.
    Superusers automatically receive the 'Admin' role and full permissions.
    """
    profile, created = UserProfile.objects.get_or_create(user=user)
    if created:
        if user.is_superuser:
            profile.role = UserProfile.ROLE_ADMIN
        else:
            profile.role = UserProfile.ROLE_STUDENT
        profile.permissions = profile.get_effective_permissions()
        profile.save()
    elif user.is_superuser and profile.role != UserProfile.ROLE_ADMIN:
        profile.role = UserProfile.ROLE_ADMIN
        profile.permissions = profile.get_effective_permissions()
        profile.save()

    return profile
