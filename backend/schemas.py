from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class NoteCreate(BaseModel):
    title: str
    content: str

class MCQRequest(BaseModel):
    topic: str
    difficulty: str = "Medium"
    count: int = 5

class NotesRequest(BaseModel):
    topic: str

class StudyPlanRequest(BaseModel):
    exam: str
    today:str
    exam_date: str
    days_remaining: int
    hours_per_day: float
    subjects: list
