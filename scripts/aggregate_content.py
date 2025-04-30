import json
import os

def main():
    # Chemin du dossier contenant les fichiers JSON
    data_dir = "export_data"
    
    # Vérification de l'existence du dossier
    if not os.path.exists(data_dir):
        print(f"❌ Le dossier {data_dir} n'existe pas!")
        return
    
    # Liste des fichiers à agréger
    files_to_aggregate = [
        "dramas.json",
        "popular.json",
        "featured.json",
        "recently_added.json",
        "top_rated.json"
    ]
    
    # Dictionnaire pour stocker le contenu agrégé
    all_content = {}
    content_list = []
    
    # Lecture et agrégation des fichiers
    for filename in files_to_aggregate:
        file_path = os.path.join(data_dir, filename)
        if os.path.exists(file_path):
            print(f" Lecture du fichier {filename}...")
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    if item["id"] not in all_content:
                        all_content[item["id"]] = item
                        content_list.append(item)
    
    # Écriture du fichier agrégé
    output_file = os.path.join(data_dir, "all_content.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(content_list, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Fichier agrégé créé avec succès: {output_file}")
    print(f"   Total d'éléments: {len(content_list)}")

if __name__ == "__main__":
    main()
