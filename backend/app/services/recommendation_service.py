# app/services/recommendation_service.py
from sqlalchemy.orm import Session, joinedload
from app.models.user import User, AvailabilityStatus, UserSkill
from app.models.team import Team, TeamMember
from app.services.team_health_service import TeamHealthService


class RecommendationService:
    @classmethod
    def compute_recommendation_score(
        cls, builder: User, team: Team, missing_roles: list[str]
    ) -> tuple[int, list[str], str]:
        """Calculate match score, fit areas, and natural language reasoning for a builder."""
        score = 50  # Base score
        fit_areas = []
        matched_skills = []

        builder_skills = {us.skill.name.lower() for us in builder.user_skills}
        builder_verified_skills = {us.skill.name.lower() for us in builder.user_skills if us.is_verified}

        # 1. Match skills against missing roles / skills categories
        for cat, keywords in TeamHealthService.CATEGORIES.items():
            intersection = builder_skills.intersection(set(keywords))
            if intersection:
                fit_areas.append(cat)
                matched_skills.extend(list(intersection))
                # Add score points for matches
                score += len(intersection) * 10
                
                # Verified skills bonus
                verified_intersection = builder_verified_skills.intersection(set(keywords))
                score += len(verified_intersection) * 5

        # 2. Hackathons won bonus
        score += min(15, builder.hackathons_won * 5)

        # 3. Interest match via bio keywords
        bio_text = (builder.bio or "").lower()
        interest_matches = []
        project_keywords = ["web3", "ai", "ml", "blockchain", "iot", "healthcare", "edtech", "saas", "design"]
        for kw in project_keywords:
            if kw in bio_text:
                interest_matches.append(kw.upper())
                score += 5

        # Cap score at 98% for realistic matching metrics
        final_score = min(98, score)

        # Build natural language explanation reasons
        skill_list_str = ", ".join(matched_skills[:3]).title()
        verified_str = " (verified)" if any(s in builder_verified_skills for s in matched_skills) else ""
        
        reason = (
            f"{builder.name} is a strong fit for your team because they cover your critical "
            f"{'/'.join(fit_areas) if fit_areas else 'builder'} gaps with expertise in {skill_list_str}{verified_str}. "
        )
        if builder.hackathons_won > 0:
            reason += f"They are a proven innovator with {builder.hackathons_won} hackathon win(s). "
        if interest_matches:
            reason += f"Their profile shows active interest in {', '.join(interest_matches)}."

        return final_score, fit_areas, reason

    @classmethod
    def get_recommendations(cls, db: Session, team: Team) -> list[dict]:
        """Find the best matching builders for a team's skill deficits."""
        # Calculate team health metrics first
        missing_roles = TeamHealthService.calculate_missing_roles(team)
        team_member_ids = {m.user_id for m in team.members}

        # Retrieve available builders (excluding current team members)
        available_builders = (
            db.query(User)
            .options(joinedload(User.user_skills).joinedload(UserSkill.skill))
            .filter(
                User.status.in_([AvailabilityStatus.LOOKING_FOR_TEAM, AvailabilityStatus.OPEN_TO_INVITES]),
                User.is_active == True,
                ~User.id.in_(team_member_ids)
            )
            .all()
        )

        recommendations = []
        for builder in available_builders:
            score, fit_areas, reason = cls.compute_recommendation_score(builder, team, missing_roles)
            
            # Filter recommendations with minimum fit criteria
            if score >= 60:
                recommendations.append({
                    "builder": builder,
                    "score": score,
                    "reason": reason,
                    "fit_areas": fit_areas
                })

        # Sort recommendations by score descending
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations
