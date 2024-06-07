import json
import shortuuid
import os
import shutil
import pandas as pd
from datetime import datetime

from db import get_db
from sector import Sector
from graph import Graph

from function import process

SITE_ROOT = os.path.realpath(os.path.dirname(__file__))

def create_output_simulation(s_id):
    path = os.path.join("data", s_id)
    os.makedirs(path, exist_ok = True)
    
    src = "data/lu_2020.json"
    dst = path + "/" + s_id + ".json"
    shutil.copyfile(src, dst)
    
    result_url = os.path.join(SITE_ROOT, "data", s_id, "{}.json".format(s_id))
    result = json.load(open(result_url))
    return result

def remove_base_simulation(s_id):
    path = os.path.join("data", s_id)
    if os.path.exists(path):
        shutil.rmtree(path)

class Simulation():
        
    def __init__(self, s_id, u_id, s_type, create_dt, s_name, s_description, s_dt, status, publish):
        self.s_id = s_id
        self.u_id = u_id
        self.s_type = s_type
        self.create_dt = create_dt
        self.s_name = s_name
        self.s_description = s_description
        self.s_dt = s_dt
        self.status = status
        self.publish = publish

    def getall():
        db = get_db()
        cursor = db.cursor()
        sql = "SELECT `simulation`.*, `user`.`name` FROM `simulation` INNER JOIN `user` ON `user`.`u_id` = `simulation`.`u_id` WHERE `simulation`.`publish` = '1'"
        cursor.execute(sql)
        row_headers=[x[0] for x in cursor.description]
        simulation = cursor.fetchall()
        
        if simulation is None:
            return None
            
        json_data=[]
        for result in simulation:
            json_data.append(dict(zip(row_headers, result)))
        
        db.commit()
        
        return json_data

    @staticmethod
    def get_byuser(u_id):
        db = get_db()
        cursor = db.cursor()
        sql = "SELECT * FROM `simulation` WHERE u_id = %s"
        cursor.execute(sql, (u_id, ))
        row_headers=[x[0] for x in cursor.description]
        simulation = cursor.fetchall()
        
        if simulation is None:
            return None
            
        json_data=[]
        for result in simulation:
            json_data.append(dict(zip(row_headers, result)))
        
        db.commit()
        
        return json_data

    def get_byid(sim_id):
        db = get_db()
        cursor = db.cursor()
        sql = "SELECT * FROM `simulation` WHERE s_id = %s"
        cursor.execute(sql, (sim_id, ))
        simulation = cursor.fetchone()
        
        if simulation is None:
            return None
            
        simulation = Simulation(
            s_id=simulation[0], u_id=simulation[1], s_type=simulation[2], create_dt=simulation[3], 
            s_name=simulation[4], s_description=simulation[5], s_dt=simulation[6], status=simulation[7], publish=simulation[8]
        )
        db.commit()
        
        return simulation

    @staticmethod
    def create(u_id, s_type, s_name, s_description):
        s_id = shortuuid.ShortUUID().random(length=22)
        create_dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'INSERT INTO `simulation` (s_id, u_id, s_type, create_dt, s_name, s_description) VALUES (%s, %s, %s, %s, %s, %s);',
            (s_id, u_id, s_type, create_dt, s_name, s_description)
        )
        db.commit()
        
        return 200

    @staticmethod
    def update(u_id, s_id, s_name, s_description):
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'UPDATE `simulation` SET s_name = %s, s_description = %s WHERE s_id = %s;',
            (s_name, s_description, s_id)
        )
        db.commit()
        
        return 200

    @staticmethod
    def remove(u_id, s_id):
        
        remove_base_simulation(s_id)
        
        db = get_db()
        cursor = db.cursor()
        sql = "DELETE FROM `simulation` WHERE s_id = %s"
        cursor.execute(sql, (s_id, ))
        db.commit()
        
        return 200

    @staticmethod
    def copy(u_id, s_id_old, s_name, s_description):
        s_id = shortuuid.ShortUUID().random(length=22)
        create_dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        db = get_db()
        
        # Copy from source
        cursor = db.cursor()
        sql = 'INSERT INTO simulation (s_id, u_id, s_type, create_dt, s_name, s_description) SELECT %s, u_id, s_type, %s, %s, %s FROM simulation WHERE s_id = %s'
        cursor.execute(sql, (s_id, create_dt, s_name, s_description, s_id_old))
        db.commit()
        
        # Get source parameter
        cursor = db.cursor(dictionary=True)
        sql = "SELECT `sector_param`.`p_id`, `sector_param`.`scale`, `sector_param`.`loc`, `sector_detail`.`sector`, `sector_detail`.`val` "\
            "FROM `sector_param` INNER JOIN `sector_detail` ON `sector_detail`.`p_id` = `sector_param`.`p_id` "\
            "WHERE `sector_param`.`s_id` = %s ORDER BY `sector_param`.`p_id`, `sector_detail`.`sector`;"
        cursor.execute(sql, (s_id_old, ))
        params = cursor.fetchall()
        db.commit()
        
        if len(params) > 0:
            df = pd.DataFrame(params)
            
            data = df.groupby(['p_id','scale','loc'])\
                .apply(lambda x: x[['sector','val']].to_dict('records'))\
                .reset_index(name="detail")\
                .to_dict('records')
            
            # Insert Param Sector
            for param in data:
                sql = 'INSERT INTO sector_param (s_id, scale, loc) VALUES (%s, %s, %s)'
                cursor.execute(sql, (s_id, param["scale"], param["loc"]))
                db.commit()
            
            # Insert Param Detail
            cursor = db.cursor()
            sql = "SELECT `sector_param`.`p_id` FROM `sector_param` WHERE `sector_param`.`s_id` = %s ORDER BY `sector_param`.`p_id`;"
            cursor.execute(sql, (s_id, ))
            p_id = cursor.fetchall()
            db.commit()
            for i in range(len(p_id)):
                for detail in data[i]["detail"]:
                    sql = 'INSERT INTO sector_detail (p_id, sector, val) VALUES (%s, %s, %s)'
                    cursor.execute(sql, (p_id[i][0], detail["sector"], detail["val"]))
                    db.commit()
        
        # Insert Param Graph
        sql = 'INSERT INTO `graph_param` (s_id, scale_origin, loc_origin, scale_dest, loc_dest, direction, val) SELECT %s, scale_origin, loc_origin, scale_dest, loc_dest, direction, val FROM `graph_param` WHERE s_id = %s'
        cursor.execute(sql, (s_id, s_id_old))
        db.commit()
        
        return 200

    @staticmethod
    def publish(u_id, s_id, publish):
        db = get_db()
        cursor = db.cursor()
        sql = "UPDATE `simulation` SET publish = %s WHERE s_id = %s"
        cursor.execute(sql, (publish, s_id, ))
        db.commit()
        
        return 200

    @staticmethod
    def simulate(u_id, s_id):
        s_dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        sector = Sector.get_by_simulation(s_id)
        graph = Graph.get_by_simulation(s_id)
        result = process(s_id, sector, graph)
        
        db = get_db()
        cursor = db.cursor()
        sql = "UPDATE `simulation` SET s_dt = %s, status = '1' WHERE s_id = %s"
        cursor.execute(sql, (s_dt, s_id, ))
        db.commit()
        
        return result