"""
Worker Autoscaler
Automatically scales workers based on queue depth.
"""

import asyncio
import logging
import subprocess
import signal
from typing import List
import redis.asyncio as redis

logger = logging.getLogger(__name__)

class WorkerAutoscaler:
    """Automatically scales reply workers based on queue depth"""
    
    def __init__(self,
                 redis_url: str = "redis://localhost:6379/0",
                 min_workers: int = 2,
                 max_workers: int = 10,
                 target_processing_time: int = 120,
                 check_interval: int = 10):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.min_workers = min_workers
        self.max_workers = max_workers
        self.target_processing_time = target_processing_time
        self.check_interval = check_interval
        self.workers: List[subprocess.Popen] = []
        self._running = False
        
    async def start(self):
        """Start the autoscaler"""
        self._running = True
        logger.info(f"Autoscaler started (min={self.min_workers}, max={self.max_workers})")
        
        # Start minimum workers
        await self._scale_to(self.min_workers)
        
        while self._running:
            try:
                await self._evaluate_and_scale()
            except Exception as e:
                logger.error(f"Autoscaler error: {e}")
            
            await asyncio.sleep(self.check_interval)
    
    async def stop(self):
        """Stop autoscaler and all workers"""
        self._running = False
        logger.info("Stopping autoscaler and all workers...")
        
        for worker in self.workers:
            try:
                worker.terminate()
                worker.wait(timeout=5)
            except:
                worker.kill()
        
        self.workers = []
        logger.info("All workers stopped")
    
    async def _evaluate_and_scale(self):
        """Evaluate queue depth and scale workers"""
        # Get queue metrics
        queue_depth = await self.redis.llen('reply_queue')
        processing_times = await self._get_recent_processing_times()
        
        current_workers = len(self.workers)
        
        # Calculate desired workers
        # Formula: each worker should handle 1 job per target_processing_time seconds
        # So if queue_depth is 10 and target is 120s, we need enough workers to clear queue in 120s
        
        if queue_depth == 0:
            desired_workers = self.min_workers
        else:
            # Estimate: each worker handles ~1 job per processing cycle
            avg_processing_time = sum(processing_times) / len(processing_times) if processing_times else 60
            jobs_per_worker = self.target_processing_time / max(avg_processing_time, 30)
            desired_workers = max(self.min_workers, int(queue_depth / jobs_per_worker))
            desired_workers = min(desired_workers, self.max_workers)
        
        # Scale if needed
        if desired_workers != current_workers:
            logger.info(f"Scaling from {current_workers} to {desired_workers} workers "
                       f"(queue_depth={queue_depth})")
            await self._scale_to(desired_workers)
    
    async def _scale_to(self, target: int):
        """Scale to target number of workers"""
        current = len(self.workers)
        
        if target > current:
            # Scale up
            for i in range(target - current):
                await self._start_worker()
        elif target < current:
            # Scale down (gracefully)
            for i in range(current - target):
                await self._stop_one_worker()
    
    async def _start_worker(self):
        """Start a new worker process"""
        worker_id = f"worker-{len(self.workers) + 1}"
        
        try:
            proc = subprocess.Popen(
                ['python', '-m', 'workers.reply_worker', '--worker-id', worker_id],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            self.workers.append(proc)
            logger.info(f"Started {worker_id} (PID: {proc.pid})")
        except Exception as e:
            logger.error(f"Failed to start worker: {e}")
    
    async def _stop_one_worker(self):
        """Stop one worker (the oldest)"""
        if not self.workers:
            return
        
        worker = self.workers.pop(0)
        try:
            worker.terminate()
            worker.wait(timeout=5)
            logger.info(f"Stopped worker (PID: {worker.pid})")
        except:
            worker.kill()
    
    async def _get_recent_processing_times(self) -> List[int]:
        """Get recent processing times from Redis"""
        # This would track actual processing times
        # For now, return empty to use defaults
        return []
    
    async def get_metrics(self) -> dict:
        """Get current scaling metrics"""
        return {
            'active_workers': len(self.workers),
            'queue_depth': await self.redis.llen('reply_queue'),
            'min_workers': self.min_workers,
            'max_workers': self.max_workers
        }


async def main():
    """Run autoscaler standalone"""
    import os
    
    scaler = WorkerAutoscaler(
        redis_url=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
        min_workers=int(os.getenv('MIN_WORKERS', '2')),
        max_workers=int(os.getenv('MAX_WORKERS', '10')),
        target_processing_time=int(os.getenv('TARGET_PROCESSING_TIME', '120'))
    )
    
    try:
        await scaler.start()
    except KeyboardInterrupt:
        await scaler.stop()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
