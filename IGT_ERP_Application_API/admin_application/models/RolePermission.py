from django.db import models


class RolePermission(models.Model):
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

    role = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    permissions = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'role_permissions'

    def __str__(self):
        return f"Permissions for {self.role}"


def get_default_permissions_for_role(role_name):
    """
    Returns initial default permissions based on role requirements and reference images.
    Admin gets all 39+ menus with full view/add/edit/delete.
    Technical, Sales, HR, Student receive their dedicated scoped defaults.
    """
    role = (role_name or '').strip()
    if role.lower() == 'sales / staff':
        role = RolePermission.ROLE_SALES

    # Base list of all defined menus
    ALL_MENUS = [
        # Dashboard
        'dashboard',
        # Master
        'course', 'coursemodule', 'coursefees', 'department', 'designation', 'batch_creation',
        # Admission
        'enquiry', 'enquiry_followup', 'registration',
        # Academic
        'batch_scheduling', 'batch_transfer', 'student_attendance', 'student_academic_process',
        'exams', 'exam_schedule', 'marks_entry', 'results', 'gradesheet',
        # Certificate
        'certificate', 'certificate_generation', 'mail_generation', 'workshop_template',
        'letterhead_template', 'certificate_verification', 'id_card_generation',
        # Payment
        'billing', 'dues',
        # Placement
        'companies', 'placement_openings', 'student_applications', 'placed_students',
        # Staff
        'staff_register', 'staff_attendance', 'staff_leave', 'payslip_generation',
        # Accounts
        'income', 'expenses', 'vendors',
        # Reports
        'reports_enquiry', 'reports_fees', 'reports_attendance', 'reports_collection',
        'reports_dues', 'reports_batch', 'reports_trainer', 'reports_exam',
        'reports_placement', 'reports_income_expense',
        # Settings
        'settings_users', 'settings_backup',
        # Personal Staff / Student
        'my_attendance', 'my_leave', 'my_payslip',
        'my_profile', 'my_course_batch', 'my_certificates', 'my_fees_invoices', 'my_applications',
        'profile',
    ]

    perms = {}
    for m in ALL_MENUS:
        perms[m] = {'view': False, 'add': False, 'edit': False, 'delete': False}

    # Profile is always viewable
    perms['profile'] = {'view': True, 'add': False, 'edit': True, 'delete': False}

    if role == RolePermission.ROLE_ADMIN:
        for m in ALL_MENUS:
            perms[m] = {'view': True, 'add': True, 'edit': True, 'delete': True}
        return perms

    if role == RolePermission.ROLE_TECHNICAL:
        tech_enabled = {
            'dashboard': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'batch_scheduling': {'view': True, 'add': True, 'edit': True, 'delete': False},
            'student_attendance': {'view': True, 'add': True, 'edit': True, 'delete': False},
            'student_academic_process': {'view': True, 'add': True, 'edit': True, 'delete': False},
            'exams': {'view': True, 'add': True, 'edit': True, 'delete': False},
            'exam_schedule': {'view': True, 'add': True, 'edit': True, 'delete': False},
            'marks_entry': {'view': True, 'add': True, 'edit': True, 'delete': False},
            'results': {'view': True, 'add': True, 'edit': True, 'delete': False},
            'gradesheet': {'view': True, 'add': True, 'edit': False, 'delete': False},
            'certificate': {'view': True, 'add': True, 'edit': True, 'delete': False},
            'certificate_generation': {'view': True, 'add': True, 'edit': False, 'delete': False},
            'reports_batch': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'reports_attendance': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'reports_exam': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'my_attendance': {'view': True, 'add': True, 'edit': False, 'delete': False},
            'my_leave': {'view': True, 'add': True, 'edit': False, 'delete': False},
            'my_payslip': {'view': True, 'add': False, 'edit': False, 'delete': False},
        }
        for k, v in tech_enabled.items():
            perms[k] = v
        return perms

    if role == RolePermission.ROLE_SALES:
        sales_enabled = {
            'dashboard': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'course': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'coursemodule': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'coursefees': {'view': True, 'add': True, 'edit': True, 'delete': False},
            'batch_scheduling': {'view': True, 'add': True, 'edit': False, 'delete': False},
            'enquiry': {'view': True, 'add': True, 'edit': True, 'delete': False},
            'enquiry_followup': {'view': True, 'add': True, 'edit': True, 'delete': False},
            'registration': {'view': True, 'add': True, 'edit': True, 'delete': False},
            'billing': {'view': True, 'add': True, 'edit': False, 'delete': False},
            'dues': {'view': True, 'add': True, 'edit': True, 'delete': False},
            'reports_enquiry': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'reports_fees': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'reports_collection': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'reports_dues': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'my_attendance': {'view': True, 'add': True, 'edit': False, 'delete': False},
            'my_leave': {'view': True, 'add': True, 'edit': False, 'delete': False},
            'my_payslip': {'view': True, 'add': False, 'edit': False, 'delete': False},
        }
        for k, v in sales_enabled.items():
            perms[k] = v
        return perms

    if role == RolePermission.ROLE_HR:
        hr_enabled = {
            'dashboard': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'staff_register': {'view': True, 'add': True, 'edit': True, 'delete': False},
            'staff_attendance': {'view': True, 'add': True, 'edit': True, 'delete': False},
            'staff_leave': {'view': True, 'add': True, 'edit': True, 'delete': False},
            'payslip_generation': {'view': True, 'add': True, 'edit': True, 'delete': False},
            'reports_attendance': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'my_attendance': {'view': True, 'add': True, 'edit': False, 'delete': False},
            'my_leave': {'view': True, 'add': True, 'edit': False, 'delete': False},
            'my_payslip': {'view': True, 'add': False, 'edit': False, 'delete': False},
        }
        for k, v in hr_enabled.items():
            perms[k] = v
        return perms

    if role == RolePermission.ROLE_STUDENT:
        student_enabled = {
            'dashboard': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'profile': {'view': True, 'add': False, 'edit': True, 'delete': False},
            'my_profile': {'view': True, 'add': False, 'edit': True, 'delete': False},
            'my_course_batch': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'my_attendance': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'exams': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'exam_schedule': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'results': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'gradesheet': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'my_certificates': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'my_fees_invoices': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'placement_openings': {'view': True, 'add': False, 'edit': False, 'delete': False},
            'my_applications': {'view': True, 'add': True, 'edit': False, 'delete': False},
        }
        for k, v in student_enabled.items():
            perms[k] = v
        return perms

    return perms


def get_saved_role_permissions(role_name):
    """
    Fetches persisted permissions from RolePermission table.
    If no record exists, generates and stores default permissions automatically.
    """
    role = (role_name or '').strip()
    if role.lower() == 'sales / staff':
        role = RolePermission.ROLE_SALES

    role_perm, created = RolePermission.objects.get_or_create(
        role=role,
        defaults={'permissions': get_default_permissions_for_role(role)}
    )
    if not role_perm.permissions:
        role_perm.permissions = get_default_permissions_for_role(role)
        role_perm.save()

    return role_perm.permissions
