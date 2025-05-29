from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

_client = None

def get_mongo_client():
    global _client
    if _client is None:
        _client = MongoClient(os.environ['MONGO_URI'])
    else:
        try:
            _client.admin.command('ping')
        except Exception:
            _client = MongoClient(os.environ['MONGO_URI'])
    return _client
