
from django.db import models
from django.contrib.auth.models import User


class JobApplication(models.Model):
    STATUS_CHOICES = [
        ("Applied", "Applied"),
        ("Assessment", "Assessment"),
        ("Interview", "Interview"),
        ("Offer", "Offer"),
        ("Rejected", "Rejected"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="job_applications",
    )
    company = models.CharField(max_length=150)
    role = models.CharField(max_length=150)
    location = models.CharField(max_length=150, blank=True)
    job_url = models.URLField(blank=True)
    salary = models.CharField(max_length=100, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Applied",
    )
    applied_date = models.DateField()
    notes = models.TextField(blank=True)
    interview_date = models.DateTimeField(null=True, blank=True)
    interview_round = models.CharField(max_length=100, blank=True, default="")
    interview_link = models.URLField(blank=True, default="")
    interview_notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.company} - {self.role}"


class SavedJob(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="saved_jobs",
    )
    company = models.CharField(max_length=150)
    role = models.CharField(max_length=150)
    location = models.CharField(max_length=150, blank=True)
    job_url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    source = models.CharField(max_length=100, blank=True)
    saved_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.company} - {self.role}"


class UserProfile(models.Model):
    THEME_CHOICES = [
        ("dark", "Dark"),
        ("light", "Light"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    headline = models.CharField(max_length=120, blank=True, default="Job Seeker")
    target_role = models.CharField(max_length=120, blank=True, default="")
    target_salary = models.CharField(max_length=100, blank=True, default="")
    preferred_location = models.CharField(max_length=120, blank=True, default="Remote / Hybrid")
    theme_preference = models.CharField(max_length=10, choices=THEME_CHOICES, default="dark")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile of {self.user.username}"

