from django.db import connection


class Course_services:

    @staticmethod
    def Course_services(
        username,
        Course_name,
        Course_Fees,
        Course_Status
    ):

        with connection.cursor() as cursor:

            cursor.execute(
                "CALL sp_course_insert(%s, %s, %s)",
                [
                    Course_name,
                    Course_Fees,
                    Course_Status
                ]
            )

            columns = [
                column[0]
                for column in cursor.description
            ]

            row = cursor.fetchone()

            while cursor.nextset():
                pass

        if not row:
            return None

        return dict(
            zip(columns, row)
        )

    # ---------------------------------
    # GET COURSE BY ID
    # ---------------------------------

    @staticmethod
    def Get_Course_detail(Course_id):

        with connection.cursor() as cursor:

            cursor.execute(
                "CALL sp_course_get(%s)",
                [Course_id]
            )

            columns = [
                column[0]
                for column in cursor.description
            ]

            row = cursor.fetchone()

            while cursor.nextset():
                pass

        if not row:
            return None

        return dict(
            zip(columns, row)
        )

    # ---------------------------------
    # GET ALL COURSES
    # ---------------------------------

    @staticmethod
    def Fetch_course_detail():

        with connection.cursor() as cursor:

            cursor.execute(
                "CALL sp_course_get_all()"
            )

            columns = [
                column[0]
                for column in cursor.description
            ]

            rows = cursor.fetchall()

            while cursor.nextset():
                pass

        return [
            dict(zip(columns, row))
            for row in rows
        ]

    # ---------------------------------
    # UPDATE COURSE
    # ---------------------------------

    @staticmethod
    def Update_course_detail(
        Course_id,
        Course_name,
        Course_Fees,
        Course_Status
    ):

        with connection.cursor() as cursor:

            cursor.execute(
                """
                CALL sp_course_update(
                    %s,
                    %s,
                    %s,
                    %s
                )
                """,
                [
                    Course_id,
                    Course_name,
                    Course_Fees,
                    Course_Status
                ]
            )

            columns = [
                column[0]
                for column in cursor.description
            ]

            row = cursor.fetchone()

            while cursor.nextset():
                pass

        if not row:
            return None

        result = dict(zip(columns, row))

        # Notify certificate application to update and re-render certificate images for this course
        try:
            from certificate_application.services import Certificate_services
            Certificate_services.on_course_name_updated(Course_id, Course_name)
        except Exception:
            pass

        return result


    # ---------------------------------
    # DELETE COURSE
    # ---------------------------------

    @staticmethod
    def Delete_course_detail(Course_id):

        with connection.cursor() as cursor:

            cursor.execute(
                "CALL sp_course_delete(%s)",
                [Course_id]
            )

            row = cursor.fetchone()

            while cursor.nextset():
                pass

        if row and row[0] > 0:
            return "Course deleted successfully."

        return "Course not found."