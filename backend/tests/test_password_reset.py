"""
backend/tests/test_password_reset.py

Unit & Integration Tests for Forgot Password & Password Reset Flow.
Verifies:
1. Forgot-password with existing email returns HTTP 200 generic message.
2. Forgot-password with nonexistent email returns identical HTTP 200 generic message.
3. Response does not reveal account existence (enumeration protection).
4. Email normalization matches case-insensitively with whitespace stripping.
5. Database-backed rate limiting / cooldown prevents token and email flooding.
6. New reset request invalidates previous unused tokens for the user.
7. Raw token is never stored in DB (only SHA-256 hash).
8. Valid raw token resets password, bcrypt hashes password, updates DB.
9. Token is single-use and cannot be reused.
10. Expired token is rejected with HTTP 400.
11. Tampered / invalid token is rejected with HTTP 400.
12. Password policy (min 8 chars) enforced.
13. Inactive user cannot reset password.
14. Email delivery failure removes newly issued token (no unsafe orphaned state).
15. API never returns raw token or token hash.
"""

import sys
import os
import unittest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

project_root = os.path.abspath(os.path.join(backend_path, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from app.main import app
from app.database import SessionLocal
from app.models.user import User, AvailabilityStatus
from app.models.password_reset_token import PasswordResetToken
from app.utils.security import (
    get_password_hash,
    verify_password,
    hash_reset_token,
    generate_password_reset_token,
)
from app.services.email_service import EmailService


class TestPasswordReset(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        # Clean up any leftover test users
        cls.db.query(PasswordResetToken).delete(synchronize_session=False)
        cls.db.query(User).filter(
            User.email.in_(["test_reset_active@test.com", "test_reset_inactive@test.com"])
        ).delete(synchronize_session=False)
        cls.db.commit()

        # Create active test user
        cls.active_user = User(
            name="Reset Test User",
            username="resettestuser",
            email="test_reset_active@test.com",
            hashed_password=get_password_hash("InitialPassword123!"),
            is_active=True,
            is_admin=False,
            status=AvailabilityStatus.LOOKING_FOR_TEAM,
        )
        cls.db.add(cls.active_user)

        # Create inactive test user
        cls.inactive_user = User(
            name="Inactive Reset User",
            username="inactiveresetuser",
            email="test_reset_inactive@test.com",
            hashed_password=get_password_hash("InitialPassword123!"),
            is_active=False,
            is_admin=False,
            status=AvailabilityStatus.OFFLINE,
        )
        cls.db.add(cls.inactive_user)
        cls.db.commit()
        cls.db.refresh(cls.active_user)
        cls.db.refresh(cls.inactive_user)

    @classmethod
    def tearDownClass(cls):
        cls.db.query(PasswordResetToken).delete(synchronize_session=False)
        cls.db.query(User).filter(
            User.email.in_(["test_reset_active@test.com", "test_reset_inactive@test.com"])
        ).delete(synchronize_session=False)
        cls.db.commit()
        cls.db.close()

    def setUp(self):
        EmailService.reset_test_dispatches()

    def test_01_forgot_password_existing_email(self):
        """Requesting password reset for existing email creates token and sends email."""
        # Clean up any existing tokens for active_user
        self.db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == self.active_user.id
        ).delete(synchronize_session=False)
        self.db.commit()

        res = self.client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "test_reset_active@test.com"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("message", data)
        self.assertEqual(
            data["message"],
            "If an account exists with this email, a password reset link has been sent.",
        )
        self.assertNotIn("token", data)
        self.assertNotIn("raw_token", data)

        # Verify email dispatch
        dispatch = EmailService.get_last_test_dispatch()
        self.assertIsNotNone(dispatch)
        self.assertEqual(dispatch["to_email"], "test_reset_active@test.com")
        self.assertIn("reset-password?token=", dispatch["reset_link"])

        # Verify token in DB
        raw_token = dispatch["raw_token"]
        expected_hash = hash_reset_token(raw_token)
        token_in_db = (
            self.db.query(PasswordResetToken)
            .filter(PasswordResetToken.token_hash == expected_hash)
            .first()
        )
        self.assertIsNotNone(token_in_db)
        self.assertEqual(token_in_db.user_id, self.active_user.id)
        self.assertIsNone(token_in_db.used_at)
        self.assertGreater(token_in_db.expires_at, datetime.now(timezone.utc))

        # Raw token must NOT exist in the database table
        raw_token_exists = (
            self.db.query(PasswordResetToken)
            .filter(PasswordResetToken.token_hash == raw_token)
            .first()
        )
        self.assertIsNone(raw_token_exists)

    def test_02_forgot_password_nonexistent_email(self):
        """Requesting reset for nonexistent email returns exact same generic 200 response."""
        initial_count = self.db.query(PasswordResetToken).count()

        res = self.client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "nonexistent_builder_xyz@unknown.edu"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(
            data["message"],
            "If an account exists with this email, a password reset link has been sent.",
        )

        # No token created, no email sent
        self.assertEqual(self.db.query(PasswordResetToken).count(), initial_count)
        self.assertIsNone(EmailService.get_last_test_dispatch())

    def test_03_email_normalization(self):
        """Email with irregular casing and leading/trailing whitespace is properly normalized."""
        self.db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == self.active_user.id
        ).delete(synchronize_session=False)
        self.db.commit()

        res = self.client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "   TEST_RESET_ACTIVE@test.com   "},
        )
        self.assertEqual(res.status_code, 200)

        dispatch = EmailService.get_last_test_dispatch()
        self.assertIsNotNone(dispatch)
        self.assertEqual(dispatch["to_email"], "test_reset_active@test.com")

    def test_04_cooldown_rate_limiting(self):
        """Repeated requests within cooldown window do not generate duplicate tokens or emails."""
        # Clean up existing tokens
        self.db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == self.active_user.id
        ).delete(synchronize_session=False)
        self.db.commit()

        # 1st request
        res1 = self.client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "test_reset_active@test.com"},
        )
        self.assertEqual(res1.status_code, 200)
        first_dispatch = EmailService.get_last_test_dispatch()
        self.assertIsNotNone(first_dispatch)
        EmailService.reset_test_dispatches()

        # Immediate 2nd request (within 60s cooldown)
        res2 = self.client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "test_reset_active@test.com"},
        )
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(
            res2.json()["message"],
            "If an account exists with this email, a password reset link has been sent.",
        )

        # No new email dispatched due to cooldown
        self.assertIsNone(EmailService.get_last_test_dispatch())

        # Only 1 active token exists
        active_tokens = (
            self.db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.user_id == self.active_user.id,
                PasswordResetToken.used_at.is_(None),
            )
            .all()
        )
        self.assertEqual(len(active_tokens), 1)

    def test_05_previous_tokens_invalidated_on_new_request(self):
        """When cooldown passes, a new reset request invalidates previous unused tokens."""
        # Age the existing token so it's outside the cooldown window
        token = (
            self.db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.user_id == self.active_user.id,
                PasswordResetToken.used_at.is_(None),
            )
            .first()
        )
        self.assertIsNotNone(token)
        token.created_at = datetime.now(timezone.utc) - timedelta(seconds=120)
        self.db.commit()

        # Request new reset
        res = self.client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "test_reset_active@test.com"},
        )
        self.assertEqual(res.status_code, 200)

        # The older token is now marked as used/invalidated
        self.db.refresh(token)
        self.assertIsNotNone(token.used_at)

        # A new unused token was created
        new_token = (
            self.db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.user_id == self.active_user.id,
                PasswordResetToken.used_at.is_(None),
            )
            .first()
        )
        self.assertIsNotNone(new_token)
        self.assertNotEqual(new_token.id, token.id)

    def test_06_reset_password_valid_token(self):
        """Valid token successfully updates user password and consumes the token."""
        raw_token, token_hash = generate_password_reset_token()
        token = PasswordResetToken(
            user_id=self.active_user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(token)
        self.db.commit()

        new_password = "BrandNewSecurePassword456!"
        res = self.client.post(
            "/api/v1/auth/reset-password",
            json={"token": raw_token, "new_password": new_password},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("message", data)
        self.assertIn("successfully", data["message"].lower())

        # Check DB token consumed
        self.db.refresh(token)
        self.assertIsNotNone(token.used_at)

        # Check user can authenticate with new password
        self.db.refresh(self.active_user)
        self.assertTrue(verify_password(new_password, self.active_user.hashed_password))

    def test_07_single_use_token_cannot_be_reused(self):
        """Consumed token cannot be used again."""
        raw_token, token_hash = generate_password_reset_token()
        token = PasswordResetToken(
            user_id=self.active_user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
            used_at=datetime.now(timezone.utc) - timedelta(minutes=2),
            created_at=datetime.now(timezone.utc) - timedelta(minutes=5),
        )
        self.db.add(token)
        self.db.commit()

        res = self.client.post(
            "/api/v1/auth/reset-password",
            json={"token": raw_token, "new_password": "AnotherNewPassword789!"},
        )
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json()["detail"], "Invalid or expired password reset token.")

    def test_08_expired_token_rejected(self):
        """Expired token is rejected with HTTP 400."""
        raw_token, token_hash = generate_password_reset_token()
        expired_token = PasswordResetToken(
            user_id=self.active_user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=5),
            created_at=datetime.now(timezone.utc) - timedelta(minutes=35),
        )
        self.db.add(expired_token)
        self.db.commit()

        res = self.client.post(
            "/api/v1/auth/reset-password",
            json={"token": raw_token, "new_password": "ValidPassword123!"},
        )
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json()["detail"], "Invalid or expired password reset token.")

    def test_09_invalid_or_tampered_token_rejected(self):
        """Completely invalid or tampered token returns HTTP 400."""
        res = self.client.post(
            "/api/v1/auth/reset-password",
            json={"token": "this_is_a_completely_fake_token_value", "new_password": "ValidPassword123!"},
        )
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json()["detail"], "Invalid or expired password reset token.")

    def test_10_password_validation_enforced(self):
        """Password shorter than 8 characters is rejected by Pydantic validation (HTTP 422)."""
        raw_token, token_hash = generate_password_reset_token()
        token = PasswordResetToken(
            user_id=self.active_user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        )
        self.db.add(token)
        self.db.commit()

        res = self.client.post(
            "/api/v1/auth/reset-password",
            json={"token": raw_token, "new_password": "short"},
        )
        self.assertEqual(res.status_code, 422)

    def test_11_inactive_user_rejected(self):
        """Inactive user cannot reset password even with valid token."""
        raw_token, token_hash = generate_password_reset_token()
        token = PasswordResetToken(
            user_id=self.inactive_user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        )
        self.db.add(token)
        self.db.commit()

        res = self.client.post(
            "/api/v1/auth/reset-password",
            json={"token": raw_token, "new_password": "ValidPassword123!"},
        )
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json()["detail"], "Invalid or expired password reset token.")

    def test_12_email_delivery_failure_rolls_back_token(self):
        """If email delivery fails, the newly generated token is removed to prevent unsafe orphaned state."""
        # Clean up existing tokens for active_user
        self.db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == self.active_user.id
        ).delete(synchronize_session=False)
        self.db.commit()

        original_send = EmailService.send_password_reset_email
        try:
            # Simulate delivery failure
            EmailService.send_password_reset_email = classmethod(lambda cls, to_email, raw_token: False)

            res = self.client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "test_reset_active@test.com"},
            )
            self.assertEqual(res.status_code, 200)
            self.assertEqual(
                res.json()["message"],
                "If an account exists with this email, a password reset link has been sent.",
            )

            # Token should NOT exist in database (rolled back/deleted)
            tokens = (
                self.db.query(PasswordResetToken)
                .filter(PasswordResetToken.user_id == self.active_user.id)
                .all()
            )
            self.assertEqual(len(tokens), 0)
        finally:
            EmailService.send_password_reset_email = original_send

    def test_13_concurrent_forgot_password_race_protection(self):
        """Concurrent requests for the same user cannot bypass cooldown or create multiple active tokens."""
        import concurrent.futures

        # Clean up any existing tokens for active_user
        self.db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == self.active_user.id
        ).delete(synchronize_session=False)
        self.db.commit()

        EmailService.reset_test_dispatches()

        def make_request():
            client = TestClient(app)
            return client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "test_reset_active@test.com"},
            )

        # Launch 2 simultaneous requests in parallel threads
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            futures = [executor.submit(make_request) for _ in range(2)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # Both requests must return identical safe generic 200 responses
        for res in results:
            self.assertEqual(res.status_code, 200)
            self.assertEqual(
                res.json()["message"],
                "If an account exists with this email, a password reset link has been sent.",
            )
            self.assertNotIn("token", res.json())
            self.assertNotIn("raw_token", res.json())

        # CRITICAL INVARIANT: Exactly 1 active (unused) reset token exists in the database
        active_tokens = (
            self.db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.user_id == self.active_user.id,
                PasswordResetToken.used_at.is_(None),
            )
            .all()
        )
        self.assertEqual(len(active_tokens), 1)

        # CRITICAL INVARIANT: Exactly 1 email dispatch occurred (the 2nd was serialized & rejected by cooldown)
        self.assertEqual(len(EmailService._test_dispatches), 1)

        # Invariant: Raw token is not stored in plaintext
        raw_token = EmailService._test_dispatches[0]["raw_token"]
        raw_in_db = (
            self.db.query(PasswordResetToken)
            .filter(PasswordResetToken.token_hash == raw_token)
            .first()
        )
        self.assertIsNone(raw_in_db)

    def test_14_production_environment_requires_smtp(self):
        """Production environment requires mandatory SMTP configuration; startup/validation fails otherwise."""
        from app.config import Settings

        # In development: succeeds with empty SMTP host
        dev_settings = Settings(app_env="development", smtp_host="", smtp_port=587, emails_from_email="")
        self.assertEqual(dev_settings.app_env, "development")

        # In production: missing SMTP_HOST raises ValueError
        with self.assertRaises(ValueError) as ctx:
            Settings(app_env="production", smtp_host="", smtp_port=587, emails_from_email="noreply@b2b2h.com")
        self.assertIn("SMTP_HOST", str(ctx.exception))

        # In production: missing EMAILS_FROM_EMAIL raises ValueError
        with self.assertRaises(ValueError) as ctx:
            Settings(app_env="production", smtp_host="smtp.sendgrid.net", smtp_port=587, emails_from_email="")
        self.assertIn("EMAILS_FROM_EMAIL", str(ctx.exception))

        # In production: complete configuration succeeds
        prod_settings = Settings(
            app_env="production",
            smtp_host="smtp.example.com",
            smtp_port=587,
            emails_from_email="noreply@b2b2h.com",
        )
        self.assertEqual(prod_settings.app_env, "production")
        self.assertEqual(prod_settings.smtp_host, "smtp.example.com")


if __name__ == "__main__":
    unittest.main()

