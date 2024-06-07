import pandas as pd
from flask import jsonify

from db import get_db

class Sector():
        
    def __init__(self, p_id, s_id, sector, scale, loc, val):
        self.p_id = p_id
        self.s_id = s_id
        self.sector = sector
        self.scale = scale
        self.loc = loc
        self.val = val

    @staticmethod
    def get_by_simulation(s_id):
        db = get_db()
        cursor = db.cursor()
        sql = "SELECT `sector_param`.*, `sector_detail`.`sector`, `sector_detail`.`val` "\
            "FROM `sector_param` INNER JOIN `sector_detail` ON `sector_detail`.`p_id` = `sector_param`.`p_id` "\
            "WHERE `sector_param`.`s_id`=%s "\
            "ORDER BY `sector_param`.`scale`, `sector_param`.`loc`, `sector_detail`.`sector`"
        cursor.execute(sql, (s_id, ))
        row_headers=[x[0] for x in cursor.description]
        param = cursor.fetchall()
        db.commit()
        
        if not param:
            return None
            
        json_data=[]
        for result in param:
            json_data.append(dict(zip(row_headers, result)))
        
        df = pd.DataFrame(json_data)
        group_data = df.groupby(['p_id','s_id','scale','loc']).apply(lambda x: x[['sector','val']].to_dict('records')).reset_index(name="param").to_dict('records')
        
        returnval = {"data":group_data}
        
        return returnval

    @staticmethod
    def get_by_param(p_id):
        db = get_db()
        cursor = db.cursor()
        sql = "SELECT `sector_param`.*, `sector_detail`.`sector`, `sector_detail`.`val` "\
            "FROM `sector_param` INNER JOIN `sector_detail` ON `sector_detail`.`p_id` = `sector_param`.`p_id` "\
            "WHERE `sector_param`.`p_id`=%s "\
            "ORDER BY `sector_param`.`scale`, `sector_param`.`loc`, `sector_detail`.`sector`"
        cursor.execute(sql, (p_id, ))
        row_headers=[x[0] for x in cursor.description]
        param = cursor.fetchall()
        db.commit()
        
        if param is None:
            return None
        
        json_data=[]
        for result in param:
            json_data.append(dict(zip(row_headers, result)))
        
        df = pd.DataFrame(json_data)
        group_data = df.groupby(['p_id','s_id','scale','loc']).apply(lambda x: x[['sector','val']].to_dict('records')).reset_index(name="param").to_dict('records')
        
        return group_data[0]

    @staticmethod
    def create(s_id, scale, loc, sectors):
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'INSERT INTO `sector_param` (s_id, scale, loc) VALUES (%s, %s, %s)',
            (s_id, scale, loc)
        )
        db.commit()
        
        cursor.execute( 'SELECT max(p_id) as p_id FROM sector_param WHERE s_id = %s', (s_id, ))
        last_id = cursor.fetchone()
        db.commit()
        
        sectors_var = ['A','B','C','D','E','F','G','H','I','J','K','L','MN','O','P','Q','RSTU']
        length = len(sectors)
        
        for i in range(length):
            cursor.execute(
                'INSERT INTO `sector_detail` (p_id, sector, val) VALUES (%s, %s, %s)', ( int(last_id[0]), str(sectors_var[i]), float(sectors[i]) )
            )
            db.commit()
        
        cursor.execute(
            'UPDATE `simulation` SET status = "2" WHERE s_id = %s',
            (s_id, )
        )
        db.commit()

        return 200

    @staticmethod
    def update(p_id, s_id, scale, loc, sectors):
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'UPDATE `sector_param` SET scale = %s, loc = %s WHERE p_id = %s',
            (scale, loc, p_id)
        )
        db.commit()
        
        sectors_var = ['A','B','C','D','E','F','G','H','I','J','K','L','MN','O','P','Q','RSTU']
        length = len(sectors)
        
        for i in range(length):
            cursor.execute(
                'UPDATE `sector_detail` SET val = %s WHERE p_id = %s AND sector = %s', (float(sectors[i]), p_id, str(sectors_var[i]) )
            )
            db.commit()
            
        cursor.execute(
            'UPDATE `simulation` SET status = "2" WHERE s_id = %s',
            (s_id, )
        )
        db.commit()
        
        return 200

    @staticmethod
    def remove(p_id, s_id):
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            "DELETE FROM `sector_param` WHERE p_id = %s", 
            (p_id, )
        )
        cursor.execute(
            'UPDATE `simulation` SET status = "2" WHERE s_id = %s',
            (s_id, )
        )
        db.commit()
        
        return 200