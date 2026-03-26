"""
Alert dispatch service - Multi-channel notifications
Send alerts via email, SMS, dashboard, and in-app notifications
"""

import logging
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.config import settings

logger = logging.getLogger(__name__)


class AlertDispatcher:
    """Manage alert delivery across multiple channels"""

    def __init__(self):
        self.email_enabled = settings.ALERT_EMAIL_ENABLED
        self.sms_enabled = settings.ALERT_TWILIO_ENABLED
        self._init_clients()

    def _init_clients(self):
        """Initialize notification service clients"""
        self.sendgrid_client = None
        self.twilio_client = None

        if self.email_enabled:
            try:
                from sendgrid import SendGridAPIClient

                self.sendgrid_client = SendGridAPIClient(settings.ALERT_EMAIL_FROM)
                logger.info("SendGrid email client initialized")
            except ImportError:
                logger.warning("SendGrid not available for email alerts")
                self.email_enabled = False

        if self.sms_enabled:
            try:
                from twilio.rest import Client

                self.twilio_client = Client(
                    settings.ALERT_TWILIO_ACCOUNT_SID,
                    settings.ALERT_TWILIO_AUTH_TOKEN,
                )
                logger.info("Twilio SMS client initialized")
            except ImportError:
                logger.warning("Twilio not available for SMS alerts")
                self.sms_enabled = False

    async def dispatch_alert(
        self,
        machine_id: str,
        alert_type: str,
        severity: str,
        title: str,
        message: str,
        user_email: Optional[str] = None,
        user_phone: Optional[str] = None,
    ) -> Dict[str, bool]:
        """Dispatch alert through all enabled channels"""
        results = {
            "email": False,
            "sms": False,
            "dashboard": True,  # Always send to dashboard
        }

        # Run dispatch tasks in parallel
        tasks = []

        if self.email_enabled and user_email:
            tasks.append(self._send_email(user_email, title, message, severity))

        if self.sms_enabled and user_phone:
            tasks.append(self._send_sms(user_phone, title, message, severity))

        if tasks:
            task_results = await asyncio.gather(*tasks, return_exceptions=True)
            for i, result in enumerate(task_results):
                if i == 0 and self.email_enabled:
                    results["email"] = result if isinstance(result, bool) else False
                if i == 1 and self.sms_enabled:
                    results["sms"] = result if isinstance(result, bool) else False

        logger.info(
            f"Alert dispatched for {machine_id}: "
            f"email={results['email']}, sms={results['sms']}, dashboard={results['dashboard']}"
        )

        return results

    async def _send_email(self, to_email: str, title: str, message: str, severity: str) -> bool:
        """Send email alert"""
        try:
            if not self.sendgrid_client:
                return False

            from sendgrid.helpers.mail import Mail, Email, To, Content

            severity_icon = {
                "critical": "🚨",
                "warning": "⚠️",
                "info": "ℹ️",
            }.get(severity, "ℹ️")

            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>{severity_icon} {title}</h2>
                <p>{message}</p>
                <p style="color: #666; font-size: 12px;">
                    Timestamp: {datetime.utcnow().isoformat()}
                </p>
            </body>
            </html>
            """

            mail = Mail(
                from_email=settings.ALERT_EMAIL_FROM,
                to_emails=To(to_email),
                subject=f"[{severity.upper()}] {title}",
                html_content=html_content,
            )

            response = self.sendgrid_client.send(mail)
            return 200 <= response.status_code < 300

        except Exception as e:
            logger.error(f"Error sending email alert: {e}")
            return False

    async def _send_sms(self, to_phone: str, title: str, message: str, severity: str) -> bool:
        """Send SMS alert via Twilio"""
        try:
            if not self.twilio_client:
                return False

            severity_emoji = {
                "critical": "🚨",
                "warning": "⚠️",
                "info": "ℹ️",
            }.get(severity, "ℹ️")

            sms_body = f"{severity_emoji} {title}\n{message[:120]}"

            message = self.twilio_client.messages.create(
                body=sms_body,
                from_=settings.ALERT_TWILIO_PHONE,
                to=to_phone,
            )

            return bool(message.sid)

        except Exception as e:
            logger.error(f"Error sending SMS alert: {e}")
            return False

    async def dispatch_critical_alert(
        self,
        machine_name: str,
        issue: str,
        recommended_action: str,
        escalation_contacts: List[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """Dispatch critical alert to multiple escalation levels"""
        results = {
            "primary": {},
            "escalation": [],
            "failed_contacts": [],
        }

        if escalation_contacts:
            for contact in escalation_contacts:
                try:
                    dispatch_result = await self.dispatch_alert(
                        machine_id=machine_name,
                        alert_type="critical",
                        severity="critical",
                        title=f"CRITICAL: {machine_name} - {issue}",
                        message=f"Issue: {issue}\nRecommended Action: {recommended_action}",
                        user_email=contact.get("email"),
                        user_phone=contact.get("phone"),
                    )
                    if dispatch_result["email"] or dispatch_result["sms"]:
                        results["primary"][contact.get("name")] = dispatch_result
                    else:
                        results["failed_contacts"].append(contact.get("name"))
                except Exception as e:
                    logger.error(f"Error sending critical alert to {contact}: {e}")
                    results["failed_contacts"].append(contact.get("name"))

        return results


# Global alert dispatcher instance
_alert_dispatcher: Optional[AlertDispatcher] = None


def init_alert_dispatcher() -> None:
    """Initialize global alert dispatcher"""
    global _alert_dispatcher
    _alert_dispatcher = AlertDispatcher()
    logger.info("Alert dispatcher initialized")


def get_alert_dispatcher() -> AlertDispatcher:
    """Get alert dispatcher instance"""
    if _alert_dispatcher is None:
        raise RuntimeError("Alert dispatcher not initialized. Call init_alert_dispatcher() first.")
    return _alert_dispatcher
