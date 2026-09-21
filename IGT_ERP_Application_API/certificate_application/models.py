from django.db import models
from django.contrib.auth.models import User
from admin_application.models.Course import Course


class Certificate(models.Model):
    certificate_id = models.CharField(max_length=50, primary_key=True)
    verification_token = models.CharField(max_length=100, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='app_certificates', null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='app_certificates', null=True, blank=True)
    register_id = models.CharField(max_length=50, null=True, blank=True)
    student_name = models.CharField(max_length=255, null=True, blank=True)
    course_name = models.CharField(max_length=255, null=True, blank=True)
    joining_date = models.DateField(null=True, blank=True)
    issue_date = models.DateField(null=True, blank=True)
    assignment_status = models.CharField(max_length=50, default='Completed')
    assessment_status = models.CharField(max_length=50, default='Completed')
    assignment_score = models.FloatField(null=True, blank=True)
    assessment_score = models.FloatField(null=True, blank=True)
    certificate_image = models.CharField(max_length=500, null=True, blank=True)
    certificate_status = models.CharField(max_length=30, default='Active')
    create_date = models.DateTimeField(auto_now_add=True)
    update_date = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'certificate'

    def get_effective_course_name(self):
        """Dynamically fetch the latest course name from the related Course model if available."""
        if self.course and self.course.Course_name:
            return self.course.Course_name
        return self.course_name or "Course"

    def __str__(self):
        return f"{self.certificate_id} - {self.student_name} ({self.get_effective_course_name()})"
