import asyncio
from src.services.ContentSchedulerService import ContentSchedulerService
from pymongo import MongoClient
import json
import os

MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/flodrama")
REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
SQS_QUEUE_URL = os.environ.get("SQS_QUEUE_URL", "https://sqs.<region>.amazonaws.com/<account_id>/<queue_name>")

async def main():
    # 1. Lancer le scraping général
    scheduler = ContentSchedulerService(MONGODB_URI, REDIS_HOST, SQS_QUEUE_URL)
    await scheduler.schedule_scraping_tasks()
    print("Scraping général déclenché. Attente de complétion...")
    await asyncio.sleep(600)  # Attendre 10 min (ajuster selon volume)

    # 2. Analyse du schéma MongoDB
    client = MongoClient(MONGODB_URI)
    db = client.flodrama
    sample = list(db.contents.find().limit(20))
    with open("scraping_schema_report.json", "w") as f:
        json.dump(sample, f, indent=2)
    print("Rapport de schéma généré : scraping_schema_report.json")

if __name__ == "__main__":
    asyncio.run(main())
