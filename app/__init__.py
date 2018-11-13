from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False
CORS(app)

from app import routes
