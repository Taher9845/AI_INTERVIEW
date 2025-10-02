from django.urls import path
from . import views
from .views import (
    QuestionsView,
    submit_answers,
    ResumeUploadView,
    CandidatesListView,
    CandidateDetailView,
    CandidateDeleteView,
)

urlpatterns = [
    path("resume-upload/", ResumeUploadView.as_view(), name="resume-upload"),
    path("questions/", QuestionsView.as_view(), name="questions"),
    path("submit-answers/", submit_answers, name="submit-answers"),
    path("generate-questions/", views.generate_questions, name="generate_questions"),
    path("candidates/", CandidatesListView.as_view(), name="candidates"),
    path("candidates/<int:pk>/", CandidateDetailView.as_view(), name="candidate-detail"),
    path("candidates/<int:pk>/delete/", CandidateDeleteView.as_view(), name="candidate-delete"),
]

