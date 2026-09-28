import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env if present
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

class Config:
    OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://127.0.0.1:11434').strip()
    OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.2').strip()
    HINDSIGHT_API_URL = os.getenv('HINDSIGHT_API_URL', '').strip()
    HINDSIGHT_API_KEY = os.getenv('HINDSIGHT_API_KEY', '').strip()
    
    # Path to SQLite database file
    BASE_DIR = Path(__file__).resolve().parent
    DATABASE_PATH = os.getenv('DATABASE_PATH', str(BASE_DIR.parent / 'data' / 'supportmind.db'))
    
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() in ('true', '1', 't')
    PORT = int(os.getenv('PORT', 5000))
