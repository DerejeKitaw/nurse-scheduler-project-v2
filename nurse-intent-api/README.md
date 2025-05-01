# Nurse Intent API

This folder contains the backend for the Nurse Scheduling Assistant project. It's built with **FastAPI** and serves a machine learning model that can classify scheduling-related intents from natural language inputs.

## 🔧 Features
- Intent classification using a trained `intent_model.pkl`
- Shift type and role extraction using spaCy
- Date parsing using custom logic and `dateparser`
- API endpoint: `POST /predict`

## 🧠 Model
Trained with `scikit-learn`, using cleaned and augmented datasets.

## 🔍 Endpoint Example

**URL**: `/predict`  
**Method**: `POST`  
**Body**:
```json
{
  "message": "Can you schedule me for tomorrow morning?",
  "currentUserEmail": "nurse@example.com",
  "currentUserName": "Nurse A",
  "UserId": 1
}
🚀 Run Locally
--------------

```bash
uvicorn main:app --reload
```

📦 Required Files
-----------------

-   `main.py` -- FastAPI entry point

-   `intent_model.pkl` -- trained intent classifier

-   `requirements.txt` -- dependencies

-   `startup.txt` -- used for Azure deployment