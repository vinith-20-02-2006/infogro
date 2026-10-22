import logging
from datetime import datetime, date
from django.utils import timezone
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.exceptions import AuthenticationFailed, ValidationError, PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication

from ..models.Department import Department
from ..models.Designation import Designation
from ..models.Staff import Staff
from ..models.Enrollment import Enrollment
from ..models.Course import Course
from ..models.RolePermission import (
    RolePermission,
    get_saved_role_permissions,
    get_default_permissions_for_role
)
from ..models.UserProfile import UserProfile, get_or_create_user_profile

logger = logging.getLogger('django')


# =========================================================================
# AUTHENTICATION & JWT TOKEN CREATION
# =========================================================================

def create_token(**data):
    username = str(data.get('username', '')).strip()
    password = str(data.get('password', '')).strip()

    # Allow login with either username or email
    user = authenticate(username=username, password=password)
    if not user:
        try:
            matched_user = User.objects.filter(email__iexact=username).first()
            if matched_user:
                user = authenticate(username=matched_user.username, password=password)
        except Exception:
            pass

    if not user:
        raise AuthenticationFailed(detail='Invalid Credentials')

    if not user.is_active:
        raise AuthenticationFailed(detail='This account is inactive. Please contact the administrator.')

    profile = get_or_create_user_profile(user)
    effective_perms = profile.get_effective_permissions()
    profile.permissions = effective_perms
    profile.save(update_fields=['permissions'])

    # Update last login timestamp
    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])

    refresh_tkn = RefreshToken.for_user(user)
    access_tkn = refresh_tkn.access_token

    full_name = f"{user.first_name} {user.last_name}".strip() or user.username

    # Embed permissions and identity claims in access token
    access_tkn['user_id'] = user.id
    access_tkn['username'] = user.username
    access_tkn['email'] = user.email or ''
    access_tkn['full_name'] = full_name
    access_tkn['role'] = profile.role
    access_tkn['permissions'] = effective_perms
    access_tkn['is_superuser'] = user.is_superuser

    user_info = {
        'id': user.id,
        'user_id': user.id,
        'username': user.username,
        'email': user.email or '',
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': full_name,
        'role': profile.role,
        'permissions': effective_perms,
        'is_superuser': user.is_superuser,
        'is_active': user.is_active,
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
    effective_perms = profile.get_effective_permissions()

    dept_name = profile.department.department_name if profile.department else ''
    desig_name = profile.designation.designation_name if profile.designation else ''

    if hasattr(user, 'staff_member') and user.staff_member:
        if not dept_name and user.staff_member.department:
            dept_name = user.staff_member.department.department_name
        if not desig_name and user.staff_member.designation:
            desig_name = user.staff_member.designation.designation_name

    return {
        'id': user.id,
        'user_id': user.id,
        'username': user.username,
        'email': user.email or '',
        'first_name': user.first_name,
        'last_name': user.last_name,
        'full_name': full_name,
        'role': profile.role,
        'department': dept_name,
        'designation': desig_name,
        'permissions': effective_perms,
        'custom_permissions': profile.custom_permissions or {},
        'is_superuser': user.is_superuser,
        'is_active': user.is_active,
        'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M') if user.date_joined else ''
    }


# =========================================================================
# DEPARTMENT & DESIGNATION MANAGEMENT
# =========================================================================

def list_departments():
    depts = Department.objects.all().order_by('department_id')
    return [
        {
            'department_id': d.department_id,
            'department_name': d.department_name,
            'description': d.description or '',
        }
        for d in depts
    ]


def create_department(department_name, description=''):
    name = str(department_name).strip()
    if not name:
        raise ValidationError('Department name is required.')
    dept, created = Department.objects.get_or_create(
        department_name=name,
        defaults={'description': description}
    )
    return {
        'department_id': dept.department_id,
        'department_name': dept.department_name,
        'description': dept.description or '',
    }


