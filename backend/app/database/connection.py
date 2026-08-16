from sqlalchemy import URL, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

print("=== DATABASE CONFIG ===")
print("DB_HOST:", settings.DB_HOST)
print("DB_PORT:", settings.DB_PORT)
print("DB_NAME:", settings.DB_NAME)
print("DB_USER:", settings.DB_USER)
print("=======================")

DATABASE_URL = URL.create(
    drivername="postgresql+psycopg2",
)

print("=== DATABASE URL ===")
print(
    f"postgresql+psycopg2://{settings.DB_USER}:***"
    f"@{settings.DB_HOST}:{settings.DB_PORT}"
    f"/{settings.DB_NAME}?sslmode=require"
)
print("====================")

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "host": settings.DB_HOST,
        "port": int(settings.DB_PORT),
        "dbname": settings.DB_NAME,
        "user": settings.DB_USER,
        "password": settings.DB_PASSWORD,
        "sslmode": "require",
        "connect_timeout": 10,
    },
    pool_pre_ping=True,
    pool_recycle=1800,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
