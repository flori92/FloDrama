# Script de validation automatique des URLs 'streamUrl' et 'trailerUrl' dans les données scrappées FloDrama
# Usage : python validate_urls.py <chemin_vers_dump_json>

import sys
import json
import requests

MANDATORY_FIELDS = ['streamUrl', 'trailerUrl']


def check_url(url):
    try:
        resp = requests.head(url, allow_redirects=True, timeout=5)
        return resp.status_code == 200
    except Exception as e:
        return False


def validate_content(content):
    errors = []
    for field in MANDATORY_FIELDS:
        url = content.get(field)
        if not url:
            errors.append(f"Champ manquant ou vide : {field}")
        elif not check_url(url):
            errors.append(f"URL invalide ou inaccessible : {field} → {url}")
    return errors


def main():
    if len(sys.argv) < 2:
        print("Usage: python validate_urls.py <dump.json>")
        sys.exit(1)
    path = sys.argv[1]
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    total = len(data)
    failed = 0
    for i, content in enumerate(data):
        errs = validate_content(content)
        if errs:
            failed += 1
            print(f"[KO] Contenu id={content.get('id', '?')} :")
            for err in errs:
                print(f"   - {err}")
    print(f"\nValidation terminée : {total-failed}/{total} contenus OK.")

if __name__ == "__main__":
    main()
