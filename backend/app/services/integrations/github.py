import logging
from typing import Any
from github import Github
from github.GithubException import GithubException

logger = logging.getLogger("crewmind.integrations.github")

class GitHubService:
    def __init__(self, access_token: str):
        self.client = Github(access_token)

    def search_repositories(self, query: str) -> list[dict[str, Any]]:
        """Search GitHub for repositories matching a query."""
        try:
            repos = self.client.search_repositories(query=query)
            # Limit to top 5 results for efficiency
            return [{"full_name": repo.full_name, "description": repo.description, "html_url": repo.html_url} for repo in list(repos)[:5]]
        except GithubException as e:
            logger.error(f"Error searching GitHub repos: {e}")
            return []

    def read_issue(self, repo_full_name: str, issue_number: int) -> dict[str, Any]:
        """Read a specific issue from a GitHub repository."""
        try:
            repo = self.client.get_repo(repo_full_name)
            issue = repo.get_issue(number=issue_number)
            return {
                "title": issue.title,
                "body": issue.body,
                "state": issue.state,
                "html_url": issue.html_url,
                "user": issue.user.login if issue.user else None
            }
        except GithubException as e:
            logger.error(f"Error reading GitHub issue: {e}")
            return {"error": str(e)}
