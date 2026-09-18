import uuid
from datetime import datetime
from django.db import connection
from django.contrib.auth.models import User
from ..models.Certificate import Certificate
from ..models.Enrollment import Enrollment


class Certificate_services:

    @staticmethod
    def check_eligibility(user_id, course_id):
        with connection.cursor() as cursor:
            cursor.execute(
                "CALL sp_check_certificate_eligibility(%s, %s)",
                [user_id, course_id]
            )
            columns = [col[0] for col in cursor.description] if cursor.description else []
            row = cursor.fetchone()
            while cursor.nextset():
                pass

        if not row:
            return {
                "eligible": False,
                "reason": "Student is not enrolled in this course.",
                "enrollment": None
            }

        data = dict(zip(columns, row))
        assignment_status = data.get('assignment_status')
        assessment_status = data.get('assessment_status')

        if assignment_status != 'Completed':
            return {
                "eligible": False,
                "reason": f"Assignment incomplete. Current status: {assignment_status}",
                "enrollment": data
            }

        if assessment_status != 'Passed':
            return {
                "eligible": False,
                "reason": f"Assessment not passed. Current status: {assessment_status}",
                "enrollment": data
            }

        return {
            "eligible": True,
            "reason": "Student meets all completion criteria for certificate generation.",
            "enrollment": data
        }

    @staticmethod
    def generate_certificate(user_id, course_id, student_name=None):
        # Determine effective student name if provided or fallback to user model
        if not student_name or not str(student_name).strip():
            u = User.objects.filter(id=user_id).first()
            if u:
                student_name = f"{u.first_name} {u.last_name}".strip() or u.username
            else:
                student_name = "Student"
        else:
            student_name = str(student_name).strip()

        # 1. Check if certificate already exists
        existing_cert = Certificate.objects.filter(user_id=user_id, course_id=course_id).first()
        if existing_cert:
            if student_name and existing_cert.student_name != student_name:
                existing_cert.student_name = student_name
                existing_cert.save()
            return Certificate_services.get_certificate_detail(existing_cert.certificate_id)

        # 2. Check eligibility
        eligibility = Certificate_services.check_eligibility(user_id, course_id)
        if not eligibility.get("eligible"):
            raise ValueError(eligibility.get("reason", "Student is not eligible for certificate."))

        # 3. Generate Unique Certificate ID & Verification Token
        current_year = datetime.now().year
        count = Certificate.objects.count() + 1
        cert_id = f"CERT-{current_year}-{count:06d}"

        while Certificate.objects.filter(certificate_id=cert_id).exists():
            count += 1
            cert_id = f"CERT-{current_year}-{count:06d}"

        verification_token = str(uuid.uuid4())

        # 4. Insert into DB using stored procedure
        with connection.cursor() as cursor:
            cursor.execute(
                "CALL sp_certificate_generate(%s, %s, %s, %s, %s)",
                [cert_id, verification_token, user_id, course_id, student_name]
            )
            columns = [col[0] for col in cursor.description] if cursor.description else []
            row = cursor.fetchone()
            while cursor.nextset():
                pass

        if not row:
            raise RuntimeError("Failed to generate certificate record.")

        res = dict(zip(columns, row))
        res['student_name'] = student_name
        return res

    @staticmethod
    def get_certificate_detail(certificate_id):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT cert.certificate_id, cert.verification_token, cert.student_name, cert.issue_date, cert.certificate_status,
                       c.Course_id, c.Course_name, c.Course_Fees,
                       u.id AS user_id, u.username, u.first_name, u.last_name, u.email
                FROM certificate cert
                JOIN course c ON cert.course_id = c.Course_id
                JOIN auth_user u ON cert.user_id = u.id
                WHERE cert.certificate_id = %s;
                """,
                [certificate_id]
            )
            columns = [col[0] for col in cursor.description] if cursor.description else []
            row = cursor.fetchone()
            while cursor.nextset():
                pass

        if not row:
            return None

        data = dict(zip(columns, row))
        if not data.get('student_name'):
            first_name = data.get('first_name', '')
            last_name = data.get('last_name', '')
            data['student_name'] = f"{first_name} {last_name}".strip() or data.get('username', 'Student')
        return data

    @staticmethod
    def get_student_certificates(user_id):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT cert.certificate_id, cert.verification_token, cert.student_name, cert.issue_date, cert.certificate_status,
                       c.Course_id, c.Course_name,
                       u.username, u.first_name, u.last_name
                FROM certificate cert
                JOIN course c ON cert.course_id = c.Course_id
                JOIN auth_user u ON cert.user_id = u.id
                WHERE cert.user_id = %s
                ORDER BY cert.issue_date DESC;
                """,
                [user_id]
            )
            columns = [col[0] for col in cursor.description] if cursor.description else []
            rows = cursor.fetchall()
            while cursor.nextset():
                pass

        result_list = []
        for row in rows:
            d = dict(zip(columns, row))
            if not d.get('student_name'):
                first_name = d.get('first_name', '')
                last_name = d.get('last_name', '')
                d['student_name'] = f"{first_name} {last_name}".strip() or d.get('username', 'Student')
            result_list.append(d)
        return result_list

    @staticmethod
    def verify_certificate(identifier):
        if not identifier:
            return None

        identifier = str(identifier).strip()

        with connection.cursor() as cursor:
            cursor.execute(
                "CALL sp_certificate_verify(%s)",
                [identifier]
            )
            columns = [col[0] for col in cursor.description] if cursor.description else []
            row = cursor.fetchone()
            while cursor.nextset():
                pass

        if not row:
            return None

        data = dict(zip(columns, row))
        name = data.get('student_name')
        if not name:
            first_name = data.get('first_name', '')
            last_name = data.get('last_name', '')
            name = f"{first_name} {last_name}".strip() or data.get('username', 'Student')

        return {
            "valid": True,
            "certificate_id": data.get("certificate_id"),
            "verification_token": data.get("verification_token"),
            "student_name": name,
            "course_name": data.get("Course_name"),
            "issue_date": data.get("issue_date"),
            "status": data.get("certificate_status"),
        }
