from django.urls import path
from .views import user_views, Course_views, Certificate_views
from rest_framework import routers

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
    path('list_certificates', Certificate_views.ListCertificates.as_view(), name='list_certificates'),
    path('search_eligible_students', Certificate_views.SearchEligibleStudents.as_view(), name='search_eligible_students'),
    path('generate_certificate', Certificate_views.GenerateCertificate.as_view(), name='generate_certificate'),
    path('update_certificate', Certificate_views.UpdateCertificate.as_view(), name='update_certificate'),
    path('download_certificate_jpg', Certificate_views.DownloadCertificateJPG.as_view(), name='download_certificate_jpg'),
    path('verify_certificate', Certificate_views.VerifyCertificate.as_view(), name='verify_certificate'),
]