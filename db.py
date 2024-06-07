# http://flask.pocoo.org/docs/1.0/tutorial/database/
import click
from flask import current_app, g
from flask.cli import with_appcontext

import mysql.connector

def get_db():
    if "db" not in g:
        g.db = mysql.connector.connect(
            host="localhost",
            user="srgcnn",
            passwd="crestpent1p8",
            database="srgcnn"
        )
    return g.db

def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db():
    db = get_db()

    with current_app.open_resource("schema.sql") as f:
        db.executescript(f.read().decode("utf8"))

@click.command("init-db")
@with_appcontext
def init_db_command():
    """Clear the existing data and create new tables."""
    init_db()
    click.echo("Initialized the database.")

def init_app(app):
    app.teardown_appcontext(close_db)
    app.cli.add_command(init_db_command)