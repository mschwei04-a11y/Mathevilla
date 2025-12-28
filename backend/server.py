from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import csv
import io
import random
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'mathevilla_secret')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', 1440))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(title="MatheVilla API")
api_router = APIRouter(prefix="/api")

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ================== MODELS ==================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "student"  # student or admin
    grade: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    grade: Optional[int] = None
    xp: int = 0
    level: int = 1
    badges: List[str] = []
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TaskCreate(BaseModel):
    grade: int
    topic: str
    question: str
    task_type: str  # multiple_choice, free_text
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str
    xp_reward: int = 10
    difficulty: str = "mittel"  # leicht, mittel, schwer

class TaskResponse(BaseModel):
    id: str
    grade: int
    topic: str
    question: str
    task_type: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str
    xp_reward: int
    difficulty: str

class AnswerSubmit(BaseModel):
    task_id: str
    answer: str

class ProgressResponse(BaseModel):
    topic: str
    total_tasks: int
    completed_tasks: int
    correct_answers: int
    percentage: float

class DailyChallengeResponse(BaseModel):
    id: str
    date: str
    tasks: List[TaskResponse]
    completed: bool
    bonus_xp: int = 50

class RecommendationResponse(BaseModel):
    topic: str
    reason: str
    tasks: List[TaskResponse]

# ================== AUTH HELPERS ==================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Ungültiger Token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="Benutzer nicht gefunden")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token abgelaufen")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Ungültiger Token")

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin-Zugang erforderlich")
    return current_user

# ================== AUTH ROUTES ==================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="E-Mail bereits registriert")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "role": user_data.role,
        "grade": user_data.grade,
        "xp": 0,
        "level": 1,
        "badges": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    token = create_access_token({"sub": user_id})
    
    user_response = UserResponse(
        id=user_doc["id"],
        email=user_doc["email"],
        name=user_doc["name"],
        role=user_doc["role"],
        grade=user_doc["grade"],
        xp=user_doc["xp"],
        level=user_doc["level"],
        badges=user_doc["badges"],
        created_at=user_doc["created_at"]
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Ungültige E-Mail oder Passwort")
    
    token = create_access_token({"sub": user["id"]})
    
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        grade=user.get("grade"),
        xp=user.get("xp", 0),
        level=user.get("level", 1),
        badges=user.get("badges", []),
        created_at=user["created_at"]
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        grade=current_user.get("grade"),
        xp=current_user.get("xp", 0),
        level=current_user.get("level", 1),
        badges=current_user.get("badges", []),
        created_at=current_user["created_at"]
    )

@api_router.put("/auth/grade")
async def update_grade(grade: int, current_user: dict = Depends(get_current_user)):
    if grade < 5 or grade > 10:
        raise HTTPException(status_code=400, detail="Klasse muss zwischen 5 und 10 sein")
    await db.users.update_one({"id": current_user["id"]}, {"$set": {"grade": grade}})
    return {"message": "Klassenstufe aktualisiert", "grade": grade}

# ================== PASSWORD RESET ==================

@api_router.post("/auth/password-reset-request")
async def request_password_reset(data: PasswordResetRequest):
    """Request a password reset - generates a reset token"""
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        # Return success even if user doesn't exist for security
        return {"message": "Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link gesendet."}
    
    # Generate reset token
    reset_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store reset token
    await db.password_resets.insert_one({
        "token": reset_token,
        "user_id": user["id"],
        "email": data.email,
        "expires_at": expires_at.isoformat(),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # In production, send email here
    # For now, return the token (in production this would be sent via email)
    logger.info(f"Password reset requested for {data.email}, token: {reset_token}")
    
    return {
        "message": "Falls ein Konto mit dieser E-Mail existiert, wurde ein Reset-Link gesendet.",
        "reset_token": reset_token,  # Remove in production - only for demo
        "expires_in": "1 Stunde"
    }

@api_router.post("/auth/password-reset-confirm")
async def confirm_password_reset(data: PasswordResetConfirm):
    """Confirm password reset with token and new password"""
    # Find reset token
    reset_doc = await db.password_resets.find_one({
        "token": data.token,
        "used": False
    }, {"_id": 0})
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Ungültiger oder abgelaufener Reset-Token")
    
    # Check expiration
    expires_at = datetime.fromisoformat(reset_doc["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset-Token ist abgelaufen")
    
    # Validate new password
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Passwort muss mindestens 6 Zeichen haben")
    
    # Update password
    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"id": reset_doc["user_id"]},
        {"$set": {"password_hash": new_hash}}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"token": data.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Passwort erfolgreich geändert. Du kannst dich jetzt anmelden."}

@api_router.put("/auth/change-password")
async def change_password(data: PasswordChange, current_user: dict = Depends(get_current_user)):
    """Change password for logged-in user"""
    # Get full user with password hash
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    # Verify old password
    if not verify_password(data.old_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Aktuelles Passwort ist falsch")
    
    # Validate new password
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Neues Passwort muss mindestens 6 Zeichen haben")
    
    # Update password
    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"password_hash": new_hash}}
    )
    
    return {"message": "Passwort erfolgreich geändert"}

# ================== TASK ROUTES ==================

@api_router.get("/tasks/grades")
async def get_grades():
    return {"grades": [5, 6, 7, 8, 9, 10]}

@api_router.get("/tasks/topics/{grade}")
async def get_topics(grade: int):
    topics_by_grade = {
        5: ["Grundrechenarten", "Brüche einführen", "Dezimalzahlen", "Geometrie Grundlagen", "Größen und Einheiten", "Diagramme"],
        6: ["Bruchrechnung", "Dezimalzahlen erweitert", "Prozentrechnung Einführung", "Winkel", "Flächen", "Teilbarkeit"],
        7: ["Rationale Zahlen", "Terme und Gleichungen", "Proportionalität", "Dreiecke", "Prozentrechnung", "Statistik"],
        8: ["Lineare Funktionen", "Lineare Gleichungssysteme", "Vierecke", "Kreis", "Wahrscheinlichkeit", "Potenzen"],
        9: ["Quadratische Funktionen", "Quadratische Gleichungen", "Ähnlichkeit", "Satz des Pythagoras", "Wurzeln", "Trigonometrie"],
        10: ["Exponentialfunktionen", "Logarithmen", "Körperberechnungen", "Stochastik", "Wachstum", "Vektorrechnung"]
    }
    return {"grade": grade, "topics": topics_by_grade.get(grade, [])}

@api_router.get("/tasks/{grade}/{topic}", response_model=List[TaskResponse])
async def get_tasks(grade: int, topic: str, current_user: dict = Depends(get_current_user)):
    tasks = await db.tasks.find({"grade": grade, "topic": topic}, {"_id": 0}).to_list(100)
    return [TaskResponse(**task) for task in tasks]

