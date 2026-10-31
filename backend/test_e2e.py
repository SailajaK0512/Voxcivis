import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_voxcivis_e2e():
    print("==================================================")
    print("VOXCIVIS COMPREHENSIVE END-TO-END VERIFICATION")
    print("==================================================")

    # 1. Meta Endpoints
    print("\n1. Testing Meta & Reference Endpoints...")
    depts_res = requests.get(f"{BASE_URL}/api/meta/departments")
    assert depts_res.status_code == 200, f"Expected 200, got {depts_res.status_code}"
    depts = depts_res.json()
    print(f"   [PASS] Loaded {len(depts)} municipal departments:")
    for d in depts[:3]:
        print(f"          - {d['name']} ({d['code']})")

    locs_res = requests.get(f"{BASE_URL}/api/meta/locations")
    assert locs_res.status_code == 200
    locs = locs_res.json()
    print(f"   [PASS] Loaded {len(locs)} official states with dropdown districts.")

    # 2. Registration with Validation
    print("\n2. Testing User Registration & Password Rules...")
    new_citizen_user = f"citizen_test_{int(time.time())}"
    # Test weak password rejection (< 6 chars or no number)
    weak_res = requests.post(f"{BASE_URL}/api/auth/register", json={
        "username": new_citizen_user,
        "password": "abc",  # Too short and no number
        "id_number": f"ID-{int(time.time())}",
        "date_of_birth": "1995-01-01",
        "phone_number": "9998887776",
        "state": "Maharashtra",
        "district": "Pune",
        "mandal": "Kothrud",
        "sector": "Sector 5",
        "village_name": "Kothrud",
        "pincode": "411038",
        "address": "Test Avenue 10",
        "role": "citizen"
    })
    assert weak_res.status_code == 422, f"Weak password should be rejected, got {weak_res.status_code}"
    print("   [PASS] Password validation correctly rejected password with < 6 chars.")

    # Valid registration
    reg_res = requests.post(f"{BASE_URL}/api/auth/register", json={
        "username": new_citizen_user,
        "password": "securePass123",
        "id_number": f"ID-{int(time.time())}",
        "date_of_birth": "1995-01-01",
        "phone_number": "9998887776",
        "state": "Maharashtra",
        "district": "Pune",
        "mandal": "Kothrud",
        "sector": "Sector 5",
        "village_name": "Kothrud",
        "pincode": "411038",
        "address": "Test Avenue 10",
        "role": "citizen"
    })
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    citizen_token = reg_res.json()["access_token"]
    citizen_id = reg_res.json()["user"]["id"]
    print(f"   [PASS] Registered citizen '{new_citizen_user}' (ID: {citizen_id}).")

    # 3. Authentication & RBAC Boundaries
    print("\n3. Testing Role-Based Authentication...")
    # Admin login
    admin_login = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    print("   [PASS] Admin authentication successful.")

    # Worker login
    worker_login = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "worker_power", "password": "worker123"})
    assert worker_login.status_code == 200
    worker_token = worker_login.json()["access_token"]
    worker_data = worker_login.json()["user"]
    print(f"   [PASS] Worker authentication successful. Department: {worker_data['department_name']} (ID: {worker_data['department_id']}).")

    # RBAC boundary test: Citizen attempts to access Admin Metrics
    unauth_admin = requests.get(f"{BASE_URL}/api/admin/metrics", headers={"Authorization": f"Bearer {citizen_token}"})
    assert unauth_admin.status_code == 403, f"Citizen should be forbidden from admin metrics, got {unauth_admin.status_code}"
    print("   [PASS] RBAC Boundary: Citizen forbidden from accessing Admin metrics (403 Forbidden).")

    # RBAC boundary test: Worker attempts to access Admin Central database
    unauth_worker = requests.get(f"{BASE_URL}/api/complaints", headers={"Authorization": f"Bearer {worker_token}"})
    assert unauth_worker.status_code == 403, f"Worker should be forbidden from admin complaint list, got {unauth_worker.status_code}"
    print("   [PASS] RBAC Boundary: Worker forbidden from accessing Admin master complaint list (403 Forbidden).")

    # 4. ML Complaint Submission, Classification & Hazard Scoring
    print("\n4. Testing Citizen Grievance Submission with ML Routing...")
    test_pincode = f"41{int(time.time()) % 10000:04d}"
    complaint_payload = {
        "complaint_text": "High voltage transformer sparks and live overhead electrical wires fallen on sidewalk",
        "address": "Bavdhan Main Road, near petrol pump",
        "pincode": test_pincode,
        "area_importance": 10
    }
    comp_res = requests.post(
        f"{BASE_URL}/api/complaints",
        json=complaint_payload,
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert comp_res.status_code == 200, f"Complaint submission failed: {comp_res.text}"
    comp = comp_res.json()
    print(f"   [PASS] Complaint #{comp['id']} created.")
    print(f"          - ML Classified Department: {comp['department_name']} (Expected Electricity & Power)")
    print(f"          - Severe Hazard Detected: {comp['is_severe']}")
    print(f"          - Priority Score: {comp['priority_score']} pts ({comp['priority_classification']})")
    assert comp["department_name"] == "Electricity & Power", f"Expected Electricity & Power, got {comp['department_name']}"
    assert comp["is_severe"] == True, "Expected is_severe to be True"
    assert comp["priority_score"] >= 40, f"Expected priority >= 40, got {comp['priority_score']}"

    # 5. Duplicate Complaint Grouping & Priority Escalation
    print("\n5. Testing Duplicate Incident Detection & Dynamic Score Recalculation...")
    duplicate_payload = {
        "complaint_text": "Live electrical wires fallen and sparks from high voltage transformer on Bavdhan sidewalk",
        "address": "Opposite petrol pump, Bavdhan Main Road",
        "pincode": test_pincode,  # Same pincode
        "area_importance": 10
    }
    dup_res = requests.post(
        f"{BASE_URL}/api/complaints",
        json=duplicate_payload,
        headers={"Authorization": f"Bearer {admin_token}"}  # Submitted by another user
    )
    assert dup_res.status_code == 200
    dup_comp = dup_res.json()
    print(f"   [PASS] Duplicate matched to Parent Complaint #{dup_comp['id']}:")
    print(f"          - Total Citizen Reports: {dup_comp['number_of_reports']}")
    print(f"          - Updated Priority Score: {dup_comp['priority_score']} pts (Escalated to {dup_comp['priority_classification']})")
    assert dup_comp["id"] == comp["id"], f"Expected to link to #{comp['id']}, got #{dup_comp['id']}"
    assert dup_comp["number_of_reports"] == 2, f"Expected 2 reports, got {dup_comp['number_of_reports']}"

    # 6. Worker Department Queue & Operations
    print("\n6. Testing Worker Department Queue & Resolution Workflow...")
    worker_queue_res = requests.get(f"{BASE_URL}/api/worker/complaints", headers={"Authorization": f"Bearer {worker_token}"})
    assert worker_queue_res.status_code == 200
    worker_queue = worker_queue_res.json()
    print(f"   [PASS] Worker sees {len(worker_queue)} complaints strictly for department '{worker_data['department_name']}'.")
    for w_comp in worker_queue:
        assert w_comp["department_id"] == worker_data["department_id"], "Worker accessed unauthorized department!"

    # Worker Updates Status to 'In Progress'
    status_update_res = requests.patch(
        f"{BASE_URL}/api/complaints/{comp['id']}/status",
        json={"status": "In Progress", "note": "Technician team dispatched with bucket truck"},
        headers={"Authorization": f"Bearer {worker_token}"}
    )
    assert status_update_res.status_code == 200
    print(f"   [PASS] Worker changed status of complaint #{comp['id']} to 'In Progress'.")

    # Worker Dispatches Delay Notification
    delay_res = requests.post(
        f"{BASE_URL}/api/complaints/{comp['id']}/delay",
        json={"message": "Specialized replacement transformer requires scheduled 3-hour sub-grid shutdown."},
        headers={"Authorization": f"Bearer {worker_token}"}
    )
    assert delay_res.status_code == 200
    print(f"   [PASS] Worker issued formal delay advisory to citizen.")

    # 7. Citizen Notifications Verification
    print("\n7. Testing Citizen Status Updates & Delay Notifications...")
    notifs_res = requests.get(f"{BASE_URL}/api/notifications/my", headers={"Authorization": f"Bearer {citizen_token}"})
    assert notifs_res.status_code == 200
    notifs = notifs_res.json()
    print(f"   [PASS] Citizen received {len(notifs)} real-time notifications:")
    for n in notifs:
        print(f"          - [{n['message_type']}] {n['message'][:75]}...")

    # 8. Admin Dashboard Analytics Verification
    print("\n8. Testing Admin Metrics, Distribution Pie & Trend Analytics...")
    metrics_res = requests.get(f"{BASE_URL}/api/admin/metrics", headers={"Authorization": f"Bearer {admin_token}"})
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    print(f"   [PASS] Admin Metrics: Total: {metrics['total_cases']}, Critical/Severe: {metrics['critical_severe_cases']}, Pending: {metrics['pending_cases']}, In Progress: {metrics['in_progress_cases']}, Solved: {metrics['solved_cases']}")

    dept_dist_res = requests.get(f"{BASE_URL}/api/admin/dept-distribution", headers={"Authorization": f"Bearer {admin_token}"})
    assert dept_dist_res.status_code == 200
    dept_dist = dept_dist_res.json()
    print(f"   [PASS] Department Distribution Pie Data: {len(dept_dist)} department categories.")

    trends_res = requests.get(f"{BASE_URL}/api/admin/monthly-trends", headers={"Authorization": f"Bearer {admin_token}"})
    assert trends_res.status_code == 200
    trends = trends_res.json()
    print(f"   [PASS] Monthly Area Trends Data: {len(trends)} area groupings.")

    print("\n==================================================")
    print("ALL VOXCIVIS SYSTEM VERIFICATION TESTS PASSED (100% SUCCESS)!")
    print("==================================================")

if __name__ == "__main__":
    test_voxcivis_e2e()