def list_designations(department_id=None):
    qs = Designation.objects.all().select_related('department').order_by('designation_id')
    if department_id:
        qs = qs.filter(department_id=department_id)
    return [
        {
            'designation_id': d.designation_id,
            'designation_name': d.designation_name,
            'department_id': d.department_id if d.department else None,
            'department_name': d.department.department_name if d.department else '',
            'description': d.description or '',
        }
        for d in qs
    ]


def create_designation(designation_name, department_id=None, description=''):
    name = str(designation_name).strip()
    if not name:
        raise ValidationError('Designation name is required.')
    dept = None
    if department_id:
        try:
            dept = Department.objects.get(department_id=department_id)
        except Department.DoesNotExist:
            pass
    desig, created = Designation.objects.get_or_create(
        designation_name=name,
        department=dept,
        defaults={'description': description}
    )
    return {
        'designation_id': desig.designation_id,
        'designation_name': desig.designation_name,
        'department_name': dept.department_name if dept else '',
        'description': desig.description or '',
    }


# =========================================================================
# REGISTRATION MODULES: STAFF & STUDENT
# =========================================================================

def register_staff(**data):
    """
    Registers a staff member from Staff Registration.
    Fields:
      staff_name, email (professional email), password, department_id/name, designation_id/name, phone
    Department maps directly to permission category:
      - Technical -> Technical
      - Sales -> Sales
      - HR -> HR
      - Admin -> Admin
    """
    staff_name = str(data.get('staff_name', '')).strip()
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', '')).strip()
    phone = str(data.get('phone', '')).strip()
    dept_val = data.get('department_id') or data.get('department')
    desig_val = data.get('designation_id') or data.get('designation')

    if not staff_name:
        raise ValidationError('Staff name is required.')
    if not email:
        raise ValidationError('Professional email address is required.')
    if not password:
        password = 'Staff@' + email.split('@')[0][-4:]

    if User.objects.filter(username__iexact=email).exists() or User.objects.filter(email__iexact=email).exists():
        raise ValidationError(f"A user with email '{email}' already exists.")

    # Resolve Department
    dept = None
    if dept_val:
        if isinstance(dept_val, int) or str(dept_val).isdigit():
            dept = Department.objects.filter(department_id=int(dept_val)).first()
        if not dept:
            dept = Department.objects.filter(department_name__iexact=str(dept_val).strip()).first()
    if not dept:
        dept = Department.objects.filter(department_name='Technical').first()

    # Resolve Designation
    desig = None
    if desig_val:
        if isinstance(desig_val, int) or str(desig_val).isdigit():
            desig = Designation.objects.filter(designation_id=int(desig_val)).first()
        if not desig:
            desig = Designation.objects.filter(designation_name__iexact=str(desig_val).strip()).first()

    # Determine Role category strictly from department
    dept_name = dept.department_name if dept else 'Technical'
    if 'tech' in dept_name.lower():
        role = UserProfile.ROLE_TECHNICAL
    elif 'sale' in dept_name.lower():
        role = UserProfile.ROLE_SALES
    elif 'hr' in dept_name.lower():
        role = UserProfile.ROLE_HR
    elif 'admin' in dept_name.lower():
        role = UserProfile.ROLE_ADMIN
    else:
        role = UserProfile.ROLE_TECHNICAL

    # Split name into first and last name
    name_parts = staff_name.split()
    first_name = name_parts[0] if name_parts else staff_name
    last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

    # Create Django Auth User with professional email as username
    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )

    if role == UserProfile.ROLE_ADMIN:
        user.is_staff = True
        user.save()

    # Create Staff record
    staff = Staff.objects.create(
        staff_name=staff_name,
        email=email,
        phone=phone,
        department=dept,
        designation=desig,
        user=user,
        status='Active'
    )

    # Create UserProfile with role and latest default permissions
    profile = get_or_create_user_profile(user)
    profile.role = role
    profile.department = dept
    profile.designation = desig
    profile.permissions = profile.get_effective_permissions()
    profile.save()

    return {
        'success': True,
        'message': f"Staff '{staff_name}' registered successfully under '{role}' role.",
        'staff': {
            'staff_id': staff.staff_id,
            'user_id': user.id,
            'username': user.username,
            'staff_name': staff.staff_name,
            'email': staff.email,
            'role': profile.role,
            'department': dept.department_name if dept else '',
            'designation': desig.designation_name if desig else '',
            'permissions': profile.permissions,
        }
    }


