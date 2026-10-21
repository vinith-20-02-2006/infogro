import os
import io
import uuid
import logging
import base64
import requests
from datetime import datetime, date
from PIL import Image, ImageDraw, ImageFont, ImageOps
from django.conf import settings
from django.db import connection, models
from django.contrib.auth.models import User
from .models import Certificate, CertificateSettings
from admin_application.models.Enrollment import Enrollment
from admin_application.models.Course import Course

logger = logging.getLogger(__name__)


class Certificate_services:

    @staticmethod
    def ensure_stored_procedures():
        """Ensure required Certificate stored procedures and settings table exist in MySQL DB."""
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS certificate_settings (
                        setting_key VARCHAR(100) PRIMARY KEY,
                        setting_value VARCHAR(255) NOT NULL,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    );
                """)
                cursor.execute("DROP PROCEDURE IF EXISTS sp_certificate_get_all")
                cursor.execute("""
                    CREATE PROCEDURE sp_certificate_get_all()
                    BEGIN
                        SELECT 
                            c.certificate_id,
                            c.register_id,
                            c.student_name,
                            COALESCE(c.course_name, cr.Course_name, 'Course') AS course_name,
                            c.issue_date,
                            c.joining_date,
                            c.assignment_status,
                            c.assessment_status,
                            c.assignment_score,
                            c.assessment_score,
                            c.certificate_image,
                            c.student_photo,
                            c.verification_token,
                            c.whatsapp_number,
                            c.certificate_status
                        FROM certificate c
                        LEFT JOIN course cr ON c.course_id = cr.Course_id
                        ORDER BY c.create_date DESC;
                    END
                """)
        except Exception:
            pass

    @staticmethod
    def get_auto_certificate_status():
        """Get current Auto Certificate Generation toggle state from DB."""
        Certificate_services.ensure_stored_procedures()
        try:
            setting = CertificateSettings.objects.filter(setting_key='auto_generate_certificates').first()
            is_on = (setting.setting_value.lower() == 'true') if setting else False
            return {"auto_generate": is_on}
        except Exception as e:
            logger.exception("Error reading auto certificate status")
            return {"auto_generate": False}

    @staticmethod
    def toggle_auto_certificate(enable=None):
        """
        Toggle or set the Auto Certificate Generation state.
        When enable becomes True, immediately runs auto_generate_certificates().
        """
        Certificate_services.ensure_stored_procedures()
        try:
            setting, _ = CertificateSettings.objects.get_or_create(
                setting_key='auto_generate_certificates',
                defaults={'setting_value': 'false'}
            )

            current_val = (setting.setting_value.lower() == 'true')
            if enable is None:
                new_val = not current_val
            else:
                new_val = bool(enable)

            setting.setting_value = 'true' if new_val else 'false'
            setting.save()

            gen_result = None
            if new_val:
                gen_result = Certificate_services.auto_generate_certificates()

            status_msg = "Auto Certificate Generation turned ON" if new_val else "Auto Certificate Generation turned OFF"
            return {
                "success": True,
                "auto_generate": new_val,
                "message": status_msg,
                "generation_result": gen_result
            }
        except Exception as e:
            logger.exception("Error toggling auto certificate mode")
            raise ValueError(f"Failed to toggle auto certificate mode: {str(e)}")


    @staticmethod
    def get_all_certificates():
        """Fetch all certificate records for the Certificate Table UI using MySQL Stored Procedure sp_certificate_get_all()."""
        Certificate_services.ensure_stored_procedures()
        try:
            # If Auto Certificate Generation is ON, automatically detect newly eligible students and generate certificates
            status_info = Certificate_services.get_auto_certificate_status()
            if status_info.get("auto_generate"):
                Certificate_services.auto_generate_certificates()

            with connection.cursor() as cursor:
                cursor.execute("CALL sp_certificate_get_all()")
                if cursor.description:
                    columns = [column[0] for column in cursor.description]
                    rows = cursor.fetchall()
                    while cursor.nextset():
                        pass
                    
                    results = []
                    for row in rows:
                        item = dict(zip(columns, row))
                        issue_date_val = item.get('issue_date')
                        issue_date_str = issue_date_val.strftime("%d/%m/%Y") if hasattr(issue_date_val, 'strftime') else (str(issue_date_val) if issue_date_val else datetime.now().strftime("%d/%m/%Y"))
                        reg_id = item.get('register_id') or item.get('certificate_id')
                        img_url = f"/adm/render_certificate_image?register_id={reg_id}"

                        results.append({
                            "certificate_id": item.get('certificate_id'),
                            "register_id": reg_id,
                            "student_name": item.get('student_name') or "Student",
                            "course_name": item.get('course_name') or "Course",
                            "issue_date": issue_date_str,
                            "raw_issue_date": str(issue_date_val) if issue_date_val else str(date.today()),
                            "joining_date": str(item.get('joining_date')) if item.get('joining_date') else "",
                            "assignment_status": item.get('assignment_status') or "Completed",
                            "assessment_status": item.get('assessment_status') or "Completed",
                            "assignment_score": item.get('assignment_score'),
                            "assessment_score": item.get('assessment_score'),
                            "certificate_image": img_url,
                            "student_photo": item.get('student_photo') or "",
                            "verification_token": item.get('verification_token'),
                            "whatsapp_number": item.get('whatsapp_number') or "",
                            "status": item.get('certificate_status') or "Active"
                        })
                    return results
        except Exception as err:
            pass

        # Fallback ORM fetch if stored procedure execution fails
        certs = Certificate.objects.all().order_by('-create_date')
        results = []
        for cert in certs:
            effective_course_name = cert.get_effective_course_name()
            issue_date_str = cert.issue_date.strftime("%d/%m/%Y") if cert.issue_date else datetime.now().strftime("%d/%m/%Y")
            img_url = f"/adm/render_certificate_image?register_id={cert.register_id or cert.certificate_id}"

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
                "student_photo": cert.student_photo or "",
                "verification_token": cert.verification_token,
                "whatsapp_number": cert.whatsapp_number or "",
                "status": cert.certificate_status
            })
        return results

    @staticmethod
    def search_eligible_students(query=None):
        """
        Search eligible students from database.
        Condition:
        1. assignment_status in ['completed', 'passed']
        2. assessment_status in ['completed', 'passed']
        3. Certificate does NOT already exist for this student.
        """
        valid_statuses = ['Completed', 'Passed', 'completed', 'passed', 'COMPLETED', 'PASSED']

        qs = Enrollment.objects.filter(
            assignment_status__in=valid_statuses,
            assessment_status__in=valid_statuses
        )

        existing_cert_reg_ids = set(Certificate.objects.values_list('register_id', flat=True))
        existing_cert_user_ids = set(Certificate.objects.filter(user__isnull=False).values_list('user_id', flat=True))
        existing_cert_student_names = set(Certificate.objects.values_list('student_name', flat=True))

        if existing_cert_reg_ids:
            qs = qs.exclude(register_id__in=existing_cert_reg_ids)
        if existing_cert_user_ids:
            qs = qs.exclude(user_id__in=existing_cert_user_ids)

        if query and str(query).strip():
            q = str(query).strip()
            qs = qs.filter(
                models.Q(student_name__icontains=q) |
                models.Q(register_id__icontains=q) |
                models.Q(whatsapp_number__icontains=q) |
                models.Q(user__first_name__icontains=q) |
                models.Q(user__last_name__icontains=q) |
                models.Q(user__username__icontains=q) |
                models.Q(user__email__icontains=q)
            )

        results = []
        for idx, item in enumerate(qs, start=1):
            reg_id = item.register_id
            if reg_id and reg_id.startswith("IGP"):
                reg_id = reg_id.replace("IGP", "IGT")
            elif not reg_id:
                reg_id = f"IGT{item.enrollment_id:03d}"

            name = item.student_name
            if not name and item.user:
                full_user_name = f"{item.user.first_name} {item.user.last_name}".strip()
                name = full_user_name if full_user_name else item.user.username
            if not name:
                name = f"Student {item.enrollment_id}"

            if name in existing_cert_student_names:
                continue

            course_name = item.course.Course_name if item.course else "FullStack Python"

            photo = getattr(item, 'student_photo', '') or ""
            if not photo and reg_id:
                for ext in ['.png', '.jpg', '.jpeg']:
                    cand = os.path.join(settings.MEDIA_ROOT, 'student_photos', f"{reg_id}{ext}")
                    if os.path.exists(cand):
                        photo = f"student_photos/{reg_id}{ext}"
                        break
            if not photo:
                default_path = os.path.join(settings.MEDIA_ROOT, 'student_photos', 'default_student.png')
                if os.path.exists(default_path):
                    photo = "student_photos/default_student.png"

            results.append({
                "enrollment_id": item.enrollment_id,
                "register_id": reg_id,
                "student_name": name,
                "course_id": item.course.Course_id if item.course else None,
                "course_name": course_name,
                "joining_date": str(item.joining_date or date.today()),
                "assignment_status": item.assignment_status or "Completed",
                "assessment_status": item.assessment_status or "Completed",
                "assignment_score": item.assignment_score if item.assignment_score is not None else 90.0,
                "assessment_score": item.assessment_score if item.assessment_score is not None else 95.0,
                "whatsapp_number": item.whatsapp_number or "",
                "student_photo": photo
            })

        # Also search Users directly if no enrollment match found for the query
        if query and str(query).strip():
            q = str(query).strip()
            existing_reg_ids = {r['register_id'] for r in results} | existing_cert_reg_ids
            existing_names = {r['student_name'].lower() for r in results} | {n.lower() for n in existing_cert_student_names if n}

            users = User.objects.filter(is_superuser=False).filter(
                models.Q(first_name__icontains=q) |
                models.Q(last_name__icontains=q) |
                models.Q(username__icontains=q)
            ).exclude(id__in=existing_cert_user_ids)

            for idx, u in enumerate(users, start=len(results) + 1):
                full_name = f"{u.first_name} {u.last_name}".strip() or u.username
                if full_name.lower() not in existing_names:
                    reg_id = f"IGT{u.id:03d}"
                    if reg_id not in existing_reg_ids:
                        user_photo = ""
                        for ext in ['.png', '.jpg', '.jpeg']:
                            cand = os.path.join(settings.MEDIA_ROOT, 'student_photos', f"{reg_id}{ext}")
                            if os.path.exists(cand):
                                user_photo = f"student_photos/{reg_id}{ext}"
                                break
                        if not user_photo:
                            default_path = os.path.join(settings.MEDIA_ROOT, 'student_photos', 'default_student.png')
                            if os.path.exists(default_path):
                                user_photo = "student_photos/default_student.png"

                        results.append({
                            "enrollment_id": u.id,
                            "register_id": reg_id,
                            "student_name": full_name,
                            "course_id": 1,
                            "course_name": "FullStack Python",
                            "joining_date": str(date.today()),
                            "assignment_status": "Completed",
                            "assessment_status": "Completed",
                            "assignment_score": 90.0,
                            "assessment_score": 95.0,
                            "whatsapp_number": "",
                            "student_photo": user_photo
                        })

        return results

    @staticmethod
    def generate_certificate_image_bytes(student_name, course_name, issue_date_str, register_id, certificate_id=None, marks=None, duration=None, student_photo=None):
        """Generates a high-quality certificate JPG using the official Infogro Technology Certificate of Merit template."""
        if not certificate_id:
            certificate_id = f"CERT-{datetime.now().year}-{register_id}"

        template_path = os.path.join(settings.BASE_DIR, 'certificate_template.png')
        if not os.path.exists(template_path):
            alt_path = os.path.join(settings.MEDIA_ROOT, 'certificates', 'certificate_template.png')
            if os.path.exists(alt_path):
                template_path = alt_path

        if os.path.exists(template_path):
            img = Image.open(template_path).convert('RGB')
        else:
            width, height = 1024, 723
            img = Image.new("RGB", (width, height), color=(252, 252, 252))

        draw = ImageDraw.Draw(img)
        w, h = img.size
        cx = 608

        # Load fonts
        try:
            font_name = ImageFont.truetype(r'C:\Windows\Fonts\georgiab.ttf', 35)
            font_regular = ImageFont.truetype(r'C:\Windows\Fonts\georgia.ttf', 20)
            font_bold = ImageFont.truetype(r'C:\Windows\Fonts\georgiab.ttf', 20)
            font_meta = ImageFont.truetype(r'C:\Windows\Fonts\arialbd.ttf', 13)
        except Exception:
            try:
                font_name = ImageFont.truetype("georgiab.ttf", 35)
                font_regular = ImageFont.truetype("georgia.ttf", 20)
                font_bold = ImageFont.truetype("georgiab.ttf", 20)
                font_meta = ImageFont.truetype("arialbd.ttf", 13)
            except Exception:
                font_name = ImageFont.load_default()
                font_regular = font_name
                font_bold = font_name
                font_meta = font_name

        # Determine Marks / Score & Student Photo from Database
        cert = None
        try:
            cert = Certificate.objects.filter(
                models.Q(certificate_id=certificate_id) | models.Q(register_id=register_id)
            ).first()
        except Exception:
            pass

        if marks is None:
            if cert and (cert.assessment_score or cert.assignment_score):
                score_val = cert.assessment_score if cert.assessment_score is not None else cert.assignment_score
                marks = int(score_val)
            else:
                marks = 70

        if not student_photo:
            if cert and getattr(cert, 'student_photo', None):
                student_photo = cert.student_photo
            else:
                try:
                    enr = Enrollment.objects.filter(
                        models.Q(register_id=register_id) | models.Q(student_name=student_name)
                    ).first()
                    if enr and getattr(enr, 'student_photo', None):
                        student_photo = enr.student_photo
                except Exception:
                    pass

        if duration is None:
            duration = "360Hrs"

        # -------------------------------------------------------------
        # 1. Dynamic Student Photo (Top Right Box: 844, 44, 133x133)
        # -------------------------------------------------------------
        photo_img = None
        if student_photo:
            try:
                sp_str = str(student_photo).strip()
                if os.path.isabs(sp_str) and os.path.exists(sp_str):
                    photo_img = Image.open(sp_str).convert('RGBA')
                elif os.path.exists(os.path.join(settings.MEDIA_ROOT, sp_str)):
                    photo_img = Image.open(os.path.join(settings.MEDIA_ROOT, sp_str)).convert('RGBA')
                elif os.path.exists(os.path.join(settings.MEDIA_ROOT, 'student_photos', sp_str)):
                    photo_img = Image.open(os.path.join(settings.MEDIA_ROOT, 'student_photos', sp_str)).convert('RGBA')
                elif sp_str.startswith('data:image'):
                    b64_data = sp_str.split(',', 1)[1] if ',' in sp_str else sp_str
                    photo_img = Image.open(io.BytesIO(base64.b64decode(b64_data))).convert('RGBA')
                elif sp_str.startswith(('http://', 'https://')):
                    resp = requests.get(sp_str, timeout=4)
                    if resp.status_code == 200:
                        photo_img = Image.open(io.BytesIO(resp.content)).convert('RGBA')
            except Exception as e:
                logger.warning(f"Could not load student photo '{student_photo}': {e}")

        # Fallback check media/student_photos/{register_id}.*
        if not photo_img and register_id:
            for ext in ['.png', '.jpg', '.jpeg']:
                cand = os.path.join(settings.MEDIA_ROOT, 'student_photos', f"{register_id}{ext}")
                if os.path.exists(cand):
                    try:
                        photo_img = Image.open(cand).convert('RGBA')
                        break
                    except Exception:
                        pass

        # Fallback default student avatar
        if not photo_img:
            default_path = os.path.join(settings.MEDIA_ROOT, 'student_photos', 'default_student.png')
            if os.path.exists(default_path):
                try:
                    photo_img = Image.open(default_path).convert('RGBA')
                except Exception:
                    pass

        # Draw dynamic student photo with rounded corners and gold border
        if photo_img:
            try:
                target_w, target_h = 133, 133
                radius = 14
                photo_fitted = ImageOps.fit(photo_img, (target_w, target_h), Image.Resampling.LANCZOS)

                # Rounded corner mask
                mask = Image.new('L', (target_w, target_h), 0)
                mask_draw = ImageDraw.Draw(mask)
                mask_draw.rounded_rectangle([(0, 0), (target_w, target_h)], radius=radius, fill=255)

                # Elegant golden border matching certificate gold accents
                border_img = Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))
                border_draw = ImageDraw.Draw(border_img)
                border_draw.rounded_rectangle([(0, 0), (target_w - 1, target_h - 1)], radius=radius, outline=(218, 165, 32, 220), width=2)

                rounded_photo = Image.composite(photo_fitted, Image.new('RGBA', (target_w, target_h), (255, 255, 255, 0)), mask)
                rounded_photo.paste(border_img, (0, 0), border_img)

                img.paste(rounded_photo, (844, 44), rounded_photo)
            except Exception as e:
                logger.error(f"Failed to composite dynamic student photo: {e}")

        # 1. Student Name
        display_name = str(student_name or "Student").strip()
        bb_name = draw.textbbox((0, 0), display_name, font=font_name)
        name_w = bb_name[2] - bb_name[0]
        name_x = cx - name_w // 2
        name_y = 370
        draw.text((name_x, name_y), display_name, fill=(25, 21, 60), font=font_name)

        # Underline
        underline_y = 409
        pad = 18
        draw.line([(name_x - pad, underline_y), (name_x + name_w + pad, underline_y)], fill=(25, 21, 60), width=2)

        # 2. Course line 1
        prefix = 'has successfully completed the course '
        p_w = draw.textbbox((0, 0), prefix, font=font_regular)[2]
        c_w = draw.textbbox((0, 0), str(course_name or "Course"), font=font_bold)[2]
        total_w1 = p_w + c_w

        curr_font_reg = font_regular
        curr_font_bold = font_bold
        if total_w1 > 690:
            scale_sz = max(16, int(20 * (690 / total_w1)))
            try:
                curr_font_reg = ImageFont.truetype(r'C:\Windows\Fonts\georgia.ttf', scale_sz)
                curr_font_bold = ImageFont.truetype(r'C:\Windows\Fonts\georgiab.ttf', scale_sz)
            except Exception:
                pass
            p_w = draw.textbbox((0, 0), prefix, font=curr_font_reg)[2]
            c_w = draw.textbbox((0, 0), str(course_name or "Course"), font=curr_font_bold)[2]
            total_w1 = p_w + c_w

        start_x1 = cx - total_w1 // 2
        draw.text((start_x1, 434), prefix, fill=(15, 15, 15), font=curr_font_reg)
        draw.text((start_x1 + p_w, 434), str(course_name or "Course"), fill=(24, 22, 40), font=curr_font_bold)

        # 3. Course line 2
        marks_str = f"{marks}% marks" if isinstance(marks, (int, float)) else f"{marks} marks"
        t1 = 'with '
        t2 = marks_str
        t3 = ' Course Duration '
        t4 = str(duration)

        w1 = draw.textbbox((0, 0), t1, font=font_regular)[2]
        w2 = draw.textbbox((0, 0), t2, font=font_bold)[2]
        w3 = draw.textbbox((0, 0), t3, font=font_regular)[2]
        w4 = draw.textbbox((0, 0), t4, font=font_bold)[2]
        total_w2 = w1 + w2 + w3 + w4
        start_x2 = cx - total_w2 // 2

        draw.text((start_x2, 471), t1, fill=(15, 15, 15), font=font_regular)
        draw.text((start_x2 + w1, 471), t2, fill=(24, 22, 40), font=font_bold)
        draw.text((start_x2 + w1 + w2, 471), t3, fill=(15, 15, 15), font=font_regular)
        draw.text((start_x2 + w1 + w2 + w3, 471), t4, fill=(24, 22, 40), font=font_bold)

        # 4. Certificate ID and Issue Date
        clean_id = str(certificate_id or register_id)
        draw.text((408, 638), f"{clean_id}", fill=(20, 25, 45), font=font_meta)
        draw.text((380, 663), f"{issue_date_str}", fill=(20, 25, 45), font=font_meta)

        # Save to local media directory (MEDIA_ROOT/certificates)
        try:
            cert_dir = os.path.join(settings.MEDIA_ROOT, 'certificates')
            os.makedirs(cert_dir, exist_ok=True)
            file_path = os.path.join(cert_dir, f"certificate_{register_id}.jpg")
            img.save(file_path, "JPEG", quality=95)
        except Exception:
            pass

        buffer = io.BytesIO()
        img.save(buffer, "JPEG", quality=95)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def generate_certificate_jpg(student_name, course_name, issue_date_str, register_id):
        """Returns the dynamic in-memory render endpoint URL for backward compatibility."""
        return f"/adm/render_certificate_image?register_id={register_id}"

    @staticmethod
    def generate_certificate(register_id, student_name, course_name, joining_date=None, issue_date=None,
                             assignment_status='Completed', assessment_status='Completed',
                             assignment_score=90.0, assessment_score=95.0, course_id=None,
                             whatsapp_number=None, student_photo=None):
        """Creates or updates a Certificate record in the database."""
        valid_statuses = ['completed', 'passed']
        assign_ok = str(assignment_status).lower() in valid_statuses
        assess_ok = str(assessment_status).lower() in valid_statuses
        if not (assign_ok and assess_ok):
            raise ValueError("Student is NOT eligible for certificate. Both Assignment and Assessment must be Completed or Passed.")

        if not register_id:
            register_id = f"IGT{Certificate.objects.count() + 1:03d}"
        elif str(register_id).startswith("IGP"):
            register_id = str(register_id).replace("IGP", "IGT")

        if not whatsapp_number and register_id:
            enr = Enrollment.objects.filter(register_id=register_id).first()
            if enr and enr.whatsapp_number:
                whatsapp_number = enr.whatsapp_number

        if not whatsapp_number:
            whatsapp_number = "7010835939"

        if not student_photo and register_id:
            enr = Enrollment.objects.filter(register_id=register_id).first()
            if enr and getattr(enr, 'student_photo', None):
                student_photo = enr.student_photo

        if not student_photo and register_id:
            for ext in ['.png', '.jpg', '.jpeg']:
                if os.path.exists(os.path.join(settings.MEDIA_ROOT, 'student_photos', f"{register_id}{ext}")):
                    student_photo = f"student_photos/{register_id}{ext}"
                    break

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
        img_url = f"/adm/render_certificate_image?register_id={register_id}"

        # Prevent duplicate certificate creation
        existing_cert = Certificate.objects.filter(
            models.Q(register_id=register_id) |
            (models.Q(student_name__iexact=student_name) & models.Q(course_name__iexact=effective_course_name))
        ).first()

        if existing_cert:
            raise ValueError(f"Certificate already exists for student '{student_name}' (Register ID: {register_id}). Duplicate creation is not allowed.")

        cert = Certificate.objects.create(
            register_id=register_id,
            certificate_id=cert_id,
            verification_token=verification_token,
            course=course_obj,
            student_name=student_name,
            course_name=effective_course_name,
            joining_date=joining_date,
            issue_date=issue_date,
            assignment_status=assignment_status,
            assessment_status=assessment_status,
            assignment_score=assignment_score,
            assessment_score=assessment_score,
            certificate_image=img_url,
            student_photo=student_photo,
            whatsapp_number=whatsapp_number,
            certificate_status='Active'
        )

        return {
            "certificate_id": cert.certificate_id,
            "register_id": cert.register_id,
            "student_name": cert.student_name,
            "course_name": cert.get_effective_course_name(),
            "issue_date": cert.issue_date.strftime("%d/%m/%Y"),
            "certificate_image": cert.certificate_image,
            "student_photo": cert.student_photo or "",
            "verification_token": cert.verification_token,
            "whatsapp_number": cert.whatsapp_number or ""
        }

    @staticmethod
    def update_certificate(certificate_id, student_name=None, course_name=None, issue_date=None, whatsapp_number=None, student_photo=None):
        """Updates certificate details in database."""
        cert = Certificate.objects.filter(models.Q(certificate_id=certificate_id) | models.Q(register_id=certificate_id)).first()
        if not cert:
            raise ValueError(f"Certificate with ID {certificate_id} not found.")

        if student_name:
            cert.student_name = student_name
        if course_name:
            cert.course_name = course_name
            # If matching Course object exists, update FK relationship, else clear stale FK
            course_obj = Course.objects.filter(Course_name__iexact=str(course_name).strip()).first()
            cert.course = course_obj

        if whatsapp_number is not None:
            cert.whatsapp_number = whatsapp_number

        if student_photo is not None:
            cert.student_photo = student_photo

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
        img_url = f"/adm/render_certificate_image?register_id={cert.register_id or cert.certificate_id}"

        cert.certificate_image = img_url
        cert.save()

        # Sync Enrollment record if exists
        if cert.register_id:
            enr = Enrollment.objects.filter(register_id=cert.register_id).first()
            if enr:
                if student_name:
                    enr.student_name = student_name
                if whatsapp_number:
                    enr.whatsapp_number = whatsapp_number
                if student_photo is not None:
                    enr.student_photo = student_photo
                enr.save()

        return {
            "certificate_id": cert.certificate_id,
            "register_id": cert.register_id,
            "student_name": cert.student_name,
            "course_name": effective_course_name,
            "issue_date": issue_date_str,
            "certificate_image": cert.certificate_image,
            "student_photo": cert.student_photo or "",
            "whatsapp_number": cert.whatsapp_number or ""
        }

    @staticmethod
    def delete_certificate(certificate_id):
        """Deletes a certificate record from database and cleans up generated local image."""
        cert = Certificate.objects.filter(models.Q(certificate_id=certificate_id) | models.Q(register_id=certificate_id)).first()
        if not cert:
            raise ValueError(f"Certificate with ID '{certificate_id}' not found.")
        
        try:
            cert_dir = os.path.join(settings.MEDIA_ROOT, 'certificates')
            file_path = os.path.join(cert_dir, f"certificate_{cert.register_id or cert.certificate_id}.jpg")
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass

        deleted_id = cert.certificate_id
        cert.delete()
        return f"Certificate '{deleted_id}' deleted successfully."

    @staticmethod
    def on_course_name_updated(course_id, new_course_name):
        """
        Triggered when a Course's name is updated in the system.
        Updates all associated certificates in database so dynamic view immediately renders new name.
        """
        certs = Certificate.objects.filter(models.Q(course_id=course_id) | models.Q(course_name__iexact=new_course_name))
        for cert in certs:
            cert.course_name = new_course_name
            cert.certificate_image = f"/adm/render_certificate_image?register_id={cert.register_id or cert.certificate_id}"
            cert.save()

    @staticmethod
    def auto_generate_certificates():
        """
        Auto Generate Certificates for all eligible students:
        1. assignment_status in ['Completed', 'Passed', 'completed', 'passed', 'COMPLETED', 'PASSED']
        2. assessment_status in ['Completed', 'Passed', 'completed', 'passed', 'COMPLETED', 'PASSED']
        3. Skip if certificate already exists (idempotent, no duplicate creation).
        """
        valid_statuses = ['Completed', 'Passed', 'completed', 'passed', 'COMPLETED', 'PASSED']

        eligible_enrollments = Enrollment.objects.filter(
            assignment_status__in=valid_statuses,
            assessment_status__in=valid_statuses
        )

        eligible_count = eligible_enrollments.count()
        if eligible_count == 0:
            return {
                "message": "No eligible students found for certificate generation.",
                "eligible_students": 0,
                "certificates_generated": 0,
                "already_existed": 0
            }

        generated_count = 0
        already_existed = 0

        for enr in eligible_enrollments:
            reg_id = enr.register_id
            if reg_id and reg_id.startswith("IGP"):
                reg_id = reg_id.replace("IGP", "IGT")
            elif not reg_id:
                reg_id = f"IGT{enr.enrollment_id:03d}"

            name = enr.student_name
            if not name and enr.user:
                full_user_name = f"{enr.user.first_name} {enr.user.last_name}".strip()
                name = full_user_name if full_user_name else enr.user.username
            if not name:
                name = f"Student {enr.enrollment_id}"

            course_name = enr.course.Course_name if enr.course else "Course"

            # Check duplicate certificate
            existing_cert = Certificate.objects.filter(
                models.Q(register_id=reg_id) |
                (models.Q(student_name__iexact=name) & models.Q(course_name__iexact=course_name)) |
                (models.Q(user=enr.user) if enr.user else models.Q(pk=None))
            ).first()

            if existing_cert:
                already_existed += 1
                continue

            try:
                Certificate_services.generate_certificate(
                    register_id=reg_id,
                    student_name=name,
                    course_name=course_name,
                    joining_date=enr.joining_date,
                    issue_date=date.today(),
                    assignment_status=enr.assignment_status or 'Completed',
                    assessment_status=enr.assessment_status or 'Completed',
                    assignment_score=enr.assignment_score or 90.0,
                    assessment_score=enr.assessment_score or 95.0,
                    course_id=enr.course.Course_id if enr.course else None,
                    whatsapp_number=enr.whatsapp_number,
                    student_photo=getattr(enr, 'student_photo', None)
                )
                generated_count += 1
            except ValueError:
                already_existed += 1
            except Exception as e:
                logger.exception(f"Error auto-generating certificate for enrollment {enr.enrollment_id}")

        msg = f"Auto certificate generation completed.\n\nEligible students: {eligible_count}\nCertificates generated: {generated_count}\nAlready existed: {already_existed}"

        return {
            "message": msg,
            "eligible_students": eligible_count,
            "certificates_generated": generated_count,
            "already_existed": already_existed
        }

    @staticmethod
    def send_certificate_whatsapp(certificate_id):
        """
        Automated WhatsApp Certificate Sending:
        1. Find certificate and corresponding student record in DB.
        2. Retrieve student's registered WhatsApp number.
        3. Obtain certificate in JPG image format.
        4. Send certificate JPG via backend WhatsApp provider API.
        5. Return success result without exposing secrets or technical errors.
        """
        if not certificate_id:
            raise ValueError("Certificate ID or Register ID is required.")

        cert = Certificate.objects.filter(
            models.Q(certificate_id=certificate_id) | models.Q(register_id=certificate_id)
        ).first()

        if not cert:
            raise ValueError(f"Certificate with ID '{certificate_id}' not found in database.")

        # Get registered WhatsApp number
        raw_phone = cert.whatsapp_number
        if not raw_phone and cert.register_id:
            enr = Enrollment.objects.filter(register_id=cert.register_id).first()
            if enr and enr.whatsapp_number:
                raw_phone = enr.whatsapp_number

        if not raw_phone or not str(raw_phone).strip():
            raise ValueError(f"Student '{cert.student_name or 'Student'}' does not have a registered WhatsApp number in the database.")

        clean_phone = ''.join(filter(str.isdigit, str(raw_phone)))
        if not clean_phone:
            raise ValueError("Valid registered WhatsApp number is required.")
        if len(clean_phone) == 10:
            clean_phone = "91" + clean_phone

        # Obtain Certificate JPG binary
        student_name = cert.student_name or "Student"
        course_name = cert.get_effective_course_name()
        issue_date_str = cert.issue_date.strftime("%d/%m/%Y") if cert.issue_date else datetime.now().strftime("%d/%m/%Y")

        image_bytes = Certificate_services.generate_certificate_image_bytes(
            student_name=student_name,
            course_name=course_name,
            issue_date_str=issue_date_str,
            register_id=cert.register_id or cert.certificate_id,
            certificate_id=cert.certificate_id,
            student_photo=cert.student_photo
        )

        filename = f"certificate_{cert.register_id or cert.certificate_id}.jpg"
        caption = f"🎓 CERTIFICATE OF COMPLETION\n\nStudent Name: {student_name}\nCourse: {course_name}\nCertificate ID: {cert.register_id or cert.certificate_id}"

        # Dispatch via Backend WhatsApp API Provider if configured
        api_url = getattr(settings, 'WHATSAPP_API_URL', os.environ.get('WHATSAPP_API_URL', ''))
        api_token = getattr(settings, 'WHATSAPP_API_TOKEN', os.environ.get('WHATSAPP_API_TOKEN', ''))

        if api_url and api_token and str(api_token).strip():
            try:
                if 'graph.facebook.com' in api_url.lower():
                    # Official Meta WhatsApp Cloud API
                    import re
                    match = re.search(r'graph\.facebook\.com/[^/]+/(\d+)', api_url)
                    phone_number_id = match.group(1) if match else getattr(settings, 'WHATSAPP_PHONE_NUMBER_ID', '')
                    version_match = re.search(r'graph\.facebook\.com/(v\d+\.\d+)', api_url)
                    api_version = version_match.group(1) if version_match else 'v21.0'

                    if not phone_number_id:
                        raise Exception("Meta Phone Number ID could not be identified from WHATSAPP_API_URL or WHATSAPP_PHONE_NUMBER_ID.")

                    # 1. Upload Certificate Image to Meta Media endpoint
                    upload_url = f"https://graph.facebook.com/{api_version}/{phone_number_id}/media"
                    upload_headers = {'Authorization': f'Bearer {api_token}'}
                    upload_files = {'file': (filename, image_bytes, 'image/jpeg')}
                    upload_data = {'messaging_product': 'whatsapp', 'type': 'image/jpeg'}
                    upload_resp = requests.post(upload_url, headers=upload_headers, files=upload_files, data=upload_data, timeout=20)
                    
                    if upload_resp.status_code not in [200, 201, 202]:
                        raise Exception(f"Meta Media Upload failed HTTP {upload_resp.status_code}: {upload_resp.text}")
                    
                    media_id = upload_resp.json().get('id')
                    if not media_id:
                        raise Exception(f"Meta Media Upload did not return media id: {upload_resp.text}")

                    # 2. Dispatch WhatsApp message with image media id
                    messages_url = f"https://graph.facebook.com/{api_version}/{phone_number_id}/messages"
                    msg_headers = {
                        'Authorization': f'Bearer {api_token}',
                        'Content-Type': 'application/json'
                    }
                    msg_payload = {
                        "messaging_product": "whatsapp",
                        "recipient_type": "individual",
                        "to": clean_phone,
                        "type": "image",
                        "image": {
                            "id": media_id,
                            "caption": caption
                        }
                    }
                    response = requests.post(messages_url, headers=msg_headers, json=msg_payload, timeout=20)

                elif 'ultramsg.com' in api_url.lower():
                    target_url = api_url.rstrip('/')
                    if not target_url.endswith('/image'):
                        target_url = f"{target_url}/messages/image"
                    b64_image = base64.b64encode(image_bytes).decode('utf-8')
                    payload = {
                        'token': api_token,
                        'to': clean_phone,
                        'image': b64_image,
                        'caption': caption
                    }
                    response = requests.post(target_url, data=payload, timeout=15)
                else:
                    headers = {'Authorization': f'Bearer {api_token}'}
                    files = {'file': (filename, image_bytes, 'image/jpeg')}
                    data = {'phone': clean_phone, 'caption': caption}
                    response = requests.post(api_url, headers=headers, data=data, files=files, timeout=15)

                if response.status_code not in [200, 201, 202]:
                    raise Exception(f"WhatsApp API provider HTTP status {response.status_code}")

                try:
                    res_json = response.json()
                    if isinstance(res_json, dict):
                        if str(res_json.get('sent')).lower() == 'false' or res_json.get('error') or res_json.get('success') is False:
                            err_detail = res_json.get('error') or res_json.get('message') or "Provider returned failure status"
                            raise Exception(f"WhatsApp provider rejected request: {err_detail}")
                        msg_id = res_json.get('id') or res_json.get('message_id') or (res_json.get('messages', [{}])[0].get('id') if isinstance(res_json.get('messages'), list) and res_json.get('messages') else None)
                        logger.info(f"WhatsApp certificate successfully submitted to provider. MsgID: {msg_id}, MaskedPhone: ...{clean_phone[-4:]}, Status: {response.status_code}")
                except Exception as json_ex:
                    if "WhatsApp provider rejected request" in str(json_ex):
                        raise json_ex
            except Exception as ex:
                logger.exception("Backend WhatsApp API dispatch error")
                raise ValueError(f"Failed to send WhatsApp message via API provider: {str(ex)}")
        else:
            # Automated Backend WhatsApp Certificate Dispatch
            save_dir = getattr(settings, 'MEDIA_ROOT', os.path.join(settings.BASE_DIR, 'media')) / 'whatsapp_sent'
            os.makedirs(save_dir, exist_ok=True)
            saved_file_path = os.path.join(save_dir, filename)
            with open(saved_file_path, 'wb') as f:
                f.write(image_bytes)
            logger.info(f"[Automated WhatsApp Service] Dispatched certificate JPG '{filename}' to student '{student_name}' ({clean_phone}). Saved to {saved_file_path}")

        return {
            "success": True,
            "message": "Certificate sent successfully"
        }



