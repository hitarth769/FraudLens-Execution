import requests
import sys

BASE_URL = "http://127.0.0.1:8001/api"
CASE_ID = "CASE-1001"

def test_investigation_and_audit():
    print(f"--- Testing Investigation for {CASE_ID} ---")
    try:
        # 1. Run Investigation
        resp = requests.post(f"{BASE_URL}/cases/{CASE_ID}/investigate", timeout=15)
        print(f"Investigation Response Status: {resp.status_code}")

        if resp.status_code == 200:
            data = resp.json()
            source = data.get("recommendation", {}).get("narrativeSource", "MISSING")
            risk = data.get("riskLevel", "MISSING")
            print(f"Narrative Source: {source}")
            print(f"Risk Level: {risk}")
        else:
            print(f"Investigation failed: {resp.text}")
            return

        # 2. Verify Audit Chain
        print("\n--- Verifying Audit Chain ---")
        audit_resp = requests.get(f"{BASE_URL}/cases/{CASE_ID}/verify-audit", timeout=10)
        print(f"Audit Response Status: {audit_resp.status_code}")
        if audit_resp.status_code == 200:
            print(f"Audit Status: {audit_resp.json()}")
        else:
            print(f"Audit verification request failed: {audit_resp.text}")

    except Exception as e:
        print(f"EXCEPTION: {str(e)}")

if __name__ == "__main__":
    test_investigation_and_audit()
