from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Mini CRM API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT Settings
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Security
security = HTTPBearer()

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class LeadStatus(str, Enum):
    NEW = "New"
    CONTACTED = "Contacted"
    CONVERTED = "Converted"
    LOST = "Lost"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    role: UserRole = UserRole.USER
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.USER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    company: str
    owner_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    company: str

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None

class Lead(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    title: str
    description: str
    status: LeadStatus = LeadStatus.NEW
    value: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeadCreate(BaseModel):
    title: str
    description: str
    status: LeadStatus = LeadStatus.NEW
    value: float

class LeadUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[LeadStatus] = None
    value: Optional[float] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class DashboardStats(BaseModel):
    total_customers: int
    total_leads: int
    leads_by_status: dict
    total_value: float

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    """Convert ISO strings back to datetime objects"""
    if isinstance(item, dict):
        for key, value in item.items():
            if key.endswith('_at') and isinstance(value, str):
                try:
                    item[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    pass
    return item

# Auth endpoints
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user_dict = user_data.dict()
    user_dict.pop('password')
    user = User(**user_dict)
    
    user_mongo = prepare_for_mongo(user.dict())
    user_mongo['password_hash'] = hashed_password
    
    await db.users.insert_one(user_mongo)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_obj = User(**parse_from_mongo(user))
    
    # Create token
    access_token = create_access_token(data={"sub": user_obj.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

# Customer endpoints
@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate, current_user: User = Depends(get_current_user)):
    customer_dict = customer_data.dict()
    customer_dict['owner_id'] = current_user.id
    customer = Customer(**customer_dict)
    
    customer_mongo = prepare_for_mongo(customer.dict())
    await db.customers.insert_one(customer_mongo)
    
    return customer

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(
    skip: int = 0, 
    limit: int = 10, 
    search: str = "",
    current_user: User = Depends(get_current_user)
):
    query = {}
    if current_user.role != UserRole.ADMIN:
        query['owner_id'] = current_user.id
    
    if search:
        query['$or'] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}}
        ]
    
    customers = await db.customers.find(query).skip(skip).limit(limit).to_list(length=None)
    return [Customer(**parse_from_mongo(customer)) for customer in customers]

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    query = {"id": customer_id}
    if current_user.role != UserRole.ADMIN:
        query['owner_id'] = current_user.id
    
    customer = await db.customers.find_one(query)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return Customer(**parse_from_mongo(customer))

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(
    customer_id: str, 
    customer_data: CustomerUpdate, 
    current_user: User = Depends(get_current_user)
):
    query = {"id": customer_id}
    if current_user.role != UserRole.ADMIN:
        query['owner_id'] = current_user.id
    
    # Check if customer exists
    existing_customer = await db.customers.find_one(query)
    if not existing_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Update only provided fields
    update_data = {k: v for k, v in customer_data.dict().items() if v is not None}
    if update_data:
        await db.customers.update_one(query, {"$set": update_data})
    
    # Return updated customer
    updated_customer = await db.customers.find_one(query)
    return Customer(**parse_from_mongo(updated_customer))

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: User = Depends(get_current_user)):
    query = {"id": customer_id}
    if current_user.role != UserRole.ADMIN:
        query['owner_id'] = current_user.id
    
    # Delete customer
    result = await db.customers.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Delete associated leads
    await db.leads.delete_many({"customer_id": customer_id})
    
    return {"message": "Customer deleted successfully"}

# Lead endpoints
@api_router.post("/customers/{customer_id}/leads", response_model=Lead)
async def create_lead(
    customer_id: str, 
    lead_data: LeadCreate, 
    current_user: User = Depends(get_current_user)
):
    # Check if customer exists and user has access
    query = {"id": customer_id}
    if current_user.role != UserRole.ADMIN:
        query['owner_id'] = current_user.id
    
    customer = await db.customers.find_one(query)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Create lead
    lead_dict = lead_data.dict()
    lead_dict['customer_id'] = customer_id
    lead = Lead(**lead_dict)
    
    lead_mongo = prepare_for_mongo(lead.dict())
    await db.leads.insert_one(lead_mongo)
    
    return lead

@api_router.get("/customers/{customer_id}/leads", response_model=List[Lead])
async def get_customer_leads(
    customer_id: str, 
    status: Optional[LeadStatus] = None,
    current_user: User = Depends(get_current_user)
):
    # Check if customer exists and user has access
    customer_query = {"id": customer_id}
    if current_user.role != UserRole.ADMIN:
        customer_query['owner_id'] = current_user.id
    
    customer = await db.customers.find_one(customer_query)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get leads
    leads_query = {"customer_id": customer_id}
    if status:
        leads_query['status'] = status
    
    leads = await db.leads.find(leads_query).to_list(length=None)
    return [Lead(**parse_from_mongo(lead)) for lead in leads]

@api_router.get("/leads", response_model=List[Lead])
async def get_all_leads(
    status: Optional[LeadStatus] = None,
    current_user: User = Depends(get_current_user)
):
    # Build query
    leads_query = {}
    if status:
        leads_query['status'] = status
    
    # If not admin, filter by owned customers
    if current_user.role != UserRole.ADMIN:
        customer_ids = []
        customers = await db.customers.find({"owner_id": current_user.id}).to_list(length=None)
        customer_ids = [customer['id'] for customer in customers]
        leads_query['customer_id'] = {"$in": customer_ids}
    
    leads = await db.leads.find(leads_query).to_list(length=None)
    return [Lead(**parse_from_mongo(lead)) for lead in leads]

