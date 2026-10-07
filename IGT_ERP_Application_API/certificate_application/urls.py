from django.urls import path
from . import views

urlpatterns = [
    path('list_certificates', views.ListCertificates.as_view(), name='list_certificates'),
    path('search_eligible_students', views.SearchEligibleStudents.as_view(), name='search_eligible_students'),
    path('generate_certificate', views.GenerateCertificate.as_view(), name='generate_certificate'),
    path('update_certificate', views.UpdateCertificate.as_view(), name='update_certificate'),
    path('delete_certificate', views.DeleteCertificate.as_view(), name='delete_certificate'),
    path('download_certificate_jpg', views.DownloadCertificateJPG.as_view(), name='download_certificate_jpg'),
    path('render_certificate_image', views.RenderCertificateImage.as_view(), name='render_certificate_image'),
    path('auto_generate_certificates', views.AutoGenerateCertificates.as_view(), name='auto_generate_certificates'),
    path('get_auto_certificate_status', views.GetAutoCertificateStatus.as_view(), name='get_auto_certificate_status'),
    path('toggle_auto_certificate', views.ToggleAutoCertificate.as_view(), name='toggle_auto_certificate'),
    path('send_certificate_whatsapp', views.SendCertificateWhatsApp.as_view(), name='send_certificate_whatsapp'),
]


