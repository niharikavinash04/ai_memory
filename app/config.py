import os
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

class Settings:
    def __init__(self):
        self.app_name: str = os.getenv("APP_NAME", "AI Work Memory")
        self.app_env: str = os.getenv("APP_ENV", "development")
        self.log_level: str = os.getenv("LOG_LEVEL", "INFO")
        self.host: str = os.getenv("HOST", "0.0.0.0")
        self.port: int = int(os.getenv("PORT", "8000"))
        
        # Database URL handling with Supabase preference
        db_url = os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL", "sqlite:///./ai_work_memory.db")
        
        # Normalize legacy postgres:// prefix to postgresql:// for SQLAlchemy compatibility
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
            
        self.database_url: str = db_url
        self.supabase_url: str = os.getenv("SUPABASE_URL", "")
        self.supabase_key: str = os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_ANON_KEY", ""))

settings = Settings()
