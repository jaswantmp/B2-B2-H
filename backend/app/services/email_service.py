# app/services/email_service.py
import logging
import smtplib
from email.message import EmailMessage
from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    # Test spy hook for testing environments
    _test_dispatches: list[dict] = []

    @classmethod
    def reset_test_dispatches(cls) -> None:
        cls._test_dispatches.clear()

    @classmethod
    def get_last_test_dispatch(cls) -> dict | None:
        return cls._test_dispatches[-1] if cls._test_dispatches else None

    @classmethod
    def send_password_reset_email(cls, to_email: str, raw_token: str) -> bool:
        """
        Send a password reset email to the specified address.
        Returns True if successful (or recorded in dev/test mode),
        or False if SMTP delivery fails in production.
        """
        reset_link = f"{settings.frontend_url.rstrip('/')}/reset-password?token={raw_token}"
        expire_minutes = settings.password_reset_token_expire_minutes

        # Prepare message
        msg = EmailMessage()
        msg["Subject"] = "Reset Your Password - B2B2H"
        from_email = settings.emails_from_email or "noreply@b2b2h.com"
        msg["From"] = f"{settings.emails_from_name} <{from_email}>"
        msg["To"] = to_email

        # Plain text fallback
        text_content = (
            f"Hello,\n\n"
            f"A password reset was requested for your B2B2H account.\n\n"
            f"To reset your password, visit the following link:\n"
            f"{reset_link}\n\n"
            f"This link will expire in {expire_minutes} minutes.\n\n"
            f"If you did not request a password reset, you can safely ignore this email.\n"
            f"Your password will remain unchanged.\n\n"
            f"— The B2B2H Team\n"
        )
        msg.set_content(text_content)

        # HTML body
        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; color: #F8FAFC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F172A; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #1E293B; border-radius: 16px; border: 1px solid #334155; overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #334155;">
              <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF;">B2B2H</span>
              <p style="margin: 6px 0 0; font-size: 13px; color: #94A3B8;">Born 2 Build. Built 2 Hack.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #FFFFFF;">Password Reset Request</h2>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 24px; color: #CBD5E1;">
                We received a request to reset the password for your account associated with <strong style="color: #FFFFFF;">{to_email}</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="{reset_link}" target="_blank" style="display: inline-block; background-color: #7C3AED; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 10px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 16px; font-size: 13px; line-height: 20px; color: #94A3B8;">
                This link will automatically expire in <strong>{expire_minutes} minutes</strong>. For your security, it can only be used once.
              </p>
              <div style="background-color: #0F172A; border-radius: 8px; padding: 16px; margin: 24px 0 0; border: 1px solid #334155;">
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94A3B8;">
                  If you didn't request a password reset, please disregard this email. Your account remains completely secure.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background-color: #0F172A; text-align: center; border-top: 1px solid #334155;">
              <p style="margin: 0; font-size: 11px; color: #64748B;">
                © 2026 B2B2H Platform. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
        msg.add_alternative(html_content, subtype="html")

        # Record test dispatch for test environment assertions
        cls._test_dispatches.append({
            "to_email": to_email,
            "reset_link": reset_link,
            "raw_token": raw_token,
        })

        if not settings.smtp_host:
            if settings.app_env.strip().lower() == "production":
                logger.error("SMTP host not configured in production environment.")
                return False
            logger.info("SMTP host not configured. Running in test/dev mode for %s", to_email)
            return True

        try:
            if settings.smtp_ssl or settings.smtp_port == 465:
                server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10)
            else:
                server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10)
                if settings.smtp_tls:
                    server.starttls()

            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)

            server.send_message(msg)
            server.quit()
            return True
        except Exception as e:
            logger.error("Failed to deliver password reset email via SMTP: %s", type(e).__name__)
            return False
