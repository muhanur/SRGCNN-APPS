import warnings
warnings.filterwarnings('ignore')

import os
import numpy as np, pandas as pd
import geopandas as gp
import copy
import json

###
import torch
from torch import nn
import torch.nn.functional as F

###
from scipy.sparse import diags
from scipy.sparse import csgraph

###
from sklearn.metrics import median_absolute_error as mae
from sklearn.preprocessing import StandardScaler, MinMaxScaler

###
from joblib import dump, load

###
from operator import itemgetter

# enable cuda gpu accelaration
device = torch.device("cpu")
np.set_printoptions(suppress=True)

SITE_ROOT = os.path.realpath(os.path.dirname(__file__))

def make_sym_matrix_boolean_sum(mx): # This will ensure the adjacent matrix to be symmetric no matter ways of definition
    return 1*np.add(mx,mx.T)

def renormalized_trick_mx(mx): # This will add diagonal ones for the adjacent matrix
    return mx+np.eye(mx.shape[0])

def renormalized_trick_laplacian(mx_tilde):    
    degree_tilde = np.diag(np.sum(mx_tilde, axis=1))
    D_tilde_inv_sqrt=np.linalg.inv(np.sqrt(degree_tilde))
    return np.dot(D_tilde_inv_sqrt,mx_tilde).dot(D_tilde_inv_sqrt)

def return_results(model,input_tensor,idx,target_tensor,adj): ## return results as arrays
    '''
    call a model and get the predicted array and the ground truth array
    '''
    model.eval()
    output = model(input_tensor, adj)
    return output[idx].cpu().detach().numpy(),target_tensor[idx].cpu().detach().numpy()

class GWGraphConvolution(nn.Module):
    """Geographically weighted graph convolution operation that 
    adds locally parameterized weights to all the variables (to be used in the SRGCNNs-GW model)"""
    def __init__(self, f_in, f_out, use_bias=True, activation=nn.ReLU()):
        super().__init__()
        self.f_in = f_in
        self.f_out = f_out
        self.use_bias = use_bias
        self.activation = activation
        #########Geographically local parameters
        self.gwr_weight = nn.Parameter(torch.FloatTensor(514, f_in),requires_grad=True)
        self.weight = nn.Parameter(torch.FloatTensor(f_in, f_out),requires_grad=True) #
        self.bias = nn.Parameter(torch.FloatTensor(f_out),requires_grad=True) if use_bias else None
        self.initialize_weights()
    
    def initialize_weights(self):
        nn.init.constant_(self.weight,1)
        nn.init.constant_(self.gwr_weight,1)
        if self.use_bias: nn.init.constant_(self.bias,0)
        
    def forward(self, input, adj):
        ##  ---- self.method=='SRGCNN-GW':
        gwr_support=torch.mul(input,self.gwr_weight) # use torch.mul to enable element-wise product
        support=torch.mm(adj,gwr_support) #adj here has to be renormalized     
        out=torch.mm(support,self.weight) 
        
        if self.use_bias: out.add_(self.bias) #
        if self.activation is not None: 
            out=self.activation(out) 
        return out

class GWGCN(nn.Module):
    """SRGCNN-GW model"""
    def __init__(self, f_in, n_classes, hidden=[16], dropouts=[0.0]):
        if hidden==[]:
            super().__init__()
            self.layers=[]
            self.dropouts=[]
            self.out_layer = GWGraphConvolution(f_in, n_classes, activation=None)# for spatial regression tasks: no activation func after the output layer
        else:
            super().__init__()
            layers = []
            for f_in,f_out in zip([f_in]+hidden[:-1], hidden):
                layers += [GWGraphConvolution(f_in, f_out)]

            self.layers = nn.Sequential(*layers)
            self.dropouts = dropouts
            self.out_layer = GWGraphConvolution(f_out, n_classes, activation=None)# for spatial regression tasks: no activation func after the output layer
    
    def forward(self, x, adj):
        for layer,d in zip(self.layers, self.dropouts):
            x = layer(x, adj)
            if d > 0: x = F.dropout(x, d, training=self.training, inplace=False)
             
        return self.out_layer(x, adj)

def load_new_variable(db):
    mm_X = MinMaxScaler()
    mm_X = load(os.path.join(SITE_ROOT, "models", "mm_X.bin"))
    
    variable_names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'MN', 'O', 'P', 'Q', 'RSTU']
    
    ### Standarization x input
    x = torch.FloatTensor(
        mm_X.transform(np.log(db[variable_names].values + 1)).tolist()
    ).to(device)
    
    ### logaritm y output
    y = torch.FloatTensor(
        np.log(db[['PDRB']].values).tolist()
    ).to(device)
    
    return x, y

def update_param(df, params):
    params = sorted(params, key=itemgetter('scale'))
    for x in params:
        scale = x["scale"]
        loc = x["loc"]
        for y in x["param"]:
            sector = y["sector"]
            val = y["val"]
            
            if scale == 1:
                ### Semua Kabupaten
                df[sector] = df[sector] + df[sector] * val / 100
            elif scale == 2:
                ### Kawasan KTI/KBI
                mask = df["Kawasan"] == loc
                df.update(df.loc[mask, sector] + df.loc[mask, sector] * val / 100)
            elif scale == 3:
                ### Wilayah Metropilitan
                mask = df["wm"] == loc
                df.update(df.loc[mask, sector] + df.loc[mask, sector] * val / 100)
            elif scale == 4:
                ### Provinsi
                mask = df["KDBPS"].str[0:2] == loc
                df.update(df.loc[mask, sector] + df.loc[mask, sector] * val / 100)
            elif scale == 5:
                ### Kabupaten
                mask = df["KDBPS"] == loc
                df.update(df.loc[mask, sector] + df.loc[mask, sector] * val / 100)
            else:
                ### Pulau
                mask = df["Pulau"] == loc
                df.update(df.loc[mask, sector] + df.loc[mask, sector] * val / 100)
    
    return df

