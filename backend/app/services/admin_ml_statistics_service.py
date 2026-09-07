# app/services/admin_ml_statistics_service.py
from datetime import datetime, timezone, timedelta
import logging
from sqlalchemy import func, case, and_
from sqlalchemy.orm import Session, selectinload

from app.models.ai import MLUsageEvent
from app.models.user import User, UserSkill
from app.models.team import Team, TeamMember
from app.services.team_health_service import TeamHealthService
from app.schemas.admin import (
    MLOverallSummary,
    MLFeatureUsageItem,
    MLTimeWindowStats,
    MLTimeWindows,
    MLModelVersionItem,
    MLTeamHealthAnalytics,
    MLActiveModelItem,
    AdminMLStatisticsResponse,
)

logger = logging.getLogger(__name__)

TRACKED_FEATURES = [
    "team_matcher",
    "project_recommendations",
    "hackathon_recommendations",
    "team_generator",
    "team_health",
]


class AdminMLStatisticsService:
    @staticmethod
    def get_ml_statistics(db: Session) -> AdminMLStatisticsResponse:
        """
        Aggregate live ML/AI operational usage analytics and active model metadata.
        Uses single-pass database queries for performance and zero-division safeguards.
        """
        overall_summary, time_windows = AdminMLStatisticsService._get_overall_and_time_windows(db)
        feature_usage = AdminMLStatisticsService._get_feature_usage(db)
        model_version_analytics = AdminMLStatisticsService._get_model_version_analytics(db)
        team_health_analytics = AdminMLStatisticsService._get_team_health_analytics(db)
        active_models = AdminMLStatisticsService._get_active_models()

        return AdminMLStatisticsResponse(
            overall_summary=overall_summary,
            feature_usage=feature_usage,
            time_windows=time_windows,
            model_version_analytics=model_version_analytics,
            team_health_analytics=team_health_analytics,
            active_models=active_models,
        )

    @staticmethod
    def _get_overall_and_time_windows(db: Session) -> tuple[MLOverallSummary, MLTimeWindows]:
        """
        Calculates overall totals and time window aggregates (today, last 7 days, last 30 days)
        in a single database query.
        """
        now_utc = datetime.now(timezone.utc)
        today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
        d7_start = now_utc - timedelta(days=7)
        d30_start = now_utc - timedelta(days=30)

        # Single aggregation query
        row = db.query(
            # Overall
            func.count(MLUsageEvent.id).label("total_requests"),
            func.coalesce(func.sum(case((MLUsageEvent.success == True, 1), else_=0)), 0).label("successful_requests"),
            func.coalesce(func.sum(case((MLUsageEvent.success == False, 1), else_=0)), 0).label("failed_requests"),
            func.count(func.distinct(MLUsageEvent.user_id)).label("unique_users"),
            func.avg(MLUsageEvent.response_time_ms).label("average_response_time_ms"),

            # Today
            func.coalesce(func.sum(case((MLUsageEvent.created_at >= today_start, 1), else_=0)), 0).label("today_total"),
            func.coalesce(func.sum(case((and_(MLUsageEvent.created_at >= today_start, MLUsageEvent.success == True), 1), else_=0)), 0).label("today_successful"),
            func.coalesce(func.sum(case((and_(MLUsageEvent.created_at >= today_start, MLUsageEvent.success == False), 1), else_=0)), 0).label("today_failed"),
            func.count(func.distinct(case((MLUsageEvent.created_at >= today_start, MLUsageEvent.user_id), else_=None))).label("today_unique_users"),

            # Last 7 Days
            func.coalesce(func.sum(case((MLUsageEvent.created_at >= d7_start, 1), else_=0)), 0).label("d7_total"),
            func.coalesce(func.sum(case((and_(MLUsageEvent.created_at >= d7_start, MLUsageEvent.success == True), 1), else_=0)), 0).label("d7_successful"),
            func.coalesce(func.sum(case((and_(MLUsageEvent.created_at >= d7_start, MLUsageEvent.success == False), 1), else_=0)), 0).label("d7_failed"),
            func.count(func.distinct(case((MLUsageEvent.created_at >= d7_start, MLUsageEvent.user_id), else_=None))).label("d7_unique_users"),

            # Last 30 Days
            func.coalesce(func.sum(case((MLUsageEvent.created_at >= d30_start, 1), else_=0)), 0).label("d30_total"),
            func.coalesce(func.sum(case((and_(MLUsageEvent.created_at >= d30_start, MLUsageEvent.success == True), 1), else_=0)), 0).label("d30_successful"),
            func.coalesce(func.sum(case((and_(MLUsageEvent.created_at >= d30_start, MLUsageEvent.success == False), 1), else_=0)), 0).label("d30_failed"),
            func.count(func.distinct(case((MLUsageEvent.created_at >= d30_start, MLUsageEvent.user_id), else_=None))).label("d30_unique_users"),
        ).first()

        total = int(row.total_requests or 0)
        success = int(row.successful_requests or 0)
        failed = int(row.failed_requests or 0)
        unique_users = int(row.unique_users or 0)
        avg_resp = round(float(row.average_response_time_ms), 2) if row.average_response_time_ms is not None else None
        success_rate = round((success / total) * 100.0, 2) if total > 0 else 0.0

        overall = MLOverallSummary(
            total_requests=total,
            successful_requests=success,
            failed_requests=failed,
            success_rate=success_rate,
            unique_users=unique_users,
            average_response_time_ms=avg_resp,
        )

        windows = MLTimeWindows(
            today=MLTimeWindowStats(
                total_requests=int(row.today_total or 0),
                successful_requests=int(row.today_successful or 0),
                failed_requests=int(row.today_failed or 0),
                unique_users=int(row.today_unique_users or 0),
            ),
            last_7_days=MLTimeWindowStats(
                total_requests=int(row.d7_total or 0),
                successful_requests=int(row.d7_successful or 0),
                failed_requests=int(row.d7_failed or 0),
                unique_users=int(row.d7_unique_users or 0),
            ),
            last_30_days=MLTimeWindowStats(
                total_requests=int(row.d30_total or 0),
                successful_requests=int(row.d30_successful or 0),
                failed_requests=int(row.d30_failed or 0),
                unique_users=int(row.d30_unique_users or 0),
            ),
        )

        return overall, windows

    @staticmethod
    def _get_feature_usage(db: Session) -> list[MLFeatureUsageItem]:
        """
        Aggregates usage per tracked feature. Guarantees all 5 tracked features
        are returned even when 0 requests have been recorded.
        """
        rows = db.query(
            MLUsageEvent.feature,
            func.count(MLUsageEvent.id).label("total_requests"),
            func.coalesce(func.sum(case((MLUsageEvent.success == True, 1), else_=0)), 0).label("successful_requests"),
            func.coalesce(func.sum(case((MLUsageEvent.success == False, 1), else_=0)), 0).label("failed_requests"),
            func.count(func.distinct(MLUsageEvent.user_id)).label("unique_users"),
            func.avg(MLUsageEvent.response_time_ms).label("average_response_time_ms"),
            func.max(MLUsageEvent.created_at).label("last_used_at"),
        ).group_by(MLUsageEvent.feature).all()

        feature_map = {r.feature: r for r in rows}
        items = []

        for feat in TRACKED_FEATURES:
            row = feature_map.get(feat)
            if row:
                tot = int(row.total_requests or 0)
                suc = int(row.successful_requests or 0)
                fai = int(row.failed_requests or 0)
                rate = round((suc / tot) * 100.0, 2) if tot > 0 else 0.0
                avg_ms = round(float(row.average_response_time_ms), 2) if row.average_response_time_ms is not None else None
                items.append(MLFeatureUsageItem(
                    feature=feat,
                    total_requests=tot,
                    successful_requests=suc,
                    failed_requests=fai,
                    success_rate=rate,
                    unique_users=int(row.unique_users or 0),
                    average_response_time_ms=avg_ms,
                    last_used_at=row.last_used_at,
                ))
            else:
                items.append(MLFeatureUsageItem(
                    feature=feat,
                    total_requests=0,
                    successful_requests=0,
                    failed_requests=0,
                    success_rate=0.0,
                    unique_users=0,
                    average_response_time_ms=None,
                    last_used_at=None,
                ))

        return items

    @staticmethod
    def _get_model_version_analytics(db: Session) -> list[MLModelVersionItem]:
        """
        Returns model versions actually represented in ml_usage_events.
        Does not fabricate unobserved versions.
        """
        rows = db.query(
            MLUsageEvent.feature,
            MLUsageEvent.model_version,
            func.count(MLUsageEvent.id).label("request_count"),
            func.coalesce(func.sum(case((MLUsageEvent.success == True, 1), else_=0)), 0).label("successful_requests"),
            func.coalesce(func.sum(case((MLUsageEvent.success == False, 1), else_=0)), 0).label("failed_requests"),
            func.avg(MLUsageEvent.response_time_ms).label("average_response_time_ms"),
            func.max(MLUsageEvent.created_at).label("last_used_at"),
        ).filter(
            MLUsageEvent.model_version.isnot(None)
        ).group_by(
            MLUsageEvent.feature,
            MLUsageEvent.model_version,
        ).order_by(
            func.count(MLUsageEvent.id).desc(),
            func.max(MLUsageEvent.created_at).desc(),
        ).all()

        results = []
        for r in rows:
            tot = int(r.request_count or 0)
            avg_ms = round(float(r.average_response_time_ms), 2) if r.average_response_time_ms is not None else None
            results.append(MLModelVersionItem(
                feature=r.feature,
                model_version=r.model_version,
                request_count=tot,
                successful_requests=int(r.successful_requests or 0),
                failed_requests=int(r.failed_requests or 0),
                average_response_time_ms=avg_ms,
                last_used_at=r.last_used_at,
            ))

        return results

    @staticmethod
    def _get_team_health_analytics(db: Session) -> MLTeamHealthAnalytics:
        """
        Dynamically calculates team health distribution across existing teams
        using the unmodified TeamHealthService.
        Does not create usage events or persist fake records.
        """
        teams = db.query(Team).options(
            selectinload(Team.members)
            .selectinload(TeamMember.user)
            .selectinload(User.user_skills)
            .selectinload(UserSkill.skill)
        ).all()

        total_teams = len(teams)
        if total_teams == 0:
            return MLTeamHealthAnalytics(
                total_teams=0,
                average_health_score=None,
                healthy_count=0,
                moderate_count=0,
                at_risk_count=0,
            )

        scores: list[int] = []
        healthy_count = 0
        moderate_count = 0
        at_risk_count = 0

        for team in teams:
            try:
                health_info = TeamHealthService.get_full_team_health(team, db=None)
                score = int(health_info.get("health_score", 0))
            except Exception as e:
                logger.warning(f"Failed to calculate health for team {team.id}: {e}")
                score = 0

            scores.append(score)
            if score >= 75:
                healthy_count += 1
            elif score >= 50:
                moderate_count += 1
            else:
                at_risk_count += 1

        avg_score = round(sum(scores) / total_teams, 2) if total_teams > 0 else None

        return MLTeamHealthAnalytics(
            total_teams=total_teams,
            average_health_score=avg_score,
            healthy_count=healthy_count,
            moderate_count=moderate_count,
            at_risk_count=at_risk_count,
        )

    @staticmethod
    def _get_active_models() -> list[MLActiveModelItem]:
        """
        Returns the production ML/AI model/service versions currently used
        by the application from single source-of-truth metadata.
        Student Clustering is represented with is_tracked=False.
        """
        try:
            from ml.inference import get_inference_engine
            engine = get_inference_engine()
            gb_ver = engine.model_version
            hk_ver = engine.hackathon_model_version
            tg_ver = engine.team_generator_model_version
            th_ver = engine.team_health_model_version
        except Exception:
            gb_ver = "GradientBoosting-v1.0"
            hk_ver = "hackathon_recommender_v1"
            tg_ver = "team_generator_v1"
            th_ver = "team_health_v1"

        return [
            MLActiveModelItem(
                feature="team_matcher",
                feature_name="AI Team Matcher",
                model_version=gb_ver,
                description="Gradient Boosting Classifier & Regressor for student builder team matching",
                is_tracked=True,
            ),
            MLActiveModelItem(
                feature="project_recommendations",
                feature_name="Project Recommendations",
                model_version=gb_ver,
                description="Gradient Boosting Regressor ranking project affinity for student builders",
                is_tracked=True,
            ),
            MLActiveModelItem(
                feature="hackathon_recommendations",
                feature_name="Hackathon Recommendations",
                model_version=hk_ver,
                description="Hackathon recommendation scoring engine based on student skills and domains",
                is_tracked=True,
            ),
            MLActiveModelItem(
                feature="team_generator",
                feature_name="AI Team Generator",
                model_version=tg_ver,
                description="Multi-role team formation engine with pairwise affinity and team quality scoring",
                is_tracked=True,
            ),
            MLActiveModelItem(
                feature="team_health",
                feature_name="Team Health Radar & Predictor",
                model_version=th_ver,
                description="18-feature ML team health predictor and 5-domain radar diagnostic engine",
                is_tracked=True,
            ),
            MLActiveModelItem(
                feature="student_clustering",
                feature_name="K-Means Student Segmentation",
                model_version="kmeans_student_segmentation_v1",
                description="K-Means student segmentation (4 builder archetypes). Not instrumented for usage tracking.",
                is_tracked=False,
            ),
        ]
