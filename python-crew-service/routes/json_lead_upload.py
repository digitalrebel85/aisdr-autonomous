"""
JSON Lead Upload API Endpoint
Handles intelligent processing of unstructured lead data
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, ValidationError
from typing import List, Dict, Any, Optional
import json
import asyncio
from datetime import datetime
import logging

from agents.lead_processing_agent import (
    RawLeadInput, 
    ProcessedLead, 
    process_raw_lead_data, 
    process_bulk_leads
)
from database.supabase_client import get_supabase_client
from utils.auth import verify_user_token, get_user_api_keys

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/leads", tags=["JSON Lead Processing"])
security = HTTPBearer()

class JSONLeadUploadRequest(BaseModel):
    leads: List[Dict[str, Any]] = Field(description="List of raw lead data objects")
    processing_options: Optional[Dict[str, Any]] = Field(
        default={},
        description="Processing options like batch_size, confidence_threshold, etc."
    )
    auto_enrich: bool = Field(
        default=True, 
        description="Whether to automatically enrich leads after processing"
    )

class JSONLeadUploadResponse(BaseModel):
    success: bool
    message: str
    processed_count: int
    failed_count: int
    processing_id: str
    results: List[Dict[str, Any]]
    summary: Dict[str, Any]

class LeadProcessingStatus(BaseModel):
    processing_id: str
    status: str  # "pending", "processing", "completed", "failed"
    progress: float  # 0.0 to 1.0
    processed_count: int
    total_count: int
    results: List[ProcessedLead]
    errors: List[str]
    started_at: datetime
    completed_at: Optional[datetime] = None

# In-memory storage for processing status (in production, use Redis or database)
processing_status_store: Dict[str, LeadProcessingStatus] = {}

@router.post("/upload-json", response_model=JSONLeadUploadResponse)
async def upload_json_leads(
    request: JSONLeadUploadRequest,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Upload and process leads from JSON format with AI-powered data extraction
    """
    try:
        # Verify user authentication
        user_id = await verify_user_token(credentials.credentials)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        
        # Get user's API keys for enrichment
        user_api_keys = await get_user_api_keys(user_id)
        
        # Validate and parse raw leads
        raw_leads = []
        parsing_errors = []
        
        for i, lead_data in enumerate(request.leads):
            try:
                # Handle flexible input formats
                if isinstance(lead_data, str):
                    # Simple string input
                    raw_lead = RawLeadInput(
                        raw_data=lead_data,
                        source="json_upload"
                    )
                elif isinstance(lead_data, dict):
                    # Structured input
                    raw_lead = RawLeadInput(
                        raw_data=lead_data.get("raw_data", lead_data.get("text", str(lead_data))),
                        metadata=lead_data.get("metadata", {}),
                        source=lead_data.get("source", "json_upload"),
                        notes=lead_data.get("notes", "")
                    )
                else:
                    raise ValueError(f"Invalid lead data format at index {i}")
                
                raw_leads.append(raw_lead)
                
            except Exception as e:
                parsing_errors.append(f"Lead {i}: {str(e)}")
                logger.error(f"Error parsing lead {i}: {e}")
        
        if not raw_leads:
            raise HTTPException(
                status_code=400, 
                detail=f"No valid leads found. Errors: {parsing_errors}"
            )
        
        # Create processing ID and status
        processing_id = f"json_upload_{user_id}_{int(datetime.utcnow().timestamp())}"
        
        processing_status = LeadProcessingStatus(
            processing_id=processing_id,
            status="pending",
            progress=0.0,
            processed_count=0,
            total_count=len(raw_leads),
            results=[],
            errors=parsing_errors,
            started_at=datetime.utcnow()
        )
        
        processing_status_store[processing_id] = processing_status
        
        # Start background processing
        background_tasks.add_task(
            process_leads_background,
            processing_id,
            raw_leads,
            user_id,
            user_api_keys,
            request.processing_options,
            request.auto_enrich
        )
        
        # Return immediate response
        return JSONLeadUploadResponse(
            success=True,
            message=f"Started processing {len(raw_leads)} leads",
            processed_count=0,
            failed_count=len(parsing_errors),
            processing_id=processing_id,
            results=[],
            summary={
                "total_leads": len(raw_leads),
                "parsing_errors": len(parsing_errors),
                "status": "processing_started",
                "estimated_time_minutes": len(raw_leads) * 0.5  # Rough estimate
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in JSON lead upload: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

async def process_leads_background(
    processing_id: str,
    raw_leads: List[RawLeadInput],
    user_id: str,
    user_api_keys: Dict[str, str],
    processing_options: Dict[str, Any],
    auto_enrich: bool
):
    """Background task to process leads with AI"""
    
    status = processing_status_store[processing_id]
    status.status = "processing"
    
    try:
        # Process leads in batches
        batch_size = processing_options.get("batch_size", 10)
        confidence_threshold = processing_options.get("confidence_threshold", 0.3)
        
        processed_leads = []
        failed_count = 0
        
        for i in range(0, len(raw_leads), batch_size):
            batch = raw_leads[i:i + batch_size]
            
            try:
                # Process batch with AI
                batch_results = process_bulk_leads(batch, user_api_keys)
                
                # Filter by confidence threshold
                for result in batch_results:
                    if result.confidence_score >= confidence_threshold:
                        processed_leads.append(result)
                    else:
                        failed_count += 1
                        status.errors.append(
                            f"Low confidence ({result.confidence_score:.2f}) for lead: {result.raw_input[:50]}..."
                        )
                
                # Update progress
                status.processed_count = len(processed_leads)
                status.progress = min(1.0, (i + batch_size) / len(raw_leads))
                status.results = processed_leads
                
                logger.info(f"Processed batch {i//batch_size + 1}, total leads: {len(processed_leads)}")
                
            except Exception as e:
                failed_count += len(batch)
                status.errors.append(f"Batch processing error: {str(e)}")
                logger.error(f"Error processing batch {i//batch_size + 1}: {e}")
        
        # Save processed leads to database
        if processed_leads:
            await save_processed_leads_to_db(processed_leads, user_id)
        
        # Auto-enrich if requested
        if auto_enrich and processed_leads:
            await trigger_auto_enrichment(processed_leads, user_id, user_api_keys)
        
        # Update final status
        status.status = "completed"
        status.completed_at = datetime.utcnow()
        status.progress = 1.0
        
        logger.info(f"Completed processing {processing_id}: {len(processed_leads)} successful, {failed_count} failed")
        
    except Exception as e:
        status.status = "failed"
        status.errors.append(f"Processing failed: {str(e)}")
        status.completed_at = datetime.utcnow()
        logger.error(f"Background processing failed for {processing_id}: {e}")

async def save_processed_leads_to_db(processed_leads: List[ProcessedLead], user_id: str):
    """Save processed leads to Supabase database"""
    
    try:
        supabase = get_supabase_client()
        
        # Convert processed leads to database format
        db_leads = []
        for lead in processed_leads:
            db_lead = {
                "user_id": user_id,
                "email": lead.email,
                "first_name": lead.first_name,
                "last_name": lead.last_name,
                "company": lead.company,
                "title": lead.title,
                "phone": lead.phone,
                "linkedin_url": lead.linkedin_url,
                "company_domain": lead.company_domain,
                "location": lead.location,
                "industry": lead.industry,
                "company_size": lead.company_size,
                "notes": f"AI Processed | Confidence: {lead.confidence_score:.2f} | Source: {lead.source}",
                "raw_data": json.dumps({
                    "original_input": lead.raw_input,
                    "extracted_fields": lead.extracted_fields,
                    "missing_fields": lead.missing_fields,
                    "processing_notes": lead.processing_notes,
                    "confidence_score": lead.confidence_score
                }),
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Only add leads with email (required field)
            if db_lead["email"]:
                db_leads.append(db_lead)
        
        if db_leads:
            # Insert leads into database
            result = supabase.table("leads").insert(db_leads).execute()
            logger.info(f"Saved {len(db_leads)} processed leads to database")
            return result
        else:
            logger.warning("No leads with email addresses to save")
            return None
            
    except Exception as e:
        logger.error(f"Error saving leads to database: {e}")
        raise

async def trigger_auto_enrichment(processed_leads: List[ProcessedLead], user_id: str, user_api_keys: Dict[str, str]):
    """Trigger automatic enrichment for processed leads"""
    
    try:
        # Import enrichment functions
        # from routes.enrich_leads import enrich_leads_batch  # Import when available
        
        # Get emails of processed leads for enrichment
        emails_to_enrich = [lead.email for lead in processed_leads if lead.email]
        
        if emails_to_enrich:
            logger.info(f"Starting auto-enrichment for {len(emails_to_enrich)} leads")
            
            # TODO: Implement batch enrichment when available
            # await enrich_leads_batch(emails_to_enrich, user_id, user_api_keys)
            
            logger.info(f"Auto-enrichment queued for {len(emails_to_enrich)} leads")
        
    except Exception as e:
        logger.error(f"Error in auto-enrichment: {e}")
        # Don't fail the main process if enrichment fails

@router.get("/processing-status/{processing_id}")
async def get_processing_status(
    processing_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get the status of a lead processing job"""
    
    try:
        # Verify user authentication
        user_id = await verify_user_token(credentials.credentials)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        
        # Check if processing ID exists and belongs to user
        if processing_id not in processing_status_store:
            raise HTTPException(status_code=404, detail="Processing job not found")
        
        status = processing_status_store[processing_id]
        
        # Verify ownership (processing_id contains user_id)
        if user_id not in processing_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "processing_id": processing_id,
            "status": status.status,
            "progress": status.progress,
            "processed_count": status.processed_count,
            "total_count": status.total_count,
            "error_count": len(status.errors),
            "errors": status.errors[-5:],  # Last 5 errors
            "started_at": status.started_at,
            "completed_at": status.completed_at,
            "results_preview": [
                {
                    "email": result.email,
                    "full_name": result.full_name,
                    "company": result.company,
                    "confidence_score": result.confidence_score
                }
                for result in status.results[:5]  # First 5 results
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting processing status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test-processing")
async def test_lead_processing(
    test_data: Dict[str, Any],
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Test endpoint for lead processing without saving to database"""
    
    try:
        # Verify user authentication
        user_id = await verify_user_token(credentials.credentials)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        
        # Get user's API keys
        user_api_keys = await get_user_api_keys(user_id)
        
        # Create raw lead input
        raw_lead = RawLeadInput(
            raw_data=test_data.get("raw_data", ""),
            metadata=test_data.get("metadata", {}),
            source=test_data.get("source", "test"),
            notes=test_data.get("notes", "")
        )
        
        # Process the lead
        processed_lead = process_raw_lead_data(raw_lead, user_api_keys)
        
        return {
            "success": True,
            "processed_lead": processed_lead.model_dump(),
            "extraction_summary": {
                "confidence_score": processed_lead.confidence_score,
                "extracted_fields": processed_lead.extracted_fields,
                "missing_fields": processed_lead.missing_fields,
                "processing_notes": processed_lead.processing_notes
            }
        }
        
    except Exception as e:
        logger.error(f"Error in test processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))
