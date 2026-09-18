from django.urls import path
from .views import user_views, Course_views, Certificate_views
from rest_framework import routers
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

router = routers.DefaultRouter()
urlpatterns = router.urls
urlpatterns += [
    path('token', user_views.CreateToken.as_view(), name='token_obtain_pair'),
    # course
    path('course_create', Course_views.CreateCourse.as_view(), name='course_create'),
    path('get_course_datail', Course_views.GetCourseDetail.as_view(), name='get_course_datail'),
    path('fetch_course_datail', Course_views.FetchCourseDetail.as_view(), name='fetch_course_datail'),
    path('update_course_datail', Course_views.UpdateCourseDetail.as_view(), name='update_course_datail'),
    path('delete_course_datail', Course_views.DeleteCourseDetail.as_view(), name='delete_course_datail'),

    # certificate
    path('check_certificate_eligibility', Certificate_views.CheckEligibility.as_view(), name='check_certificate_eligibility'),
    path('generate_certificate', Certificate_views.GenerateCertificate.as_view(), name='generate_certificate'),
    path('get_student_certificates', Certificate_views.GetStudentCertificates.as_view(), name='get_student_certificates'),
    path('verify_certificate', Certificate_views.VerifyCertificate.as_view(), name='verify_certificate'),
    path('download_certificate_pdf', Certificate_views.DownloadCertificatePDF.as_view(), name='download_certificate_pdf'),
]

 