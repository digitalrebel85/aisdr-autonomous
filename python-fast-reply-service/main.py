"""
Main entry point - starts all services
"""

import asyncio
import logging
import os
from dotenv import load_dotenv

from detection.router import DetectionRouter
from detection.webhook_server import start_webhook_server
from orchestration.scaler import WorkerAutoscaler

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

async def main():
    """Start all services"""
    logger.info("Starting AISDR Fast Reply System...")
    
    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    
    # Create services
    router = DetectionRouter(redis_url=redis_url)
    autoscaler = WorkerAutoscaler(
        redis_url=redis_url,
        min_workers=int(os.getenv('MIN_WORKERS', '2')),
        max_workers=int(os.getenv('MAX_WORKERS', '10'))
    )
    
    # Start all services concurrently
    tasks = [
        router.start(),
        start_webhook_server(
            host=os.getenv('WEBHOOK_HOST', '0.0.0.0'),
            port=int(os.getenv('WEBHOOK_PORT', '8001'))
        ),
        autoscaler.start()
    ]
    
    try:
        await asyncio.gather(*tasks)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        await autoscaler.stop()

if __name__ == "__main__":
    asyncio.run(main())
