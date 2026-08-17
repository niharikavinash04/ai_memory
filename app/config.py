import os

class Settings:
    def __init__(self):
        self.app_name: str = os.getenv("APP_NAME", "AI Work Memory")
        self.app_env: str = os.getenv("APP_ENV", "development")
        self.log_level: str = os.getenv("LOG_LEVEL", "INFO")
        self.host: str = os.getenv("HOST", "0.0.0.0")
        self.port: int = int(os.getenv("PORT", "8000"))
        self.database_url: str = os.getenv(
            "DATABASE_URL",
            "sqlite:///./ai_work_memory.db"
        )

settings = Settings()
