# Python standard libraries
import json
import os
import requests

from dotenv import load_dotenv

# Third-party libraries
from flask import Flask, render_template, redirect, request, url_for, abort, jsonify
from flask_login import (
    LoginManager,
    current_user,
    login_required,
    login_user,
    logout_user,
)
from oauthlib.oauth2 import WebApplicationClient

# Internal imports
#from db import init_db_command
from user import User
from simulation import Simulation
from sector import Sector
from graph import Graph

# Flask app setup
app = Flask(__name__)
SITE_ROOT = os.path.realpath(os.path.dirname(__file__))
app.secret_key = os.environ.get("SECRET_KEY") or os.urandom(24)

# Configuration
load_dotenv(os.path.join(SITE_ROOT, '.env'))

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", None)
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", None)
GOOGLE_DISCOVERY_URL = (
    "https://accounts.google.com/.well-known/openid-configuration"
)

# User session management setup
# https://flask-login.readthedocs.io/en/latest
login_manager = LoginManager()
login_manager.init_app(app)

# OAuth 2 client setup
client = WebApplicationClient(GOOGLE_CLIENT_ID)

def check_file(path):
    return os.path.isfile(path)

# Flask-Login helper to retrieve a user from our db
@login_manager.user_loader
def load_user(user_id):
    return User.get(user_id)

def get_google_provider_cfg():
    return requests.get(GOOGLE_DISCOVERY_URL).json()
    
@app.route("/")
def index():
    dt_simulation = Simulation.getall()
    return render_template('index.html', simulations=dt_simulation)

@app.route("/login")
def login():
    # Find out what URL to hit for Google login
    google_provider_cfg = get_google_provider_cfg()
    authorization_endpoint = google_provider_cfg["authorization_endpoint"]

    # Use library to construct the request for Google login and provide
    # scopes that let you retrieve user's profile from Google
    request_uri = client.prepare_request_uri(
        authorization_endpoint,
        redirect_uri = request.base_url + "/callback",
        scope = ["openid", "email", "profile"],
    )
    return redirect(request_uri)

@app.route("/login/callback")
def callback():
    # Get authorization code Google sent back to you
    code = request.args.get("code")

    # Find out what URL to hit to get tokens that allow you to ask for
    # things on behalf of a user
    google_provider_cfg = get_google_provider_cfg()
    token_endpoint = google_provider_cfg["token_endpoint"]

    # Prepare and send a request to get tokens! Yay tokens!
    token_url, headers, body = client.prepare_token_request(
        token_endpoint,
        authorization_response = request.url,
        redirect_url = request.base_url,
        code=code
    )
    token_response = requests.post(
        token_url,
        headers = headers,
        data = body,
        auth = (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
    )

    # Parse the tokens!
    client.parse_request_body_response(json.dumps(token_response.json()))

    # Now that you have tokens (yay) let's find and hit the URL
    # from Google that gives you the user's profile information,
    # including their Google profile image and email
    userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
    uri, headers, body = client.add_token(userinfo_endpoint)
    userinfo_response = requests.get(uri, headers=headers, data=body)

    # You want to make sure their email is verified.
    # The user authenticated with Google, authorized your
    # app, and now you've verified their email through Google!
    if userinfo_response.json().get("email_verified"):
        unique_id = userinfo_response.json()["sub"]
        users_email = userinfo_response.json()["email"]
        picture = userinfo_response.json()["picture"]
        users_name = userinfo_response.json()["given_name"]
    else:
        return "User email not available or not verified by Google.", 400

    # Create a user in your db with the information provided
    # by Google
    user = User(
        id_ = unique_id, name=users_name, email=users_email, profile_pic=picture
    )
    
    # Doesn't exist? Add it to the database.
    if User.get(unique_id) is None:
        User.create(unique_id, users_name, users_email, picture)

    # Begin user session by logging the user in
    login_user(user)

    # Send user back to homepage
    return redirect(url_for("simulation"))

@app.route('/simulation')
def simulation():
    if current_user.is_authenticated:
        dt_simulation = Simulation.get_byuser(current_user.id)
        return render_template('simulation.html', login=True, data=[current_user.name, current_user.email, current_user.profile_pic], simulations=dt_simulation)
    else:
        return render_template('simulation.html', login=False)

@app.route('/simulation-editor/<id>')
def simulation_editor(id):
    if current_user.is_authenticated:
        simulation = Simulation.get_byid(id)
        
        if simulation != None:
            result_url = os.path.join(SITE_ROOT, "data", simulation.s_id, "{}.json".format(simulation.s_id))
            
            pdrb_url = os.path.join(SITE_ROOT, "data", "lu_2020.json")
            pdrb = json.load(open(pdrb_url))
            pdrb = json.dumps(pdrb)
            
            if (simulation.status == '1' or simulation.status == '2') and check_file(result_url):
                result = json.load(open(result_url))
                result = json.dumps(result)
            else:
                result = None
            
            return render_template('editor.html', login=True, data=[current_user.name, current_user.email, current_user.profile_pic], simulation=simulation, PDRB=pdrb, RESULT=result)
        else:
            return render_template('404.html'), 404
    else:
        return render_template('simulation.html', login=False)

@app.route('/simulation-viewer/<id>')
def simulation_viewer(id):
    simulation = Simulation.get_byid(id)
        
    if simulation != None:
        if simulation.publish == 1:
            result_url = os.path.join(SITE_ROOT, "data", simulation.s_id, "{}.json".format(simulation.s_id))
            
            pdrb_url = os.path.join(SITE_ROOT, "data", "lu_2020.json")
            pdrb = json.load(open(pdrb_url))
            pdrb = json.dumps(pdrb)
            
            if (simulation.status == '1' or simulation.status == '2') and check_file(result_url):
                result = json.load(open(result_url))
                result = json.dumps(result)
            else:
                result = None
            
            return render_template('viewer.html', simulation=simulation, PDRB=pdrb, RESULT=result)
        else:
            return render_template('404.html'), 404
    else:
        return render_template('404.html'), 404
        
@app.route('/manuals')
def manuals():
    return render_template('manuals.html')

@app.route('/about')
def about():
    return render_template('about.html')
    
@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("index"))




