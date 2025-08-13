from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
      client: AsyncIOMotorClient = None

database = Database()

async def get_database():
      return database.client[settings.mongodb_name]

async def connect_to_mongo():
      """Create database connection"""
      try:
          database.client = AsyncIOMotorClient(settings.mongodb_url)
          # Test the connection
          await database.client.admin.command('ping')
          logger.info("Connected to MongoDB successfully")
      except Exception as e:
          logger.error(f"Failed to connect to MongoDB: {e}")
          raise

async def close_mongo_connection():
      """Close database connection"""
      if database.client:
          database.client.close()
          logger.info("Disconnected from MongoDB")

  # Database collections
async def get_reports_collection():
      db = await get_database()
      return db.hlra.reports

async def get_files_collection():
      db = await get_database()
      return db.hlra.files

async def get_users_collection():
      db = await get_database()
      return db.hlra.users

async def get_family_profiles_collection():
      db = await get_database()
      return db.hlra.family_profiles

async def get_user_profile_settings_collection():
      db = await get_database()
      return db.hlra.user_profile_settings