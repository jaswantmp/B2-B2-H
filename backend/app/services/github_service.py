# app/services/github_service.py
import json
import urllib.request
import urllib.error
from typing import Any
from app.config import settings


class GithubService:
    @staticmethod
    def _make_request(url: str) -> Any:
        """Helper to make a secure HTTP GET request to GitHub API."""
        headers = {
            "User-Agent": "B2B2H-App",
            "Accept": "application/vnd.github.v3+json"
        }
        if settings.github_token:
            headers["Authorization"] = f"token {settings.github_token}"

        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    return json.loads(response.read().decode())
        except urllib.error.URLError:
            pass  # Fallback to returning empty/None on network errors or rate limit hits
        return None

    @classmethod
    def fetch_github_profile(cls, username: str) -> dict[str, Any] | None:
        """Fetch general profile metadata from GitHub API."""
        url = f"{settings.github_api_url}/users/{username}"
        return cls._make_request(url)

    @classmethod
    def fetch_repositories(cls, username: str) -> list[dict[str, Any]]:
        """Fetch public repositories from GitHub API."""
        url = f"{settings.github_api_url}/users/{username}/repos?per_page=100"
        repos = cls._make_request(url)
        return repos if isinstance(repos, list) else []

    @staticmethod
    def extract_languages(repos: list[dict[str, Any]]) -> dict[str, int]:
        """Aggregate and count languages used across the fetched repositories."""
        language_counts = {}
        for repo in repos:
            lang = repo.get("language")
            if lang:
                language_counts[lang] = language_counts.get(lang, 0) + 1
        # Return sorted by count descending
        return dict(sorted(language_counts.items(), key=lambda item: item[1], reverse=True))
