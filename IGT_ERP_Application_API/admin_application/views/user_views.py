import logging
from rest_framework.views import APIView
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.decorators import authentication_classes, permission_classes
from rest_framework import status
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
    """Fetches the latest profile and permissions for the current user."""
    def post(self, request):
        user = user_services.extract_request_user(request)
        if not user:
            user_id = request.data.get('user_id')
            if user_id:
                user = user_services.get_user_profile_data(user_id)
                if user:
                    return Response({'success': True, 'user': user}, status=status.HTTP_200_OK)
            return Response({'error': 'User not found or unauthenticated.'}, status=status.HTTP_401_UNAUTHORIZED)

        user_info = user_services.get_user_profile_data(user)
        return Response({'success': True, 'user': user_info}, status=status.HTTP_200_OK)

    def get(self, request):
        return self.post(request)


@authentication_classes([])
@permission_classes([])
class CreateUser(APIView):
    """
    Admin endpoint to dynamically create Technical, Sales / Staff, or Student accounts.
    Default permissions for newly created accounts is ['profile'] only.
    """
    class InputSerializer(serializers.Serializer):
        username = serializers.CharField(required=True)
        password = serializers.CharField(required=True, min_length=4)
        role = serializers.CharField(required=True)
        email = serializers.EmailField(required=False, allow_blank=True, default='')
        first_name = serializers.CharField(required=False, allow_blank=True, default='')
        last_name = serializers.CharField(required=False, allow_blank=True, default='')
        permissions = serializers.ListField(
            child=serializers.CharField(),
            required=False,
            default=None
        )

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            new_user = user_services.create_user(**serializer.validated_data)
            return Response({
                'success': True,
                'message': f"Account for '{new_user['username']}' with role '{new_user['role']}' created successfully.",
                'user': new_user
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@authentication_classes([])
@permission_classes([])
class ListUsers(APIView):
    """Returns list of all registered users with their roles and permissions."""
    def get(self, request):
        try:
            users = user_services.list_users()
            return Response({'success': True, 'users': users}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error listing users: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        return self.get(request)


@authentication_classes([])
@permission_classes([])
class UpdateUserPermissions(APIView):
    """
    Admin endpoint to enable/disable menus for a user.
    """
    class InputSerializer(serializers.Serializer):
        user_id = serializers.IntegerField(required=True)
        permissions = serializers.ListField(child=serializers.CharField(), required=True)

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated_user = user_services.update_user_permissions(
                user_id=serializer.validated_data['user_id'],
                permissions=serializer.validated_data['permissions']
            )
            return Response({
                'success': True,
                'message': f"Permissions for '{updated_user['username']}' updated successfully.",
                'user': updated_user
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error updating permissions: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)