from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.db.base import Base

connect_args = {}
engine_kwargs = {
    "pool_pre_ping": True,
}

if settings.database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    # Connection pooling parameters optimized for Supabase PostgreSQL
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Import models so Base.metadata contains table definitions
    import app.models.knowledge  # noqa: F401
    Base.metadata.create_all(bind=engine)
