from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import CandidateSerializer
from .models import Candidate
from .utils import extract_text_from_pdf, extract_text_from_docx, extract_fields_from_text
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.parsers import JSONParser
from rest_framework.generics import ListAPIView, RetrieveAPIView, DestroyAPIView
from .services.groq_client import generate_question
import logging

logger = logging.getLogger(__name__)


class ResumeUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        file = request.FILES.get("resume")
        if not file:
            return Response(
                {"error": "No file uploaded"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Enforce file size limit (10 MB)
        max_bytes = 10 * 1024 * 1024
        if getattr(file, 'size', 0) and file.size > max_bytes:
            return Response(
                {"error": "File too large. Maximum size is 10MB."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file type
        allowed_extensions = ['.pdf', '.docx']
        file_ext = file.name.lower().split('.')[-1]
        if f'.{file_ext}' not in allowed_extensions:
            return Response(
                {"error": "Unsupported file type. Only PDF and DOCX allowed."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Extract text directly from file object (no temp save needed)
            if file.name.endswith(".pdf"):
                text = extract_text_from_pdf(file)
            elif file.name.endswith(".docx"):
                text = extract_text_from_docx(file)
            else:
                return Response(
                    {"error": "Unsupported file type"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Extract fields using utils
            parsed = extract_fields_from_text(text)

            return Response({
                "filename": file.name,
                "parsed_fields": parsed
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Resume parsing error: {str(e)}")
            return Response(
                {"error": "Failed to parse resume. Please try another file."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class QuestionsView(APIView):
    """Returns static fallback questions if groq_client is unavailable"""
    def get(self, request):
        questions = [
            {"text": "Explain React hooks and their benefits.", "difficulty": "Easy", "time": 20},
            {"text": "What is Redux and when would you use it?", "difficulty": "Easy", "time": 20},
            {"text": "Explain the Virtual DOM and reconciliation.", "difficulty": "Medium", "time": 60},
            {"text": "How do you optimize React performance?", "difficulty": "Medium", "time": 60},
            {"text": "Implement a dynamic form with validation in React.", "difficulty": "Hard", "time": 120},
            {"text": "How would you architect a scalable full-stack application?", "difficulty": "Hard", "time": 120},
        ]
        return Response(questions, status=status.HTTP_200_OK)


@api_view(['POST'])
def submit_answers(request):
    """
    Receives candidate info and answers, calculates score, and returns summary
    """
    try:
        data = request.data
        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        phone = data.get("phone", "").strip()
        resume = data.get("resume", None)  # may be a filename string in this flow
        answers = data.get("answers", [])

        # Validation
        if not name or not email or not phone:
            return Response(
                {"error": "Name, email, and phone are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if not answers:
            return Response(
                {"error": "No answers provided"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Weighted scoring by difficulty
        weights = {"Easy": 1, "Medium": 2, "Hard": 3}
        max_points = 2 * (weights["Easy"] + weights["Medium"] + weights["Hard"])  # 12
        raw = 0
        
        attended_count = 0
        for ans in answers:
            diff = ans.get("difficulty", "Easy")
            user_answer = (ans.get("answer") or "").strip()
            attended = ans.get("attended", False)
            
            if attended and user_answer:
                raw += weights.get(diff, 1)
                attended_count += 1
        
        score = int(round((raw / max_points) * 100)) if max_points > 0 else 0

        # Generate summary
        total_questions = len(answers)
        skipped = total_questions - attended_count
        
        summary = (
            f"{name} completed the interview with {attended_count}/{total_questions} questions answered. "
            f"Weighted score: {score}/100. "
        )
        
        if skipped > 0:
            summary += f"{skipped} question(s) were skipped or timed out."

        # Append resume filename context if provided as a simple string
        if isinstance(resume, str) and resume.strip():
            summary += f" Resume file: {resume.strip()}."

        # Save to database
        candidate = Candidate.objects.create(
            name=name,
            email=email,
            phone=phone,
            # In this simplified flow, we only persist the filename in summary. The actual file is not saved.
            score=score,
            summary=summary,
            answers=answers
        )

        return Response({
            "score": score,
            "summary": summary,
            "id": candidate.id,
            "attended": attended_count,
            "total": total_questions
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error submitting answers: {str(e)}")
        return Response(
            {"error": "Failed to submit answers. Please try again."}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class CandidatesListView(ListAPIView):
    # Order by score desc, then id desc for recency without relying on created_at column
    queryset = Candidate.objects.all().order_by('-score', '-id')
    serializer_class = CandidateSerializer


class CandidateDetailView(RetrieveAPIView):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer


class CandidateDeleteView(DestroyAPIView):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer


def generate_questions(request):
    """Generate AI questions using Groq or fallback to static questions"""
    difficulties = ["easy", "easy", "medium", "medium", "hard", "hard"]
    time_map = {"easy": 20, "medium": 60, "hard": 120}
    result = []
    
    for d in difficulties:
        try:
            q_text = generate_question(d)
        except Exception as e:
            logger.warning(f"Groq API failed for {d}: {str(e)}. Using fallback.")
            # Fallback questions
            fallbacks = {
                "easy": [
                    "What are React components and how do they work?",
                    "Explain the difference between state and props in React."
                ],
                "medium": [
                    "How does React's useEffect hook work?",
                    "Explain the concept of lifting state up in React."
                ],
                "hard": [
                    "Design a custom hook for data fetching with caching.",
                    "Explain React's reconciliation algorithm and fiber architecture."
                ]
            }
            import random
            q_text = random.choice(fallbacks.get(d, ["Explain React state management."]))
        
        result.append({
            "text": q_text,
            "difficulty": d.title(),
            "time": time_map.get(d, 30),
        })
    
    return JsonResponse({"questions": result})