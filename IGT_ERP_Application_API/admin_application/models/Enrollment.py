from django.db import models
from django.contrib.auth.models import User
from .Course import Course


class Enrollment(models.Model):
    enrollment_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    assignment_status = models.CharField(max_length=30, default='Incomplete')
    assessment_status = models.CharField(max_length=30, default='Incomplete')
    create_date = models.DateTimeField(auto_now_add=True)
    update_date = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'enrollment'

    def __str__(self):
        return f"{self.user.username} - {self.course.Course_name}"
