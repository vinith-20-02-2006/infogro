from django.urls import path
from .views import user_views, Course_views
from certificate_application import views as Certificate_views
from rest_framework import routers

router = routers.DefaultRouter()
urlpatterns = router.urls
urlpatterns += [
    # Auth & Profile
    path('token', user_views.CreateToken.as_view(), name='token_obtain_pair'),
    path('get_user_profile', user_views.GetCurrentUserProfile.as_view(), name='get_user_profile'),

    # Users & Roles Management (Phase 2, 4, 5, 7, 8)
    path('user_roles_summary', user_views.UserRolesSummaryView.as_view(), name='user_roles_summary'),
    path('list_all_users', user_views.ListAllUsersView.as_view(), name='list_all_users'),
    path('list_users', user_views.ListAllUsersView.as_view(), name='list_users'),  # Legacy alias
    path('toggle_user_status', user_views.ToggleUserStatusView.as_view(), name='toggle_user_status'),
    path('role_permissions', user_views.RolePermissionsView.as_view(), name='role_permissions'),
    path('reset_role_permissions', user_views.ResetRolePermissionsView.as_view(), name='reset_role_permissions'),
    path('update_user_override_permissions', user_views.UpdateUserOverridePermissionsView.as_view(), name='update_user_override_permissions'),
    path('update_user_permissions', user_views.UpdateUserOverridePermissionsView.as_view(), name='update_user_permissions'),  # Legacy alias

    # Staff & Student Registration Processes (Phase 2)
    path('staff/register', user_views.RegisterStaffView.as_view(), name='register_staff'),
    path('student/register', user_views.RegisterStudentView.as_view(), name='register_student'),

    # Department & Designation Management (Phase 3)
    path('departments', user_views.DepartmentView.as_view(), name='departments'),
    path('designations', user_views.DesignationView.as_view(), name='designations'),

    # Course
    path('course_create', Course_views.CreateCourse.as_view(), name='course_create'),
    path('get_course_datail', Course_views.GetCourseDetail.as_view(), name='get_course_datail'),
    path('fetch_course_datail', Course_views.FetchCourseDetail.as_view(), name='fetch_course_datail'),
    path('update_course_datail', Course_views.UpdateCourseDetail.as_view(), name='update_course_datail'),
    path('delete_course_datail', Course_views.DeleteCourseDetail.as_view(), name='delete_course_datail'),

    # Certificate
    path('list_certificates', Certificate_views.ListCertificates.as_view(), name='list_certificates'),
    path('search_eligible_students', Certificate_views.SearchEligibleStudents.as_view(), name='search_eligible_students'),
    path('generate_certificate', Certificate_views.GenerateCertificate.as_view(), name='generate_certificate'),
    path('update_certificate', Certificate_views.UpdateCertificate.as_view(), name='update_certificate'),
    path('delete_certificate', Certificate_views.DeleteCertificate.as_view(), name='delete_certificate'),
    path('download_certificate_jpg', Certificate_views.DownloadCertificateJPG.as_view(), name='download_certificate_jpg'),
    path('render_certificate_image', Certificate_views.RenderCertificateImage.as_view(), name='render_certificate_image'),
    path('auto_generate_certificates', Certificate_views.AutoGenerateCertificates.as_view(), name='auto_generate_certificates'),
    path('get_auto_certificate_status', Certificate_views.GetAutoCertificateStatus.as_view(), name='get_auto_certificate_status'),
    path('toggle_auto_certificate', Certificate_views.ToggleAutoCertificate.as_view(), name='toggle_auto_certificate'),
    path('send_certificate_whatsapp', Certificate_views.SendCertificateWhatsApp.as_view(), name='send_certificate_whatsapp'),
]