def register_student(**data):
    """
    Registers a student from Student Registration.
    Fields:
      student_name, register_id, email, password, course_id, whatsapp_number, student_photo, joining_date
    Creates user account with role Student and default Student permissions.
    Stores record in enrollment table.
    """
    student_name = str(data.get('student_name', '')).strip()
    register_id = str(data.get('register_id', '')).strip()
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', '')).strip() or 'Student@123'
    whatsapp_number = str(data.get('whatsapp_number', '')).strip()
    student_photo = str(data.get('student_photo', '')).strip()
    joining_date = data.get('joining_date') or date.today()
    course_id = data.get('course_id')

    if not student_name:
        raise ValidationError('Student name is required.')

    if not register_id:
        last_enr = Enrollment.objects.order_by('-enrollment_id').first()
        next_num = (last_enr.enrollment_id + 1) if last_enr else 1001
        register_id = f"REG{next_num}"

    clean_username = register_id.lower().replace(" ", "_")
    if not email:
        email = f"{clean_username}@student.igt.in"

    if User.objects.filter(username__iexact=clean_username).exists():
        user = User.objects.get(username__iexact=clean_username)
    else:
        name_parts = student_name.split()
        first_name = name_parts[0] if name_parts else student_name
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        user = User.objects.create_user(
            username=clean_username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

    # Resolve course if provided
    course_obj = None
    if course_id:
        course_obj = Course.objects.filter(Course_id=course_id).first()

    # Create Enrollment
    enrollment = Enrollment.objects.create(
        register_id=register_id,
        user=user,
        course=course_obj,
        student_name=student_name,
        joining_date=joining_date,
        whatsapp_number=whatsapp_number,
        student_photo=student_photo,
        assignment_status='Incomplete',
        assessment_status='Incomplete'
    )

    # Configure UserProfile
    profile = get_or_create_user_profile(user)
    profile.role = UserProfile.ROLE_STUDENT
    profile.permissions = profile.get_effective_permissions()
    profile.save()

    return {
        'success': True,
        'message': f"Student '{student_name}' registered successfully with Register ID '{register_id}'.",
        'student': {
            'enrollment_id': enrollment.enrollment_id,
            'register_id': enrollment.register_id,
            'user_id': user.id,
            'username': user.username,
            'student_name': enrollment.student_name,
            'email': user.email,
            'role': profile.role,
            'permissions': profile.permissions,
        }
    }


# =========================================================================
# ROLE PERMISSIONS MANAGEMENT (PHASE 5 & 7)
# =========================================================================

def get_role_permissions(role_name):
    """Retrieves saved granular permissions for a given role."""
    role = (role_name or '').strip()
    if role.lower() == 'sales / staff':
        role = RolePermission.ROLE_SALES
    return get_saved_role_permissions(role)


def save_role_permissions(role_name, permissions):
    """
    Saves granular menu permissions for the selected role.
    Updates the RolePermission model, and synchronizes effective permissions
    for all active users belonging to that role.
    """
    role = (role_name or '').strip()
    if role.lower() == 'sales / staff':
        role = RolePermission.ROLE_SALES

    if not isinstance(permissions, dict):
        raise ValidationError('Permissions must be a dictionary of menu permission objects.')

    # Ensure profile view is always preserved
    if 'profile' not in permissions or not isinstance(permissions['profile'], dict):
        permissions['profile'] = {'view': True, 'add': False, 'edit': True, 'delete': False}
    else:
        permissions['profile']['view'] = True

    role_perm, _ = RolePermission.objects.update_or_create(
        role=role,
        defaults={'permissions': permissions}
    )

    # Synchronize permissions across all users with this role
    # Users inherit role defaults unless they have an explicit override
    affected_profiles = UserProfile.objects.filter(role=role)
    for p in affected_profiles:
        p.permissions = p.get_effective_permissions()
        p.save(update_fields=['permissions'])

    return role_perm.permissions


def reset_role_permissions(role_name):
    """Restores default template permissions for the specified role."""
    role = (role_name or '').strip()
    if role.lower() == 'sales / staff':
        role = RolePermission.ROLE_SALES

    defaults = get_default_permissions_for_role(role)
    return save_role_permissions(role, defaults)


# =========================================================================
# USER LISTING & STATUS ACTIONS (PHASE 4)
# =========================================================================

def get_user_roles_summary():
    """
    Calculates dynamic counts of registered users per category:
    Admin, Staff/Technical, Sales, HR, Student.
    """
    admin_count = UserProfile.objects.filter(role=UserProfile.ROLE_ADMIN).count()
    tech_count = UserProfile.objects.filter(role=UserProfile.ROLE_TECHNICAL).count()
    sales_count = UserProfile.objects.filter(role__in=[UserProfile.ROLE_SALES, 'Sales / Staff']).count()
    hr_count = UserProfile.objects.filter(role=UserProfile.ROLE_HR).count()
    student_count = UserProfile.objects.filter(role=UserProfile.ROLE_STUDENT).count()
    total_users = User.objects.count()

    staff_total = tech_count + sales_count + hr_count

    return {
        'admin_count': admin_count,
        'staff_count': staff_total,
        'technical_count': tech_count,
        'sales_count': sales_count,
        'hr_count': hr_count,
        'student_count': student_count,
        'total_users': total_users,
    }


def format_last_login(dt):
    if not dt:
        return 'Never'
    now = timezone.now()
    if dt.date() == now.date():
        return f"Today, {dt.strftime('%H:%M')}"
    elif (now.date() - dt.date()).days == 1:
        return f"Yesterday, {dt.strftime('%H:%M')}"
    else:
        return dt.strftime('%d %b, %H:%M')


def list_all_users_extended(search='', role='', status='', user_type='', page=1, page_size=10):
    """
    Returns users matching filters with pagination.
    Includes staff details, student enrollments, role badges, last login, and status.
    """
    qs = User.objects.all().select_related('profile').order_by('id')

    if search:
        search = search.strip().lower()
        qs = qs.filter(
            models.Q(username__icontains=search) |
            models.Q(email__icontains=search) |
            models.Q(first_name__icontains=search) |
            models.Q(last_name__icontains=search)
        )

    if status and status.upper() != 'ALL':
        is_active = (status.lower() == 'active')
        qs = qs.filter(is_active=is_active)

    # Filter by user type (Staff vs Students)
    if user_type and user_type.upper() != 'ALL':
        if user_type.lower() == 'staff':
            qs = qs.filter(profile__role__in=[UserProfile.ROLE_TECHNICAL, UserProfile.ROLE_SALES, UserProfile.ROLE_HR, 'Sales / Staff'])
        elif user_type.lower() in ['student', 'students']:
            qs = qs.filter(profile__role=UserProfile.ROLE_STUDENT)
        elif user_type.lower() == 'admin':
            qs = qs.filter(profile__role=UserProfile.ROLE_ADMIN)

    # Filter by specific role category
    if role and role.upper() != 'ALL':
        if role.lower() in ['staff']:
            qs = qs.filter(profile__role__in=[UserProfile.ROLE_TECHNICAL, UserProfile.ROLE_SALES, UserProfile.ROLE_HR, 'Sales / Staff'])
        elif role.lower() in ['student', 'students']:
            qs = qs.filter(profile__role=UserProfile.ROLE_STUDENT)
        elif role.lower() == 'sales':
            qs = qs.filter(profile__role__in=[UserProfile.ROLE_SALES, 'Sales / Staff'])
        else:
            qs = qs.filter(profile__role__iexact=role)

    total_count = qs.count()

    # Pagination slice
    try:
        page = max(1, int(page))
        page_size = max(1, int(page_size))
    except (ValueError, TypeError):
        page = 1
        page_size = 10

    start = (page - 1) * page_size
    end = start + page_size
    paginated_users = qs[start:end]

    user_rows = []
    for u in paginated_users:
        profile = get_or_create_user_profile(u)
        full_name = f"{u.first_name} {u.last_name}".strip() or u.username

        # Department / Designation resolution
        dept_name = profile.department.department_name if profile.department else ''
        desig_name = profile.designation.designation_name if profile.designation else ''
        if hasattr(u, 'staff_member') and u.staff_member:
            if not dept_name and u.staff_member.department:
                dept_name = u.staff_member.department.department_name
            if not desig_name and u.staff_member.designation:
                desig_name = u.staff_member.designation.designation_name

        # User Type classification
        if profile.role == UserProfile.ROLE_ADMIN:
            u_type = 'Admin'
        elif profile.role == UserProfile.ROLE_STUDENT:
            u_type = 'Student'
        else:
            u_type = 'Staff'

        user_rows.append({
            'id': u.id,
            'user_id': u.id,
            'username': u.username,
            'full_name': full_name,
            'email': u.email or f"{u.username}@institute.in",
            'role': profile.role,
            'department': dept_name,
            'designation': desig_name,
            'user_type': u_type,
            'last_login': format_last_login(u.last_login),
            'status': 'Active' if u.is_active else 'Inactive',
            'is_active': u.is_active,
            'permissions': profile.get_effective_permissions(),
            'custom_permissions': profile.custom_permissions or {},
        })

    total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1

    return {
        'users': user_rows,
        'total': total_count,
        'page': page,
        'page_size': page_size,
        'total_pages': total_pages,
    }


def toggle_user_status(user_id):
    """Toggles user active / inactive status."""
    try:
        user = User.objects.get(id=int(user_id))
    except (User.DoesNotExist, ValueError):
        raise ValidationError('User not found.')

    if user.is_superuser:
        raise ValidationError('Superuser account status cannot be deactivated.')

    user.is_active = not user.is_active
    user.save(update_fields=['is_active'])

    return {
        'user_id': user.id,
        'username': user.username,
        'is_active': user.is_active,
        'status': 'Active' if user.is_active else 'Inactive',
        'message': f"Account '{user.username}' is now {'Active' if user.is_active else 'Inactive'}."
    }


def update_user_override_permissions(user_id, custom_permissions):
    """Saves user-specific override permissions."""
    try:
        user = User.objects.get(id=int(user_id))
    except (User.DoesNotExist, ValueError):
        raise ValidationError('User not found.')

    if not isinstance(custom_permissions, dict):
        raise ValidationError('Custom permissions must be a dictionary.')

    profile = get_or_create_user_profile(user)
    profile.custom_permissions = custom_permissions
    profile.permissions = profile.get_effective_permissions()
    profile.save()

    return get_user_profile_data(user)


# =========================================================================
# BACKEND PERMISSION ENFORCEMENT (PHASE 10)
# =========================================================================

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


def verify_user_permission(request, menu_key, action='view'):
    """
    Enforces granular backend permissions (view, add, edit, delete).
    Superusers and Admin role automatically pass.
    """
    user = extract_request_user(request)
    if not user:
        return True  # Fallback for unauthenticated legacy endpoints

    if user.is_superuser:
        return True

    profile = get_or_create_user_profile(user)
    if profile.role == UserProfile.ROLE_ADMIN:
        return True

    effective = profile.get_effective_permissions()

    # If menu is in effective permissions dictionary
    if menu_key in effective:
        menu_perms = effective[menu_key]
        if isinstance(menu_perms, dict):
            if menu_perms.get(action, False):
                return True
        elif isinstance(menu_perms, bool) and menu_perms:
            return True

    raise PermissionDenied(
        f"Permission denied: User does not have '{action}' permission for menu '{menu_key}'."
    )
