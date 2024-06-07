import os
import pandas as pd

from flask import jsonify
from sklearn.preprocessing import MinMaxScaler

from db import get_db

SITE_ROOT = os.path.realpath(os.path.dirname(__file__))
scaler = MinMaxScaler(feature_range = (0.5, 7))

class Graph():
        
    def __init__(self, g_id, s_id, scale_origin, loc_origin, scale_dest, loc_dest, direction, val):
        self.p_id = p_id
        self.s_id = s_id
        self.scale_origin = scale_origin
        self.loc_origin = loc_origin
        self.scale_dest = scale_dest
        self.loc_dest = loc_dest
        self.direction = direction
        self.val = val

    @staticmethod
    def get_by_simulation(s_id):
        db = get_db()
        cursor = db.cursor()
        sql = "SELECT * FROM `graph_param` WHERE s_id = %s ORDER BY `scale_origin` desc"
        cursor.execute(sql, (s_id, ))
        row_headers=[x[0] for x in cursor.description]
        param = cursor.fetchall()
        
        if param is None:
            return None
            
        json_data=[]
        for result in param:
            json_data.append(dict(zip(row_headers, result)))
        
        return json_data

    @staticmethod
    def get_by_param(g_id):
        db = get_db()
        cursor = db.cursor(dictionary=True)
        sql = "SELECT * FROM `graph_param` WHERE g_id = %s"
        cursor.execute(sql, (g_id, ))
        param = cursor.fetchone()
        
        if param is None:
            return None
        
        response = jsonify(param)
        response.status_code = 200
        
        return response

    @staticmethod
    def create(s_id, scale_origin, loc_origin, scale_dest, loc_dest, direction, val):
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'INSERT INTO `graph_param` (s_id, scale_origin, loc_origin, scale_dest, loc_dest, direction, val) VALUES (%s, %s, %s, %s, %s, %s, %s)',
            (s_id, scale_origin, loc_origin, scale_dest, loc_dest, direction, val)
        )
        cursor.execute(
            'UPDATE `simulation` SET status = "2" WHERE s_id = %s',
            (s_id, )
        )
        db.commit()
        
        return 200

    @staticmethod
    def update(g_id, s_id, scale_origin, loc_origin, scale_dest, loc_dest, direction, val):
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            'UPDATE `graph_param` SET s_id = %s, scale_origin = %s, loc_origin = %s, scale_dest = %s, loc_dest = %s, direction = %s, val = %s WHERE g_id = %s',
            (s_id, scale_origin, loc_origin, scale_dest, loc_dest, direction, val, g_id)
        )
        cursor.execute(
            'UPDATE `simulation` SET status = "2" WHERE s_id = %s',
            (s_id, )
        )
        db.commit()
        
        return 200

    @staticmethod
    def remove(g_id, s_id):
        db = get_db()
        cursor = db.cursor()
        sql = "DELETE FROM `graph_param` WHERE g_id = %s"
        cursor.execute(sql, (g_id, ))
        cursor.execute(
            'UPDATE `simulation` SET status = "2" WHERE s_id = %s',
            (s_id, )
        )
        db.commit()
        
        return 200

    @staticmethod
    def get_vgraph(kdbps, direction, filter):
        df = pd.read_csv(os.path.join(SITE_ROOT, "data", "OD_2011_POINT.csv"))
        df = df.sort_values(by='KDBPS', ascending=True)
        
        origin = df[['y', 'x']][df["KDBPS"] == kdbps].values.tolist()
        
        sel1 = df.iloc[:, 4:6]
        
        if direction == 1:
            sel2 = df.loc[df['KDBPS'] == kdbps].T.iloc[5:, :]
            sel2.columns = ["val"]
            sel2.reset_index(inplace=True, drop=True)
        elif direction == 0:
            sel2 = df[[str(kdbps)]]
            sel2.columns = ["val"]
            sel2
        
        sel2[["val"]] = scaler.fit_transform(sel2[["val"]])
        
        data = pd.concat([sel1, sel2], axis=1, join="inner")
        data = data.loc[data['val'] > 0]
        
        avg = data["val"].mean()
        stdev = data["val"].std()
        if (filter == 0):
            data = data.loc[data['val'] >= (avg + stdev)]
        elif (filter == 1):
            data = data.sort_values(by='val', ascending=False).head(10)
        
        response = []
        for index, row in data.iterrows():
            response.append([origin[0], [row["y"], row["x"]], row["val"]])
        
        return response