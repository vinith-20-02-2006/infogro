import io
import os
import logging
from django.conf import settings
from django.http import HttpResponse
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from ..services.Certificate_services import Certificate_services

logger = logging.getLogger('django')


# ==========================================
# CHECK ELIGIBILITY
# ==========================================
class CheckEligibility(APIView):
    class InputSerializer(serializers.Serializer):
        course_id = serializers.IntegerField(required=True)
        user_id = serializers.IntegerField(required=False)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data.get('user_id') or (request.user.id if request.user and request.user.is_authenticated else None)
        if not user_id:
            return Response({"message": "User ID is required or user must be authenticated."}, status=status.HTTP_400_BAD_REQUEST)

        course_id = serializer.validated_data['course_id']
        result = Certificate_services.check_eligibility(user_id, course_id)
        return Response(result, status=status.HTTP_200_OK)


# ==========================================
# GENERATE CERTIFICATE
# ==========================================
class GenerateCertificate(APIView):
    class InputSerializer(serializers.Serializer):
        course_id = serializers.IntegerField(required=True)
        user_id = serializers.IntegerField(required=False)
        student_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data.get('user_id') or (request.user.id if request.user and request.user.is_authenticated else None)
        if not user_id:
            return Response({"message": "User ID is required or user must be authenticated."}, status=status.HTTP_400_BAD_REQUEST)

        course_id = serializer.validated_data['course_id']
        student_name = serializer.validated_data.get('student_name')

        try:
            result = Certificate_services.generate_certificate(user_id, course_id, student_name=student_name)
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
# GET STUDENT CERTIFICATES
# ==========================================
class GetStudentCertificates(APIView):
    class InputSerializer(serializers.Serializer):
        user_id = serializers.IntegerField(required=False)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data.get('user_id') or (request.user.id if request.user and request.user.is_authenticated else None)
        if not user_id:
            return Response({"message": "User ID is required or user must be authenticated."}, status=status.HTTP_400_BAD_REQUEST)

        result = Certificate_services.get_student_certificates(user_id)
        return Response(result, status=status.HTTP_200_OK)