# API SIMULATION

@app.route('/api/create', methods = ['POST'])
@login_required
def create_simulation():
    data = request.get_json(force=True)
    simulation = Simulation.create(current_user.id, data["simType"], data["simName"], data["simDesc"])
    return json.dumps({'success':True}), 200, {'Content-Type':'application/json'} 

@app.route('/api/update', methods = ['POST'])
@login_required
def update_simulation():
    data = request.get_json(force=True)
    simulation = Simulation.update(current_user.id, data["simID"], data["simName"], data["simDesc"])
    return json.dumps({'success':True}), 200, {'Content-Type':'application/json'} 
    
@app.route('/api/remove', methods = ['POST'])
@login_required
def remove_simulation():
    data = request.get_json(force=True)
    simulation = Simulation.remove(current_user.id, data["simID"])
    return json.dumps({'success':True}), 200, {'Content-Type':'application/json'} 
    
@app.route('/api/copy', methods = ['POST'])
@login_required
def copy_simulation():
    data = request.get_json(force=True)
    simulation = Simulation.copy(current_user.id, data["sIDOld"], data["simNameNew"], data["simDescNew"])
    return json.dumps({'success':True}), 200, {'Content-Type':'application/json'} 

@app.route('/api/publish', methods = ['POST'])
@login_required
def publish_simulation():
    data = request.get_json(force=True)
    simulation = Simulation.publish(current_user.id, data["simID"], data["publish"])
    return json.dumps({'success':True}), 200, {'Content-Type':'application/json'}

@app.route('/api/simulate', methods = ['POST'])
@login_required
def simulate():
    data = request.get_json(force=True)
    result = Simulation.simulate(current_user.id, data["simID"])
    return json.dumps(result), 200, {'Content-Type':'application/json'}




# API SECTOR

@app.route('/api/sector-all', methods = ['GET'])
def get_sector_by_sim():
    s_id = request.args.get('s_id')
    if current_user.is_authenticated:
        sector = Sector.get_by_simulation(s_id)
        return json.dumps(sector), 200, {'Content-Type':'application/json'}
    else:
        simulation = Simulation.get_byid(s_id)
        if simulation.publish == 1:
            sector = Sector.get_by_simulation(s_id)
            return json.dumps(sector), 200, {'Content-Type':'application/json'}
        else:
            return json.dumps({}), 404, {'Content-Type':'application/json'}

@app.route('/api/sector', methods = ['GET'])
@login_required
def get_sector_by_param():
    p_id = request.args.get('pID')
    sector = Sector.get_by_param(p_id)
    return sector

@app.route('/api/sector', methods = ['POST'])
@login_required
def create_sector():
    data = request.get_json(force=True)
    sector = Sector.create( data["simluationID"], data["scaleParam"], data["locParam"],
        [data["A"], data["B"], data["C"], data["D"], data["E"], data["F"], data["G"], data["H"], 
        data["I"], data["J"], data["K"], data["L"], data["MN"], data["O"], data["P"], data["Q"], data["RSTU"]] )
    return json.dumps({'success':True}), 200, {'Content-Type':'application/json'} 

@app.route('/api/sector', methods = ['PUT'])
@login_required
def update_sector():
    data = request.get_json(force=True)
    sector = Sector.update(data["pID"], data["simluationID"], data["scaleEdit"], data["locEdit"],
        [data["A"], data["B"], data["C"], data["D"], data["E"], data["F"], data["G"], data["H"], 
        data["I"], data["J"], data["K"], data["L"], data["MN"], data["O"], data["P"], data["Q"], data["RSTU"]] )
    return json.dumps({'success':True}), 200, {'Content-Type':'application/json'} 

@app.route('/api/sector', methods = ['DELETE'])
@login_required
def remove_sector():
    data = request.get_json(force=True)
    sector = Sector.remove(data["pID"], data["simluationID"])
    return json.dumps({'success':True}), 200, {'Content-Type':'application/json'} 




# API GRAPH

@app.route('/api/graph-all', methods = ['GET'])
def get_graph_by_sim():
    s_id = request.args.get('s_id')
    if current_user.is_authenticated:
        graph = Graph.get_by_simulation(s_id)
        return json.dumps(graph), 200, {'Content-Type':'application/json'}
    else:
        simulation = Simulation.get_byid(s_id)
        if simulation.publish == 1:
            graph = Graph.get_by_simulation(s_id)
            return json.dumps(graph), 200, {'Content-Type':'application/json'}
        else:
            return json.dumps({}), 404, {'Content-Type':'application/json'}

@app.route('/api/graph', methods = ['GET'])
@login_required
def get_graph_by_param():
    g_id = request.args.get('gID')
    graph = Graph.get_by_param(g_id)
    return graph

@app.route('/api/graph', methods = ['POST'])
@login_required
def create_graph():
    data = request.get_json(force=True)
    graph = Graph.create(data["simluationID"], data["scaleOrigin"], data["locOrigin"], data["scaleDest"], data["locDest"], data["direction"], data["valueGraph"])
    return json.dumps({'success':True}), 200, {'Content-Type':'application/json'} 

@app.route('/api/graph', methods = ['PUT'])
@login_required
def update_graph():
    data = request.get_json(force=True)
    graph = Graph.update(data["gID"], data["simluationID"], data["scaleOrigin"], data["locOrigin"], data["scaleDest"], data["locDest"], data["direction"], data["valueGraph"])
    return json.dumps({'success':True}), 200, {'Content-Type':'application/json'} 

@app.route('/api/graph', methods = ['DELETE'])
@login_required
def remove_graph():
    data = request.get_json(force=True)
    graph = Graph.remove(data["gID"], data["simluationID"])
    return json.dumps({'success':True}), 200, {'Content-Type':'application/json'} 

@app.route('/api/vgraph', methods = ['POST'])
def get_vgraph():
    data = request.get_json(force=True)
    graph = Graph.get_vgraph(data["KDBPS"], data["direction"], data["filter"])
    return graph


# ERROR HANDLE

#Handling error 404 and displaying relevant web page
@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'),404
 
#Handling error 500 and displaying relevant web page
@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'),500

if __name__ == "__main__":
    app.run(ssl_context="adhoc", port=5001)