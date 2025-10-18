from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from agents.apollo_discovery_agent import create_apollo_discovery_agent
from crewai import LLM

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class ICPCriteria(BaseModel):
    industries: List[str]
    job_titles: List[str]
    locations: Optional[List[str]] = []
    company_sizes: Optional[List[str]] = []
    max_results: Optional[int] = 100

class ApolloDiscoveryRequest(BaseModel):
    user_id: str
    icp_criteria: ICPCriteria

class ApolloDiscoveryResponse(BaseModel):
    success: bool
    total_discovered: int
    organizations_found: int
    leads: List[Dict[str, Any]]
    query_details: Dict[str, Any]
    error: Optional[str] = None

@router.post("/apollo-discovery", response_model=ApolloDiscoveryResponse)
async def discover_leads(request: ApolloDiscoveryRequest):
    """
    Discover leads using Apollo's two-stage search process.
    
    Stage 1: Find organizations matching industry criteria
    Stage 2: Find people with specific job titles at those organizations
    """
    try:
        logger.info(f"Starting Apollo discovery for user {request.user_id}")
        logger.info(f"ICP Criteria: {request.icp_criteria.dict()}")
        
        # Create LLM instance (though not used directly in Apollo calls)
        llm = LLM(model="gpt-4o-mini", temperature=0.1)
        
        # Create Apollo discovery agent
        apollo_agent = create_apollo_discovery_agent(llm)
        
        # Prepare ICP criteria for the agent
        icp_criteria = {
            "industries": request.icp_criteria.industries,
            "job_titles": request.icp_criteria.job_titles,
            "locations": request.icp_criteria.locations or [],
            "company_sizes": request.icp_criteria.company_sizes or [],
        }
        
        # Execute discovery
        logger.info("Executing Apollo lead discovery...")
        discovery_result = apollo_agent.discover_leads(
            icp_criteria=icp_criteria,
            max_results=request.icp_criteria.max_results
        )
        
        logger.info(f"Discovery completed. Success: {discovery_result.get('success', False)}")
        logger.info(f"Total leads found: {discovery_result.get('total_discovered', 0)}")
        
        if not discovery_result.get('success', False):
            raise HTTPException(
                status_code=400,
                detail=f"Apollo discovery failed: {discovery_result.get('error', 'Unknown error')}"
            )
        
        # Format response
        response = ApolloDiscoveryResponse(
            success=True,
            total_discovered=discovery_result.get('total_discovered', 0),
            organizations_found=discovery_result.get('organizations_found', 0),
            leads=discovery_result.get('leads', []),
            query_details={
                "industries": request.icp_criteria.industries,
                "job_titles": request.icp_criteria.job_titles,
                "locations": request.icp_criteria.locations,
                "company_sizes": request.icp_criteria.company_sizes,
                "max_results": request.icp_criteria.max_results
            }
        )
        
        logger.info(f"Returning {len(response.leads)} leads to client")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Apollo discovery error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during Apollo discovery: {str(e)}"
        )