# ==========================================
# VERIFY CERTIFICATE
# ==========================================
class VerifyCertificate(APIView):
    class InputSerializer(serializers.Serializer):
        identifier = serializers.CharField(required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data['identifier']
        result = Certificate_services.verify_certificate(identifier)

        if not result:
            return Response({
                "valid": False,
                "message": "Certificate Not Found / Invalid Certificate"
            }, status=status.HTTP_404_NOT_FOUND)

        return Response(result, status=status.HTTP_200_OK)


# ==========================================
# DOWNLOAD CERTIFICATE PDF (CLEAN & ALIGNED WITHOUT LINES OR VERIFY URL)
# ==========================================
class DownloadCertificatePDF(APIView):
    def get(self, request):
        certificate_id = request.GET.get('certificate_id') or request.GET.get('id')
        if not certificate_id:
            return Response({"message": "certificate_id parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        cert_data = Certificate_services.get_certificate_detail(certificate_id)
        if not cert_data:
            return Response({"message": "Certificate not found."}, status=status.HTTP_404_NOT_FOUND)

        req_student_name = request.GET.get('student_name')
        student_name = req_student_name or cert_data.get('student_name')
        if not student_name or not str(student_name).strip():
            first_name = cert_data.get('first_name', '')
            last_name = cert_data.get('last_name', '')
            student_name = f"{first_name} {last_name}".strip() or cert_data.get('username', 'Student')
        else:
            student_name = str(student_name).strip()
            if req_student_name and cert_data.get('certificate_id'):
                from ..models.Certificate import Certificate
                Certificate.objects.filter(certificate_id=cert_data['certificate_id']).update(student_name=student_name)

        course_name = cert_data.get('Course_name', 'Course')
        cert_id = cert_data.get('certificate_id')
        issue_date = str(cert_data.get('issue_date'))[:10] if cert_data.get('issue_date') else 'N/A'

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(letter),
            rightMargin=0.4 * inch,
            leftMargin=0.4 * inch,
            topMargin=0.4 * inch,
            bottomMargin=0.4 * inch
        )

        elements = []
        styles = getSampleStyleSheet()

        # IGT Brand Colors
        NAVY_COLOR = colors.HexColor('#0F4C81')
        GOLD_COLOR = colors.HexColor('#F5B000')
        ORANGE_COLOR = colors.HexColor('#E65100')
        GRAY_TEXT = colors.HexColor('#4A5568')

        # IGT Logo
        logo_path = os.path.join(settings.BASE_DIR, 'igt_logo.png')
        if os.path.exists(logo_path):
            img = Image(logo_path, width=1.3 * inch, height=1.3 * inch)
            img.hAlign = 'CENTER'
            elements.append(img)
            elements.append(Spacer(1, 10))
        else:
            elements.append(Spacer(1, 15))

        # Typography & Styles with Explicit Leading to Prevent Text Overlaps
        cert_title_style = ParagraphStyle(
            'IGTCertTitle',
            parent=styles['Title'],
            fontName='Helvetica-Bold',
            fontSize=34,
            leading=40,
            textColor=NAVY_COLOR,
            alignment=1,
            spaceAfter=6
        )

        cert_subtitle_style = ParagraphStyle(
            'IGTCertSubTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=GOLD_COLOR,
            alignment=1,
            spaceAfter=25
        )

        presented_to_style = ParagraphStyle(
            'IGTPresentedTo',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=15,
            textColor=ORANGE_COLOR,
            alignment=1,
            spaceAfter=15
        )

        name_style = ParagraphStyle(
            'IGTCertName',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=30,
            leading=36,
            textColor=NAVY_COLOR,
            alignment=1,
            spaceAfter=20
        )

        award_text_style = ParagraphStyle(
            'IGTAwardText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=11,
            leading=15,
            textColor=GRAY_TEXT,
            alignment=1,
            spaceAfter=8
        )

        course_style = ParagraphStyle(
            'IGTCourseTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=24,
            textColor=NAVY_COLOR,
            alignment=1,
            spaceAfter=35
        )

        sig_label_style = ParagraphStyle(
            'IGTSigLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=14,
            textColor=NAVY_COLOR,
            alignment=1
        )

        footer_meta_style = ParagraphStyle(
            'IGTFooterMeta',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#718096'),
            alignment=1
        )

        # Flowables Assembly (Lines and Verification URL Removed)
        elements.append(Paragraph("Certificate", cert_title_style))
        elements.append(Paragraph("TRAINING COMPLETION", cert_subtitle_style))
        elements.append(Spacer(1, 10))

        elements.append(Paragraph("THIS CERTIFICATE IS PROUDLY PRESENTED TO:", presented_to_style))
        elements.append(Paragraph(student_name, name_style))
        elements.append(Spacer(1, 5))

        elements.append(Paragraph("Awarded upon successful completion of training programs, workshops, and assessment for", award_text_style))
        elements.append(Paragraph(f"<b>{course_name}</b>", course_style))
        elements.append(Spacer(1, 15))

        # Signatures & Date Table
        sig_data = [
            [
                Paragraph(". . . . . . . . . . . . . . . . . . . . . . . . . . .<br/><b>Authorized Signature</b>", sig_label_style),
                Paragraph(f". . . . . . . . . . . . . . . . . . . . . . . . . . .<br/><b>Date: {issue_date}</b>", sig_label_style)
            ]
        ]
        sig_table = Table(sig_data, colWidths=[3.5 * inch, 3.5 * inch])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(sig_table)
        elements.append(Spacer(1, 20))

        # Clean Footer with Certificate ID Only (Verification URL Removed)
        footer_text = f"Certificate ID: <b>{cert_id}</b>"
        elements.append(Paragraph(footer_text, footer_meta_style))

        doc.build(elements)
        buffer.seek(0)

        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Certificate_{cert_id}.pdf"'
        return response
