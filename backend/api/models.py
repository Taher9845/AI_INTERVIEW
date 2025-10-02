from django.db import models

class Candidate(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    resume = models.FileField(upload_to="resumes/", blank=True, null=True)
    score = models.IntegerField(default=0)
    summary = models.TextField(blank=True, null=True)
    answers = models.JSONField(default=list)  # Stores [{question, answer}]

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name or "Candidate"