import logging
from rest_framework.views import APIView
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.decorators import authentication_classes, permission_classes
from ..services import user_services

logger = logging.getLogger('django')


@authentication_classes([])
@permission_classes([])
class CreateToken(APIView):
    class InputSerializer(serializers.Serializer):
        username = serializers.CharField()
        password = serializers.CharField(write_only=True)
        source = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        access, refresh, user_info = user_services.create_token(**serializer.validated_data)

        return Response({
            'access': access,
            'refresh': refresh,
            'user': user_info
        }, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([])
class GetCurrentUserProfile(APIView):
    def post(self, request):
        user = user_services.extract_request_user(request)
        if not user:
            user_id = request.data.get('user_id')
            if user_id:
                user_info = user_services.get_user_profile_data(user_id)
                if user_info:
                    return Response({'success': True, 'user': user_info}, status=status.HTTP_200_OK)
            return Response({'error': 'User not found or unauthenticated.'}, status=status.HTTP_401_UNAUTHORIZED)

        user_info = user_services.get_user_profile_data(user)
        return Response({'success': True, 'user': user_info}, status=status.HTTP_200_OK)

    def get(self, request):
        return self.post(request)


# =========================================================================
# DEPARTMENT & DESIGNATION VIEWS
# =========================================================================

@authentication_classes([])
@permission_classes([])
class DepartmentView(APIView):
    def get(self, request):
        departments = user_services.list_departments()
        return Response({'success': True, 'departments': departments}, status=status.HTTP_200_OK)

    def post(self, request):
        name = request.data.get('department_name')
        desc = request.data.get('description', '')
        dept = user_services.create_department(name, desc)
        return Response({'success': True, 'department': dept}, status=status.HTTP_201_CREATED)


@authentication_classes([])
@permission_classes([])
class DesignationView(APIView):
    def get(self, request):
        dept_id = request.query_params.get('department_id')
        designations = user_services.list_designations(dept_id)
        return Response({'success': True, 'designations': designations}, status=status.HTTP_200_OK)

    def post(self, request):
        name = request.data.get('designation_name')
        dept_id = request.data.get('department_id')
        desc = request.data.get('description', '')
        desig = user_services.create_designation(name, dept_id, desc)
        return Response({'success': True, 'designation': desig}, status=status.HTTP_201_CREATED)


# =========================================================================
# REGISTRATION PROCESS VIEWS: STAFF & STUDENT (PHASE 2)
# =========================================================================

@authentication_classes([])
@permission_classes([])
class RegisterStaffView(APIView):
    """
    Staff Registration endpoint.
    Collects: staff_name, professional email, password, department, designation, phone.
    Staff account is created and automatically appears in Users & Roles.
    """
    def post(self, request):
        try:
            result = user_services.register_staff(**request.data)
            return Response(result, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error registering staff: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@authentication_classes([])
@permission_classes([])
class RegisterStudentView(APIView):
    """
    Student Registration endpoint.
    Collects: student_name, register_id, email, password, course_id, whatsapp_number, student_photo.
    Student account is created and automatically appears in Users & Roles.
    """
    def post(self, request):
        try:
            result = user_services.register_student(**request.data)
            return Response(result, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error registering student: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# =========================================================================
# USERS & ROLES PAGE SUMMARY & LISTING (PHASE 4)
# =========================================================================

@authentication_classes([])
@permission_classes([])
class UserRolesSummaryView(APIView):
    """Returns dynamic counts for Admin, Staff, Sales, HR, Student, Total."""
    def get(self, request):
        try:
            summary = user_services.get_user_roles_summary()
            return Response({'success': True, 'summary': summary}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching roles summary: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@authentication_classes([])
@permission_classes([])
class ListAllUsersView(APIView):
    """
    Returns all registered users with search, role filtering, status filtering, and pagination.
    """
    def get(self, request):
        search = request.query_params.get('search', '')
        role = request.query_params.get('role', '')
        status_filter = request.query_params.get('status', '')
        user_type = request.query_params.get('user_type', '')
        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 10)

        try:
            result = user_services.list_all_users_extended(
                search=search,
                role=role,
                status=status_filter,
                user_type=user_type,
                page=page,
                page_size=page_size
            )
            return Response({'success': True, **result}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error listing users: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@authentication_classes([])
@permission_classes([])
class ToggleUserStatusView(APIView):
    """Locks or unlocks user account (toggles Active / Inactive)."""
    def post(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            result = user_services.toggle_user_status(user_id)
            return Response({'success': True, **result}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error toggling user status: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@authentication_classes([])
@permission_classes([])
class UpdateUserOverridePermissionsView(APIView):
    """Updates user-specific override permissions."""
    def post(self, request):
        user_id = request.data.get('user_id')
        custom_permissions = request.data.get('custom_permissions', {})
        if not user_id:
            return Response({'error': 'user_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            updated = user_services.update_user_override_permissions(user_id, custom_permissions)
            return Response({
                'success': True,
                'message': f"Custom permissions for '{updated['username']}' updated successfully.",
                'user': updated
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error updating user overrides: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# =========================================================================
# ROLE PERMISSION CONFIGURATION (PHASE 5 & 7)
# =========================================================================

@authentication_classes([])
@permission_classes([])
class RolePermissionsView(APIView):
    """
    GET: Retrieves saved permissions for a role, department, or designation.
         Query params: ?department_id=X&designation_id=Y or ?role=Technical
    POST: Saves updated permissions and synchronizes across users.
    """
    def get(self, request):
        role = request.query_params.get('role')
        dept_id = request.query_params.get('department_id')
        desig_id = request.query_params.get('designation_id')
        try:
            perms = user_services.get_role_permissions(
                role_name=role,
                department_id=dept_id,
                designation_id=desig_id
            )
            return Response({
                'success': True,
                'role': role,
                'department_id': dept_id,
                'designation_id': desig_id,
                'permissions': perms
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching role permissions: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        role = request.data.get('role')
        dept_id = request.data.get('department_id')
        desig_id = request.data.get('designation_id')
        permissions = request.data.get('permissions')
        if not permissions or (not role and not dept_id and not desig_id):
            return Response({
                'error': 'Permissions and either designation_id, department_id, or role are required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            saved_perms = user_services.save_role_permissions(
                role_name=role,
                permissions=permissions,
                department_id=dept_id,
                designation_id=desig_id
            )
            return Response({
                'success': True,
                'message': 'Permissions saved successfully and applied to active users.',
                'role': role,
                'department_id': dept_id,
                'designation_id': desig_id,
                'permissions': saved_perms
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error saving role permissions: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@authentication_classes([])
@permission_classes([])
class ResetRolePermissionsView(APIView):
    """Resets role permissions back to default reference values."""
    def post(self, request):
        role = request.data.get('role')
        dept_id = request.data.get('department_id')
        desig_id = request.data.get('designation_id')
        if not role and not dept_id and not desig_id:
            return Response({
                'error': 'Either designation_id, department_id, or role is required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            reset_perms = user_services.reset_role_permissions(
                role_name=role,
                department_id=dept_id,
                designation_id=desig_id
            )
            return Response({
                'success': True,
                'message': 'Permissions have been reset to system defaults.',
                'role': role,
                'department_id': dept_id,
                'designation_id': desig_id,
                'permissions': reset_perms
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error resetting role permissions: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)