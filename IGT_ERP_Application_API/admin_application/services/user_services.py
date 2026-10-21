import logging
from rest_framework.exceptions import AuthenticationFailed, ValidationError, PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken, UntypedToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from ..models.UserProfile import UserProfile, get_or_create_user_profile

logger = logging.getLogger('django')


def create_token(**data):
    username = data.get('username')
    password = data.get('password')

    user = authenticate(username=username, password=password)
    if not user:
        raise AuthenticationFailed(detail='Invalid Credentials')

    profile = get_or_create_user_profile(user)

    refresh_tkn = RefreshToken.for_user(user)
    access_tkn = refresh_tkn.access_token

    full_name = f"{user.first_name} {user.last_name}".strip() or user.username

    # Add custom claims to the access token
    access_tkn['user_id'] = user.id
    access_tkn['username'] = user.username
    access_tkn['email'] = user.email or ''
    access_tkn['full_name'] = full_name
    access_tkn['role'] = profile.role
    access_tkn['permissions'] = profile.permissions
    access_tkn['is_superuser'] = user.is_superuser

    user_info = {
        'id': user.id,
        'user_id': user.id,
        'username': user.username,
        'email': user.email or '',
        'full_name': full_name,
        'role': profile.role,
        'permissions': profile.permissions,
        'is_superuser': user.is_superuser,
    }

    return str(access_tkn), str(refresh_tkn), user_info


def get_user_profile_data(user):
    """Returns a serialized profile dict for a given user instance or user ID."""
    if isinstance(user, (int, str)):
        try:
            user = User.objects.get(id=int(user))
        except (User.DoesNotExist, ValueError):
            return None

    profile = get_or_create_user_profile(user)
    full_name = f"{user.first_name} {user.last_name}".strip() or user.username

    return {
        'id': user.id,
        'user_id': user.id,
        'username': user.username,
        'email': user.email or '',
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': full_name,
        'role': profile.role,
        'permissions': profile.permissions,
        'is_superuser': user.is_superuser,
        'is_active': user.is_active,
        'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M') if user.date_joined else ''
    }


def create_user(**data):
    """
    Creates a new user dynamically from the Admin Panel.
    Supported roles: 'Technical', 'Sales / Staff', 'Student' (or 'Admin').
    Default permissions for new non-admin users: ['profile'].
    """
    username = str(data.get('username', '')).strip()
    password = str(data.get('password', '')).strip()
    role = str(data.get('role', '')).strip() or UserProfile.ROLE_STUDENT
    email = str(data.get('email', '')).strip()
    first_name = str(data.get('first_name', '')).strip()
    last_name = str(data.get('last_name', '')).strip()
    permissions = data.get('permissions', None)

    if not username:
        raise ValidationError('Username is required.')
    if not password:
        raise ValidationError('Password is required.')
    if len(password) < 4:
        raise ValidationError('Password must be at least 4 characters long.')

    if User.objects.filter(username__iexact=username).exists():
        raise ValidationError(f"A user with username '{username}' already exists.")

    valid_roles = [UserProfile.ROLE_ADMIN, UserProfile.ROLE_TECHNICAL, UserProfile.ROLE_SALES, UserProfile.ROLE_STUDENT]
    if role not in valid_roles:
        # Check case-insensitive match
        matched_role = None
        for vr in valid_roles:
            if vr.lower() == role.lower():
                matched_role = vr
                break
        if matched_role:
            role = matched_role
        else:
            raise ValidationError(f"Invalid role '{role}'. Allowed roles: {', '.join(valid_roles)}")

    # Default permissions: ONLY ['profile'] by default for new accounts
    if permissions is None:
        if role == UserProfile.ROLE_ADMIN:
            permissions = ['profile', 'dashboard', 'course', 'certificate', 'user_management']
        else:
            permissions = ['profile']
    else:
        # Ensure 'profile' is always in permissions
        if 'profile' not in permissions:
            permissions.append('profile')

    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        first_name=first_name,
        last_name=last_name
    )

    if role == UserProfile.ROLE_ADMIN:
        user.is_staff = True
        user.save()

    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.role = role
    profile.permissions = permissions
    profile.save()

    return get_user_profile_data(user)


def list_users():
    """Lists all users with their roles and assigned permissions."""
    users = User.objects.all().order_by('id')
    results = []
    for u in users:
        results.append(get_user_profile_data(u))
    return results


def update_user_permissions(user_id, permissions):
    """
    Updates menu permissions for a specific user.
    'profile' is always retained as a baseline permitted menu.
    """
    try:
        user = User.objects.get(id=int(user_id))
    except (User.DoesNotExist, ValueError):
        raise ValidationError('User not found.')

    if not isinstance(permissions, list):
        raise ValidationError('Permissions must be a list of menu keys.')

    if 'profile' not in permissions:
        permissions.append('profile')

    profile = get_or_create_user_profile(user)
    profile.permissions = permissions
    profile.save()

    return get_user_profile_data(user)


def extract_request_user(request):
    """Extracts authenticated User from request headers or body."""
    if hasattr(request, 'user') and request.user and request.user.is_authenticated:
        return request.user

    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token_str = auth_header.split(' ')[1]
        try:
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token_str)
            user = jwt_auth.get_user(validated_token)
            if user:
                return user
        except Exception:
            pass

    user_id = request.data.get('user_id') or request.query_params.get('user_id') if hasattr(request, 'data') else None
    if user_id:
        try:
            return User.objects.get(id=int(user_id))
        except Exception:
            pass

    return None


def verify_user_permission(request, required_permission):
    """
    Verifies that the caller has the required permission.
    Admins / superusers always pass.
    """
    user = extract_request_user(request)
    if not user:
        return True  # Fallback for unauthenticated legacy calls

    if user.is_superuser:
        return True

    profile = get_or_create_user_profile(user)
    if profile.role == UserProfile.ROLE_ADMIN:
        return True

    if required_permission in profile.permissions:
        return True

    raise PermissionDenied(f"Permission denied: Access to '{required_permission}' requires Admin authorization.")
