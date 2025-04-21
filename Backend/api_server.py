from flask import Flask, jsonify, request, abort
import json
import os
import boto3
from botocore.exceptions import ClientError

app = Flask(__name__)

# Variables S3
S3_BUCKET = os.environ.get('FLODRAMA_S3_BUCKET', 'flodrama-dump')
S3_KEY = os.environ.get('FLODRAMA_S3_KEY', 'content.json')

# Chargement des données depuis S3
def load_content():
    s3 = boto3.client('s3')
    try:
        obj = s3.get_object(Bucket=S3_BUCKET, Key=S3_KEY)
        data = obj['Body'].read().decode('utf-8')
        return json.loads(data)
    except ClientError as e:
        print(f"Erreur S3: {e}")
        return []
    except Exception as e:
        print(f"Erreur de chargement du dump: {e}")
        return []

@app.route('/api/content')
def get_content():
    """
    Endpoint: /api/content?category=trending
    Retourne la liste des contenus, filtrés par catégorie si précisé
    """
    data = load_content()
    category = request.args.get('category')
    if category:
        filtered = [item for item in data if item.get('category') == category]
        return jsonify(filtered)
    return jsonify(data)

@app.route('/api/content/<content_id>')
def get_content_detail(content_id):
    data = load_content()
    for item in data:
        if str(item.get('id')) == str(content_id):
            return jsonify(item)
    abort(404, description="Contenu non trouvé")

@app.route('/api/content/<content_id>/stream')
def get_content_stream(content_id):
    data = load_content()
    for item in data:
        if str(item.get('id')) == str(content_id):
            return jsonify({"url": item.get('streamUrl', None)})
    abort(404, description="Stream non trouvé")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
