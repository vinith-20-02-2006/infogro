import os
import logging
from django.conf import settings
from django.http import HttpResponse, FileResponse
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from ..services.Certificate_services import Certificate_services

logger = logging.getLogger('django')


# ==========================================
# LIST ALL CERTIFICATES
# ==========================================
class ListCertificates(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        try:
            certs = Certificate_services.get_all_certificates()
            return Response(certs, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to list certificates")
            return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# SEARCH ELIGIBLE STUDENTS
# ==========================================
class SearchEligibleStudents(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        query = request.GET.get('q') or request.GET.get('query')
        try:
            eligible_students = Certificate_services.search_eligible_students(query=query)
            return Response(eligible_students, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to search eligible students")
            return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# GENERATE CERTIFICATE (JPG)
# ==========================================
class GenerateCertificate(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    class InputSerializer(serializers.Serializer):
        register_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        student_name = serializers.CharField(required=True)
        course_name = serializers.CharField(required=True)
        joining_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        issue_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        assignment_status = serializers.CharField(default='Completed')
        assessment_status = serializers.CharField(default='Completed')
        assignment_score = serializers.FloatField(required=False, default=90.0)
        assessment_score = serializers.FloatField(required=False, default=95.0)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            result = Certificate_services.generate_certificate(
                register_id=data.get('register_id'),
                student_name=data.get('student_name'),
                course_name=data.get('course_name'),
                joining_date=data.get('joining_date'),
                issue_date=data.get('issue_date'),
                assignment_status=data.get('assignment_status', 'Completed'),
                assessment_status=data.get('assessment_status', 'Completed'),
                assignment_score=data.get('assignment_score', 90.0),
                assessment_score=data.get('assessment_score', 95.0),
            )
            return Response({
                "message": "Certificate issued successfully.",
                "data": result
            }, status=status.HTTP_201_CREATED)
        except ValueError as ve:
            return Response({"message": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception("Certificate generation failed")
            return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# UPDATE / EDIT CERTIFICATE
# ==========================================
class UpdateCertificate(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    class InputSerializer(serializers.Serializer):
        certificate_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        register_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        student_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        course_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        issue_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
        whatsapp_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def put(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        target_id = data.get('certificate_id') or data.get('register_id')
        if not target_id:
            return Response({"message": "certificate_id or register_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = Certificate_services.update_certificate(
                certificate_id=target_id,
                student_name=data.get('student_name'),
                course_name=data.get('course_name'),
                issue_date=data.get('issue_date'),
                whatsapp_number=data.get('whatsapp_number')
            )
            return Response({
                "message": "Certificate updated successfully.",
                "data": result
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Failed to update certificate")
            return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# DOWNLOAD CERTIFICATE JPG FILE
# ==========================================
class DownloadCertificateJPG(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        register_id = request.GET.get('register_id') or request.GET.get('certificate_id') or request.GET.get('id')
        if not register_id:
            return Response({"message": "register_id parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure filename format
        filename = f"certificate_{register_id}.jpg"
        file_path = os.path.join(settings.MEDIA_ROOT, 'certificates', filename)

        if not os.path.exists(file_path):
            # Try finding by certificate_id or regenerating
            certs = Certificate_services.get_all_certificates()
            match = next((c for c in certs if c['register_id'] == register_id or c['certificate_id'] == register_id), None)
            if match:
                Certificate_services.generate_certificate_jpg(
                    student_name=match['student_name'],
                    course_name=match['course_name'],
                    issue_date_str=match['issue_date'],
                    register_id=match['register_id']
                )

        if os.path.exists(file_path):
            response = FileResponse(open(file_path, 'rb'), content_type='image/jpeg')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

        return Response({"message": "Certificate JPG file not found."}, status=status.HTTP_404_NOT_FOUND)