@api_router.get("/tasks/single/{task_id}", response_model=TaskResponse)
async def get_single_task(task_id: str, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    return TaskResponse(**task)

@api_router.post("/tasks/submit")
async def submit_answer(submission: AnswerSubmit, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": submission.task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    
    is_correct = submission.answer.strip().lower() == task["correct_answer"].strip().lower()
    
    # Save result
    result_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "task_id": submission.task_id,
        "grade": task["grade"],
        "topic": task["topic"],
        "answer": submission.answer,
        "is_correct": is_correct,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.results.insert_one(result_doc)
    
    # Update XP and level if correct
    xp_earned = 0
    level_up = False
    new_badges = []
    
    if is_correct:
        xp_earned = task["xp_reward"]
        user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
        new_xp = user.get("xp", 0) + xp_earned
        new_level = (new_xp // 100) + 1
        level_up = new_level > user.get("level", 1)
        
        # Check for badges
        current_badges = user.get("badges", [])
        correct_count = await db.results.count_documents({"user_id": current_user["id"], "is_correct": True})
        
        if correct_count >= 10 and "Anfänger" not in current_badges:
            new_badges.append("Anfänger")
        if correct_count >= 50 and "Fortgeschritten" not in current_badges:
            new_badges.append("Fortgeschritten")
        if correct_count >= 100 and "Experte" not in current_badges:
            new_badges.append("Experte")
        if correct_count >= 500 and "Mathe-Meister" not in current_badges:
            new_badges.append("Mathe-Meister")
        
        update_data = {"$set": {"xp": new_xp, "level": new_level}}
        if new_badges:
            update_data["$push"] = {"badges": {"$each": new_badges}}
        
        await db.users.update_one({"id": current_user["id"]}, update_data)
    
    return {
        "is_correct": is_correct,
        "correct_answer": task["correct_answer"],
        "explanation": task["explanation"],
        "xp_earned": xp_earned,
        "level_up": level_up,
        "new_badges": new_badges
    }

# ================== PROGRESS ROUTES ==================

@api_router.get("/progress/overview", response_model=List[ProgressResponse])
async def get_progress_overview(current_user: dict = Depends(get_current_user)):
    grade = current_user.get("grade", 5)
    topics_resp = await get_topics(grade)
    topics = topics_resp["topics"]
    
    progress_list = []
    for topic in topics:
        total_tasks = await db.tasks.count_documents({"grade": grade, "topic": topic})
        results = await db.results.find({"user_id": current_user["id"], "grade": grade, "topic": topic}, {"_id": 0}).to_list(1000)
        
        completed_task_ids = set(r["task_id"] for r in results)
        correct_count = sum(1 for r in results if r["is_correct"])
        
        percentage = (len(completed_task_ids) / total_tasks * 100) if total_tasks > 0 else 0
        
        progress_list.append(ProgressResponse(
            topic=topic,
            total_tasks=total_tasks,
            completed_tasks=len(completed_task_ids),
            correct_answers=correct_count,
            percentage=round(percentage, 1)
        ))
    
    return progress_list

@api_router.get("/progress/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    total_results = await db.results.count_documents({"user_id": current_user["id"]})
    correct_results = await db.results.count_documents({"user_id": current_user["id"], "is_correct": True})
    
    # Get results by topic for strengths/weaknesses
    pipeline = [
        {"$match": {"user_id": current_user["id"]}},
        {"$group": {
            "_id": "$topic",
            "total": {"$sum": 1},
            "correct": {"$sum": {"$cond": ["$is_correct", 1, 0]}}
        }}
    ]
    topic_stats = await db.results.aggregate(pipeline).to_list(100)
    
    strengths = []
    weaknesses = []
    
    for stat in topic_stats:
        if stat["total"] >= 3:
            rate = stat["correct"] / stat["total"]
            if rate >= 0.7:
                strengths.append({"topic": stat["_id"], "rate": round(rate * 100, 1)})
            elif rate < 0.5:
                weaknesses.append({"topic": stat["_id"], "rate": round(rate * 100, 1)})
    
    return {
        "total_tasks_completed": total_results,
        "correct_answers": correct_results,
        "success_rate": round((correct_results / total_results * 100) if total_results > 0 else 0, 1),
        "xp": current_user.get("xp", 0),
        "level": current_user.get("level", 1),
        "badges": current_user.get("badges", []),
        "strengths": sorted(strengths, key=lambda x: x["rate"], reverse=True)[:3],
        "weaknesses": sorted(weaknesses, key=lambda x: x["rate"])[:3]
    }

# ================== DAILY CHALLENGE ROUTES ==================

@api_router.get("/challenges/daily", response_model=DailyChallengeResponse)
async def get_daily_challenge(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    grade = current_user.get("grade", 5)
    
    # Check if challenge exists for today
    existing = await db.daily_challenges.find_one({"user_id": current_user["id"], "date": today}, {"_id": 0})
    
    if existing:
        task_ids = existing["task_ids"]
        tasks = await db.tasks.find({"id": {"$in": task_ids}}, {"_id": 0}).to_list(5)
        return DailyChallengeResponse(
            id=existing["id"],
            date=today,
            tasks=[TaskResponse(**t) for t in tasks],
            completed=existing["completed"],
            bonus_xp=50
        )
    
    # Create new daily challenge
    all_tasks = await db.tasks.find({"grade": grade}, {"_id": 0}).to_list(1000)
    if len(all_tasks) < 5:
        all_tasks = await db.tasks.find({}, {"_id": 0}).to_list(1000)
    
    selected_tasks = random.sample(all_tasks, min(5, len(all_tasks)))
    task_ids = [t["id"] for t in selected_tasks]
    
    challenge_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "date": today,
        "task_ids": task_ids,
        "completed": False,
        "completed_task_ids": []
    }
    await db.daily_challenges.insert_one(challenge_doc)
    
    return DailyChallengeResponse(
        id=challenge_doc["id"],
        date=today,
        tasks=[TaskResponse(**t) for t in selected_tasks],
        completed=False,
        bonus_xp=50
    )

@api_router.post("/challenges/submit/{challenge_id}")
async def submit_challenge_answer(challenge_id: str, submission: AnswerSubmit, current_user: dict = Depends(get_current_user)):
    challenge = await db.daily_challenges.find_one({"id": challenge_id, "user_id": current_user["id"]}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge nicht gefunden")
    
    # Submit the answer normally
    result = await submit_answer(submission, current_user)
    
    # Track completion
    completed_tasks = challenge.get("completed_task_ids", [])
    if submission.task_id not in completed_tasks:
        completed_tasks.append(submission.task_id)
    
    all_completed = len(completed_tasks) >= len(challenge["task_ids"])
    bonus_awarded = False
    
    if all_completed and not challenge["completed"]:
        # Award bonus XP
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$inc": {"xp": 50}}
        )
        bonus_awarded = True
    
    await db.daily_challenges.update_one(
        {"id": challenge_id},
        {"$set": {"completed_task_ids": completed_tasks, "completed": all_completed}}
    )
    
    result["challenge_completed"] = all_completed
    result["bonus_xp_awarded"] = bonus_awarded
    result["tasks_remaining"] = len(challenge["task_ids"]) - len(completed_tasks)
    
    return result

# ================== AI RECOMMENDATIONS ==================

@api_router.get("/recommendations", response_model=List[RecommendationResponse])
async def get_recommendations(current_user: dict = Depends(get_current_user)):
    grade = current_user.get("grade", 5)
    
    # Get user's weak topics
    pipeline = [
        {"$match": {"user_id": current_user["id"]}},
        {"$group": {
            "_id": "$topic",
            "total": {"$sum": 1},
            "correct": {"$sum": {"$cond": ["$is_correct", 1, 0]}}
        }}
    ]
    topic_stats = await db.results.aggregate(pipeline).to_list(100)
    
    recommendations = []
    
    # Find weak topics
    for stat in topic_stats:
        if stat["total"] >= 2:
            rate = stat["correct"] / stat["total"]
            if rate < 0.6:
                tasks = await db.tasks.find({"grade": grade, "topic": stat["_id"]}, {"_id": 0}).to_list(5)
                if tasks:
                    recommendations.append(RecommendationResponse(
                        topic=stat["_id"],
                        reason=f"Du hast hier eine Erfolgsquote von {round(rate*100)}%. Übe weiter!",
                        tasks=[TaskResponse(**t) for t in tasks[:3]]
                    ))
    
    # If no weak topics, suggest untried topics
    if len(recommendations) < 2:
        topics_resp = await get_topics(grade)
        tried_topics = set(s["_id"] for s in topic_stats)
        
        for topic in topics_resp["topics"]:
            if topic not in tried_topics:
                tasks = await db.tasks.find({"grade": grade, "topic": topic}, {"_id": 0}).to_list(3)
                if tasks:
                    recommendations.append(RecommendationResponse(
                        topic=topic,
                        reason="Dieses Thema hast du noch nicht ausprobiert.",
                        tasks=[TaskResponse(**t) for t in tasks]
                    ))
                    if len(recommendations) >= 3:
                        break
    
    return recommendations[:3]

@api_router.get("/recommendations/ai")
async def get_ai_recommendations(current_user: dict = Depends(get_current_user)):
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            return {"recommendation": "KI-Empfehlungen sind derzeit nicht verfügbar."}
        
        # Get user stats
        stats = await get_user_stats(current_user)
        grade = current_user.get("grade", 5)
        
        prompt = f"""Du bist ein freundlicher Mathe-Tutor für einen Schüler der {grade}. Klasse.
Der Schüler hat folgende Statistiken:
- Erfolgsquote: {stats['success_rate']}%
- Level: {stats['level']}
- Stärken: {', '.join([s['topic'] for s in stats['strengths']]) if stats['strengths'] else 'Noch keine'}
- Schwächen: {', '.join([w['topic'] for w in stats['weaknesses']]) if stats['weaknesses'] else 'Noch keine'}

Gib eine kurze, ermutigende Lernempfehlung auf Deutsch (max 3 Sätze)."""
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"mathevilla_{current_user['id']}",
            system_message="Du bist ein freundlicher Mathe-Tutor für Schüler."
        ).with_model("openai", "gpt-4o-mini")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        return {"recommendation": response}
    except Exception as e:
        logger.error(f"AI recommendation error: {e}")
        return {"recommendation": "Übe regelmäßig und arbeite an deinen schwachen Themen!"}

# ================== ADMIN ROUTES ==================

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    total_students = await db.users.count_documents({"role": "student"})
    total_tasks = await db.tasks.count_documents({})
    total_results = await db.results.count_documents({})
    correct_results = await db.results.count_documents({"is_correct": True})
    
    # Difficult topics
    pipeline = [
        {"$group": {
            "_id": "$topic",
            "total": {"$sum": 1},
            "correct": {"$sum": {"$cond": ["$is_correct", 1, 0]}}
        }},
        {"$addFields": {"error_rate": {"$subtract": [1, {"$divide": ["$correct", "$total"]}]}}},
        {"$sort": {"error_rate": -1}},
        {"$limit": 5}
    ]
    difficult_topics = await db.results.aggregate(pipeline).to_list(5)
    
    return {
        "total_students": total_students,
        "total_tasks": total_tasks,
        "total_answers": total_results,
        "success_rate": round((correct_results / total_results * 100) if total_results > 0 else 0, 1),
        "difficult_topics": [
            {"topic": t["_id"], "error_rate": round(t["error_rate"] * 100, 1)}
            for t in difficult_topics if t["_id"]
        ]
    }

@api_router.get("/admin/students")
async def get_all_students(admin: dict = Depends(get_admin_user)):
    students = await db.users.find({"role": "student"}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    student_list = []
    for student in students:
        total = await db.results.count_documents({"user_id": student["id"]})
        correct = await db.results.count_documents({"user_id": student["id"], "is_correct": True})
        student_list.append({
            **student,
            "tasks_completed": total,
            "success_rate": round((correct / total * 100) if total > 0 else 0, 1)
        })
    
    return student_list

@api_router.get("/admin/students/{student_id}")
async def get_student_detail(student_id: str, admin: dict = Depends(get_admin_user)):
    student = await db.users.find_one({"id": student_id, "role": "student"}, {"_id": 0, "password_hash": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Schüler nicht gefunden")
    
    # Get topic breakdown
    pipeline = [
        {"$match": {"user_id": student_id}},
        {"$group": {
            "_id": "$topic",
            "total": {"$sum": 1},
            "correct": {"$sum": {"$cond": ["$is_correct", 1, 0]}}
        }}
    ]
    topic_stats = await db.results.aggregate(pipeline).to_list(100)
    
    return {
        **student,
        "topic_breakdown": [
            {"topic": t["_id"], "total": t["total"], "correct": t["correct"], "rate": round(t["correct"]/t["total"]*100, 1)}
            for t in topic_stats if t["_id"]
        ]
    }

@api_router.post("/admin/tasks", response_model=TaskResponse)
async def create_task(task: TaskCreate, admin: dict = Depends(get_admin_user)):
    task_doc = {
        "id": str(uuid.uuid4()),
        **task.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["id"]
    }
    await db.tasks.insert_one(task_doc)
    return TaskResponse(**task_doc)

@api_router.put("/admin/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task: TaskCreate, admin: dict = Depends(get_admin_user)):
    existing = await db.tasks.find_one({"id": task_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    
    await db.tasks.update_one({"id": task_id}, {"$set": task.model_dump()})
    updated = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    return TaskResponse(**updated)

@api_router.delete("/admin/tasks/{task_id}")
async def delete_task(task_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Aufgabe nicht gefunden")
    return {"message": "Aufgabe gelöscht"}

@api_router.get("/admin/tasks", response_model=List[TaskResponse])
async def get_all_tasks(grade: Optional[int] = None, topic: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    query = {}
    if grade:
        query["grade"] = grade
    if topic:
        query["topic"] = topic
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(1000)
    return [TaskResponse(**t) for t in tasks]

@api_router.post("/admin/tasks/import-csv")
async def import_tasks_csv(file: UploadFile = File(...), admin: dict = Depends(get_admin_user)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Nur CSV-Dateien erlaubt")
    
    content = await file.read()
    decoded = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    imported_count = 0
    errors = []
    
    for row in reader:
        try:
            task_doc = {
                "id": str(uuid.uuid4()),
                "grade": int(row["grade"]),
                "topic": row["topic"],
                "question": row["question"],
                "task_type": row.get("task_type", "free_text"),
                "options": row.get("options", "").split("|") if row.get("options") else None,
                "correct_answer": row["correct_answer"],
                "explanation": row.get("explanation", ""),
                "xp_reward": int(row.get("xp_reward", 10)),
                "difficulty": row.get("difficulty", "mittel"),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "created_by": admin["id"]
            }
            await db.tasks.insert_one(task_doc)
            imported_count += 1
        except Exception as e:
            errors.append(f"Zeile {imported_count + len(errors) + 1}: {str(e)}")
    
    return {"imported": imported_count, "errors": errors}

# ================== SEED DATA ==================

@api_router.post("/seed")
async def seed_database():
    # Check if already seeded
    task_count = await db.tasks.count_documents({})
    if task_count > 0:
        return {"message": "Datenbank bereits mit Seed-Daten gefüllt", "task_count": task_count}
    
    seed_tasks = get_seed_tasks()
    
    for task in seed_tasks:
        task["id"] = str(uuid.uuid4())
        task["created_at"] = datetime.now(timezone.utc).isoformat()
        task["created_by"] = "system"
    
    await db.tasks.insert_many(seed_tasks)
    
    # Create admin user if not exists
    admin_exists = await db.users.find_one({"email": "admin@mathevilla.de"})
    if not admin_exists:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": "admin@mathevilla.de",
            "password_hash": hash_password("admin123"),
            "name": "Administrator",
            "role": "admin",
            "grade": None,
            "xp": 0,
            "level": 1,
            "badges": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
    
    return {"message": "Seed-Daten erfolgreich eingefügt", "task_count": len(seed_tasks)}

@api_router.post("/seed/additional")
async def seed_additional_tasks():
    """Add more tasks to reach 20-25 per grade"""
    additional_tasks = get_additional_tasks()
    
    for task in additional_tasks:
        task["id"] = str(uuid.uuid4())
        task["created_at"] = datetime.now(timezone.utc).isoformat()
        task["created_by"] = "system"
    
    await db.tasks.insert_many(additional_tasks)
    
    # Count tasks per grade
    counts = {}
    for grade in range(5, 11):
        counts[f"grade_{grade}"] = await db.tasks.count_documents({"grade": grade})
    
    return {"message": "Zusätzliche Aufgaben eingefügt", "added": len(additional_tasks), "counts": counts}

def get_additional_tasks():
    """Additional tasks to bring each grade to 20-25 tasks"""
    tasks = []
    
    # Additional Klasse 5 tasks
    tasks.extend([
        {"grade": 5, "topic": "Grundrechenarten", "question": "Was ergibt 234 + 567?", "task_type": "free_text", "options": None, "correct_answer": "801", "explanation": "234 + 567 = 801", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 5, "topic": "Grundrechenarten", "question": "Was ergibt 1000 - 456?", "task_type": "free_text", "options": None, "correct_answer": "544", "explanation": "1000 - 456 = 544", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 5, "topic": "Grundrechenarten", "question": "Was ergibt 15 × 6?", "task_type": "multiple_choice", "options": ["80", "90", "85", "95"], "correct_answer": "90", "explanation": "15 × 6 = 90", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 5, "topic": "Grundrechenarten", "question": "Was ergibt 72 ÷ 8?", "task_type": "free_text", "options": None, "correct_answer": "9", "explanation": "72 ÷ 8 = 9", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 5, "topic": "Brüche einführen", "question": "Was ist 1/2 von 50?", "task_type": "free_text", "options": None, "correct_answer": "25", "explanation": "1/2 von 50 = 50 ÷ 2 = 25", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 5, "topic": "Brüche einführen", "question": "Erweitere 2/3 mit 4.", "task_type": "free_text", "options": None, "correct_answer": "8/12", "explanation": "2/3 × 4/4 = 8/12", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 5, "topic": "Dezimalzahlen", "question": "Was ergibt 3,5 - 1,2?", "task_type": "free_text", "options": None, "correct_answer": "2,3", "explanation": "3,5 - 1,2 = 2,3", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 5, "topic": "Geometrie Grundlagen", "question": "Berechne die Fläche eines Quadrats mit a = 5 cm.", "task_type": "free_text", "options": None, "correct_answer": "25", "explanation": "A = a² = 5² = 25 cm²", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 5, "topic": "Größen und Einheiten", "question": "Wie viele Minuten sind 2,5 Stunden?", "task_type": "free_text", "options": None, "correct_answer": "150", "explanation": "2,5 × 60 = 150 Minuten", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 5, "topic": "Diagramme", "question": "In einem Balkendiagramm zeigt ein Balken 30. Der andere ist doppelt so lang. Welchen Wert zeigt er?", "task_type": "free_text", "options": None, "correct_answer": "60", "explanation": "30 × 2 = 60", "xp_reward": 10, "difficulty": "leicht"},
    ])
    
    # Additional Klasse 6 tasks
    tasks.extend([
        {"grade": 6, "topic": "Bruchrechnung", "question": "Was ergibt 1/2 + 1/4?", "task_type": "multiple_choice", "options": ["2/6", "3/4", "1/3", "2/4"], "correct_answer": "3/4", "explanation": "1/2 = 2/4, also 2/4 + 1/4 = 3/4", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 6, "topic": "Bruchrechnung", "question": "Berechne 2/5 × 3/4.", "task_type": "free_text", "options": None, "correct_answer": "6/20", "explanation": "2/5 × 3/4 = 6/20 = 3/10", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 6, "topic": "Dezimalzahlen erweitert", "question": "Was ergibt 4,2 ÷ 0,7?", "task_type": "free_text", "options": None, "correct_answer": "6", "explanation": "4,2 ÷ 0,7 = 42 ÷ 7 = 6", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 6, "topic": "Prozentrechnung Einführung", "question": "Was sind 50% von 120?", "task_type": "free_text", "options": None, "correct_answer": "60", "explanation": "50% = 1/2, also 120 ÷ 2 = 60", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 6, "topic": "Prozentrechnung Einführung", "question": "Was sind 10% von 250?", "task_type": "free_text", "options": None, "correct_answer": "25", "explanation": "10% = 1/10, also 250 ÷ 10 = 25", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 6, "topic": "Winkel", "question": "Wie groß ist ein gestreckter Winkel?", "task_type": "multiple_choice", "options": ["90°", "180°", "270°", "360°"], "correct_answer": "180°", "explanation": "Ein gestreckter Winkel hat 180°", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 6, "topic": "Flächen", "question": "Berechne den Umfang eines Rechtecks mit a = 6 cm und b = 4 cm.", "task_type": "free_text", "options": None, "correct_answer": "20", "explanation": "U = 2(a + b) = 2(6 + 4) = 20 cm", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 6, "topic": "Teilbarkeit", "question": "Ist 245 durch 5 teilbar?", "task_type": "multiple_choice", "options": ["Ja", "Nein"], "correct_answer": "Ja", "explanation": "245 endet auf 5, also ist es durch 5 teilbar", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 6, "topic": "Teilbarkeit", "question": "Was ist das kgV von 4 und 6?", "task_type": "free_text", "options": None, "correct_answer": "12", "explanation": "kgV(4,6) = 12", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 6, "topic": "Bruchrechnung", "question": "Wandle 7/4 in eine gemischte Zahl um.", "task_type": "free_text", "options": None, "correct_answer": "1 3/4", "explanation": "7/4 = 1 + 3/4 = 1 3/4", "xp_reward": 15, "difficulty": "mittel"},
    ])
    
    # Additional Klasse 7 tasks
    tasks.extend([
        {"grade": 7, "topic": "Rationale Zahlen", "question": "Was ergibt (-8) - (-3)?", "task_type": "free_text", "options": None, "correct_answer": "-5", "explanation": "(-8) - (-3) = -8 + 3 = -5", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 7, "topic": "Rationale Zahlen", "question": "Was ergibt (-12) ÷ 4?", "task_type": "free_text", "options": None, "correct_answer": "-3", "explanation": "(-12) ÷ 4 = -3", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 7, "topic": "Terme und Gleichungen", "question": "Löse: 2x + 3 = 11", "task_type": "free_text", "options": None, "correct_answer": "4", "explanation": "2x + 3 = 11 → 2x = 8 → x = 4", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 7, "topic": "Terme und Gleichungen", "question": "Vereinfache: 4a + 2b - a + 3b", "task_type": "free_text", "options": None, "correct_answer": "3a + 5b", "explanation": "4a - a = 3a, 2b + 3b = 5b", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 7, "topic": "Proportionalität", "question": "5 Arbeiter brauchen 8 Tage. Wie lange brauchen 4 Arbeiter?", "task_type": "free_text", "options": None, "correct_answer": "10", "explanation": "Antiproportional: 5 × 8 = 4 × x → x = 10", "xp_reward": 20, "difficulty": "schwer"},
        {"grade": 7, "topic": "Dreiecke", "question": "Welches Dreieck hat drei gleich lange Seiten?", "task_type": "multiple_choice", "options": ["Gleichschenkliges", "Gleichseitiges", "Rechtwinkliges"], "correct_answer": "Gleichseitiges", "explanation": "Ein gleichseitiges Dreieck hat drei gleich lange Seiten", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 7, "topic": "Prozentrechnung", "question": "Ein Preis steigt von 50€ auf 60€. Um wie viel Prozent?", "task_type": "free_text", "options": None, "correct_answer": "20", "explanation": "Erhöhung: 10€. 10/50 = 0,2 = 20%", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 7, "topic": "Statistik", "question": "Berechne den Median von: 3, 7, 2, 9, 5", "task_type": "free_text", "options": None, "correct_answer": "5", "explanation": "Sortiert: 2, 3, 5, 7, 9. Median ist der mittlere Wert: 5", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 7, "topic": "Statistik", "question": "Was ist die Spannweite von: 12, 5, 8, 15, 3?", "task_type": "free_text", "options": None, "correct_answer": "12", "explanation": "Spannweite = Maximum - Minimum = 15 - 3 = 12", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 7, "topic": "Rationale Zahlen", "question": "Berechne: |−7| + |3|", "task_type": "free_text", "options": None, "correct_answer": "10", "explanation": "|−7| = 7 und |3| = 3, also 7 + 3 = 10", "xp_reward": 10, "difficulty": "leicht"},
    ])
    
    # Additional Klasse 8 tasks
    tasks.extend([
        {"grade": 8, "topic": "Lineare Funktionen", "question": "Wo schneidet y = 3x - 6 die x-Achse?", "task_type": "free_text", "options": None, "correct_answer": "2", "explanation": "0 = 3x - 6 → x = 2", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 8, "topic": "Lineare Funktionen", "question": "Sind y = 2x + 1 und y = 2x - 3 parallel?", "task_type": "multiple_choice", "options": ["Ja", "Nein"], "correct_answer": "Ja", "explanation": "Beide haben Steigung m = 2, also sind sie parallel", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 8, "topic": "Lineare Gleichungssysteme", "question": "Löse: x + y = 10 und x - y = 4. Was ist x?", "task_type": "free_text", "options": None, "correct_answer": "7", "explanation": "Addiere: 2x = 14 → x = 7", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 8, "topic": "Lineare Gleichungssysteme", "question": "Löse: 2x + y = 8 und x + y = 5. Was ist y?", "task_type": "free_text", "options": None, "correct_answer": "2", "explanation": "Subtrahiere: x = 3. Einsetzen: y = 2", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 8, "topic": "Vierecke", "question": "Was ist die Diagonale eines Quadrats mit a = 4 cm? (Antwort als √)", "task_type": "free_text", "options": None, "correct_answer": "4√2", "explanation": "d = a√2 = 4√2", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 8, "topic": "Kreis", "question": "Was ist der Durchmesser eines Kreises mit r = 5 cm?", "task_type": "free_text", "options": None, "correct_answer": "10", "explanation": "d = 2r = 2 × 5 = 10 cm", "xp_reward": 5, "difficulty": "leicht"},
        {"grade": 8, "topic": "Wahrscheinlichkeit", "question": "Wie groß ist P(gerade Zahl) beim Würfeln?", "task_type": "free_text", "options": None, "correct_answer": "1/2", "explanation": "3 gerade Zahlen (2,4,6) von 6. P = 3/6 = 1/2", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 8, "topic": "Wahrscheinlichkeit", "question": "Eine Münze wird 3-mal geworfen. P(3× Kopf)?", "task_type": "free_text", "options": None, "correct_answer": "1/8", "explanation": "P = (1/2)³ = 1/8", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 8, "topic": "Potenzen", "question": "Was ergibt 5⁰?", "task_type": "free_text", "options": None, "correct_answer": "1", "explanation": "Jede Zahl hoch 0 ist 1", "xp_reward": 5, "difficulty": "leicht"},
        {"grade": 8, "topic": "Potenzen", "question": "Was ergibt 2⁴ ÷ 2²?", "task_type": "free_text", "options": None, "correct_answer": "4", "explanation": "2⁴ ÷ 2² = 2² = 4", "xp_reward": 10, "difficulty": "leicht"},
    ])
    
    # Additional Klasse 9 tasks
    tasks.extend([
        {"grade": 9, "topic": "Quadratische Funktionen", "question": "Was ist der Scheitelpunkt von y = x² - 4x + 4?", "task_type": "free_text", "options": None, "correct_answer": "(2,0)", "explanation": "y = (x-2)², Scheitelpunkt bei (2, 0)", "xp_reward": 20, "difficulty": "mittel"},
        {"grade": 9, "topic": "Quadratische Funktionen", "question": "Ist die Parabel y = -x² + 3 nach oben oder unten geöffnet?", "task_type": "multiple_choice", "options": ["Nach oben", "Nach unten"], "correct_answer": "Nach unten", "explanation": "a = -1 < 0, also nach unten geöffnet", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 9, "topic": "Quadratische Gleichungen", "question": "Löse: x² - 9 = 0", "task_type": "free_text", "options": None, "correct_answer": "±3", "explanation": "x² = 9 → x = ±3", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 9, "topic": "Quadratische Gleichungen", "question": "Löse: x² + 2x - 8 = 0", "task_type": "multiple_choice", "options": ["x = 2 oder x = -4", "x = -2 oder x = 4", "x = 1 oder x = -8"], "correct_answer": "x = 2 oder x = -4", "explanation": "(x-2)(x+4) = 0", "xp_reward": 20, "difficulty": "mittel"},
        {"grade": 9, "topic": "Satz des Pythagoras", "question": "Ist ein Dreieck mit a=6, b=8, c=10 rechtwinklig?", "task_type": "multiple_choice", "options": ["Ja", "Nein"], "correct_answer": "Ja", "explanation": "6² + 8² = 36 + 64 = 100 = 10²", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 9, "topic": "Satz des Pythagoras", "question": "Berechne die Diagonale d in einem Rechteck mit a=3 und b=4.", "task_type": "free_text", "options": None, "correct_answer": "5", "explanation": "d² = 3² + 4² = 25, d = 5", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 9, "topic": "Wurzeln", "question": "Was ist √64?", "task_type": "free_text", "options": None, "correct_answer": "8", "explanation": "8 × 8 = 64", "xp_reward": 5, "difficulty": "leicht"},
        {"grade": 9, "topic": "Wurzeln", "question": "Vereinfache √72.", "task_type": "free_text", "options": None, "correct_answer": "6√2", "explanation": "√72 = √(36×2) = 6√2", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 9, "topic": "Ähnlichkeit", "question": "Zwei ähnliche Dreiecke haben Verhältnis 1:3. Wenn die kleine Fläche 4 cm² ist, wie groß ist die große?", "task_type": "free_text", "options": None, "correct_answer": "36", "explanation": "Flächenverhältnis = 1²:3² = 1:9. 4 × 9 = 36 cm²", "xp_reward": 20, "difficulty": "schwer"},
        {"grade": 9, "topic": "Trigonometrie", "question": "Was ist sin(90°)?", "task_type": "free_text", "options": None, "correct_answer": "1", "explanation": "sin(90°) = 1", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 9, "topic": "Trigonometrie", "question": "Was ist cos(0°)?", "task_type": "free_text", "options": None, "correct_answer": "1", "explanation": "cos(0°) = 1", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 9, "topic": "Trigonometrie", "question": "tan(45°) = ?", "task_type": "free_text", "options": None, "correct_answer": "1", "explanation": "tan(45°) = sin(45°)/cos(45°) = 1", "xp_reward": 15, "difficulty": "mittel"},
    ])
    
    # Additional Klasse 10 tasks
    tasks.extend([
        {"grade": 10, "topic": "Exponentialfunktionen", "question": "Was ist 3⁻²?", "task_type": "free_text", "options": None, "correct_answer": "1/9", "explanation": "3⁻² = 1/3² = 1/9", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 10, "topic": "Exponentialfunktionen", "question": "Löse: 3^x = 81", "task_type": "free_text", "options": None, "correct_answer": "4", "explanation": "3⁴ = 81, also x = 4", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 10, "topic": "Logarithmen", "question": "Was ist log₁₀(1000)?", "task_type": "free_text", "options": None, "correct_answer": "3", "explanation": "10³ = 1000", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 10, "topic": "Logarithmen", "question": "Was ist ln(e)?", "task_type": "free_text", "options": None, "correct_answer": "1", "explanation": "ln(e) = 1", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 10, "topic": "Körperberechnungen", "question": "Volumen eines Zylinders mit r=3 cm und h=5 cm? (π ≈ 3,14)", "task_type": "free_text", "options": None, "correct_answer": "141,3", "explanation": "V = πr²h = 3,14 × 9 × 5 = 141,3 cm³", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 10, "topic": "Körperberechnungen", "question": "Oberfläche eines Würfels mit a = 4 cm?", "task_type": "free_text", "options": None, "correct_answer": "96", "explanation": "O = 6a² = 6 × 16 = 96 cm²", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 10, "topic": "Stochastik", "question": "Was ist der Erwartungswert bei n=10 und p=0,3?", "task_type": "free_text", "options": None, "correct_answer": "3", "explanation": "E(X) = n × p = 10 × 0,3 = 3", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 10, "topic": "Stochastik", "question": "Was ist die Standardabweichung wenn Varianz = 16?", "task_type": "free_text", "options": None, "correct_answer": "4", "explanation": "σ = √16 = 4", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 10, "topic": "Wachstum", "question": "K₀ = 500€ wächst mit 4% pro Jahr. K nach 1 Jahr?", "task_type": "free_text", "options": None, "correct_answer": "520", "explanation": "K = 500 × 1,04 = 520€", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 10, "topic": "Wachstum", "question": "Halbwertszeit: Nach wie vielen HWZ ist 1/8 übrig?", "task_type": "free_text", "options": None, "correct_answer": "3", "explanation": "1/2³ = 1/8, also 3 Halbwertszeiten", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 10, "topic": "Vektorrechnung", "question": "Berechne: 3 × (2, 4)", "task_type": "free_text", "options": None, "correct_answer": "(6,12)", "explanation": "3 × (2,4) = (6, 12)", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 10, "topic": "Vektorrechnung", "question": "Was ist der Betrag von (6, 8)?", "task_type": "free_text", "options": None, "correct_answer": "10", "explanation": "|v| = √(36+64) = √100 = 10", "xp_reward": 15, "difficulty": "mittel"},
    ])
    
    return tasks

def get_seed_tasks():
    tasks = []
    
    # Klasse 5
    tasks.extend([
        {"grade": 5, "topic": "Grundrechenarten", "question": "Was ergibt 125 + 378?", "task_type": "free_text", "options": None, "correct_answer": "503", "explanation": "125 + 378 = 503. Addiere zuerst die Einer, dann die Zehner, dann die Hunderter.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 5, "topic": "Grundrechenarten", "question": "Was ergibt 456 - 189?", "task_type": "free_text", "options": None, "correct_answer": "267", "explanation": "456 - 189 = 267. Bei der Subtraktion muss manchmal übertragen werden.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 5, "topic": "Grundrechenarten", "question": "Was ergibt 12 × 8?", "task_type": "multiple_choice", "options": ["86", "96", "106", "92"], "correct_answer": "96", "explanation": "12 × 8 = 96. Das ist ein Ergebnis aus dem kleinen Einmaleins.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 5, "topic": "Grundrechenarten", "question": "Was ergibt 144 ÷ 12?", "task_type": "free_text", "options": None, "correct_answer": "12", "explanation": "144 ÷ 12 = 12. Division ist die Umkehrung der Multiplikation.", "xp_reward": 10, "difficulty": "mittel"},
        {"grade": 5, "topic": "Grundrechenarten", "question": "Berechne: (15 + 25) × 3", "task_type": "free_text", "options": None, "correct_answer": "120", "explanation": "Klammer zuerst: 15 + 25 = 40, dann 40 × 3 = 120.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 5, "topic": "Brüche einführen", "question": "Welcher Bruch ist größer: 1/2 oder 1/4?", "task_type": "multiple_choice", "options": ["1/2", "1/4", "Beide gleich"], "correct_answer": "1/2", "explanation": "1/2 ist größer als 1/4. Je kleiner der Nenner, desto größer der Anteil.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 5, "topic": "Brüche einführen", "question": "Was ist 1/4 von 20?", "task_type": "free_text", "options": None, "correct_answer": "5", "explanation": "1/4 von 20 = 20 ÷ 4 = 5.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 5, "topic": "Brüche einführen", "question": "Kürze den Bruch 6/12 so weit wie möglich.", "task_type": "free_text", "options": None, "correct_answer": "1/2", "explanation": "6/12 = 1/2. Teile Zähler und Nenner durch 6.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 5, "topic": "Dezimalzahlen", "question": "Schreibe 0,75 als Bruch.", "task_type": "multiple_choice", "options": ["3/4", "7/5", "1/2", "2/3"], "correct_answer": "3/4", "explanation": "0,75 = 75/100 = 3/4.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 5, "topic": "Dezimalzahlen", "question": "Was ergibt 2,5 + 1,75?", "task_type": "free_text", "options": None, "correct_answer": "4,25", "explanation": "2,5 + 1,75 = 4,25. Achte auf die Kommastellen.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 5, "topic": "Geometrie Grundlagen", "question": "Wie viele Ecken hat ein Rechteck?", "task_type": "free_text", "options": None, "correct_answer": "4", "explanation": "Ein Rechteck hat 4 Ecken, 4 Seiten und 4 rechte Winkel.", "xp_reward": 5, "difficulty": "leicht"},
        {"grade": 5, "topic": "Geometrie Grundlagen", "question": "Berechne den Umfang eines Quadrats mit Seitenlänge 7 cm.", "task_type": "free_text", "options": None, "correct_answer": "28", "explanation": "Umfang = 4 × Seitenlänge = 4 × 7 = 28 cm.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 5, "topic": "Größen und Einheiten", "question": "Wie viele Zentimeter sind 2,5 Meter?", "task_type": "free_text", "options": None, "correct_answer": "250", "explanation": "1 m = 100 cm, also 2,5 m = 250 cm.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 5, "topic": "Größen und Einheiten", "question": "Wie viele Gramm sind 3 kg?", "task_type": "free_text", "options": None, "correct_answer": "3000", "explanation": "1 kg = 1000 g, also 3 kg = 3000 g.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 5, "topic": "Diagramme", "question": "In einem Säulendiagramm zeigt eine Säule den Wert 45. Die nächste Säule ist halb so hoch. Welchen Wert zeigt sie?", "task_type": "free_text", "options": None, "correct_answer": "22,5", "explanation": "Die Hälfte von 45 ist 22,5.", "xp_reward": 10, "difficulty": "mittel"},
    ])
    
    # Klasse 6
    tasks.extend([
        {"grade": 6, "topic": "Bruchrechnung", "question": "Was ergibt 2/3 + 1/6?", "task_type": "multiple_choice", "options": ["5/6", "3/9", "1/2", "4/6"], "correct_answer": "5/6", "explanation": "2/3 = 4/6, also 4/6 + 1/6 = 5/6.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 6, "topic": "Bruchrechnung", "question": "Berechne 3/4 × 2/5.", "task_type": "free_text", "options": None, "correct_answer": "6/20", "explanation": "3/4 × 2/5 = 6/20 = 3/10.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 6, "topic": "Bruchrechnung", "question": "Was ergibt 5/6 - 1/3?", "task_type": "free_text", "options": None, "correct_answer": "1/2", "explanation": "1/3 = 2/6, also 5/6 - 2/6 = 3/6 = 1/2.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 6, "topic": "Bruchrechnung", "question": "Berechne 3/4 ÷ 1/2.", "task_type": "free_text", "options": None, "correct_answer": "3/2", "explanation": "Division durch einen Bruch = Multiplikation mit dem Kehrwert: 3/4 × 2/1 = 6/4 = 3/2.", "xp_reward": 20, "difficulty": "schwer"},
        {"grade": 6, "topic": "Dezimalzahlen erweitert", "question": "Was ergibt 3,6 × 0,5?", "task_type": "free_text", "options": None, "correct_answer": "1,8", "explanation": "3,6 × 0,5 = 1,8. Multiplizieren mit 0,5 ist wie durch 2 teilen.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 6, "topic": "Dezimalzahlen erweitert", "question": "Runde 3,456 auf zwei Dezimalstellen.", "task_type": "free_text", "options": None, "correct_answer": "3,46", "explanation": "Die dritte Dezimalstelle ist 6, also wird aufgerundet: 3,46.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 6, "topic": "Prozentrechnung Einführung", "question": "Was sind 25% von 80?", "task_type": "free_text", "options": None, "correct_answer": "20", "explanation": "25% = 1/4, also 80 ÷ 4 = 20.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 6, "topic": "Prozentrechnung Einführung", "question": "Schreibe 0,35 als Prozentzahl.", "task_type": "free_text", "options": None, "correct_answer": "35", "explanation": "0,35 × 100 = 35%.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 6, "topic": "Winkel", "question": "Wie groß ist ein rechter Winkel?", "task_type": "multiple_choice", "options": ["45°", "90°", "180°", "360°"], "correct_answer": "90°", "explanation": "Ein rechter Winkel hat genau 90°.", "xp_reward": 5, "difficulty": "leicht"},
        {"grade": 6, "topic": "Winkel", "question": "Zwei Winkel ergänzen sich zu 180°. Einer ist 65°. Wie groß ist der andere?", "task_type": "free_text", "options": None, "correct_answer": "115", "explanation": "180° - 65° = 115°. Diese Winkel heißen Supplementwinkel.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 6, "topic": "Flächen", "question": "Berechne die Fläche eines Rechtecks mit a = 8 cm und b = 5 cm.", "task_type": "free_text", "options": None, "correct_answer": "40", "explanation": "Fläche = a × b = 8 × 5 = 40 cm².", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 6, "topic": "Flächen", "question": "Berechne die Fläche eines Dreiecks mit g = 10 cm und h = 6 cm.", "task_type": "free_text", "options": None, "correct_answer": "30", "explanation": "Fläche = (g × h) ÷ 2 = (10 × 6) ÷ 2 = 30 cm².", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 6, "topic": "Teilbarkeit", "question": "Ist 126 durch 3 teilbar?", "task_type": "multiple_choice", "options": ["Ja", "Nein"], "correct_answer": "Ja", "explanation": "Quersumme: 1+2+6=9, und 9 ist durch 3 teilbar, also ist 126 durch 3 teilbar.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 6, "topic": "Teilbarkeit", "question": "Was ist der ggT von 24 und 36?", "task_type": "free_text", "options": None, "correct_answer": "12", "explanation": "24 = 2³ × 3, 36 = 2² × 3². Der ggT ist 2² × 3 = 12.", "xp_reward": 20, "difficulty": "schwer"},
    ])
    
    # Klasse 7
    tasks.extend([
        {"grade": 7, "topic": "Rationale Zahlen", "question": "Was ergibt (-5) + 8?", "task_type": "free_text", "options": None, "correct_answer": "3", "explanation": "(-5) + 8 = 3. Von -5 aus 8 Schritte nach rechts.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 7, "topic": "Rationale Zahlen", "question": "Was ergibt (-3) × (-4)?", "task_type": "free_text", "options": None, "correct_answer": "12", "explanation": "Minus mal Minus ergibt Plus: (-3) × (-4) = 12.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 7, "topic": "Rationale Zahlen", "question": "Ordne: -2,5; 0; -3; 1,5 von klein nach groß.", "task_type": "multiple_choice", "options": ["-3; -2,5; 0; 1,5", "-2,5; -3; 0; 1,5", "0; -2,5; -3; 1,5"], "correct_answer": "-3; -2,5; 0; 1,5", "explanation": "Negative Zahlen sind kleiner als 0. -3 < -2,5 < 0 < 1,5.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 7, "topic": "Terme und Gleichungen", "question": "Löse: x + 7 = 15", "task_type": "free_text", "options": None, "correct_answer": "8", "explanation": "x + 7 = 15 → x = 15 - 7 = 8.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 7, "topic": "Terme und Gleichungen", "question": "Löse: 3x - 5 = 16", "task_type": "free_text", "options": None, "correct_answer": "7", "explanation": "3x - 5 = 16 → 3x = 21 → x = 7.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 7, "topic": "Terme und Gleichungen", "question": "Vereinfache: 5x + 3 - 2x + 7", "task_type": "free_text", "options": None, "correct_answer": "3x + 10", "explanation": "5x - 2x = 3x und 3 + 7 = 10, also 3x + 10.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 7, "topic": "Proportionalität", "question": "3 Äpfel kosten 1,50€. Wie viel kosten 7 Äpfel?", "task_type": "free_text", "options": None, "correct_answer": "3,50", "explanation": "Ein Apfel kostet 0,50€. 7 × 0,50€ = 3,50€.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 7, "topic": "Proportionalität", "question": "y ist proportional zu x. Wenn x = 4, ist y = 12. Was ist y, wenn x = 7?", "task_type": "free_text", "options": None, "correct_answer": "21", "explanation": "y = k × x. k = 12/4 = 3. Bei x = 7: y = 3 × 7 = 21.", "xp_reward": 20, "difficulty": "schwer"},
        {"grade": 7, "topic": "Dreiecke", "question": "Die Winkelsumme in einem Dreieck beträgt immer...", "task_type": "multiple_choice", "options": ["90°", "180°", "270°", "360°"], "correct_answer": "180°", "explanation": "Die Summe aller Winkel in einem Dreieck ist immer 180°.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 7, "topic": "Dreiecke", "question": "Zwei Winkel eines Dreiecks sind 45° und 75°. Wie groß ist der dritte?", "task_type": "free_text", "options": None, "correct_answer": "60", "explanation": "180° - 45° - 75° = 60°.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 7, "topic": "Prozentrechnung", "question": "Ein Artikel kostet 80€ und wird um 20% reduziert. Was ist der neue Preis?", "task_type": "free_text", "options": None, "correct_answer": "64", "explanation": "20% von 80€ = 16€. Neuer Preis: 80€ - 16€ = 64€.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 7, "topic": "Prozentrechnung", "question": "Von 50 Schülern sind 30 Mädchen. Wie viel Prozent?", "task_type": "free_text", "options": None, "correct_answer": "60", "explanation": "30/50 = 0,6 = 60%.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 7, "topic": "Statistik", "question": "Der Mittelwert von 4, 7, 10, 3 ist...", "task_type": "free_text", "options": None, "correct_answer": "6", "explanation": "(4+7+10+3)/4 = 24/4 = 6.", "xp_reward": 15, "difficulty": "mittel"},
    ])
    
    # Klasse 8
    tasks.extend([
        {"grade": 8, "topic": "Lineare Funktionen", "question": "Welche Steigung hat die Gerade y = 3x - 2?", "task_type": "free_text", "options": None, "correct_answer": "3", "explanation": "In y = mx + b ist m die Steigung. Hier ist m = 3.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 8, "topic": "Lineare Funktionen", "question": "Wo schneidet y = 2x + 4 die y-Achse?", "task_type": "free_text", "options": None, "correct_answer": "4", "explanation": "Der y-Achsenabschnitt ist b = 4. Die Gerade schneidet bei (0, 4).", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 8, "topic": "Lineare Funktionen", "question": "Bestimme die Gleichung einer Geraden durch (0,1) mit Steigung 2.", "task_type": "multiple_choice", "options": ["y = 2x + 1", "y = x + 2", "y = 2x - 1"], "correct_answer": "y = 2x + 1", "explanation": "y = mx + b mit m = 2 und b = 1 ergibt y = 2x + 1.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 8, "topic": "Lineare Gleichungssysteme", "question": "Löse: x + y = 5 und x - y = 1. Was ist x?", "task_type": "free_text", "options": None, "correct_answer": "3", "explanation": "Addiere beide: 2x = 6 → x = 3.", "xp_reward": 20, "difficulty": "mittel"},
        {"grade": 8, "topic": "Lineare Gleichungssysteme", "question": "Löse: x + y = 5 und x - y = 1. Was ist y?", "task_type": "free_text", "options": None, "correct_answer": "2", "explanation": "Mit x = 3: 3 + y = 5 → y = 2.", "xp_reward": 20, "difficulty": "mittel"},
        {"grade": 8, "topic": "Vierecke", "question": "Was ist die Flächenformel eines Parallelogramms?", "task_type": "multiple_choice", "options": ["A = a × b", "A = a × h", "A = (a × b)/2"], "correct_answer": "A = a × h", "explanation": "Fläche Parallelogramm = Grundseite × Höhe.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 8, "topic": "Vierecke", "question": "Ein Parallelogramm hat a = 8 cm und h = 5 cm. Berechne die Fläche.", "task_type": "free_text", "options": None, "correct_answer": "40", "explanation": "A = a × h = 8 × 5 = 40 cm².", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 8, "topic": "Kreis", "question": "Was ist der Umfang eines Kreises mit r = 7 cm? (π ≈ 3,14)", "task_type": "free_text", "options": None, "correct_answer": "43,96", "explanation": "U = 2πr = 2 × 3,14 × 7 = 43,96 cm.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 8, "topic": "Kreis", "question": "Berechne die Fläche eines Kreises mit r = 5 cm. (π ≈ 3,14)", "task_type": "free_text", "options": None, "correct_answer": "78,5", "explanation": "A = πr² = 3,14 × 25 = 78,5 cm².", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 8, "topic": "Wahrscheinlichkeit", "question": "Ein Würfel wird geworfen. Wie groß ist die Wahrscheinlichkeit für eine 6?", "task_type": "free_text", "options": None, "correct_answer": "1/6", "explanation": "Es gibt 6 mögliche Ergebnisse, davon ist eines die 6. P = 1/6.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 8, "topic": "Wahrscheinlichkeit", "question": "Zwei Münzen werden geworfen. Wie groß ist P(2× Kopf)?", "task_type": "free_text", "options": None, "correct_answer": "1/4", "explanation": "Mögliche Ergebnisse: KK, KZ, ZK, ZZ. Nur KK passt. P = 1/4.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 8, "topic": "Potenzen", "question": "Was ergibt 2³ × 2²?", "task_type": "free_text", "options": None, "correct_answer": "32", "explanation": "2³ × 2² = 2^(3+2) = 2⁵ = 32.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 8, "topic": "Potenzen", "question": "Vereinfache: (x³)²", "task_type": "free_text", "options": None, "correct_answer": "x^6", "explanation": "(x³)² = x^(3×2) = x⁶.", "xp_reward": 15, "difficulty": "mittel"},
    ])
    
    # Klasse 9
    tasks.extend([
        {"grade": 9, "topic": "Quadratische Funktionen", "question": "Wo hat y = x² - 4 ihre Nullstellen?", "task_type": "multiple_choice", "options": ["x = ±2", "x = ±4", "x = 2", "x = 0"], "correct_answer": "x = ±2", "explanation": "x² - 4 = 0 → x² = 4 → x = ±2.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 9, "topic": "Quadratische Funktionen", "question": "Wo ist der Scheitelpunkt von y = (x-3)² + 2?", "task_type": "free_text", "options": None, "correct_answer": "(3,2)", "explanation": "Scheitelpunktform: y = (x-d)² + e hat Scheitelpunkt (d, e) = (3, 2).", "xp_reward": 20, "difficulty": "mittel"},
        {"grade": 9, "topic": "Quadratische Gleichungen", "question": "Löse: x² = 49", "task_type": "free_text", "options": None, "correct_answer": "±7", "explanation": "x² = 49 → x = ±7.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 9, "topic": "Quadratische Gleichungen", "question": "Löse mit pq-Formel: x² - 5x + 6 = 0", "task_type": "multiple_choice", "options": ["x = 2 oder x = 3", "x = -2 oder x = -3", "x = 1 oder x = 6"], "correct_answer": "x = 2 oder x = 3", "explanation": "p = -5, q = 6. x = 2,5 ± √(6,25-6) = 2,5 ± 0,5. Also x = 2 oder x = 3.", "xp_reward": 25, "difficulty": "schwer"},
        {"grade": 9, "topic": "Satz des Pythagoras", "question": "In einem rechtwinkligen Dreieck sind a = 3 und b = 4. Wie lang ist c?", "task_type": "free_text", "options": None, "correct_answer": "5", "explanation": "c² = a² + b² = 9 + 16 = 25 → c = 5.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 9, "topic": "Satz des Pythagoras", "question": "In einem rechtwinkligen Dreieck sind a = 5 und c = 13. Wie lang ist b?", "task_type": "free_text", "options": None, "correct_answer": "12", "explanation": "b² = c² - a² = 169 - 25 = 144 → b = 12.", "xp_reward": 20, "difficulty": "mittel"},
        {"grade": 9, "topic": "Wurzeln", "question": "Was ist √144?", "task_type": "free_text", "options": None, "correct_answer": "12", "explanation": "12 × 12 = 144, also √144 = 12.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 9, "topic": "Wurzeln", "question": "Vereinfache: √50", "task_type": "free_text", "options": None, "correct_answer": "5√2", "explanation": "√50 = √(25×2) = 5√2.", "xp_reward": 20, "difficulty": "mittel"},
        {"grade": 9, "topic": "Ähnlichkeit", "question": "Zwei ähnliche Dreiecke haben Seitenverhältnis 2:3. Die kleinere Seite ist 8 cm. Wie lang ist die größere?", "task_type": "free_text", "options": None, "correct_answer": "12", "explanation": "8 × (3/2) = 12 cm.", "xp_reward": 20, "difficulty": "mittel"},
        {"grade": 9, "topic": "Trigonometrie", "question": "In einem rechtwinkligen Dreieck ist α = 30° und die Hypotenuse c = 10. Wie lang ist die Gegenkathete?", "task_type": "free_text", "options": None, "correct_answer": "5", "explanation": "sin(30°) = Gegenkathete/Hypotenuse = a/10. sin(30°) = 0,5, also a = 5.", "xp_reward": 25, "difficulty": "schwer"},
    ])
    
    # Klasse 10
    tasks.extend([
        {"grade": 10, "topic": "Exponentialfunktionen", "question": "Was ist 2⁰?", "task_type": "free_text", "options": None, "correct_answer": "1", "explanation": "Jede Zahl (außer 0) hoch 0 ist 1.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 10, "topic": "Exponentialfunktionen", "question": "Löse: 2^x = 16", "task_type": "free_text", "options": None, "correct_answer": "4", "explanation": "2⁴ = 16, also x = 4.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 10, "topic": "Logarithmen", "question": "Was ist log₂(8)?", "task_type": "free_text", "options": None, "correct_answer": "3", "explanation": "2³ = 8, also log₂(8) = 3.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 10, "topic": "Logarithmen", "question": "Was ist lg(100)?", "task_type": "free_text", "options": None, "correct_answer": "2", "explanation": "10² = 100, also lg(100) = 2.", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 10, "topic": "Körperberechnungen", "question": "Berechne das Volumen eines Würfels mit a = 5 cm.", "task_type": "free_text", "options": None, "correct_answer": "125", "explanation": "V = a³ = 5³ = 125 cm³.", "xp_reward": 10, "difficulty": "leicht"},
        {"grade": 10, "topic": "Körperberechnungen", "question": "Berechne das Volumen einer Kugel mit r = 3 cm. (π ≈ 3,14)", "task_type": "free_text", "options": None, "correct_answer": "113,04", "explanation": "V = (4/3)πr³ = (4/3) × 3,14 × 27 ≈ 113,04 cm³.", "xp_reward": 25, "difficulty": "schwer"},
        {"grade": 10, "topic": "Stochastik", "question": "Bei einem Binomialexperiment ist n = 4 und p = 0,5. Wie groß ist P(X = 2)?", "task_type": "multiple_choice", "options": ["0,25", "0,375", "0,5"], "correct_answer": "0,375", "explanation": "P(X=2) = C(4,2) × 0,5² × 0,5² = 6 × 0,0625 = 0,375.", "xp_reward": 30, "difficulty": "schwer"},
        {"grade": 10, "topic": "Stochastik", "question": "Der Erwartungswert eines fairen Würfels ist...", "task_type": "free_text", "options": None, "correct_answer": "3,5", "explanation": "E(X) = (1+2+3+4+5+6)/6 = 21/6 = 3,5.", "xp_reward": 20, "difficulty": "mittel"},
        {"grade": 10, "topic": "Wachstum", "question": "Ein Kapital von 1000€ wächst mit 5% jährlich. Wie viel ist es nach 2 Jahren?", "task_type": "free_text", "options": None, "correct_answer": "1102,5", "explanation": "K = 1000 × 1,05² = 1000 × 1,1025 = 1102,5€.", "xp_reward": 20, "difficulty": "mittel"},
        {"grade": 10, "topic": "Wachstum", "question": "Eine Bakterienkultur verdoppelt sich alle 3 Stunden. Nach wie vielen Stunden ist sie 8-mal so groß?", "task_type": "free_text", "options": None, "correct_answer": "9", "explanation": "8 = 2³, also 3 Verdopplungen = 3 × 3 = 9 Stunden.", "xp_reward": 25, "difficulty": "schwer"},
        {"grade": 10, "topic": "Vektorrechnung", "question": "Addiere die Vektoren: (2,3) + (4,1)", "task_type": "free_text", "options": None, "correct_answer": "(6,4)", "explanation": "(2+4, 3+1) = (6, 4).", "xp_reward": 15, "difficulty": "mittel"},
        {"grade": 10, "topic": "Vektorrechnung", "question": "Berechne den Betrag von (3,4).", "task_type": "free_text", "options": None, "correct_answer": "5", "explanation": "|v| = √(3² + 4²) = √25 = 5.", "xp_reward": 20, "difficulty": "mittel"},
    ])
    
    return tasks

# ================== ROOT ROUTE ==================

@api_router.get("/")
async def root():
    return {"message": "Willkommen bei MatheVilla API", "version": "1.0.0"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
