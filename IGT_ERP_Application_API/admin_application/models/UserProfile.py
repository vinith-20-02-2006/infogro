from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    ROLE_ADMIN = 'Admin'
    ROLE_TECHNICAL = 'Technical'
    ROLE_SALES = 'Sales / Staff'
    ROLE_STUDENT = 'Student'

    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Admin'),
        (ROLE_TECHNICAL, 'Technical'),
        (ROLE_SALES, 'Sales / Staff'),
        (ROLE_STUDENT, 'Student'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default=ROLE_STUDENT)
    permissions = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profile'

    def __str__(self):
        return f"{self.user.username} ({self.role})"


def get_or_create_user_profile(user):
    """
    Retrieves or initializes a UserProfile.
    Superusers automatically receive the 'Admin' role and full permissions.
    Regular new users receive default permissions: ['profile'].
    """
    profile, created = UserProfile.objects.get_or_create(user=user)
    if created:
        if user.is_superuser:
            profile.role = UserProfile.ROLE_ADMIN
            profile.permissions = ['profile', 'dashboard', 'course', 'certificate', 'user_management']
        else:
            profile.role = UserProfile.ROLE_STUDENT
            profile.permissions = ['profile']
        profile.save()
    elif user.is_superuser and profile.role != UserProfile.ROLE_ADMIN:
        profile.role = UserProfile.ROLE_ADMIN
        if 'user_management' not in profile.permissions:
            profile.permissions = list(set(profile.permissions + ['profile', 'dashboard', 'course', 'certificate', 'user_management']))
        profile.save()
    elif not profile.permissions:
        profile.permissions = ['profile']
        profile.save()

    return profile
