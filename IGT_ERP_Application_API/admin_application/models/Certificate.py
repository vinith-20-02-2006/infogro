from django.db import models
from django.contrib.auth.models import User
from .Course import Course


class Certificate(models.Model):
    certificate_id = models.CharField(max_length=50, primary_key=True)
    verification_token = models.CharField(max_length=100, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certificates')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='certificates')
    student_name = models.CharField(max_length=255, null=True, blank=True)
    issue_date = models.DateTimeField(auto_now_add=True)
    certificate_status = models.CharField(max_length=30, default='Active')
    create_date = models.DateTimeField(auto_now_add=True)
    update_date = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'certificate'

    def __str__(self):
        return f"{self.certificate_id} - {self.user.username} ({self.course.Course_name})"
