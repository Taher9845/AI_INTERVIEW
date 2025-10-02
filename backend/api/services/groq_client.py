import os

def _get_client():
    try:
        from groq import Groq
    except ImportError as e:
        raise ImportError("groq SDK is not installed. Install via 'pip install groq'.") from e
    return Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_question(difficulty):
    """
    Ask Groq to generate one interview question based on difficulty.
    """
    prompt = f"Generate a {difficulty} full stack interview question (React/Node). Keep it concise and under 20 words. Return only the question, no explanations."
    
    client = _get_client()
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",   # ✅ updated model
        messages=[
            {"role": "system", "content": "You are an AI interviewer. Generate short, concise questions only."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=100,  # Limit response length
        temperature=0.7
    )
    return response.choices[0].message.content.strip()
