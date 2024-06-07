import warnings
warnings.filterwarnings('ignore')

import torch
import numpy as np
import pandas as pd
import geopandas as gp

from joblib import dump, load

device = torch.device("cpu")
np.set_printoptions(suppress=True)

def make_sym_matrix_boolean_sum(mx):
    return 1*np.add(mx,mx.T)

def renormalized_trick_mx(mx):
    return mx+np.eye(mx.shape[0])

def renormalized_trick_laplacian(mx_tilde):    
    degree_tilde = np.diag(np.sum(mx_tilde, axis=1))
    D_tilde_inv_sqrt = np.linalg.inv(np.sqrt(degree_tilde))
    return np.dot(D_tilde_inv_sqrt,mx_tilde).dot(D_tilde_inv_sqrt)

db_original = gp.read_file('data/lu_2020.json')
db = db_original.sort_values(by=['KDBPS'], ignore_index=True)

df_w = pd.read_csv('data/OD_2011_ASLI.csv')
df_w = df_w.sort_values(by = 'KDBPS')
df_w = df_w.sort_index(axis=1)
df_w = df_w.drop('KDBPS', axis=1)
df_w = df_w.div(df_w.sum(axis=1), axis=0)

od_neighbour = df_w.to_numpy()

A_od_sym = make_sym_matrix_boolean_sum(od_neighbour)
A_tilde_od_sym = renormalized_trick_mx(A_od_sym)
Laplacian_od = renormalized_trick_laplacian(A_tilde_od_sym)

adj = torch.FloatTensor(Laplacian_od).to(device)
idx_all = torch.LongTensor(db.index.values).to(device)

dump(Laplacian_od, 'models/Laplacian_od.bin', compress=True)
dump(idx_all, 'models/idx_cpu.bin', compress=True)