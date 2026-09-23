from django.db import models
from django.contrib.auth.models import User
from .Course import Course


class Enrollment(models.Model):
    enrollment_id = models.BigAutoField(primary_key=True)
    register_id = models.CharField(max_length=50, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments', null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments', null=True, blank=True)
    student_name = models.CharField(max_length=255, null=True, blank=True)
    joining_date = models.DateField(null=True, blank=True)
    assignment_status = models.CharField(max_length=30, default='Incomplete')
    assessment_status = models.CharField(max_length=30, default='Incomplete')
    assignment_score = models.FloatField(null=True, blank=True)
    assessment_score = models.FloatField(null=True, blank=True)
    whatsapp_number = models.CharField(max_length=20, null=True, blank=True)
    create_date = models.DateTimeField(auto_now_add=True)
    update_date = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'enrollment'

    def __str__(self):
        return f"{self.register_id or self.enrollment_id} - {self.student_name}"

