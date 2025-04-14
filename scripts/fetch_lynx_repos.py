import requests
import json
import os
from datetime import datetime

def fetch_lynx_repos():
    """
    Récupère tous les repos de l'organisation lynx-family sur GitHub
    et sauvegarde les informations dans un fichier JSON
    """
    # Configuration
    org_name = "lynx-family"
    api_url = f"https://api.github.com/orgs/{org_name}/repos"
    headers = {
        "Accept": "application/vnd.github.v3+json"
    }

    try:
        # Récupération des repos
        print(f"Récupération des repos de {org_name}...")
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()
        repos = response.json()

        # Création du dossier de données s'il n'existe pas
        data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        os.makedirs(data_dir, exist_ok=True)

        # Préparation des données
        repos_data = []
        for repo in repos:
            # Récupération des informations détaillées du repo
            repo_url = repo["url"]
            repo_response = requests.get(repo_url, headers=headers)
            repo_response.raise_for_status()
            repo_details = repo_response.json()

            # Récupération du README
            readme_url = f"https://api.github.com/repos/{org_name}/{repo['name']}/readme"
            try:
                readme_response = requests.get(readme_url, headers=headers)
                readme_response.raise_for_status()
                readme_content = readme_response.json()["content"]
            except:
                readme_content = ""

            # Structure des données
            repo_info = {
                "name": repo["name"],
                "full_name": repo["full_name"],
                "description": repo["description"],
                "html_url": repo["html_url"],
                "clone_url": repo["clone_url"],
                "created_at": repo["created_at"],
                "updated_at": repo["updated_at"],
                "language": repo["language"],
                "topics": repo_details.get("topics", []),
                "readme": readme_content,
                "default_branch": repo["default_branch"],
                "is_template": repo.get("is_template", False),
                "dependencies": {
                    "package_json": get_package_json(org_name, repo["name"], repo["default_branch"]),
                }
            }
            repos_data.append(repo_info)
            print(f"Informations récupérées pour {repo['name']}")

        # Sauvegarde des données
        output_file = os.path.join(data_dir, "lynx_repos.json")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump({
                "last_updated": datetime.now().isoformat(),
                "repos": repos_data
            }, f, ensure_ascii=False, indent=2)

        print(f"\nDonnées sauvegardées dans {output_file}")
        return True

    except Exception as e:
        print(f"Erreur lors de la récupération des repos: {str(e)}")
        return False

def get_package_json(org_name, repo_name, branch):
    """
    Récupère le contenu du package.json s'il existe
    """
    url = f"https://api.github.com/repos/{org_name}/{repo_name}/contents/package.json?ref={branch}"
    headers = {
        "Accept": "application/vnd.github.v3+json"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        content = response.json()["content"]
        return content
    except:
        return None

if __name__ == "__main__":
    fetch_lynx_repos()
