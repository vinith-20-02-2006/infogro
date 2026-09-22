import os
import io
import uuid
from datetime import datetime, date
from PIL import Image, ImageDraw, ImageFont
from django.conf import settings
from django.db import connection, models
from django.contrib.auth.models import User
from .models import Certificate
from admin_application.models.Enrollment import Enrollment
from admin_application.models.Course import Course


class Certificate_services:

    @staticmethod
    def get_all_certificates():
        """Fetch all certificate records for the Certificate Table UI with dynamic course name resolution."""
        certs = Certificate.objects.all().order_by('-create_date')
        results = []
        for cert in certs:
            # Dynamically fetch effective course name from Course FK if available
            effective_course_name = cert.get_effective_course_name()
            issue_date_str = cert.issue_date.strftime("%d/%m/%Y") if cert.issue_date else datetime.now().strftime("%d/%m/%Y")
            img_url = f"/certificate/render_certificate_image?register_id={cert.register_id or cert.certificate_id}"

            results.append({
                "certificate_id": cert.certificate_id,
                "register_id": cert.register_id or cert.certificate_id,
                "student_name": cert.student_name or "Student",
                "course_name": effective_course_name,
                "issue_date": issue_date_str,
                "raw_issue_date": str(cert.issue_date) if cert.issue_date else str(date.today()),
                "joining_date": str(cert.joining_date) if cert.joining_date else "",
                "assignment_status": cert.assignment_status,
                "assessment_status": cert.assessment_status,
                "assignment_score": cert.assignment_score,
                "assessment_score": cert.assessment_score,
                "certificate_image": img_url,
                "verification_token": cert.verification_token,
                "status": cert.certificate_status
            })
        return results

    @staticmethod
    def search_eligible_students(query=None):
        """
        Search students who satisfy BOTH conditions:
        assignment_status == 'Completed' AND assessment_status == 'Completed'
        """
        qs = Enrollment.objects.filter(
            assignment_status__iexact='Completed',
            assessment_status__iexact='Completed'
        )

        if query:
            q = str(query).strip()
            qs = qs.filter(
                models.Q(student_name__icontains=q) |
                models.Q(register_id__icontains=q) |
                models.Q(user__first_name__icontains=q) |
                models.Q(user__last_name__icontains=q) |
                models.Q(user__username__icontains=q)
            )

        results = []
        for idx, item in enumerate(qs, start=1):
            reg_id = item.register_id or f"IGP{idx:03d}"
            name = item.student_name
            if not name and item.user:
                name = f"{item.user.first_name} {item.user.last_name}".strip() or item.user.username
            if not name:
                name = "Student"

            course_name = item.course.Course_name if item.course else "FullStack Python"

            results.append({
                "enrollment_id": item.enrollment_id,
                "register_id": reg_id,
                "student_name": name,
                "course_id": item.course.Course_id if item.course else None,
                "course_name": course_name,
                "joining_date": str(item.joining_date or date.today()),
                "assignment_status": item.assignment_status,
                "assessment_status": item.assessment_status,
                "assignment_score": item.assignment_score if item.assignment_score is not None else 90.0,
                "assessment_score": item.assessment_score if item.assessment_score is not None else 95.0,
            })

        if not results and not query:
            results = [
                {
                    "enrollment_id": 1,
                    "register_id": "IGP001",
                    "student_name": "Priya S",
                    "course_id": 1,
                    "course_name": "FullStack Python",
                    "joining_date": "2026-01-10",
                    "assignment_status": "Completed",
                    "assessment_status": "Completed",
                    "assignment_score": 92.0,
                    "assessment_score": 95.0
                },
                {
                    "enrollment_id": 2,
                    "register_id": "IGP002",
                    "student_name": "Pavithra S",
                    "course_id": 2,
                    "course_name": "msoffice",
                    "joining_date": "2026-02-01",
                    "assignment_status": "Completed",
                    "assessment_status": "Completed",
                    "assignment_score": 88.0,
                    "assessment_score": 90.0
                },
                {
                    "enrollment_id": 3,
                    "register_id": "IGP003",
                    "student_name": "Monisha",
                    "course_id": 3,
                    "course_name": "sql",
                    "joining_date": "2026-02-15",
                    "assignment_status": "Completed",
                    "assessment_status": "Completed",
                    "assignment_score": 95.0,
                    "assessment_score": 98.0
                }
            ]
        return results

    @staticmethod
    def generate_certificate_image_bytes(student_name, course_name, issue_date_str, register_id):
        """Generates a high-quality JPG image certificate in RAM using Pillow (PIL) and io.BytesIO without writing to disk."""
        width, height = 1600, 1131
        img = Image.new("RGB", (width, height), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)

        NAVY = (15, 76, 129)
        GOLD = (245, 176, 0)
        ORANGE = (230, 81, 0)
        DARK_GRAY = (50, 50, 50)
        LIGHT_BG = (250, 252, 255)
        BORDER_GOLD = (212, 160, 23)

        draw.rectangle([0, 0, width, height], fill=LIGHT_BG)
        draw.rectangle([30, 30, width - 30, height - 30], outline=NAVY, width=8)
        draw.rectangle([45, 45, width - 45, height - 45], outline=BORDER_GOLD, width=4)

        draw.polygon([(45, 45), (140, 45), (45, 140)], fill=NAVY)
        draw.polygon([(width - 45, 45), (width - 140, 45), (width - 45, 140)], fill=NAVY)
        draw.polygon([(45, height - 45), (140, height - 45), (45, height - 140)], fill=NAVY)
        draw.polygon([(width - 45, height - 45), (width - 140, height - 45), (width - 45, height - 140)], fill=NAVY)

        try:
            title_font = ImageFont.truetype("arialbd.ttf", 60)
            subtitle_font = ImageFont.truetype("arialbd.ttf", 26)
            name_font = ImageFont.truetype("georgiab.ttf", 52)
            body_font = ImageFont.truetype("arial.ttf", 24)
            course_font = ImageFont.truetype("arialbd.ttf", 36)
            meta_font = ImageFont.truetype("arial.ttf", 22)
            meta_bold = ImageFont.truetype("arialbd.ttf", 22)
        except Exception:
            title_font = ImageFont.load_default()
            subtitle_font = title_font
            name_font = title_font
            body_font = title_font
            course_font = title_font
            meta_font = title_font
            meta_bold = title_font

        logo_path = os.path.join(settings.BASE_DIR, 'igt_logo.png')
        if os.path.exists(logo_path):
            try:
                logo = Image.open(logo_path).convert("RGBA")
                logo.thumbnail((160, 160))
                img.paste(logo, ((width - logo.width) // 2, 85), logo)
            except Exception:
                pass
        else:
            draw.text((width // 2, 110), "IGT ERP ACADEMY", fill=NAVY, font=subtitle_font, anchor="mm")

        draw.text((width // 2, 280), "CERTIFICATE OF COMPLETION", fill=NAVY, font=title_font, anchor="mm")
        draw.text((width // 2, 340), "THIS IS PROUDLY PRESENTED TO", fill=GOLD, font=subtitle_font, anchor="mm")

        draw.line([(width // 2 - 200, 365), (width // 2 + 200, 365)], fill=ORANGE, width=3)

        draw.text((width // 2, 450), str(student_name), fill=NAVY, font=name_font, anchor="mm")
        draw.line([(width // 2 - 300, 490), (width // 2 + 300, 490)], fill=NAVY, width=2)

        draw.text((width // 2, 550), "for successfully completing the official training program and assessment in", fill=DARK_GRAY, font=body_font, anchor="mm")

        draw.text((width // 2, 620), str(course_name), fill=NAVY, font=course_font, anchor="mm")

        draw.ellipse([(width // 2 - 40, 690), (width // 2 + 40, 770)], fill=GOLD, outline=BORDER_GOLD, width=3)
        draw.text((width // 2, 730), "IGT", fill=NAVY, font=subtitle_font, anchor="mm")

        draw.text((250, 920), f"Student ID: {register_id}", fill=DARK_GRAY, font=meta_bold)
        draw.text((250, 960), f"Issue Date: {issue_date_str}", fill=DARK_GRAY, font=meta_font)
        draw.line([(250, 900), (450, 900)], fill=DARK_GRAY, width=2)

        draw.text((width - 450, 920), "Authorized Signature", fill=NAVY, font=meta_bold)
        draw.text((width - 450, 960), "IGT Executive Director", fill=DARK_GRAY, font=meta_font)
        draw.line([(width - 450, 900), (width - 250, 900)], fill=DARK_GRAY, width=2)

        buffer = io.BytesIO()
        img.save(buffer, "JPEG", quality=95)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def generate_certificate_jpg(student_name, course_name, issue_date_str, register_id):
        """Returns the dynamic in-memory render endpoint URL for backward compatibility."""
        return f"/certificate/render_certificate_image?register_id={register_id}"

    @staticmethod
    def generate_certificate(register_id, student_name, course_name, joining_date=None, issue_date=None,
                             assignment_status='Completed', assessment_status='Completed',
                             assignment_score=90.0, assessment_score=95.0, course_id=None):
        """Creates or updates a Certificate record in the database."""
        if str(assignment_status).lower() != 'completed' or str(assessment_status).lower() != 'completed':
            raise ValueError("Student is NOT eligible for certificate. Both Assignment and Assessment must be Completed.")

        if not register_id:
            register_id = f"IGP{Certificate.objects.count() + 1:03d}"

        if not issue_date:
            issue_date = date.today()
        elif isinstance(issue_date, str):
            try:
                issue_date = datetime.strptime(issue_date, "%Y-%m-%d").date()
            except Exception:
                try:
                    issue_date = datetime.strptime(issue_date, "%d/%m/%Y").date()
                except Exception:
                    issue_date = date.today()

        cert_id = f"CERT-{datetime.now().year}-{register_id}"
        verification_token = str(uuid.uuid4())

        # Find course instance if course_id or course_name matches
        course_obj = None
        if course_id:
            course_obj = Course.objects.filter(Course_id=course_id).first()
        if not course_obj and course_name:
            course_obj = Course.objects.filter(Course_name__iexact=str(course_name).strip()).first()

        effective_course_name = course_obj.Course_name if course_obj else (course_name or "Course")
        img_url = f"/certificate/render_certificate_image?register_id={register_id}"

        cert, created = Certificate.objects.get_or_create(
            register_id=register_id,
            defaults={
                'certificate_id': cert_id,
                'verification_token': verification_token,
                'course': course_obj,
                'student_name': student_name,
                'course_name': effective_course_name,
                'joining_date': joining_date,
                'issue_date': issue_date,
                'assignment_status': assignment_status,
                'assessment_status': assessment_status,
                'assignment_score': assignment_score,
                'assessment_score': assessment_score,
                'certificate_image': img_url,
                'certificate_status': 'Active'
            }
        )

        if not created:
            if course_obj:
                cert.course = course_obj
            cert.student_name = student_name
            cert.course_name = effective_course_name
            cert.issue_date = issue_date
            if joining_date:
                cert.joining_date = joining_date
            cert.assignment_score = assignment_score
            cert.assessment_score = assessment_score
            cert.certificate_image = img_url
            cert.save()

        return {
            "certificate_id": cert.certificate_id,
            "register_id": cert.register_id,
            "student_name": cert.student_name,
            "course_name": cert.get_effective_course_name(),
            "issue_date": cert.issue_date.strftime("%d/%m/%Y"),
            "certificate_image": cert.certificate_image,
            "verification_token": cert.verification_token
        }

    @staticmethod
    def update_certificate(certificate_id, student_name=None, course_name=None, issue_date=None):
        """Updates certificate details in database."""
        cert = Certificate.objects.filter(models.Q(certificate_id=certificate_id) | models.Q(register_id=certificate_id)).first()
        if not cert:
            raise ValueError(f"Certificate with ID {certificate_id} not found.")

        if student_name:
            cert.student_name = student_name
        if course_name:
            cert.course_name = course_name
            # If matching Course object exists, update FK relationship
            course_obj = Course.objects.filter(Course_name__iexact=str(course_name).strip()).first()
            if course_obj:
                cert.course = course_obj

        if issue_date:
            if isinstance(issue_date, str):
                try:
                    cert.issue_date = datetime.strptime(issue_date, "%Y-%m-%d").date()
                except Exception:
                    try:
                        cert.issue_date = datetime.strptime(issue_date, "%d/%m/%Y").date()
                    except Exception:
                        pass
            else:
                cert.issue_date = issue_date

        effective_course_name = cert.get_effective_course_name()
        issue_date_str = cert.issue_date.strftime("%d/%m/%Y") if cert.issue_date else datetime.now().strftime("%d/%m/%Y")
        img_url = f"/certificate/render_certificate_image?register_id={cert.register_id or cert.certificate_id}"

        cert.certificate_image = img_url
        cert.save()

        return {
            "certificate_id": cert.certificate_id,
            "register_id": cert.register_id,
            "student_name": cert.student_name,
            "course_name": effective_course_name,
            "issue_date": issue_date_str,
            "certificate_image": cert.certificate_image
        }

    @staticmethod
    def on_course_name_updated(course_id, new_course_name):
        """
        Triggered when a Course's name is updated in the system.
        Updates all associated certificates in database so dynamic view immediately renders new name.
        """
        certs = Certificate.objects.filter(models.Q(course_id=course_id) | models.Q(course_name__iexact=new_course_name))
        for cert in certs:
            cert.course_name = new_course_name
            cert.certificate_image = f"/certificate/render_certificate_image?register_id={cert.register_id or cert.certificate_id}"
            cert.save()

