import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ERP_application.settings')
import django
django.setup()

from admin_application.models.Department import Department
from admin_application.models.Designation import Designation

DEPARTMENT_DESIGNATIONS_MAP = {
    "Technical Department": [
        "Technical Trainee",
        "Junior Software Developer",
        "Software Developer",
        "Senior Software Developer",
        "Python Developer",
        "Java Developer",
        "Full Stack Developer",
        "Frontend Developer",
        "Backend Developer",
        "Web Developer",
        "UI/UX Designer",
        "Software Tester",
        "QA Engineer",
        "Technical Support Engineer",
        "System Administrator",
        "Technical Team Lead",
        "Project Manager",
        "Technical Manager",
        "Head of Technology",
    ],
    "HR Department": [
        "HR Intern",
        "HR Trainee",
        "HR Executive",
        "Senior HR Executive",
        "HR Recruiter",
        "Talent Acquisition Executive",
        "HR Generalist",
        "HR Coordinator",
        "HR Manager",
        "Senior HR Manager",
        "HR Business Partner",
        "Head of HR",
    ],
    "Front Office Department": [
        "Front Office Trainee",
        "Receptionist",
        "Front Office Executive",
        "Senior Front Office Executive",
        "Receptionist & Admin Executive",
        "Visitor Management Executive",
        "Front Office Coordinator",
        "Front Office Supervisor",
        "Front Office Manager",
    ],
    "Housekeeping Department": [
        "Housekeeping Staff",
        "Housekeeping Assistant",
        "Office Cleaner",
        "Office Attendant",
        "Pantry Assistant",
        "Housekeeping Supervisor",
        "Facility Assistant",
        "Facility Supervisor",
        "Facility Manager",
    ],
    "Administration Department": [
        "Admin Assistant",
        "Admin Executive",
        "Senior Admin Executive",
        "Office Administrator",
        "Purchase Executive",
        "Inventory Executive",
        "Admin Supervisor",
        "Admin Manager",
    ],
    "Accounts & Finance Department": [
        "Accounts Trainee",
        "Junior Accountant",
        "Accountant",
        "Senior Accountant",
        "Billing Executive",
        "Finance Executive",
        "Payroll Executive",
        "Accounts Manager",
        "Finance Manager",
    ],
    "Digital Marketing Department": [
        "Digital Marketing Trainee",
        "Digital Marketing Executive",
        "SEO Executive",
        "Social Media Executive",
        "Content Writer",
        "Graphic Designer",
        "Video Editor",
        "Performance Marketing Executive",
        "Digital Marketing Manager",
    ],
    "Training & Academic Department": [
        "Technical Trainer",
        "Junior Trainer",
        "Software Trainer",
        "Senior Technical Trainer",
        "Python Trainer",
        "Java Trainer",
        "Full Stack Trainer",
        "Data Analytics Trainer",
        "Academic Coordinator",
        "Training Coordinator",
        "Training Manager",
        "Head of Training",
    ],
    "Sales Department": [
        "Sales Intern",
        "Sales Trainee",
        "Junior Sales Executive",
        "Sales Executive",
        "Senior Sales Executive",
        "Business Development Executive (BDE)",
        "Business Development Associate",
        "Business Development Manager (BDM)",
        "Sales Team Leader",
        "Assistant Sales Manager",
        "Sales Manager",
        "Senior Sales Manager",
        "Regional Sales Manager",
        "Area Sales Manager",
        "Head of Sales",
        "Sales Director",
        "Vice President – Sales",
    ],
}

def seed():
    # Rename legacy short names if present to preserve FKs
    legacy_map = {
        "Technical": "Technical Department",
        "HR": "HR Department",
        "Admin": "Administration Department",
        "Sales": "Sales Department",
    }
    for old_name, new_name in legacy_map.items():
        old_dept = Department.objects.filter(department_name__iexact=old_name).first()
        if old_dept:
            new_dept_exists = Department.objects.filter(department_name__iexact=new_name).exclude(pk=old_dept.pk).first()
            if not new_dept_exists:
                old_dept.department_name = new_name
                old_dept.save(update_fields=['department_name'])
                print(f"Renamed legacy department '{old_name}' -> '{new_name}' (ID: {old_dept.department_id})")

    # Create all 9 departments
    total_desigs_created = 0
    for dept_name, desig_list in DEPARTMENT_DESIGNATIONS_MAP.items():
        dept, _ = Department.objects.get_or_create(
            department_name=dept_name,
            defaults={'description': f"{dept_name} of the institution"}
        )
        print(f"Department: {dept.department_name} (ID: {dept.department_id})")

        for desig_name in desig_list:
            desig, created = Designation.objects.get_or_create(
                designation_name=desig_name,
                department=dept,
                defaults={'description': f"{desig_name} in {dept_name}"}
            )
            if created:
                total_desigs_created += 1

    print(f"\nSeeding complete!")
    print(f"Total departments in DB: {Department.objects.count()}")
    print(f"Total designations in DB: {Designation.objects.count()}")

if __name__ == '__main__':
    seed()
