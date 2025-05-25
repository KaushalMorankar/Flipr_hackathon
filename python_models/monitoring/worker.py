#/monitoring/worker.py

import asyncio
import json
from monitoring.qa_engine import analyze_conversation
from monitoring.feedback import generate_coaching_plan
from monitoring.data_handler import r

async def qa_worker():
    pubsub = r.pubsub()
    await pubsub.subscribe("agent_interactions")
    async for message in pubsub.listen():
        if message["type"] == "message":
            ticket = json.loads(message["data"])
            analysis = analyze_conversation(ticket["conversation"])
            feedback = generate_coaching_plan(analysis)
            print(f"⚠️ QA Alert for {ticket['ticketId']}: {feedback}")
            # Save feedback to Redis or trigger notifications

# Run worker in background
asyncio.create_task(qa_worker())