from rest_framework import serializers
from .models import Candidate

class CandidateSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        ans = data.get("answers")
        # Ensure answers is always a list
        if isinstance(ans, str):
            try:
                import json
                parsed = json.loads(ans)
                if isinstance(parsed, list):
                    data["answers"] = parsed
                else:
                    data["answers"] = []
            except Exception:
                data["answers"] = []
        elif not isinstance(ans, list):
            data["answers"] = []
        return data

    class Meta:
        model = Candidate
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "resume",
            "score",
            "summary",
            "answers",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
