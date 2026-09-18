from django.db import models
from datetime import datetime

from django.db import models


class Course(models.Model):

    Course_id = models.BigAutoField(
        primary_key=True
    )

    Course_name = models.CharField(
        max_length=255,
        unique=True
    )

    Course_Fees = models.FloatField(
        null=True,
        blank=True
    )

    Course_Status = models.CharField(
        max_length=30,
        default='Active'
    )

    Create_date = models.DateTimeField(
        auto_now_add=True
    )

    Update_date = models.DateTimeField(
        auto_now=True
    )

  

    def __str__(self):
        return self.Course_name