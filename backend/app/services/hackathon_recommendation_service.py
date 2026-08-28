# app/services/hackathon_recommendation_service.py
import re
from datetime import datetime
from sqlalchemy.orm import Session, selectinload
from app.models.hackathon import Hackathon
from app.models.user import User
from app.constants.recommendation_constants import (
    KNOWN_TECHNICAL_SKILLS,
    KNOWN_DOMAINS,
    BRANCH_DOMAIN_MAPPING,
    SKILL_SYNONYMS,
    DOMAIN_SYNONYMS,
    YEAR_SUITABILITY,
)

class HackathonRecommendationService:
    @staticmethod
    def normalize_string(val: str, synonyms: dict) -> str:
        if not val:
            return ""
        v = val.lower().strip()
        v = re.sub(r'[-_]', ' ', v)
        v = re.sub(r'\s+', ' ', v)
        return synonyms.get(v, v)

    @classmethod
    def get_recommendations(cls, db: Session, user: User) -> dict:
        # 1. Fetch and filter eligible hackathons (end_date >= current time)
        current_time = datetime.utcnow()
        all_hackathons = (
            db.query(Hackathon)
            .options(selectinload(Hackathon.registrations))
            .filter(Hackathon.end_date >= current_time)
            .all()
        )
        if not all_hackathons:
            all_hackathons = (
                db.query(Hackathon)
                .options(selectinload(Hackathon.registrations))
                .all()
            )
        total_hackathons_count = len(all_hackathons)

        # 2. Normalize User Data
        user_skills = set()
        for us in user.user_skills:
            if us.skill:
                user_skills.add(cls.normalize_string(us.skill.name, SKILL_SYNONYMS))

        user_domains = set()
        if user.domains:
            for d in user.domains:
                user_domains.add(cls.normalize_string(d, DOMAIN_SYNONYMS))

        user_branch_norm = cls.normalize_string(user.branch or "", {})
        branch_domains = set()
        for key, doms in BRANCH_DOMAIN_MAPPING.items():
            if key in user_branch_norm or user_branch_norm in key:
                branch_domains.update(doms)
                break

        # 3. Calculate match score for each hackathon
        recommendations = []
        for hk in all_hackathons:
            # Categorize hackathon tags/tracks into skills and domains
            hk_skills = set()
            hk_domains = set()
            
            combined_synonyms = {**SKILL_SYNONYMS, **DOMAIN_SYNONYMS}
            for item in (hk.tracks + hk.tags):
                norm_item = cls.normalize_string(item, combined_synonyms)
                
                # Check if it matches a known skill
                matched_skill = None
                for sk in KNOWN_TECHNICAL_SKILLS:
                    if sk == norm_item or sk in norm_item or norm_item in sk:
                        matched_skill = sk
                        break
                if matched_skill:
                    hk_skills.add(matched_skill)

                # Check if it matches a known domain
                matched_domain = None
                for dom in KNOWN_DOMAINS:
                    if dom == norm_item or dom in norm_item or norm_item in dom:
                        matched_domain = dom
                        break
                if matched_domain:
                    hk_domains.add(matched_domain)

            # A. Skills Score (40%)
            matched_skills_set = user_skills.intersection(hk_skills)
            skills_pct = len(matched_skills_set) / max(1, len(user_skills))
            skills_score = round(skills_pct * 40)

            # B. Domain Score (35%)
            matched_domains_set = user_domains.intersection(hk_domains)
            domain_pct = len(matched_domains_set) / max(1, len(user_domains))
            domain_score = round(domain_pct * 35)

            # C. Branch Match (15%)
            branch_score = 0
            if branch_domains and branch_domains.intersection(hk_domains):
                branch_score = 15

            # D. Year Suitability (10%)
            year_score = YEAR_SUITABILITY.get(user.year, 10)

            # E. Overall Match Score
            total_score = skills_score + domain_score + branch_score + year_score

            # F. Extract display values for the UI
            display_matched_skills = []
            for us in user.user_skills:
                if us.skill:
                    norm = cls.normalize_string(us.skill.name, SKILL_SYNONYMS)
                    if norm in matched_skills_set:
                        display_matched_skills.append(us.skill.name)

            display_matched_domains = []
            if user.domains:
                for d in user.domains:
                    norm = cls.normalize_string(d, DOMAIN_SYNONYMS)
                    if norm in matched_domains_set:
                        display_matched_domains.append(d)

            display_missing_skills = []
            for item in (hk.tracks + hk.tags):
                norm_item = cls.normalize_string(item, combined_synonyms)
                matched_skill = None
                for sk in KNOWN_TECHNICAL_SKILLS:
                    if sk == norm_item or sk in norm_item or norm_item in sk:
                        matched_skill = sk
                        break
            # Concise Explanation array
            explanation = []
            if display_matched_skills:
                explanation.append(f"Matched Skills: {', '.join(display_matched_skills)}")
            else:
                explanation.append("Matched Skills: None")

            if display_matched_domains:
                explanation.append(f"Matched Interests: {', '.join(display_matched_domains)}")
            else:
                explanation.append("Matched Interests: None")

            if branch_score > 0:
                explanation.append(f"Branch Alignment: {user.branch or 'Aligned'}")
            else:
                explanation.append("Branch Alignment: No direct alignment with your branch.")

            explanation.append(f"Suitable for your academic year ({user.year or 'General'}).")

            # Compute TF-IDF text similarity if bio or descriptions exist
            user_text = f"{user.bio or ''} {' '.join(user_skills)} {' '.join(user_domains)}".strip()
            hk_text = f"{hk.title} {hk.description} {' '.join(hk.tracks or [])} {' '.join(hk.tags or [])}".strip()
            tfidf_sim = 0.0
            if user_text and hk_text:
                try:
                    from sklearn.feature_extraction.text import TfidfVectorizer
                    from sklearn.metrics.pairwise import cosine_similarity
                    vec = TfidfVectorizer(stop_words='english')
                    tfidf_matrix = vec.fit_transform([user_text, hk_text])
                    tfidf_sim = float(round(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0], 4))
                except Exception:
                    tfidf_sim = 0.0

            # Dynamic TF-IDF similarity boost (up to +10 points)
            if tfidf_sim >= 0.15:
                explanation.append(f"High text similarity ({tfidf_sim:.2f}) between your profile and hackathon tracks")

            # H. Recommendation Match Label
            if total_score >= 90:
                label = "Excellent Match"
            elif total_score >= 75:
                label = "Strong Match"
            elif total_score >= 60:
                label = "Good Match"
            elif total_score >= 40:
                label = "Average Match"
            else:
                label = "Low Match"

            recommendations.append({
                "hackathon": hk,
                "score": total_score,
                "recommendation_score": total_score,
                "label": label,
                "breakdown": {
                    "skills": skills_score,
                    "domains": domain_score,
                    "branch": branch_score,
                    "year": year_score,
                    "tfidf_similarity": tfidf_sim
                },
                "matched_skills": display_matched_skills,
                "matched_domains": display_matched_domains,
                "missing_skills": display_missing_skills,
                "explanation": explanation,
                "match_reasons": explanation
            })

        # 4. Multi-tiered Tie-breaker Sorting
        #   - score (descending)
        #   - end_date (ascending, sooner first)
        #   - date (ascending)
        #   - title (alphabetically)
        recommendations.sort(key=lambda x: (
            -x["score"],
            x["hackathon"].end_date,
            x["hackathon"].date,
            x["hackathon"].title
        ))

        # Slice top 5-10
        top_recommendations = recommendations[:10]

        return {
            "total_hackathons": total_hackathons_count,
            "recommended_count": len(top_recommendations),
            "recommendations": top_recommendations
        }
