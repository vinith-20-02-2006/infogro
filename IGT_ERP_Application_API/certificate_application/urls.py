from django.urls import path
from . import views

urlpatterns = [
    path('list_certificates', views.ListCertificates.as_view(), name='list_certificates'),
    path('search_eligible_students', views.SearchEligibleStudents.as_view(), name='search_eligible_students'),
    path('generate_certificate', views.GenerateCertificate.as_view(), name='generate_certificate'),
    path('update_certificate', views.UpdateCertificate.as_view(), name='update_certificate'),
    path('download_certificate_jpg', views.DownloadCertificateJPG.as_view(), name='download_certificate_jpg'),
]

