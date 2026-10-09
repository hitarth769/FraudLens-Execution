import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8001/api"
SCENARIOS = [
    {"id": "CASE-1001", "expected": "CARD_TESTING"},
    {"id": "CASE-1002", "expected": "ACCOUNT_TAKEOVER"},
    {"id": "CASE-1003", "expected": "MULE_NETWORK"},
    {"id": "CASE-1004", "expected": "BENIGN"},
    {"id": "CASE-1005", "expected": "COMBINED"},
]

def evaluate():
    results = []
    print(f"{'Case ID':<12} | {'Scenario':<15} | {'Score':<6} | {'Level':<10} | {'Patterns':<30} | {'Audit':<10}")
    print("-" * 90)

    for s in SCENARIOS:
        try:
            # 1. Trigger Investigation
            resp = requests.post(f"{BASE_URL}/cases/{s['id']}/investigate", timeout=15)
            if resp.status_code != 200:
                print(f"{s['id']:<12} | FAILED: {resp.status_code}")
                results.append({"id": s['id'], "status": "FAILED", "error": resp.text})
                continue

            data = resp.json()
            score = data.get("riskScore", 0)
            level = data.get("riskLevel", "UNKNOWN")
            patterns = ",".join(data.get("patterns", []))

            # 2. Verify Audit Chain
            audit_resp = requests.get(f"{BASE_URL}/cases/{s['id']}/verify-audit", timeout=10)
            audit_status = "PASS" if audit_resp.status_code == 200 and audit_resp.json().get("status") == "verified" else "FAIL"

            print(f"{s['id']:<12} | {s['expected']:<15} | {score:<6} | {level:<10} | {patterns:<30} | {audit_status:<10}")

            results.append({
                "id": s['id'],
                "expected": s['expected'],
                "actual_score": score,
                "actual_level": level,
                "actual_patterns": patterns,
                "audit": audit_status,
                "status": "SUCCESS"
            })
        except Exception as e:
            print(f"{s['id']:<12} | ERROR: {str(e)}")
            results.append({"id": s['id'], "status": "ERROR", "error": str(e)})

    return results

if __name__ == "__main__":
    evaluate()
