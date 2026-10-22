from django.db import models
from django.contrib.auth.models import User
from .Department import Department
from .Designation import Designation


class Staff(models.Model):
    staff_id = models.AutoField(primary_key=True)
    staff_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_members')
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_members')
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_member', null=True, blank=True)
    status = models.CharField(max_length=20, default='Active')
    date_of_joining = models.DateField(null=True, blank=True)
    create_date = models.DateTimeField(auto_now_add=True)
    update_date = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'staff'

    def __str__(self):
        return f"{self.staff_name} ({self.department.department_name if self.department else 'No Dept'})"
