import os
import sys
import django

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ERP_application.settings')
django.setup()

from django.contrib.auth.models import User
from admin_application.models import (
    Department, Designation, Staff, RolePermission, UserProfile,
    Enrollment, get_saved_role_permissions, get_or_create_user_profile
)

def seed_departments_and_designations():
    print("Seeding Departments...")
    dept_data = [
        ('Technical', 'Technical, Academic & Training department'),
        ('Sales', 'Sales, Enquiries, Admissions & Billing department'),
        ('HR', 'Human Resources, Staffing & Payroll department'),
        ('Admin', 'Executive & IT Administration department'),
    ]
    created_depts = {}
    for name, desc in dept_data:
        dept, _ = Department.objects.get_or_create(
            department_name=name,
            defaults={'description': desc}
        )
        created_depts[name] = dept
        print(f" - Department: {dept.department_name} (ID: {dept.department_id})")

    print("\nSeeding Designations...")
    desig_data = [
        ('Technical', ['Trainer', 'Senior Trainer', 'Lab Assistant']),
        ('Sales', ['Counselor', 'Sales Executive', 'Admission Officer']),
        ('HR', ['HR Manager', 'HR Executive']),
        ('Admin', ['System Administrator', 'Director']),
    ]
    for dept_name, titles in desig_data:
        dept = created_depts.get(dept_name)
        for title in titles:
            desig, _ = Designation.objects.get_or_create(
                designation_name=title,
                department=dept,
                defaults={'description': f"{title} in {dept_name}"}
            )
            print(f" - Designation: {desig.designation_name} in {dept_name}")

def seed_role_permissions():
    print("\nSeeding Default Role Permissions...")
    roles = [
        RolePermission.ROLE_ADMIN,
        RolePermission.ROLE_TECHNICAL,
        RolePermission.ROLE_SALES,
        RolePermission.ROLE_HR,
        RolePermission.ROLE_STUDENT,
    ]
    for r in roles:
        perms = get_saved_role_permissions(r)
        print(f" - Initialized permissions for {r} ({len(perms)} menus defined)")

def sync_existing_enrollments_to_users():
    print("\nSynchronizing existing Enrollments to Student Users...")
    enrollments = Enrollment.objects.all()
    count = 0
    for e in enrollments:
        # If enrollment has no linked user, create one or link existing
        reg_id = (e.register_id or f"STUDENT_{e.enrollment_id}").strip()
        student_name = (e.student_name or f"Student {e.enrollment_id}").strip()
        name_parts = student_name.split()
        first_name = name_parts[0] if name_parts else student_name
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        clean_username = reg_id.lower().replace(" ", "_")

        user, user_created = User.objects.get_or_create(
            username=clean_username,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'email': f"{clean_username}@student.igt.in",
            }
        )
        if user_created:
            user.set_password("Student@123")
            user.save()

        # Ensure UserProfile exists with role Student
        profile = get_or_create_user_profile(user)
        profile.role = UserProfile.ROLE_STUDENT
        profile.save()

        if e.user != user:
            e.user = user
            e.save()
            count += 1

    print(f" - Synchronized {count} enrollments to User accounts.")

if __name__ == '__main__':
    seed_departments_and_designations()
    seed_role_permissions()
    sync_existing_enrollments_to_users()
    print("\nInitial seeding completed successfully!")
