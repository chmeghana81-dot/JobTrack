from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import JobApplication, SavedJob


class AuthenticationTests(APITestCase):
    def setUp(self):
        self.username = "testuser"
        self.password = "Secr3tPass!123"
        self.user = User.objects.create_user(
            username=self.username, password=self.password
        )
        self.token_url = "/api/token/"
        self.refresh_url = "/api/token/refresh/"

    def test_obtain_token_success(self):
        response = self.client.post(
            self.token_url,
            {"username": self.username, "password": self.password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_obtain_token_invalid_credentials(self):
        response = self.client.post(
            self.token_url,
            {"username": self.username, "password": "wrongpassword"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token_success(self):
        obtain_response = self.client.post(
            self.token_url,
            {"username": self.username, "password": self.password},
            format="json",
        )
        refresh_token = obtain_response.data["refresh"]

        refresh_response = self.client.post(
            self.refresh_url,
            {"refresh": refresh_token},
            format="json",
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_response.data)

    def test_unauthenticated_api_root_and_endpoints(self):
        # Root API and protected endpoints must return 401 without token
        response = self.client.get("/api/jobs/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.get("/api/saved-jobs/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_register_new_user_success(self):
        payload = {
            "username": "newcandidate",
            "email": "newcandidate@example.com",
            "full_name": "Jane Doe",
            "password": "StrongPassword!987",
            "confirm_password": "StrongPassword!987",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["username"], "newcandidate")
        self.assertEqual(response.data["user"]["first_name"], "Jane")
        self.assertEqual(response.data["user"]["last_name"], "Doe")

        # Verify new user has an isolated empty workspace
        self.assertTrue(User.objects.filter(username="newcandidate").exists())
        new_user = User.objects.get(username="newcandidate")
        self.assertEqual(JobApplication.objects.filter(user=new_user).count(), 0)

    def test_register_duplicate_username_rejected(self):
        payload = {
            "username": self.username,
            "email": "another@example.com",
            "password": "StrongPassword!987",
            "confirm_password": "StrongPassword!987",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_register_duplicate_email_rejected(self):
        # Assign email to self.user
        self.user.email = "taken@example.com"
        self.user.save()

        payload = {
            "username": "uniqueuser99",
            "email": "taken@example.com",
            "password": "StrongPassword!987",
            "confirm_password": "StrongPassword!987",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_register_password_mismatch_rejected(self):
        payload = {
            "username": "mismatchuser",
            "email": "mismatch@example.com",
            "password": "StrongPassword!987",
            "confirm_password": "DifferentPassword!123",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("confirm_password", response.data)

    def test_profile_read_and_update(self):
        self.client.force_authenticate(user=self.user)
        # Read profile
        response = self.client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.username)

        # Update profile and headline/target_role
        update_payload = {
            "first_name": "Alexander",
            "last_name": "Smith",
            "headline": "Lead Full-Stack Engineer",
            "target_role": "Staff Engineer",
            "target_salary": "$150,000",
            "theme_preference": "light",
        }
        patch_response = self.client.patch("/api/auth/profile/", update_payload, format="json")
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_response.data["first_name"], "Alexander")
        self.assertEqual(patch_response.data["profile"]["headline"], "Lead Full-Stack Engineer")
        self.assertEqual(patch_response.data["profile"]["theme_preference"], "light")

    def test_change_password_flow(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "old_password": self.password,
            "new_password": "NewSecretPass!456",
            "confirm_new_password": "NewSecretPass!456",
        }
        response = self.client.post("/api/auth/change-password/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

        # Verify old password no longer works
        self.client.logout()
        token_response = self.client.post(
            self.token_url,
            {"username": self.username, "password": self.password},
            format="json",
        )
        self.assertEqual(token_response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Verify new password works
        token_response_new = self.client.post(
            self.token_url,
            {"username": self.username, "password": "NewSecretPass!456"},
            format="json",
        )
        self.assertEqual(token_response_new.status_code, status.HTTP_200_OK)



class JobApplicationTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="user1", password="password123"
        )
        self.user2 = User.objects.create_user(
            username="user2", password="password123"
        )
        self.client.force_authenticate(user=self.user1)

    def test_create_job_application(self):
        payload = {
            "company": "Acme Corp",
            "role": "Frontend Developer",
            "location": "Remote",
            "job_url": "https://example.com/job/1",
            "salary": "6 LPA",
            "status": "Applied",
            "applied_date": "2026-10-15",
            "notes": "Referred by John",
        }
        response = self.client.post("/api/jobs/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["company"], "Acme Corp")
        self.assertEqual(response.data["role"], "Frontend Developer")
        self.assertEqual(JobApplication.objects.count(), 1)
        self.assertEqual(JobApplication.objects.first().user, self.user1)

    def test_job_application_data_isolation(self):
        # User 1 creates an application
        app1 = JobApplication.objects.create(
            user=self.user1,
            company="User1 Company",
            role="Engineer",
            applied_date="2026-10-10",
        )
        # User 2 creates an application
        app2 = JobApplication.objects.create(
            user=self.user2,
            company="User2 Company",
            role="Designer",
            applied_date="2026-10-11",
        )

        # User 1 queries /api/jobs/
        response = self.client.get("/api/jobs/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data if isinstance(response.data, list) else response.data.get("results", [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["company"], "User1 Company")

        # User 1 tries to access User 2's application directly
        response = self.client.get(f"/api/jobs/{app2.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # User 1 tries to edit User 2's application
        response = self.client.patch(f"/api/jobs/{app2.id}/", {"company": "Hacked"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # User 1 tries to delete User 2's application
        response = self.client.delete(f"/api/jobs/{app2.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_and_delete_own_application(self):
        app = JobApplication.objects.create(
            user=self.user1,
            company="Google",
            role="Software Engineer",
            applied_date="2026-10-01",
            status="Applied",
        )
        # Update status
        response = self.client.patch(
            f"/api/jobs/{app.id}/",
            {"status": "Interview"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "Interview")

        # Delete
        response = self.client.delete(f"/api/jobs/{app.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(JobApplication.objects.filter(id=app.id).count(), 0)

    def test_invalid_status_rejected(self):
        payload = {
            "company": "Startup Inc",
            "role": "Full Stack Dev",
            "applied_date": "2026-10-15",
            "status": "InvalidChoice",
        }
        response = self.client.post("/api/jobs/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)

    def test_create_and_update_interview_details(self):
        payload = {
            "company": "Netflix",
            "role": "Senior Engineer",
            "applied_date": "2026-10-15",
            "status": "Interview",
            "interview_date": "2026-10-25T14:30:00Z",
            "interview_round": "System Design",
            "interview_link": "https://meet.google.com/abc-defg-hij",
            "interview_notes": "Review distributed systems and caching",
        }
        response = self.client.post("/api/jobs/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["interview_round"], "System Design")
        self.assertEqual(response.data["interview_link"], "https://meet.google.com/abc-defg-hij")

        job_id = response.data["id"]
        update_response = self.client.patch(
            f"/api/jobs/{job_id}/",
            {"interview_round": "Executive Round", "status": "Interview"},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["interview_round"], "Executive Round")

    def test_export_csv(self):
        JobApplication.objects.create(
            user=self.user1,
            company="Apple",
            role="iOS Developer",
            applied_date="2026-10-12",
            status="Interview",
            interview_round="Technical Round 1",
        )
        response = self.client.get("/api/jobs/export-csv/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv")
        self.assertIn("attachment; filename=", response["Content-Disposition"])
        content = response.content.decode("utf-8")
        self.assertIn("Apple", content)
        self.assertIn("iOS Developer", content)
        self.assertIn("Technical Round 1", content)


class SavedJobTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="user1", password="password123"
        )
        self.user2 = User.objects.create_user(
            username="user2", password="password123"
        )
        self.client.force_authenticate(user=self.user1)

    def test_create_and_list_saved_job(self):
        payload = {
            "company": "Amazon",
            "role": "Cloud Architect",
            "location": "Hyderabad",
            "job_url": "https://amazon.jobs/123",
            "description": "AWS experience required",
            "source": "LinkedIn",
        }
        response = self.client.post("/api/saved-jobs/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["company"], "Amazon")
        self.assertEqual(SavedJob.objects.count(), 1)
        self.assertEqual(SavedJob.objects.first().user, self.user1)

    def test_saved_job_data_isolation(self):
        saved1 = SavedJob.objects.create(
            user=self.user1, company="Company 1", role="Role 1"
        )
        saved2 = SavedJob.objects.create(
            user=self.user2, company="Company 2", role="Role 2"
        )

        response = self.client.get("/api/saved-jobs/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data if isinstance(response.data, list) else response.data.get("results", [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["company"], "Company 1")

        # User 1 cannot access or delete User 2's saved job
        response = self.client.get(f"/api/saved-jobs/{saved2.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        response = self.client.delete(f"/api/saved-jobs/{saved2.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_saved_job(self):
        saved = SavedJob.objects.create(
            user=self.user1, company="Stripe", role="Backend Engineer"
        )
        response = self.client.patch(
            f"/api/saved-jobs/{saved.id}/",
            {"role": "Staff Backend Engineer", "location": "Remote"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "Staff Backend Engineer")
        self.assertEqual(response.data["location"], "Remote")
