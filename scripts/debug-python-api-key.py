#!/usr/bin/env python3
"""
Debug script to test Python service API key authentication with Nylas
This will help identify if the issue is with quotes, encoding, or other formatting problems
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables from python-crew-service/.env
env_path = os.path.join(os.path.dirname(__file__), '..', 'python-crew-service', '.env')
load_dotenv(env_path)

def test_api_key():
    print("=== Python Service API Key Diagnostic ===")
    print(f"Loading .env from: {env_path}")
    print()
    
    # Get API key from environment
    api_key = os.getenv('NYLAS_API_KEY')
    api_server = os.getenv('NYLAS_API_SERVER', 'https://api.us.nylas.com')
    
    print(f"1. API Key loaded: {api_key is not None}")
    if api_key:
        print(f"   API Key length: {len(api_key)}")
        print(f"   API Key starts with: '{api_key[:20]}...'")
        print(f"   API Key ends with: '...{api_key[-10:]}'")
        print(f"   Has quotes at start/end: {api_key.startswith('\"') or api_key.endswith('\"')}")
        print(f"   Raw repr: {repr(api_key[:30])}...")
    else:
        print("   ERROR: No API key found!")
        return
    
    print(f"2. API Server: {api_server}")
    print()
    
    # Test 1: Basic API connectivity
    print("=== Test 1: Basic API Authentication ===")
    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(f'{api_server}/v3/grants', headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ SUCCESS: Found {len(data.get('data', []))} grants")
            
            # Show available grants
            for grant in data.get('data', []):
                print(f"   Grant: {grant.get('id')} - {grant.get('email')} - Status: {grant.get('grant_status')}")
                
        elif response.status_code == 401:
            print("❌ FAILED: 401 Unauthorized - API key is invalid")
            print(f"Response: {response.text}")
            
            # Check for common issues
            if api_key.startswith('"') or api_key.endswith('"'):
                print("🔍 ISSUE DETECTED: API key has quotes - remove them from .env file")
            
        else:
            print(f"❌ FAILED: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
    
    print()
    
    # Test 2: Specific grant access (if we have grants)
    print("=== Test 2: Grant Access ===")
    test_grant_id = "ea761376-8f66-47f6-be87-6b42a2c8e736"  # From your error logs
    
    try:
        response = requests.get(f'{api_server}/v3/grants/{test_grant_id}', headers=headers, timeout=10)
        print(f"Grant {test_grant_id} - Status Code: {response.status_code}")
        
        if response.status_code == 200:
            grant_data = response.json()
            print(f"✅ Grant access successful!")
            print(f"   Email: {grant_data.get('email')}")
            print(f"   Status: {grant_data.get('grant_status')}")
            print(f"   Provider: {grant_data.get('provider')}")
        elif response.status_code == 401:
            print("❌ Grant access failed: 401 Unauthorized")
        elif response.status_code == 404:
            print("❌ Grant not found: 404 - Grant may be expired or invalid")
        else:
            print(f"❌ Grant access failed: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
    
    print()
    
    # Test 3: Message access
    print("=== Test 3: Message Access ===")
    test_message_id = "19855b118fb568ca"  # From your error logs
    
    try:
        response = requests.get(f'{api_server}/v3/grants/{test_grant_id}/messages/{test_message_id}', headers=headers, timeout=10)
        print(f"Message {test_message_id} - Status Code: {response.status_code}")
        
        if response.status_code == 200:
            message_data = response.json()
            print(f"✅ Message access successful!")
            print(f"   Subject: {message_data.get('subject')}")
            print(f"   Thread ID: {message_data.get('thread_id')}")
            print(f"   From: {message_data.get('from', [{}])[0].get('email', 'N/A')}")
        elif response.status_code == 401:
            print("❌ Message access failed: 401 Unauthorized")
        elif response.status_code == 404:
            print("❌ Message not found: 404 - Message may not exist")
        else:
            print(f"❌ Message access failed: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
    
    print()
    print("=== Summary ===")
    if api_key and (api_key.startswith('"') or api_key.endswith('"')):
        print("🔧 FIX NEEDED: Remove quotes from NYLAS_API_KEY in python-crew-service/.env")
    elif not api_key:
        print("🔧 FIX NEEDED: Add NYLAS_API_KEY to python-crew-service/.env")
    else:
        print("🔍 API key format looks correct - issue may be with grant permissions or expiration")

if __name__ == "__main__":
    test_api_key()
