from datetime import datetime, timedelta
from typing import Optional
import re

import joblib
import spacy
from dateparser.search import search_dates
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# load once
nlp = spacy.load("en_core_web_sm")
intent_model = joblib.load("intent_model.pkl")

WEEKDAY_WORDS = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}

MONTH_WORDS = {
    "january","february","march","april","may","june",
    "july","august","september","october","november","december",
}

class PredictRequest(BaseModel):
    message: str
    currentUserEmail: str
    currentUserName: str
    UserId: int

class PredictResponse(BaseModel):
    intent: str
    ShiftStartDate: Optional[str] = None
    ShiftType: Optional[str] = None
    Role: Optional[str] = None
    raw_date_phrase: Optional[str] = None
    currentUserEmail: str
    currentUserName: str
    UserId: int

def get_weekday_date(base: datetime, weekday_name: str, which: str) -> datetime:
    """Return the date of 'this' or 'next' weekday_name."""
    target_idx = WEEKDAY_WORDS[weekday_name]
    today_idx = base.weekday()
    if which == "this":
        days_ahead = (target_idx - today_idx) % 7
    else:  # "next"
        days_ahead = ((target_idx - today_idx) % 7) or 7
    return base + timedelta(days=days_ahead)

def contains_explicit_date_word(text: str) -> bool:
    t = text.lower()
    return (
        "today" in t
        or "tomorrow" in t
        or any(m in t for m in MONTH_WORDS)
        or any(d in t for d in WEEKDAY_WORDS)
    )

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    message = req.message.strip()
    m_lower = message.lower()

    # 1) intent classification
    intent = intent_model.predict([m_lower])[0]

    # 2) default slots
    shift_type: Optional[str] = None
    role: Optional[str] = None
    parsed_date: Optional[datetime] = None
    raw_date_phrase: Optional[str] = None

    # 3) extract shift type & role
    for tok in nlp(message):
        t = tok.text.lower()
        if t in {"morning","afternoon","evening","night"}:
            shift_type = t.capitalize()
        if t in {"nurse","supervisor","rn"}:
            role = t.upper()

    # 4) correct intent if user just said "today"/"tomorrow"
    if intent == "unknown" and ("today" in m_lower or "tomorrow" in m_lower):
        intent = "schedule_shift"

    # 5) FIRST: look for explicit "this <weekday>" or "next <weekday>"
    m = re.search(r"\b(this|next)\s+(" + "|".join(WEEKDAY_WORDS.keys()) + r")\b", m_lower)
    if m:
        which, day = m.group(1), m.group(2)
        parsed_date = get_weekday_date(datetime.now(), day, which)
    # 6) else built-in today/tomorrow
    elif "today" in m_lower:
        parsed_date = datetime.now()
    elif "tomorrow" in m_lower:
        parsed_date = datetime.now() + timedelta(days=1)
    # 7) else run fallback search_dates if we see any month or weekday words
    elif contains_explicit_date_word(m_lower):
        result = search_dates(message, settings={"PREFER_DATES_FROM": "future"})
        if result:
            keyword, dt = result[0]
            kw = keyword.lower()
            # guard false positives
            has_digit = any(c.isdigit() for c in kw)
            has_month_or_week = (
                any(m in kw for m in MONTH_WORDS) or any(d in kw for d in WEEKDAY_WORDS)
            )
            if not has_digit and not has_month_or_week:
                # not a real date phrase
                kw = ""
                dt = None

            if kw in WEEKDAY_WORDS and dt:
                # needs explicit this/next if just "monday"
                if f"this {kw}" in m_lower or f"next {kw}" in m_lower:
                    parsed_date = dt
                else:
                    raw_date_phrase = kw
            elif dt:
                parsed_date = dt
    # 8) handle specific date formats like "May 2", "2nd May", "May 2nd, 2025"
    if not parsed_date:
        date_patterns = [
            r"\b(\d{1,2})(?:st|nd|rd|th)?\s+(may)\b",
            r"\b(may)\s+(\d{1,2})(?:st|nd|rd|th)?\b",
            r"\b(may)\s+(\d{1,2})(?:st|nd|rd|th)?,\s+(\d{4})\b"
        ]
        for pattern in date_patterns:
            match = re.search(pattern, m_lower)
            if match:
                day = match.group(1) if match.group(1).isdigit() else match.group(2)
                month = match.group(2) if match.group(1).isdigit() else match.group(1)
                year = match.group(3) if len(match.groups()) == 3 else datetime.now().year
                parsed_date = datetime(year=int(year), month=5, day=int(day))
                break

    # build ISO or leave None
    iso_date = parsed_date.isoformat() if parsed_date else None

    return PredictResponse(
        intent=intent,
        ShiftStartDate=iso_date,
        ShiftType=shift_type,
        Role=role,
        raw_date_phrase=raw_date_phrase,
        currentUserEmail=req.currentUserEmail,
        currentUserName=req.currentUserName,
        UserId=req.UserId,
    )
