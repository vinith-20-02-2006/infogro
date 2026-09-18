from django.contrib import admin
from .models import Course, Enrollment, Certificate

admin.site.register(Course)
admin.site.register(Enrollment)
admin.site.register(Certificate)

