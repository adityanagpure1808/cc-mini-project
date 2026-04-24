import asyncio
import uuid
import os
import logging

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, String, Float
from sqlalchemy.future import select
import httpx

from auth import verify_token

# ================= LOGGING =================
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# ================= DATABASE =================
DATABASE_URL = os.environ["DATABASE_URL"]

# USER_SERVICE_URL — configurable so it works in both docker-compose and K8s
USER_SERVICE_URL = os.environ.get("USER_SERVICE_URL", "http://user-service:8000")

engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

# ================= MODEL =================
class Order(Base):
    __tablename__ = "orders"

    id      = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False)
    product = Column(String, nullable=False)
    amount  = Column(Float,  nullable=False)

# ================= SCHEMAS =================
class OrderCreate(BaseModel):
    user_id: str
    product: str
    amount: float

class OrderResponse(BaseModel):
    id: str
    user_id: str
    product: str
    amount: float

    class Config:
        from_attributes = True

# ================= APP =================
app = FastAPI(title="Order Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= STARTUP =================
@app.on_event("startup")
async def startup():
    for i in range(15):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("✅ Order DB connected")
            return
        except Exception as e:
            logger.info(f"⏳ Waiting for DB... attempt {i + 1}: {e}")
            await asyncio.sleep(2)
    raise RuntimeError("❌ DB connection failed after 15 attempts")

# ================= DB DEPENDENCY =================
async def get_db():
    async with SessionLocal() as session:
        yield session

# ================= ROUTES =================

@app.post("/api/orders", response_model=OrderResponse, status_code=201)
async def create_order(
    order: OrderCreate,
    db: AsyncSession = Depends(get_db),
    user_id_from_token: str = Depends(verify_token),
):
    if order.user_id != user_id_from_token:
        raise HTTPException(status_code=403, detail="Forbidden: token does not match user_id")

    # Verify user exists in user-service (with retry)
    async with httpx.AsyncClient(timeout=5.0) as client:
        for attempt in range(3):
            try:
                res = await client.get(f"{USER_SERVICE_URL}/api/users/{order.user_id}")
                break
            except Exception as e:
                logger.warning(f"User-service unreachable (attempt {attempt + 1}): {e}")
                await asyncio.sleep(1)
        else:
            raise HTTPException(status_code=503, detail="User service unavailable")

    if res.status_code == 404:
        raise HTTPException(status_code=404, detail="User not found")

    new_order = Order(user_id=order.user_id, product=order.product, amount=order.amount)
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    logger.info(f"Order created: {new_order.id} for user {new_order.user_id}")
    return new_order


@app.get("/api/orders", response_model=list[OrderResponse])
async def get_orders(
    db: AsyncSession = Depends(get_db),
    user_id_from_token: str = Depends(verify_token),
):
    result = await db.execute(select(Order).where(Order.user_id == user_id_from_token))
    return result.scalars().all()


@app.get("/health")
async def health():
    return {"status": "ok", "service": "order-service"}