@api_router.put("/leads/{lead_id}", response_model=Lead)
async def update_lead(
    lead_id: str, 
    lead_data: LeadUpdate, 
    current_user: User = Depends(get_current_user)
):
    # Find lead
    lead = await db.leads.find_one({"id": lead_id})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Check if user has access to the customer
    if current_user.role != UserRole.ADMIN:
        customer = await db.customers.find_one({"id": lead['customer_id'], "owner_id": current_user.id})
        if not customer:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Update lead
    update_data = {k: v for k, v in lead_data.dict().items() if v is not None}
    if update_data:
        await db.leads.update_one({"id": lead_id}, {"$set": update_data})
    
    # Return updated lead
    updated_lead = await db.leads.find_one({"id": lead_id})
    return Lead(**parse_from_mongo(updated_lead))

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, current_user: User = Depends(get_current_user)):
    # Find lead
    lead = await db.leads.find_one({"id": lead_id})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Check if user has access to the customer
    if current_user.role != UserRole.ADMIN:
        customer = await db.customers.find_one({"id": lead['customer_id'], "owner_id": current_user.id})
        if not customer:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete lead
    result = await db.leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {"message": "Lead deleted successfully"}

# Dashboard endpoint
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    # Build queries based on user role
    customer_query = {}
    if current_user.role != UserRole.ADMIN:
        customer_query['owner_id'] = current_user.id
    
    # Get customers count
    total_customers = await db.customers.count_documents(customer_query)
    
    # Get customer IDs for leads filtering
    customer_ids = []
    if current_user.role != UserRole.ADMIN:
        customers = await db.customers.find(customer_query).to_list(length=None)
        customer_ids = [customer['id'] for customer in customers]
        leads_query = {"customer_id": {"$in": customer_ids}} if customer_ids else {"customer_id": {"$in": []}}
    else:
        leads_query = {}
    
    # Get leads stats
    leads = await db.leads.find(leads_query).to_list(length=None)
    total_leads = len(leads)
    
    # Group leads by status
    leads_by_status = {status.value: 0 for status in LeadStatus}
    total_value = 0
    
    for lead in leads:
        status = lead.get('status', LeadStatus.NEW)
        leads_by_status[status] = leads_by_status.get(status, 0) + 1
        total_value += lead.get('value', 0)
    
    return DashboardStats(
        total_customers=total_customers,
        total_leads=total_leads,
        leads_by_status=leads_by_status,
        total_value=total_value
    )

# Sample data seeding
@api_router.post("/seed-data")
async def seed_sample_data():
    # Check if data already exists
    user_count = await db.users.count_documents({})
    if user_count > 0:
        return {"message": "Sample data already exists"}
    
    # Create admin user
    admin_user = User(
        name="Admin User",
        email="admin@minicrm.com",
        role=UserRole.ADMIN
    )
    admin_mongo = prepare_for_mongo(admin_user.dict())
    admin_mongo['password_hash'] = hash_password("admin123")
    await db.users.insert_one(admin_mongo)
    
    # Create regular user
    regular_user = User(
        name="John Doe",
        email="john@minicrm.com",
        role=UserRole.USER
    )
    regular_mongo = prepare_for_mongo(regular_user.dict())
    regular_mongo['password_hash'] = hash_password("user123")
    await db.users.insert_one(regular_mongo)
    
    # Create sample customers
    customers_data = [
        {"name": "Alice Johnson", "email": "alice@techcorp.com", "phone": "+1-555-0101", "company": "TechCorp Inc", "owner_id": regular_user.id},
        {"name": "Bob Smith", "email": "bob@innovate.co", "phone": "+1-555-0102", "company": "Innovate Solutions", "owner_id": regular_user.id},
        {"name": "Carol Wilson", "email": "carol@startupx.io", "phone": "+1-555-0103", "company": "StartupX", "owner_id": admin_user.id},
        {"name": "David Brown", "email": "david@enterprise.com", "phone": "+1-555-0104", "company": "Enterprise LLC", "owner_id": admin_user.id},
    ]
    
    customer_objects = []
    for customer_data in customers_data:
        customer = Customer(**customer_data)
        customer_mongo = prepare_for_mongo(customer.dict())
        await db.customers.insert_one(customer_mongo)
        customer_objects.append(customer)
    
    # Create sample leads
    leads_data = [
        {"customer_id": customer_objects[0].id, "title": "Website Redesign", "description": "Complete website overhaul", "status": LeadStatus.NEW, "value": 15000.0},
        {"customer_id": customer_objects[0].id, "title": "Mobile App", "description": "iOS and Android app development", "status": LeadStatus.CONTACTED, "value": 25000.0},
        {"customer_id": customer_objects[1].id, "title": "CRM Integration", "description": "Integrate with existing CRM", "status": LeadStatus.CONVERTED, "value": 8000.0},
        {"customer_id": customer_objects[1].id, "title": "Data Migration", "description": "Migrate legacy data", "status": LeadStatus.LOST, "value": 5000.0},
        {"customer_id": customer_objects[2].id, "title": "Cloud Setup", "description": "AWS cloud infrastructure", "status": LeadStatus.NEW, "value": 12000.0},
        {"customer_id": customer_objects[3].id, "title": "Security Audit", "description": "Complete security assessment", "status": LeadStatus.CONTACTED, "value": 10000.0},
    ]
    
    for lead_data in leads_data:
        lead = Lead(**lead_data)
        lead_mongo = prepare_for_mongo(lead.dict())
        await db.leads.insert_one(lead_mongo)
    
    return {"message": "Sample data created successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()