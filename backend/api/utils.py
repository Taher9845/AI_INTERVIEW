import re
from io import BytesIO

EMAIL_REGEX = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
PHONE_REGEX = r"(\+?\d{1,3}[-.\s]?)?(\d{10}|\d{3}[-.\s]\d{3}[-.\s]\d{4})"

def extract_text_from_pdf(file_obj):
    try:
        import fitz  # PyMuPDF
    except ImportError as e:
        raise ImportError("PyMuPDF is required for PDF parsing. Install via 'pip install PyMuPDF'.") from e
    doc = fitz.open(stream=file_obj.read(), filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def extract_text_from_docx(file_obj):
    try:
        from docx import Document  # python-docx
    except ImportError as e:
        raise ImportError("python-docx is required for DOCX parsing. Install via 'pip install python-docx'.") from e
    file_obj.seek(0)
    doc = Document(BytesIO(file_obj.read()))
    text = "\n".join([p.text for p in doc.paragraphs])
    return text

def extract_fields_from_text(text):
    text = text.replace("\n", " \n ")
    email_match = re.search(EMAIL_REGEX, text)
    phone_match = re.search(PHONE_REGEX, text)
    name = None
    name_match = re.search(r"Name[:\s\-]+([A-Z][a-z]+\s?[A-Z]?[a-z]+(?:\s[A-Z][a-z]+)?)", text)
    if name_match:
        name = name_match.group(1).strip()
    else:
        if email_match:
            before = text[: email_match.start()]
            lines = [ln.strip() for ln in before.splitlines() if ln.strip()]
            if lines:
                name = lines[0]
    phone = None
    if phone_match:
        raw = phone_match.group(0)
        digits = re.sub(r"[^\d+]", "", raw)
        # Normalize: ensure leading + if country code provided; else return digits
        if digits.startswith("+"):
            phone = digits
        elif len(digits) == 10:
            phone = digits
        else:
            phone = digits
    return {
        "name": name,
        "email": email_match.group(0) if email_match else None,
        "phone": phone,
    }
