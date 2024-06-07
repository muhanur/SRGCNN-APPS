from flask_login import UserMixin
from db import get_db

class User(UserMixin):
    def __init__(self, id_, name, email, profile_pic):
        self.id = id_
        self.name = name
        self.email = email
        self.profile_pic = profile_pic

    @staticmethod
    def get(user_id):
        db = get_db()
        cursor = db.cursor()
        sql = "SELECT * FROM `user` WHERE u_id = %s"
        cursor.execute(sql, (user_id, ))
        user = cursor.fetchone()
        
        if user is None:
            return None
            
        user = User(
            id_=user[0], name=user[1], email=user[2], profile_pic=user[3]
        )
        
        return user

    @staticmethod
    def create(id_, name, email, profile_pic):
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO `user` (u_id, name, email, profile_pic) VALUES (%s, %s, %s, %s)",
            (id_, name, email, profile_pic)
        )
        db.commit()