def update_graph(params):
    df_g = pd.read_csv(os.path.join(SITE_ROOT, "data", "OD_2011_POINT.csv"))
    df_g = df_g.sort_values(by='KDBPS', ascending=True)
    df_g = df_g.astype({'KDBPS':'string'})
    
    for x in params:
        scale_o = x["scale_origin"]
        scale_d = x["scale_dest"]
        loc_o = x["loc_origin"]
        loc_d = x["loc_dest"]
        direction = x["direction"]
        val = x["val"]
        
        if scale_o == 1:
            mask_o = df_g.loc[:, "KDBPS"].to_list()
        elif scale_o == 2:
            mask_o = df_g.loc[df_g["Kawasan"] == loc_o, "KDBPS"].to_list()
        elif scale_o == 6:
            mask_o = df_g.loc[df_g["Pulau"] == loc_o, "KDBPS"].to_list()
        elif scale_o == 3:
            mask_o = df_g.loc[df_g["wm"] == loc_o, "KDBPS"].to_list()
        elif scale_o == 4:
            mask_o = df_g.loc[df_g["KDBPS"].str[0:2] == loc_o, "KDBPS"].to_list()
        else:
            mask_o = df_g.loc[df_g["KDBPS"] == loc_o, "KDBPS"].to_list()
        
        if scale_d == 1:
            mask_d = df_g.loc[:, "KDBPS"].to_list()
        elif scale_d == 2:
            mask_d = df_g.loc[df_g["Kawasan"] == loc_d, "KDBPS"].to_list()
        elif scale_d == 6:
            mask_d = df_g.loc[df_g["Pulau"] == loc_d, "KDBPS"].to_list()
        elif scale_d == 3:
            mask_d = df_g.loc[df_g["wm"] == loc_d, "KDBPS"].to_list()
        elif scale_d == 4:
            mask_d = df_g.loc[df_g["KDBPS"].str[0:2] == loc_d, "KDBPS"].to_list()
        else:
            mask_d = df_g.loc[df_g["KDBPS"] == loc_d, "KDBPS"].to_list()
        
        # OD IN
        if direction == 2 or direction == 1:
            new_df = df_g.loc[:, mask_d][df_g["KDBPS"].isin(mask_o)] * ((val / 100) + 1)
            df_g.update(new_df)
        
        # OD OUT
        if direction == 3 or direction == 1:
            new_df = df_g.loc[:, mask_o][df_g["KDBPS"].isin(mask_d)] * ((val / 100) + 1)
            df_g.update(new_df)
    
    df_g = df_g.sort_index(axis=1)
    df_g = df_g.drop(['KDBPS', 'Kawasan', 'Pulau', 'wm', 'x', 'y'], axis=1)
    df_g = df_g.div(df_g.sum(axis=1), axis=0)
    
    od_neighbour = df_g.to_numpy()
    
    A_od_sym = make_sym_matrix_boolean_sum(od_neighbour)
    A_tilde_od_sym = renormalized_trick_mx(A_od_sym)
    Laplacian_od = renormalized_trick_laplacian(A_tilde_od_sym)
    
    laplacian = torch.FloatTensor(Laplacian_od).to(device)
    
    return laplacian
    
def process(s_id, sector, graph):
    db = gp.read_file(os.path.join(SITE_ROOT, "data", "lu_2020_training.json"))
    db = db.sort_values(by=['KDBPS'], ascending=True, ignore_index=True)
    db = update_param(db, sector["data"])
    
    if len(graph) > 0:
        Laplacian_od = update_graph(graph)
    else:
        Laplacian_od = load(os.path.join(SITE_ROOT, "models", "Laplacian_od.bin"))
    
    adj = torch.FloatTensor(Laplacian_od).to(device)
    idx_all = torch.LongTensor(db.index.values).to(device)
    
    ### Params settings for the model on limited Xs
    n_labels = 1
    n_features = 17
    lr = 1e-2 #3e-2
    weight_decay = 5e-4 #3e-2
    
    ### load test
    x_tensor, y_tensor = load_new_variable(db)
    
    best_model = os.path.join(SITE_ROOT, "models", "final_lu.pt")
    
    model = GWGCN(n_features, n_labels, hidden=[8*n_features], dropouts=[0.5]).to(device)
    optimizer = torch.optim.NAdam( filter(lambda p:p.requires_grad, model.parameters()), lr, weight_decay=weight_decay )
    
    checkpoint = torch.load(best_model, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
    
    output, target = return_results(model, x_tensor, idx_all, y_tensor, adj)
    
    dbplot = db.loc[:,['KDDAGRI', 'KDBPS', 'NAMABPS', 'NAMADAGRI', 'Kawasan', 'wm', 'PDRB', 'geometry']].copy()
    dbplot['PRED'] = np.round_(np.exp(output) * db[['error']], decimals = 2)
    dbplot['SELISIH'] = dbplot['PRED'] - dbplot['PDRB']
    dbplot['PERSEN'] = ( dbplot['SELISIH'] / dbplot['PDRB'] ) * 100
    
    path = os.path.join(os.path.join(SITE_ROOT, "data", s_id))
    os.makedirs(path, exist_ok=True)
    
    result_url = os.path.join(SITE_ROOT, "data", s_id, "{}.json".format(s_id))
    dbplot.to_file(result_url, driver='GeoJSON')
    result = json.load(open(result_url))
    return result