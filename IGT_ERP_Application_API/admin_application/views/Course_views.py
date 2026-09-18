import logging

from rest_framework.views import APIView
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework import status

from ..services.Course_services import Course_services


logger = logging.getLogger('django')


# ==========================================
# CREATE COURSE
# ==========================================

class CreateCourse(APIView):

    class InputSerializer(serializers.Serializer):

        Course_name = serializers.CharField(
            required=True,
            max_length=255
        )

        Course_Fees = serializers.FloatField(
            required=True,
            min_value=0
        )

        Course_Status = serializers.CharField(
            required=True,
            max_length=30
        )

        def validate_Course_name(self, value):

            value = value.strip()

            if not value:
                raise serializers.ValidationError(
                    "Course name is required."
                )

            return value

    def post(self, request):

        serializer = self.InputSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:

            result = Course_services.Course_services(
                request.user.username,
                **serializer.validated_data
            )

            return Response(
                {
                    "message": "Course created successfully.",
                    "data": result
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:

            logger.exception(
                "Course creation failed"
            )

            return Response(
                {
                    "message": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )


# ==========================================
# GET COURSE
# ==========================================

class GetCourseDetail(APIView):

    class InputSerializer(serializers.Serializer):

        Course_id = serializers.IntegerField(
            required=True
        )

    def post(self, request):

        serializer = self.InputSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        result = Course_services.Get_Course_detail(
            serializer.validated_data['Course_id']
        )

        if not result:

            return Response(
                {
                    "message": "Course not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            result,
            status=status.HTTP_200_OK
        )


# ==========================================
# GET ALL COURSES
# ==========================================

class FetchCourseDetail(APIView):

    def post(self, request):

        result = Course_services.Fetch_course_detail()

        return Response(
            result,
            status=status.HTTP_200_OK
        )


# ==========================================
# UPDATE COURSE
# ==========================================

class UpdateCourseDetail(APIView):

    class InputSerializer(serializers.Serializer):

        Course_id = serializers.IntegerField(
            required=True
        )

        Course_name = serializers.CharField(
            required=True,
            max_length=255
        )

        Course_Fees = serializers.FloatField(
            required=True,
            min_value=0
        )

        Course_Status = serializers.CharField(
            required=True,
            max_length=30
        )

        def validate_Course_name(self, value):

            value = value.strip()

            if not value:

                raise serializers.ValidationError(
                    "Course name is required."
                )

            return value

    def post(self, request):

        serializer = self.InputSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:

            result = Course_services.Update_course_detail(
                **serializer.validated_data
            )

            if not result:

                return Response(
                    {
                        "message": "Course not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            return Response(
                {
                    "message": "Course updated successfully.",
                    "data": result
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:

            logger.exception(
                "Course update failed"
            )

            return Response(
                {
                    "message": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )


# ==========================================
# DELETE COURSE
# ==========================================

class DeleteCourseDetail(APIView):

    class InputSerializer(serializers.Serializer):

        Course_id = serializers.IntegerField(
            required=True
        )

    def post(self, request):

        serializer = self.InputSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:

            result = Course_services.Delete_course_detail(
                serializer.validated_data['Course_id']
            )

            return Response(
                {
                    "message": result
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:

            logger.exception(
                "Course deletion failed"
            )

            return Response(
                {
                    "message": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )