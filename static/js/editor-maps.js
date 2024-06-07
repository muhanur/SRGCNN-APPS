var sectorSelector = '#sectorParam', sectorEdit = '#sectorEdit';
var scaleSelector = '#scaleParam', scaleEdit = '#scaleEdit', scaleOrigin = '#scaleOrigin', scaleDest = '#scaleDest', scaleOriginEdit = '#scaleOriginEdit', scaleDestEdit = '#scaleDestEdit';
var locSelector = '#locParam', locEdit = '#locEdit', locOrigin = '#locOrigin', locDest = '#locDest', locOriginEdit = '#locOriginEdit', locDestEdit = '#locDestEdit';
var valSelector = '#valueParam', valEdit = '#valueEdit', valueGraph = '#valueGraph';
var directionEdit = '#directionEdit';

var sectorDefaultText = 'Pilih sektor...';
var scaleDefaultText = 'Pilih skala...';
var locDefaultText = 'Pilih lokasi...';

var colors_palette = ['rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(36, 215, 204, 0.7)', 'rgba(236, 108, 0, 0.7)', 'rgba(232, 158, 1, 0.7)', 'rgba(54, 155, 1, 0.7)', 'rgba(126, 0, 214, 0.7)' ];

var sectors = [
	{ name: 'A. Pertanian, Kehutanan, dan Perikanan', code: "A" },
	{ name: 'B. Pertambangan dan Penggalian', code: "B" },
	{ name: 'C. Industri Pengolahan', code: "C" },
	{ name: 'D. Pengadaan Listrik dan Gas', code: "D" },
	{ name: 'E. Pengadaan Air, Pengelolaan Sampah, Limbah dan Daur Ulang', code: "E" },
	{ name: 'F. Konstruksi', code: "F" },
	{ name: 'G. Perdagangan Besar dan Eceran; Reparasi Mobil dan Sepeda Motor', code: "G" },
	{ name: 'H. Transportasi dan Pergudangan', code: "H" },
	{ name: 'I. Penyediaan Akomodasi dan Makan Minum', code: "I" },
	{ name: 'J. Informasi dan Komunikasi', code: "J" },
	{ name: 'K. Jasa Keuangan dan Asuransi', code: "K" },
	{ name: 'L. Real Estate', code: "L" },
	{ name: 'MN. Jasa Perusahaan', code: "MN" },
	{ name: 'O. Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial Wajib', code: "O" },
	{ name: 'P. Jasa Pendidikan', code: "P" },
	{ name: 'Q. Jasa Kesehatan dan Kegiatan Sosial', code: "Q" },
	{ name: 'RSTU. Jasa lainnya', code: "RSTU" }
];

var scales = [
	{ name: 'Nasional', code: 1 },
	{ name: 'Kawasan', code: 2 },
	{ name: 'Pulau', code: 6 },
	{ name: 'Metropolitan', code: 3 },
	{ name: 'Provinsi', code: 4 },
	{ name: 'Kabupaten/kota', code: 5 }
];

var directions = [
	{ name: 'In & Out', code: 1 },
	{ name: 'In', code: 2 },
	{ name: 'Out', code: 3 }
];

var locs = [];
var riilData = [];
var predictData = [];

var grades = [0, 
	146.600000, 
	45093.474000, 
	90040.348000, 
	134987.222000, 
	179934.096000, 
	224880.970000, 
	269827.844000, 
	314774.718000, 
	359721.592000, 
	404668.466000, 
	449615.340000];
	
var labels = ["< 146.60", 
	"146.60 - 45,093.47", 
	"45,093.47 - 90,040.35", 
	"90,040.35 - 134,987.22", 
	"134,987.22 - 179,934.10", 
	"179,934.10 - 224,880.97", 
	"224,880.97 - 269,827.84", 
	"269,827.84 - 314,774.72", 
	"314,774.72 - 359,721.59", 
	"359,721.59 - 404,668.47", 
	"404,668.47 - 449,615.34", 
	"> 449,615.34"];

// Graph Layer
var enableGraph = false;
var directionGraph = 0;
var filterGraph = 0;

$.getJSON("/static/js/data-cat.json", (json) => {
	locs = json;
});

function isTouch() {
  return (('ontouchstart' in window)
      || (navigator.MaxTouchPoints > 0)
      || (navigator.msMaxTouchPoints > 0));    
}

function getColor(d) {
    return d > 449615.340000 ? '#b81818' :
           d >= 404668.466000 ? '#ff0000' :
           d >= 359721.592000 ? '#ff1313' :
           d >= 314774.718000 ? '#ff2727' :
           d >= 269827.844000 ? '#ff3b3b' :
           d >= 224880.970000 ? '#ff4f4f' :
           d >= 179934.096000 ? '#ff6363' :
           d >= 134987.222000 ? '#ff7777' :
           d >= 90040.348000 ? '#ff8b8b' :
           d >= 45093.474000 ? '#ff9f9f' :
           d >= 146.600000 ? '#ffb3b3' :
                      '#beb297';
}

const toastLiveExample = document.getElementById('liveToast')
const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)

function liveToast(msg) {
	$(".toast-body").html(msg)
	toastBootstrap.show()
}

function defaultCreateForm() {
	// Clear Form
	$(scaleSelector).empty();
	$(locSelector).empty();
	$(sectorSelector).empty();
	
	// Set default text
	$(scaleSelector).append($('<option>').text(scaleDefaultText).val(""));
	$.each(scales, function(number, scale) {
		$(scaleSelector).append($('<option>').text(scale.name).attr('value', scale.code));
	});
	
	$(locSelector).append($('<option>').text(locDefaultText).val(""));
	$(locSelector).select2({theme:'bootstrap-5', dropdownParent: $('#createSector')});
	
	// Populate sector data
	$.each(sectors, function(number, sector) {
		$(sectorSelector).append('<div class="input-group input-group-sm mb-2">' +
									'<span class="input-group-text w-75 text-wrap text-start">' + sector.name + '</span>' +
									'<input type="number" min="-100" max="1000" id="' + sector.code + '" name="' + sector.code + '" class="form-control text-end" placeholder="0.00" aria-label="0.00" aria-describedby="' + sector.code + '" value="0.00" onchange="(function(el){el.value=parseFloat(el.value).toFixed(2);})(this)"/>' +
									'<span class="input-group-text">%</span>' +
								'</div>');
	});
}

function defaultEditForm() {
	// Clear Form
	$(scaleEdit).empty();
	$(locEdit).empty();
	$(sectorEdit).empty();
	
	// Set default text
	$(scaleEdit).append($('<option>').text(scaleDefaultText).val(""));
	$(locEdit).append($('<option>').text(locDefaultText).val(""));
	$(locEdit).select2({theme:'bootstrap-5', dropdownParent: $('#editSector')});

	// Populate scales data
	$.each(scales, function(number, scale) {
		$(scaleEdit).append($('<option>').text(scale.name).attr('value', scale.code));
	});
	
	// Populate sector data
	$.each(sectors, function(number, sector) {
		$(sectorEdit).append('<div class="input-group input-group-sm mb-2">' +
									'<span class="input-group-text w-75 text-wrap text-start">' + sector.name + '</span>' +
									'<input type="number" min="-100" max="1000" id="' + sector.code + '_edt" name="' + sector.code + '" class="form-control text-end" placeholder="0.00" aria-label="0.00" aria-describedby="' + sector.code + '" value="0.00" onchange="(function(el){el.value=parseFloat(el.value).toFixed(2);})(this)"/>' +
									'<span class="input-group-text">%</span>' +
								'</div>');
	});
}

function defaultCreateGraph() {
	// Clear Form
	$(scaleOrigin).empty();
	$(locOrigin).empty();
	$(scaleDest).empty();
	$(locDest).empty();
	$(valueGraph).val(0);
	$("#rangeGraphVal").html(0);
	
	// Set default text
	$(scaleOrigin).append($('<option>').text(scaleDefaultText).val(""));
	$(locOrigin).append($('<option>').text(locDefaultText).val(""));
	$(scaleDest).append($('<option>').text(scaleDefaultText).val(""));
	$(locDest).append($('<option>').text(locDefaultText).val(""));
	
	$(locOrigin).select2({theme:'bootstrap-5', dropdownParent: $('#createGraph')});
	$(locDest).select2({theme:'bootstrap-5', dropdownParent: $('#createGraph')});
	
	// Populate scales data
	$.each(scales, function(number, scale) {
		$(scaleOrigin).append($('<option>').text(scale.name).attr('value', scale.code));
	});
	
	// Populate scales data
	$.each(scales, function(number, scale) {
		$(scaleDest).append($('<option>').text(scale.name).attr('value', scale.code));
	});
}

function defaultEditGraph() {
	// Clear Form
	$(scaleOriginEdit).empty();
	$(locOriginEdit).empty();
	$(scaleDestEdit).empty();
	$(locDestEdit).empty();
	$(valueGraphEdit).val(0);
	$("#rangeGraphEditVal").html(0);
	
	// Set default text
	$(scaleOriginEdit).append($('<option>').text(scaleDefaultText).val(""));
	$(locOriginEdit).append($('<option>').text(locDefaultText).val(""));
	$(scaleDestEdit).append($('<option>').text(scaleDefaultText).val(""));
	$(locDestEdit).append($('<option>').text(locDefaultText).val(""));
	
	$(locOriginEdit).select2({theme:'bootstrap-5', dropdownParent: $('#editGraph')});
	$(locDestEdit).select2({theme:'bootstrap-5', dropdownParent: $('#editGraph')});
	
	// Populate scales data
	$.each(scales, function(number, scale) {
		$(scaleOriginEdit).append($('<option>').text(scale.name).attr('value', scale.code));
	});
	
	// Populate scales data
	$.each(scales, function(number, scale) {
		$(scaleDestEdit).append($('<option>').text(scale.name).attr('value', scale.code));
	});
}

function format ( d ) {
	let txt = "";
	for (key in d.param) {
		if(d.param[key].val != 0){
			txt += '<tr>'+
				'<td class="text-wrap">'+sectors.find(o => o.code === d.param[key].sector).name+'</td>'+
				'<td class="text-end">'+d.param[key].val+'%</td>'+
			'</tr>';
		}
	}
    return '<table class="table table-sm table-bordered"><thead><tr><th>Sektor</th><th class="text-center">+/-</th><tr></thead>'+txt+'</table>';
}

$('#table-param').on('click', 'tbody td.dt-control', function () {
	var tr = $(this).closest('tr');
	var row = tableParam.row( tr );

	if ( row.child.isShown() ) {
		row.child.hide();
	}
	else {
		row.child( format(row.data()) ).show();
	}
} );

$('#table-param').on('requestChild.dt', function(e, row) {
	row.child(format(row.data())).show();
})

let tableParam = new DataTable('#table-param', {
	"searching": false,
	"paging": false,
	"columnDefs": [{
		"targets": [ 1 ],
		"render" : function (data, type, row) {
			return scales.find(o => o.code === row.scale).name
		}
	},{
		"targets": [ 2 ],
		"render" : function (data, type, row) {
			return locs.find(o => o.code === row.loc).name
		}
	},{
		"targets": [ 3 ],
		"className": 'dt-body-right',
		"render" : function (data, type, row) {
			return '<div class="btn-group btn-group-sm" role="group">' + 
				'<button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-pid="' + row.p_id + '" data-bs-target="#editSector">' + 
				'<i class="fa-solid fa-pen-to-square"></i></button>' + 
				'<button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-pid="' + row.p_id + '" data-bs-target="#deleteSector">' + 
				'<i class="fa-solid fa-trash"></i></button>' + 
				'</div>';
		}
	}],
	"ajax": {
		"url": "/api/sector-all",
		"data": {
			"s_id": sID
		}
	},
	"rowId": 'p_id',
	"columns": [
		{
			"className": 'dt-control',
			"orderable": false,
			"data": null,
			"defaultContent": ''
		}
	],
	"order": [[1, 'asc']]
});

tableParam.on('stateLoaded', (e, settings, data) => {
	for(var i = 0; i < data.childRows.length; i++) {
		var row = table.row(data.childRows[i]);
		row.child(format(row.data())).show();
	}
})

function load_param_graph() {
	$.get( "/api/graph-all", { s_id: sID } ).done(function( params ) {
		$('#param-graph').html("");
		$(function() {
			$.each(params, function(i, item) {
				let scale_origin = scales.find(o => o.code === item.scale_origin);
				let loc_origin = locs.find(o => o.code === item.loc_origin);
				let scale_dest = scales.find(o => o.code === item.scale_dest);
				let loc_dest = locs.find(o => o.code === item.loc_dest);
				let direction = directions.find(o => o.code === item.direction);
				
				var $tr = $('<tr>').append(
					$('<th>').text(i + 1),
					$('<td>').text(loc_origin.name),
					$('<td>').text(loc_dest.name),
					$('<td>').text(direction.name),
					$('<td class="text-center">').text(item.val + "%"),
					$('<td class="text-end">').append(
						$('<div class="btn-group btn-group-sm" role="group">').append(
							$('<button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-gid="' + item.g_id + '" data-bs-target="#editGraph">').append(
								$('<i class="fa-solid fa-pen-to-square">')
							),
							$('<button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-gid="' + item.g_id + '" data-bs-target="#deleteGraph">').append(
								$('<i class="fa-solid fa-trash">')
							),
						)
					)
				).appendTo('#param-graph');
			});
		});
	});
}
load_param_graph();

var map = L.map('map', {gestureHandling: true}).setView([51.505, -0.09], 3);
map.createPane('left');
map.createPane('right');
var topPane = map.createPane('topPane');
var canvasRenderer = L.svg({pane:"topPane"});

var Esri_WorldDarkGrayCanvas = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
	maxZoom: 16,
	attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
}).addTo(map);

var Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
	maxZoom: 16,
	attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
});

var googleLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
	maxZoom: 19, 
	subdomains:['mt0','mt1','mt2','mt3'],
	attribution: '&copy; <a href="https://maps.google.com">Google Maps</a>'
});

var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
});

var baselayer = {
    "ESRI World Dark Gray": Esri_WorldDarkGrayCanvas,
	"ESRI World Gray": Esri_WorldGrayCanvas,
    "Google Street": googleLayer,
    "OpenStreetMap": osm
}

// fullscreen control
map.addControl(new L.Control.Fullscreen());
map.on('fullscreenchange', function () {
    if (map.isFullscreen()) {
        map.gestureHandling.disable();
    } else {
        map.gestureHandling.enable();
    }
});

// Load Graph
function pointGraph(param) {
	param.forEach(makeGraph);
	map.addLayer(GraphLayer);
}

function load_graph(KDBPS, direction, filter) {
	$.post( "/api/vgraph", 
		JSON.stringify({ KDBPS: parseInt(KDBPS), direction: direction, filter: filter }),
		function(data,status){
			pointGraph(data)
		}
	);
};

var GraphLayer = L.featureGroup()

function makeGraph(value, index, array){
	
	var latlng1 = value[0],
		latlng2 = value[1];
		
	var offsetX = latlng2[1] - latlng1[1],
		offsetY = latlng2[0] - latlng1[0];
		
	var r = Math.sqrt(Math.pow(offsetX, 2) + Math.pow(offsetY, 2)), 
		theta = Math.atan2(offsetY, offsetX);
		
	var thetaOffset = 0.5;

	var r2 = (r / 2) / (Math.cos(thetaOffset)), theta2 = theta + thetaOffset;
		
	var midpointX = (r2 * Math.cos(theta2)) + latlng1[1],
		midpointY = (r2 * Math.sin(theta2)) + latlng1[0];
		
	var midpointLatLng = [midpointY, midpointX];
	
	if (directionGraph == 0){
		lineColor = 'rgba(255,255,0,0.75)';
		reverseGraph = 'normal';
	}else{
		lineColor = 'rgba(0,255,0,0.75)';
		reverseGraph = 'reverse';
	};
	
	var pathOptions = {
		pane: 'topPane', 
		color: lineColor,
		weight: value[2],
		dashArray: '8',
		animate: {
			duration: 10000, 
			iterations: Infinity,
			direction: reverseGraph
		},
		renderer: canvasRenderer
	}
	
	let antPolyline = new L.curve(
		['M', latlng1, 'Q', midpointLatLng, latlng2], pathOptions
	);
	
	GraphLayer.addLayer(antPolyline)
	
	var icon = L.divIcon({className: 'div-icon'});
	GraphLayer.addLayer(L.marker(latlng2, { icon: icon }));
	
}

// Add GeoJSON
var PDRBLayer = L.geoJson(PDRBFeature, {
	style: function (feature) {
		return {
			fillColor: getColor(feature.properties.PDRB),
			weight: .5,
			opacity: 1,
			color: '#fff',
			fillOpacity: 0.8
		};
	},
	pane: 'left'
}).addTo(map);

map.fitBounds(PDRBLayer.getBounds());

function showGraph(e) {
	GraphLayer.remove();
	if (!enableGraph) {
		var popup = e.layer.bindPopup(
			'<strong>' + e.layer.feature.properties.NAMADAGRI + '</strong><br><br>' +
			'<table class="table table-sm"><thead><tr><th>Sektor</th><th>Nilai (Milyar)</th></tr></thead><tbody>' +
			'<tr><td>A. Pertanian, Kehutanan, dan Perikanan</td><td class="text-end">' + e.layer.feature.properties.A.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</td></tr>' +
			'<tr><td>B. Pertambangan dan Penggalian</td><td class="text-end">' + e.layer.feature.properties.B.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</td></tr>' +
			'<tr><td>C. Industri Pengolahan</td><td class="text-end">' + e.layer.feature.properties.C.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</td></tr>' +
			'<tr><td>D. Pengadaan Listrik dan Gas</td><td class="text-end">' + e.layer.feature.properties.D.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</td></tr>' +
			'<tr><td>E. Pengadaan Air, Pengelolaan Sampah, Limbah dan Daur Ulang</td><td class="text-end">' + e.layer.feature.properties.E.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</td></tr>' +
			'<tr><td>F. Konstruksi</td><td class="text-end">' + e.layer.feature.properties.F.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</td></tr>' +
			'<tr><td>G. Perdagangan Besar dan Eceran; Reparasi Mobil dan Sepeda Motor</td><td class="text-end">' + e.layer.feature.properties.G.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</td></tr>' +
			'<tr><td>H. Transportasi dan Pergudangan</td><td class="text-end">' + e.layer.feature.properties.H.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</td></tr>' +
			'<tr><td>I. Penyediaan Akomodasi dan Makan Minum</td><td class="text-end">' + e.layer.feature.properties.I.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</td></tr>' +
			'<tr><td>J. Informasi dan Komunikasi</td><td class="text-end">' + e.layer.feature.properties.J.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</td></tr>' +
			'<tr><td>K. Jasa Keuangan dan Asuransi</td><td class="text-end">' + e.layer.feature.properties.K.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</td></tr>' +
			'<tr><td>L. Real Estate</td><td class="text-end">' + e.layer.feature.properties.L.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</td></tr>' +
			'<tr><td>MN. Jasa Perusahaan</td><td class="text-end">' + e.layer.feature.properties.MN.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</td></tr>' +
			'<tr><td>O. Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial Wajib</td><td class="text-end">' + e.layer.feature.properties.O.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</td></tr>' +
			'<tr><td>P. Jasa Pendidikan</td><td class="text-end">' + e.layer.feature.properties.P.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</td></tr>' +
			'<tr><td>Q. Jasa Kesehatan dan Kegiatan Sosial</td><td class="text-end">' + e.layer.feature.properties.Q.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</td></tr>' +
			'<tr><td>RSTU. Jasa lainnya</td><td class="text-end">' + e.layer.feature.properties.RSTU.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</td></tr>' +
			'<tr><td><strong>Total PDRB 2020</td><td class="text-end">' + e.layer.feature.properties.PDRB.toLocaleString(undefined, {
				minimumFractionDigits: 2, maximumFractionDigits: 2
			}) + '</strong></td></tr>' +
			'</tbody></table>'
		).openPopup();
	} else{
		load_graph(e.layer.feature.properties.KDBPS, directionGraph, filterGraph, pointGraph);
	}
}

function hideGraph() {
	GraphLayer.eachLayer(function(layer) { GraphLayer.removeLayer(layer); });
	GraphLayer.remove();
};

map.on('click',function(e) {
	hideGraph();
});

PDRBLayer.on('click',function(e) {
	GraphLayer.eachLayer(function(layer) { GraphLayer.removeLayer(layer); });
	showGraph(e);
	L.DomEvent.stopPropagation(e);
});

var legend = L.control({ position: 'bottomleft', title: 'Total PDRB' });
legend.onAdd = function (map) {
	var div = L.DomUtil.create('div', 'info legend');

	div.innerHTML += '<div class="mb-2"><strong>Total PDRB 2020 (Milyar)</strong></div>';
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML += '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' + labels[i] + '<br>';
    }
	return div
}
legend.addTo(map);

var legendP = L.control({ position: 'bottomright', title: 'Prediksi PDRB' });

map.on('overlayadd', function (eventLayer) {
	if (eventLayer.name === 'Hasil Simulasi') {
		legendP.addTo(this);
	} else {
		legend.addTo(this);
	}
});

map.on('overlayremove', function (eventLayer) {
	if (eventLayer.name === 'Hasil Simulasi') {
		this.removeControl(legendP);
	} else {
		this.removeControl(legend);
	}
});

// sidebar control
var sidebar = L.control.sidebar({
	autopan: false,
	closeButton: true,
	container: 'sidebar',
	position: 'left',
}).addTo(map);

var ResultLayer = L.geoJson(null, { pane: 'right' }).addTo(map);

function predictRender(ResultFeature, Field, Scale, title){
	ResultLayer.clearLayers();
	layerControl.removeLayer(ResultLayer);
	if (Field == 'PRED'){
		ResultLayer = L.geoJson(ResultFeature, {
			pane: 'right',
			style: function (feature) {
				return {
					fillColor: getColor(feature.properties.PRED),
					weight: .5,
					opacity: 1,
					color: '#fff',
					fillOpacity: 0.8
				};
			},
			onEachFeature: function (feature, layer) {
				layer.bindPopup(
					'<strong>' + feature.properties.NAMADAGRI + '</strong><br><br>' +
					'<table class="table table-sm"><thead><tr><th>Sektor</th><th>Nilai</th></tr></thead><tbody>' +
					'<tr><td><strong>Total PDRB 2020 (Milyar)</td><td class="text-end">' + feature.properties.PDRB.toLocaleString(undefined, {
						minimumFractionDigits: 2, maximumFractionDigits: 2
					}) + '</strong></td></tr>' +
					'<tr><td>Prediksi Total PDRB (Milyar)</td><td class="text-end">' + feature.properties.PRED.toLocaleString(undefined, {
						minimumFractionDigits: 2, maximumFractionDigits: 2
					}) + '</td></tr>' +
					'<tr><td>Selisih PDRB (Milyar)</td><td class="text-end">' + feature.properties.SELISIH.toLocaleString(undefined, {
						minimumFractionDigits: 2, maximumFractionDigits: 2
					}) + '</td></tr>' +
					'<tr><td>% Selisih PDRB</td><td class="text-end">' + feature.properties.PERSEN.toLocaleString(undefined, {
						minimumFractionDigits: 3, maximumFractionDigits: 3
					}) + '</td></tr>' +
					'</tbody></table>'
				)
			}
		}).addTo(map);
	
		legendP.onAdd = function (map) {
			var div = L.DomUtil.create('div', 'info legend');

			div.innerHTML += '<div class="mb-2"><strong>' + title + '</strong></div>';
			for (var i = 0; i < grades.length; i++) {
				div.innerHTML += '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' + labels[i] + '<br>';
			}
			return div
		}
		legendP.addTo(map);
		
	}else{
		ResultLayer = L.choropleth(ResultFeature, {
			pane: 'right',
			valueProperty: Field,
			scale: Scale,
			steps: 5,
			mode: 'k',
			style: {
				color: '#fff',
				weight: .5,
				fillOpacity: 0.8
			},
			onEachFeature: function (feature, layer) {
				layer.bindPopup(
					'<strong>' + feature.properties.NAMADAGRI + '</strong><br><br>' +
					'<table class="table table-sm"><thead><tr><th>Sektor</th><th>Nilai</th></tr></thead><tbody>' +
					'<tr><td><strong>Total PDRB 2020 (Milyar)</td><td class="text-end">' + feature.properties.PDRB.toLocaleString(undefined, {
						minimumFractionDigits: 2, maximumFractionDigits: 2
					}) + '</strong></td></tr>' +
					'<tr><td>Prediksi Total PDRB (Milyar)</td><td class="text-end">' + feature.properties.PRED.toLocaleString(undefined, {
						minimumFractionDigits: 2, maximumFractionDigits: 2
					}) + '</td></tr>' +
					'<tr><td>Selisih PDRB (Milyar)</td><td class="text-end">' + feature.properties.SELISIH.toLocaleString(undefined, {
						minimumFractionDigits: 2, maximumFractionDigits: 2
					}) + '</td></tr>' +
					'<tr><td>% Selisih PDRB</td><td class="text-end">' + feature.properties.PERSEN.toLocaleString(undefined, {
						minimumFractionDigits: 3, maximumFractionDigits: 3
					}) + '</td></tr>' +
					'</tbody></table>'
				)
			}
		}).addTo(map);
	
		legendP.onAdd = function (map) {
			var div = L.DomUtil.create('div', 'info legend');
			var limits = ResultLayer.options.limits;
			var colors = ResultLayer.options.colors;
			var labels = [];

			limits.forEach(function (limit, index) {
				if (index == 0){
					min = 0;
				}else{
					min = addCommas(limits[index - 1]);
				}
				max = addCommas(limits[index]);
				labels.push('<i style="background-color:' + colors[index] + '"></i> ' + min + ' - ' + max + '');
			});
			
			div.innerHTML += '<div class="mb-2"><strong>' + title + '</strong></div>' + labels.join('<br>');
			return div;
		}
		legendP.addTo(map);
	}
	
	layerControl.addOverlay(ResultLayer, 'Hasil Simulasi');
	sideControl.setRightLayers(ResultLayer);
}

L.Control.Custom = L.Control.Layers.extend({
	onAdd: function () {
		this._initLayout();
		this._addButton();
		this._update();
		return this._container;
	},
	_addButton: function () {
		var elements = this._container.getElementsByClassName('leaflet-control-layers-list');
		var div = L.DomUtil.create('div', 'pred-attr', elements[0]);
		
		div.style = "display:none;";
		div.innerHTML = '<div class="leaflet-control-layers-separator"></div>' +
			'<label class="mt-2 mb-1"><strong>Atribut Prediksi:</strong></label>' + 
			'<select name="renderPrediction" class="form-select form-select-sm mb-3">' +
				'<option value="PRED" selected>Prediksi Total PDRB (Milyar)</option>' +
				'<option value="SELISIH">Selisih Prediksi terhadap Total PDRB 2020 (Milyar)</option>' + 
				'<option value="PERSEN">% Selisih Prediksi terhadap Total PDRB 2020</option>' + 
			'</select>' +
			'<div class="leaflet-control-layers-separator"></div>' + 
			'<label class="mt-2 mb-1"><strong>Click Event:</strong></label>' + 
			'<div class="form-check form-check-inline">' + 
				'<input class="form-check-input" type="radio" name="clickEvent" id="clickEvent1" value="1" checked>' + 
				'<label class="form-check-label" for="clickEvent1">Data</label>' + 
			'</div>' + 
			'<div class="form-check form-check-inline">' + 
				'<input class="form-check-input" type="radio" name="clickEvent" id="clickEvent2" value="2">' + 
				'<label class="form-check-label" for="clickEvent2">Graph Out</label>' + 
			'</div>' + 
			'<div class="form-check form-check-inline">' + 
				'<input class="form-check-input" type="radio" name="clickEvent" id="clickEvent3" value="3">' + 
				'<label class="form-check-label" for="clickEvent3">Graph in</label>' + 
			'</div>' + 
			'<div class="leaflet-control-layers-separator"></div>' + 
			'<label class="mt-2 mb-1"><strong>Filter Graph:</strong></label>' + 
			'<div class="form-check form-check-inline">' + 
				'<input class="form-check-input" type="radio" name="filterGraph" id="filterGraph1" value="0" checked>' + 
				'<label class="form-check-label" for="filterGraph1">> AVG + STDEV</label>' + 
			'</div>' + 
			'<div class="form-check form-check-inline">' + 
				'<input class="form-check-input" type="radio" name="filterGraph" id="filterGraph2" value="1">' + 
				'<label class="form-check-label" for="filterGraph2">Top 10</label>' + 
			'</div>';
		L.DomEvent.disableClickPropagation(div);
		L.DomEvent.on(div,'change',function(e){
			map.closePopup();
			PDRBLayer.eachLayer(function(layer){
				layer.unbindPopup();
			});
			hideGraph();
			var select = e.target;
			
			switch(select.name) {
				case "renderPrediction":
					if ([select.value] == 'PRED'){
						Scale = ['white', 'red'];
						title = 'Prediksi Total PDRB (Milyar)';
					}else if ([select.value] == 'SELISIH'){
						Scale = ['white', 'green'];
						title = 'Selisih Prediksi <br>terhadap Total PDRB 2020 (Milyar)';
					}else if ([select.value] == 'PERSEN'){
						Scale = ['white', 'green'];
						title = '% Selisih Prediksi <br>terhadap Total PDRB 2020';
					}
					predictRender(ResultFeature, [select.value], Scale, title);
					
					break;
					
				case "clickEvent":
					if ([select.value] == 1){
						enableGraph = false;
					}else if ([select.value] == 2){
						enableGraph = true;
						directionGraph = 0;
					}else if ([select.value] == 3){
						enableGraph = true;
						directionGraph = 1;
					}
					
					break;
					
				case "filterGraph":
					if ([select.value] == 0){
						filterGraph = 0;
					}else if ([select.value] == 1){
						filterGraph = 1;
					}
					
					break;
					
				default:
					alert("Method not allowed.");
			};
		});
		
		return div;
	}
});

var layerControl = new L.Control.Custom(baselayer).addTo(map);
layerControl.addOverlay(PDRBLayer, 'PDRB 2020');

var sideControl = new L.control.sideBySide(PDRBLayer, ResultLayer).addTo(map);


// Data prediction

const getOrCreateLegendList = (chart, id) => {
	const legendContainer = document.getElementById(id);
	let listContainer = legendContainer.querySelector('ul');

	if (!listContainer) {
		listContainer = document.createElement('ul');
		listContainer.style.display = 'flex';
		listContainer.style.flexDirection = 'row';
		listContainer.style.flexWrap = 'wrap';
		listContainer.style.justifyContent = 'center';
		listContainer.style.margin = 0;
		listContainer.style.padding = 0;

		legendContainer.appendChild(listContainer);
	}

	return listContainer;
};

const htmlLegendPlugin = {
	id: 'htmlLegend',
	afterUpdate(chart, args, options) {
		const ul = getOrCreateLegendList(chart, options.containerID);
		
		while (ul.firstChild) {
			ul.firstChild.remove();
		}
		
		const items = chart.options.plugins.legend.labels.generateLabels(chart);

		items.forEach(item => {
			const li = document.createElement('li');
			li.style.alignItems = 'center';
			li.style.cursor = 'pointer';
			li.style.display = 'flex';
			li.style.flexDirection = 'row';
			li.style.marginLeft = '10px';
			li.style.marginBottom = '10px';

			li.onclick = () => {
				const {type} = chart.config;
				if (type === 'pie' || type === 'doughnut') {
					//chart.toggleDataVisibility(item.index);
					charts.forEach((chartItem) => {
						chartItem.toggleDataVisibility(item.index);
						chartItem.update();
					});
				} else {
					//chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
					charts.forEach((chartItem) => {
						chartItem.setDatasetVisibility(item.datasetIndex, !chartItem.isDatasetVisible(item.datasetIndex));
						chartItem.update();
					});
				}
				//chart.update();
			};
			
			const boxSpan = document.createElement('span');
			boxSpan.style.background = item.fillStyle;
			boxSpan.style.borderColor = item.strokeStyle;
			boxSpan.style.borderWidth = item.lineWidth + 'px';
			boxSpan.style.display = 'inline-block';
			boxSpan.style.flexShrink = 0;
			boxSpan.style.height = '20px';
			boxSpan.style.marginRight = '10px';
			boxSpan.style.width = '20px';
			
			const textContainer = document.createElement('p');
			textContainer.style.color = item.fontColor;
			textContainer.style.margin = 0;
			textContainer.style.padding = 0;
			textContainer.style.textDecoration = item.hidden ? 'line-through' : '';

			const text = document.createTextNode(item.text);
			textContainer.appendChild(text);

			li.appendChild(boxSpan);
			li.appendChild(textContainer);
			ul.appendChild(li);
		});
	}
};

const getTotal = function(myChart) {
	const sum = myChart.config.data.datasets[0].data.reduce((a, b) => a + b, 0).toLocaleString(undefined, {
		minimumFractionDigits: 2, maximumFractionDigits: 2
	});
	return `Total: ${sum}`;
}

var riilChart = document.getElementById('riilChart').getContext('2d');
var riilChartCanvas = new Chart(riilChart, {
	type:'doughnut',
	data: {
		labels:['KTI','KBI'],
		datasets:[{
			label: 'Total PDRB',
			data: [0, 0],
			backgroundColor: colors_palette.slice(0, 2),
			borderWidth : 1,
			borderColor : '#777',
			hoverBorderWidth: 3,
			hoverBorderColor: '#000'                
		}]
	},
	options:{
		plugins: {
			title:{
				display : true,
				text:'Baseline PDRB (2020)',
				fontSize: 50
			},
			legend: {
				display: false
			},
			doughnutLabel: {
				labels: [{
					text: getTotal,
					font: {
						size: '15'
					},
					color: 'grey'
				}]
			},
			tooltip: {
				callbacks: {
					label: function(context){
						var data = context.dataset.data,
							label = context.label,
							currentValue = context.raw,
							total = 0;

						for( var i = 0; i < data.length; i++ ){
							total += data[i];
						}
						var percentage = parseFloat((currentValue/total*100).toFixed(2));

						return "Total PDRB: " + currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' (' + percentage + '%)';
					}
				}
			},
			datalabels: {
				formatter: (value, ctx) => {
					let sum = 0;
					let dataArr = ctx.chart.data.datasets[0].data;
					dataArr.map(data => {
						sum += data;
					});
					let percentage = (value*100 / sum).toFixed(2)+"%";
					return percentage;
				},
				color: '#000',
				clamp: true
			},
			htmlLegend: {
				containerID: 'legend-container',
			}
		}
	},
	plugins: [htmlLegendPlugin, ChartDataLabels]
});

var predChart = document.getElementById('predChart').getContext('2d');
var predChartCanvas = new Chart(predChart, {
	type:'doughnut',
	data: {
		labels:['Metropolitan','Non-Metropolitan'],
		datasets:[{
			label: 'Total PDRB',
			data: [0, 0],
			backgroundColor: colors_palette.slice(0, 2),
			borderWidth : 1,
			borderColor : '#777',
			hoverBorderWidth: 3,
			hoverBorderColor: '#000'                
		}]
	},
	options:{
		plugins: {
			title:{
				display : true,
				text:'Prediksi 2029',
				fontSize: 25
			},
			legend: {
				display: false
			},
			doughnutLabel: {
				labels: [{
					text: getTotal,
					font: {
						size: '15'
					},
					color: 'grey'
				}]
			},
			tooltip: {
				callbacks: {
					label: function(context){
						var data = context.dataset.data,
							label = context.label,
							currentValue = context.raw,
							total = 0;

						for( var i = 0; i < data.length; i++ ){
							total += data[i];
						}
						var percentage = parseFloat((currentValue/total*100).toFixed(2));

						return "Total PDRB : " + currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' (' + percentage + '%)';
					}
				}
			},
			datalabels: {
				formatter: (value, ctx) => {
					let sum = 0;
					let dataArr = ctx.chart.data.datasets[0].data;
					dataArr.map(data => {
						sum += data;
					});
					let percentage = (value*100 / sum).toFixed(2)+"%";
					return percentage;
				},
				color: '#000'
			}
		}
	},
	plugins: [ChartDataLabels]
});

const charts = [riilChartCanvas, predChartCanvas];

let tablePred = new DataTable('#predTable', {
    fixedColumns: {
        left: 2
    },
    scrollX: true,
	columnDefs: [{
		targets:[ 4, 5, 6 ], className: 'dt-right', render: $.fn.dataTable.render.number(',', '.', 2)
	},{
		targets:[ 7 ], className: 'dt-right', render: $.fn.dataTable.render.number(',', '.', 3)
	}],
	dom: 'Bfrtip',
	buttons: [
		'excel', 'pageLength'
	]
});

function getrandomcolor(length) {
	let totalColor = [];
	let letters = 'BCDEF'.split('');

	for (let i = 0; i < length; i++) {
		let color = '#';
		for (let j = 0; j < 6; j++) {
			color += letters[Math.floor(Math.random() * letters.length)];
		}
		totalColor.push(color);
	}
	
	return totalColor;
};

$(".sel-sum").on("change", function(){
	switch($(this).val()) {
		
		case "1":
			
			$("#desc_summary").html("<p><strong>Kawasan Timur Indonesia (KTI) vs Kawasan Barat Indonesia (KBI)</strong></br>"+
								"Target proporsi kontribusi KTI (RPJMN 2029) sebesar 23,3%</p>");
			result = [0, 0];
			for (let i = 0; i < riilData.length; i++ ) {
				if (riilData[i][2] == 'KTI') {
					result[0] += riilData[i][4]
				}else{
					result[1] += riilData[i][4]
				}
			}
			riilChartCanvas.data.datasets[0].data = result;
			riilChartCanvas.data.labels = ['KTI','KBI'];
			riilChartCanvas.data.datasets[0].backgroundColor = colors_palette.slice(0, 2);
			riilChartCanvas.update();
			
			result2 = [0, 0];
			for (let i = 0; i < predictData.length; i++ ) {
				if (predictData[i][2] == 'KTI') {
					result2[0] += predictData[i][5]
				}else{
					result2[1] += predictData[i][5]
				}
			}
			predChartCanvas.data.datasets[0].data = result2;
			predChartCanvas.data.labels = ['KTI','KBI'];
			predChartCanvas.data.datasets[0].backgroundColor = colors_palette.slice(0, 2);
			predChartCanvas.update();
			
			break;
			
		case "2":
		
			$("#desc_summary").html("<p><strong>Kawasan Metropolitan vs Non Kawasan Metropolitan</strong></br>"+
								"Target proporsi kontribusi Kawasan Metropilitan (RPJPN 2045) sebesar 48,92%</p>");
			result = [0, 0];
			for (let i = 0; i < riilData.length; i++ ) {
				if (riilData[i][3] != null) {
					result[0] += riilData[i][4]
				}else{
					result[1] += riilData[i][4]
				}
			}
			riilChartCanvas.data.datasets[0].data = result;
			riilChartCanvas.data.labels = ['Metropolitan','Non-Metropolitan'];
			riilChartCanvas.data.datasets[0].backgroundColor = colors_palette.slice(0, 2);
			riilChartCanvas.update();
			
			result2 = [0, 0];
			for (let i = 0; i < predictData.length; i++ ) {
				if (predictData[i][3] != null) {
					result2[0] += predictData[i][5]
				}else{
					result2[1] += predictData[i][5]
				}
			}
			predChartCanvas.data.datasets[0].data = result2;
			predChartCanvas.data.labels = ['Metropolitan','Non-Metropolitan'];
			predChartCanvas.data.datasets[0].backgroundColor = colors_palette.slice(0, 2);
			predChartCanvas.update();
			
			break;
			
		case "3":
			
			$("#desc_summary").html("");
		
			result = [0, 0, 0, 0, 0, 0, 0];
			for (let i = 0; i < riilData.length; i++ ) {
				if (riilData[i][0].slice(0,2) <= 21) {
					result[0] += riilData[i][4] // Sumatera
				}else if (riilData[i][0].slice(0,2) > 21 && riilData[i][0].slice(0,2) <= 36){
					result[1] += riilData[i][4] // Jawa
				}else if (riilData[i][0].slice(0,2) > 36 && riilData[i][0].slice(0,2) <= 53){
					result[2] += riilData[i][4] // Bali Nusra
				}else if (riilData[i][0].slice(0,2) > 53 && riilData[i][0].slice(0,2) <= 65){
					result[3] += riilData[i][4] // Kalimantan
				}else if (riilData[i][0].slice(0,2) > 65 && riilData[i][0].slice(0,2) <= 76){
					result[4] += riilData[i][4] // Sulawesi
				}else if (riilData[i][0].slice(0,2) > 76 && riilData[i][0].slice(0,2) <= 82){
					result[5] += riilData[i][4] // Maluku
				}else if (riilData[i][0].slice(0,2) > 82){
					result[6] += riilData[i][4] // Papua
				}
			}
			riilChartCanvas.data.datasets[0].data = result;
			riilChartCanvas.data.labels = ['Sumatera','Jawa','Bali Nusra','Kalimantan','Sulawesi','Maluku','Papua'];
			riilChartCanvas.data.datasets[0].backgroundColor = colors_palette.slice(0, 7);
			riilChartCanvas.update();
			
			result2 = [0, 0, 0, 0, 0, 0, 0];
			for (let i = 0; i < predictData.length; i++ ) {
				if (predictData[i][0].slice(0,2) <= 21) {
					result2[0] += predictData[i][5] // Sumatera
				}else if (predictData[i][0].slice(0,2) > 21 && predictData[i][0].slice(0,2) <= 36){
					result2[1] += predictData[i][5] // Jawa
				}else if (predictData[i][0].slice(0,2) > 36 && predictData[i][0].slice(0,2) <= 53){
					result2[2] += predictData[i][5] // Bali Nusra
				}else if (predictData[i][0].slice(0,2) > 53 && predictData[i][0].slice(0,2) <= 65){
					result2[3] += predictData[i][5] // Kalimantan
				}else if (predictData[i][0].slice(0,2) > 65 && predictData[i][0].slice(0,2) <= 76){
					result2[4] += predictData[i][5] // Sulawesi
				}else if (predictData[i][0].slice(0,2) > 76 && predictData[i][0].slice(0,2) <= 82){
					result2[5] += predictData[i][5] // Maluku
				}else if (predictData[i][0].slice(0,2) > 82){
					result2[6] += predictData[i][5] // Papua
				}
			}
			predChartCanvas.data.datasets[0].data = result2;
			predChartCanvas.data.labels = ['Sumatera','Jawa','Bali Nusra','Kalimantan','Sulawesi','Maluku','Papua'];
			predChartCanvas.data.datasets[0].backgroundColor = colors_palette.slice(0, 7);
			predChartCanvas.update();
			
			break;
			
		case "4":
			
			var labels = locs.filter(function (el) {
				return el.cod_scale == 4;
			}).map(a => a.name);
			
			bgColor = getrandomcolor(labels.length);
			
			$("#desc_summary").html("");
			
			//RIIL
			var dump = [];
			for(var i=0; i<riilData.length; i++){
				code = riilData[i][0].slice(0,2);
				if(dump.hasOwnProperty(code)){
					dump[code] = dump[code] + riilData[i][4];
				} else {
					dump[code] = riilData[i][4];
				}
			};
			
			var result = [];
			
			for (var prop in dump) {
				result.push(dump[prop]);
			}
			
			riilChartCanvas.data.datasets[0].data = result;
			riilChartCanvas.data.labels = labels;
			riilChartCanvas.data.datasets[0].backgroundColor = bgColor;
			riilChartCanvas.update();
			
			//PREDICTION
			var dump = [];
			for(var i=0; i<predictData.length; i++){
				code = predictData[i][0].slice(0,2);
				if(dump.hasOwnProperty(code)){
					dump[code] = dump[code] + predictData[i][5];
				} else {
					dump[code] = predictData[i][5];
				}
			};
			
			var result = [];
			
			for (var prop in dump) {
				result.push(dump[prop]);
			}
			
			predChartCanvas.data.datasets[0].data = result;
			predChartCanvas.data.labels = labels;
			predChartCanvas.data.datasets[0].backgroundColor = bgColor;
			predChartCanvas.update();
			
			break;
			
		case "5":
		
			alert("Method Not Allowed!");
			break;
			
		default:
		
			alert("Method Not Allowed!");
	}
}).trigger( "change" );

const tableModal = document.getElementById('tableModal')

tableModal.addEventListener('mouseover', function () {
	map.dragging.disable();
	map.scrollWheelZoom.disable();
});

tableModal.addEventListener('mouseout', function () {
	map.dragging.enable();
	map.scrollWheelZoom.enable();
});

$('#tableModal').on('shown.bs.modal', function () {
	map.dragging.disable();
	map.scrollWheelZoom.disable();
});

$('#tableModal').on('hidden.bs.modal', function () {
	map.dragging.enable();
	map.scrollWheelZoom.enable();
});

var tableBtn = L.easyButton('fa-table', function(btn, map){
    $('#tableModal').modal('show');
	
	riilData = [];
	PDRBFeature.features.forEach(function(entry) {
		riilData.push([entry.properties.KDDAGRI,
			entry.properties.NAMADAGRI,
			entry.properties.Kawasan,
			entry.properties.wm,
			parseFloat(entry.properties.PDRB)
		]);
	});

	predictData = [];
	ResultFeature.features.forEach(function(entry) {
		predictData.push([entry.properties.KDDAGRI,
			entry.properties.NAMADAGRI,
			entry.properties.Kawasan,
			entry.properties.wm,
			parseFloat(entry.properties.PDRB),
			parseFloat(entry.properties.PRED),
			parseFloat(entry.properties.SELISIH),
			parseFloat(entry.properties.PERSEN)
		]);
	});
	
	tablePred.clear().rows.add(predictData).draw();
	$(".sel-sum").trigger( "change" );
	
}, {position: 'topleft'});

function RenderLayer() {
	if(ResultFeature !== null){
		predictRender(ResultFeature, "PRED", ['white', 'red'], 'Prediksi Total PDRB (Milyar)');
		tableBtn.addTo(map);
		$(".pred-attr").show();
	}
	
	if(sStatus == "0"){
		$("#simMsg").html("Anda belum menjalankan simulasi");
		$("#button-wrapper").show();
	}else if(sStatus == "1"){
		$("#button-wrapper").hide();
	}else if(sStatus == "2"){
		$("#simMsg").html("Parameter telah diubah, lakukan simulasi ulang");
		$("#button-wrapper").show();
	}
	
	$(".pred-attr select").val('PRED').change();
}

RenderLayer();


// DATA MANIPULATION


// CREATE SECTOR

$("#createSector").on('shown.bs.modal', function () {
	map.dragging.disable();
	map.scrollWheelZoom.disable();
	$( "#create-param" ).validate().resetForm();
	defaultCreateForm();
});

$("#createSector").on('hidden.bs.modal', function () {
	map.dragging.enable();
	map.scrollWheelZoom.enable();
});

const createSector = document.getElementById('createSector')

createSector.addEventListener('mouseover', function () {
	map.dragging.disable();
	map.scrollWheelZoom.disable();
});

createSector.addEventListener('mouseout', function () {
	map.dragging.enable();
	map.scrollWheelZoom.enable();
});

$("#createSector").on( "click", "#create", function() {
	$("form#create-param").submit();
});

// Validate and submit add param
$("form#create-param").validate({
	rules: {
		scaleParam: { required: true }, 
		locParam: { required: true }
	},
	messages: {
		scaleParam: { required: "Silahkan pilih skala" }, 
		locParam: { required: "Silahkan pilih lokasi" }
	},
	errorElement: "div",
	errorPlacement: function ( error, element ) {
		error.addClass( "invalid-feedback" );

		if ( element.prop( "type" ) === "checkbox" ) {
			error.insertAfter( element.parent( "label" ) );
		} else if ( element.hasClass('form-select') && element.next('.select2-container').length ) {
			error.insertAfter(element.next('.select2-container'));
		} else if ( element.hasClass('form-control') && element.next('.input-group-text').length ) {
			error.insertAfter(element.next('.input-group-text'));
		} else {
			error.insertAfter( element );
		}
	},
	submitHandler: function(form) {
		let param = {};
		param['simluationID'] = $('#simluationID').val();
		param['scaleParam'] = $('#scaleParam').val();
		param['locParam'] = $('#locParam').val();
		const formInputs = form.getElementsByTagName('input');
		for (let input of formInputs) {
			param[input.name] = input.value;
		}
		$.ajax({
			url : form.action,
			type : form.method,
			contentType: "application/json; charset=utf-8",
			dataType : 'json', 
			data : JSON.stringify(param), 
			async: false,
			success: function(data, status){
				if(data.success == true){
					$('.modal').each(function(){
						$(this).modal('hide');
					});
					tableParam.ajax.reload();
					sStatus = "2";
					RenderLayer();
				}
			},
			error: function(){
				$('#createSector').modal('hide')
				liveToast("Ooops.. something wrong.")
			}
		});
	}
});


// EDIT SECTOR

const editSector = document.getElementById('editSector');

$("#editSector").on('shown.bs.modal', function (event) {
	map.dragging.disable();
	map.scrollWheelZoom.disable();
	var button = event.relatedTarget
	var param_id = button.getAttribute('data-pid')
	var bodyInput = editSector.querySelector('.modal-body input.pid')
	
	bodyInput.value = param_id
	defaultEditForm();
	
	response = $.get( "/api/sector", { pID: param_id } ).then(
		function(response){
			$.when($(scaleEdit).val(response.scale).change()).then(function() {
				$(locEdit).val(response.loc).change();
			});
			// Populate sector data
			$.each(response.param, function(number, sector) {
				$("#"+sector.sector+"_edt").val(sector.val.toFixed(2));
			});
		},
		function (){
			liveToast("Ooops.. something wrong.")
		}
	);
});

$("#editSector").on('hidden.bs.modal', function () {
	map.dragging.enable();
	map.scrollWheelZoom.enable();
});

editSector.addEventListener('mouseover', function () {
	map.dragging.disable();
	map.scrollWheelZoom.disable();
});

editSector.addEventListener('mouseout', function () {
	map.dragging.enable();
	map.scrollWheelZoom.enable();
});

$("#editSector").on('click', "#update", function() {
	$("form#edit-param").submit();
});

// Validate and submit edit param	
$("form#edit-param").validate({
	rules: {
		scaleEdit: { required: true }, 
		locEdit: { required: true }
	},
	messages: {
		scaleEdit: { required: "Silahkan pilih skala" }, 
		locEdit: { required: "Silahkan pilih lokasi" }
	},
	errorElement: "div",
    errorPlacement: function ( error, element ) {
		error.addClass( "invalid-feedback" );

		if ( element.prop( "type" ) === "checkbox" ) {
			error.insertAfter( element.parent( "label" ) );
		} else if ( element.hasClass('form-select') && element.next('.select2-container').length ) {
			error.insertAfter(element.next('.select2-container'));
		} else if ( element.hasClass('form-control') && element.next('.input-group-text').length ) {
			error.insertAfter(element.next('.input-group-text'));
		} else {
			error.insertAfter( element );
		}
    },
	submitHandler: function(form) {
		let param = {};
		param['simluationID'] = $('#simluationID').val();
		param['pID'] = $('#pid').val();
		param['scaleEdit'] = $('#scaleEdit').val();
		param['locEdit'] = $('#locEdit').val();
		const formInputs = form.getElementsByTagName('input');
		for (let input of formInputs) {
			param[input.name] = input.value;
		}
		$.ajax({
			url : form.action,
			type : "PUT",
			contentType: "application/json; charset=utf-8",
			dataType : 'json', 
			data : JSON.stringify(param), 
			async: false,
			success: function(data, status){
				if(data.success == true){
					$('.modal').each(function(){
						$(this).modal('hide');
					});
					tableParam.ajax.reload();
					sStatus = "2";
					RenderLayer();
				}
			},
			error: function(){
				$('#editSector').modal('hide')
				liveToast("Ooops.. something wrong.")
			}
		});
	}
});



// DELETE SECTOR

const deleteSector = document.getElementById('deleteSector');

$("#deleteSector").on('shown.bs.modal', function (event) {
	var button = event.relatedTarget
	var param_id = button.getAttribute('data-pid')
	var bodyInput = deleteSector.querySelector('.modal-body input.pid')
	
	bodyInput.value = param_id
});

$("#deleteSector").on( "click", "#delete", function() {
	var bodyInput = deleteSector.querySelector('.modal-body input.pid');
	var parameters = {
		simluationID: $("#simluationID").val(),
		pID: bodyInput.value
	}
	
	$.ajax({
		url : "/api/sector",
		type : "DELETE",
		contentType: "application/json; charset=utf-8",
		dataType : 'json', 
		data : JSON.stringify(parameters), 
		async: false,
		success: function(data, status){
			if(data.success == true){
				$('.modal').each(function(){
					$(this).modal('hide');
				});
				tableParam.ajax.reload();
				sStatus = "2";
				RenderLayer();
			}
		},
		error: function(){
			$('#deleteSector').modal('hide')
			liveToast("Ooops.. something wrong.")
		}
	});
});



// When selected scale changes, populate location select
$(scaleSelector).change(function() {
	var selectedScale = this.value;
	$(locSelector).empty();
	$(locSelector).append($('<option>').text(locDefaultText).val(""));
	$.each(locs, function(number, loc) {
		if (loc.cod_scale == selectedScale) {
			$(locSelector).append($('<option>').text(loc.name).attr('value', loc.code));
		}
	});
	$(locSelector).select2({theme:'bootstrap-5', dropdownParent: $('#createSector')});
});

// When selected scale changes, populate location select
$(scaleEdit).change(function() {
	var selectedScale = this.value;
	$(locEdit).empty();
	$(locEdit).append($('<option>').text(locDefaultText).val(""));
	$.each(locs, function(number, loc) {
		if (loc.cod_scale == selectedScale) {
			$(locEdit).append($('<option>').text(loc.name).attr('value', loc.code));
		}
	});
	$(locEdit).select2({theme:'bootstrap-5', dropdownParent: $('#editSector')});
});

// When selected scale changes, populate location select
$(scaleOrigin).change(function() {
	var selectedScale = this.value;
	$(locOrigin).empty();
	$(locOrigin).append($('<option>').text(locDefaultText).val(""));
	$.each(locs, function(number, loc) {
		if (loc.cod_scale == selectedScale) {
			$(locOrigin).append($('<option>').text(loc.name).attr('value', loc.code));
		}
	});
	$(locOrigin).select2({theme:'bootstrap-5', dropdownParent: $('#createGraph')});
});

// When selected scale changes, populate location select
$(scaleDest).change(function() {
	var selectedScale = this.value;
	$(locDest).empty();
	$(locDest).append($('<option>').text(locDefaultText).val(""));
	$.each(locs, function(number, loc) {
		if (loc.cod_scale == selectedScale) {
			$(locDest).append($('<option>').text(loc.name).attr('value', loc.code));
		}
	});
	$(locDest).select2({theme:'bootstrap-5', dropdownParent: $('#createGraph')});
});

// When selected scale changes, populate location select
$(scaleOriginEdit).change(function() {
	var selectedScale = this.value;
	$(locOriginEdit).empty();
	$(locOriginEdit).append($('<option>').text(locDefaultText).val(""));
	$.each(locs, function(number, loc) {
		if (loc.cod_scale == selectedScale) {
			$(locOriginEdit).append($('<option>').text(loc.name).attr('value', loc.code));
		}
	});
	$(locOriginEdit).select2({theme:'bootstrap-5', dropdownParent: $('#editGraph')});
});

// When selected scale changes, populate location select
$(scaleDestEdit).change(function() {
	var selectedScale = this.value;
	$(locDestEdit).empty();
	$(locDestEdit).append($('<option>').text(locDefaultText).val(""));
	$.each(locs, function(number, loc) {
		if (loc.cod_scale == selectedScale) {
			$(locDestEdit).append($('<option>').text(loc.name).attr('value', loc.code));
		}
	});
	$(locDestEdit).select2({theme:'bootstrap-5', dropdownParent: $('#editGraph')});
});



// CREATE GRAPH

$("#createGraph").on('shown.bs.modal', function () {
	map.dragging.disable();
	map.scrollWheelZoom.disable();
	$("#create-graph").validate().resetForm();
	defaultCreateGraph();
});

$("#createGraph").on('hidden.bs.modal', function () {
	map.dragging.enable();
	map.scrollWheelZoom.enable();
});

const createGraph = document.getElementById('createGraph');

createGraph.addEventListener('mouseover', function () {
	map.dragging.disable();
	map.scrollWheelZoom.disable();
});

createGraph.addEventListener('mouseout', function () {
	map.dragging.enable();
	map.scrollWheelZoom.enable();
});

$("#createGraph").on( "click", "#create", function() {
	$("form#create-graph").submit();
});

// Validate and submit add graph	
$("form#create-graph").validate({
	rules: {
		scaleOrigin: { required: true }, 
		locOrigin: { required: true }, 
		scaleDest: { required: true }, 
		locDest: { required: true }
	},
	messages: {
		scaleOrigin: { required: "Silahkan pilih skala asal" }, 
		locOrigin: { required: "Silahkan pilih lokasi asal" },
		scaleDest: { required: "Silahkan pilih skala tujuan" }, 
		locDest: { required: "Silahkan pilih lokasi tujuan" }
	},
	errorElement: "div",
    errorPlacement: function ( error, element ) {
		error.addClass( "invalid-feedback" );

		if ( element.prop( "type" ) === "checkbox" ) {
			error.insertAfter( element.parent( "label" ) );
		} else {
			error.insertAfter( element );
		}
    },
	submitHandler: function(form) {
		var param = {
			simluationID: $("#simluationID").val(),
			scaleOrigin: $("#scaleOrigin").val(),
			locOrigin: $("#locOrigin").val(),
			scaleDest: $("#scaleDest").val(),
			locDest: $("#locDest").val(),
			direction: $("#direction").val(),
			valueGraph: $("#valueGraph").val()
		}
		$.ajax({
			url : form.action,
			type : form.method,
			contentType: "application/json; charset=utf-8",
			dataType : 'json', 
			data : JSON.stringify(param), 
			async: false,
			success: function(data, status){
				if(data.success == true){
					$('.modal').each(function(){
						$(this).modal('hide');
					});
					load_param_graph();
					sStatus = "2";
					RenderLayer();
				}
			},
			error: function(){
				$('#createGraph').modal('hide')
				liveToast("Ooops.. something wrong.")
			}
		});
	}
});


// EDIT GRAPH

const editGraph = document.getElementById('editGraph');

$("#editGraph").on('shown.bs.modal', function (event) {
	map.dragging.disable();
	map.scrollWheelZoom.disable();
	var button = event.relatedTarget
	var param_id = button.getAttribute('data-gid')
	var bodyInput = editGraph.querySelector('.modal-body input.gid')
	
	bodyInput.value = param_id
	defaultEditGraph();
	
	response = $.get( "/api/graph", { gID: param_id } ).then(
		function(response){
			$.when($(scaleOriginEdit).val(response.scale_origin).change()).then(function() {
				$(locOriginEdit).val(response.loc_origin).change()
			})
			$.when($(scaleDestEdit).val(response.scale_dest).change()).then(function() {
				$(locDestEdit).val(response.loc_dest).change()
			})
			$(directionEdit).val(response.direction).change()
			$(valueGraphEdit).val(response.val)
			$("#rangeGraphEditVal").html(response.val)
		},
		function (){
			liveToast("Ooops.. something wrong.")
		}
	);
});

$("#editGraph").on('hidden.bs.modal', function () {
	map.dragging.enable();
	map.scrollWheelZoom.enable();
});

editGraph.addEventListener('mouseover', function () {
	map.dragging.disable();
	map.scrollWheelZoom.disable();
});

editGraph.addEventListener('mouseout', function () {
	map.dragging.enable();
	map.scrollWheelZoom.enable();
});

$("#editGraph").on('click', "#update", function() {
	$("form#edit-graph").submit();
});

// Validate and submit edit param
$("form#edit-graph").validate({
	rules: {
		scaleOriginEdit: { required: true }, 
		locOriginEdit: { required: true },
		scaleDestEdit: { required: true }, 
		locDestEdit: { required: true }
	},
	messages: {
		scaleOriginEdit: { required: "Silahkan pilih skala" }, 
		locOriginEdit: { required: "Silahkan pilih lokasi" },
		scaleDestEdit: { required: "Silahkan pilih skala" }, 
		locDestEdit: { required: "Silahkan pilih lokasi" }
	},
	errorElement: "div",
    errorPlacement: function ( error, element ) {
		error.addClass( "invalid-feedback" );

		if ( element.prop( "type" ) === "checkbox" ) {
			error.insertAfter( element.parent( "label" ) );
		} else {
			error.insertAfter( element );
		}
    },
	submitHandler: function(form) {
		var param = {
			gID: $("#gid").val(),
			simluationID: $("#simluationID").val(),
			scaleOrigin: $("#scaleOriginEdit").val(),
			locOrigin: $("#locOriginEdit").val(),
			scaleDest: $("#scaleDestEdit").val(),
			locDest: $("#locDestEdit").val(),
			direction: $("#directionEdit").val(),
			valueGraph: $("#valueGraphEdit").val()
		}
		$.ajax({
			url : form.action,
			type : "PUT",
			contentType: "application/json; charset=utf-8",
			dataType : 'json', 
			data : JSON.stringify(param), 
			async: false,
			success: function(data, status){
				if(data.success == true){
					$('.modal').each(function(){
						$(this).modal('hide');
					});
					load_param_graph();
					sStatus = "2";
					RenderLayer();
				}
			},
			error: function(){
				$('#editGraph').modal('hide');
				liveToast("Ooops.. something wrong.")
			}
		});
	}
});



// DELETE GRAPH

const deleteGraph = document.getElementById('deleteGraph');

$("#deleteGraph").on('shown.bs.modal', function (event) {
	var button = event.relatedTarget
	var param_id = button.getAttribute('data-gid')
	var bodyInput = deleteGraph.querySelector('.modal-body input.gid')
	
	bodyInput.value = param_id
});

$("#deleteGraph").on( "click", "#delete", function() {
	var bodyInput = deleteGraph.querySelector('.modal-body input.gid');
	var parameters = {
		gID: bodyInput.value,
		simluationID: $("#simluationID").val()
	}
	
	$.ajax({
		url : "/api/graph",
		type : "DELETE",
		contentType: "application/json; charset=utf-8",
		dataType : 'json', 
		data : JSON.stringify(parameters), 
		async: false,
		success: function(data, status){
			if(data.success == true){
				$('.modal').each(function(){
					$(this).modal('hide');
				});
				load_param_graph();
				sStatus = "2";
				RenderLayer();
			}
		},
		error: function(){
			$(this).modal('hide')
			liveToast("Ooops.. something wrong.")
		}
	});
});

// Update Info	
$("form#update-info").validate({
	rules: {
		simName: { required: true }, 
		simDesc: { required: true }
	},
	messages: {
		simName: { required: "Silahkan isikan nama simulasi" }, 
		simDesc: { required: "Silahkan isikan deskripsi simulasi" }
	},
	errorElement: "div",
    errorPlacement: function ( error, element ) {
		error.addClass( "invalid-feedback" );

		if ( element.prop( "type" ) === "checkbox" ) {
			error.insertAfter( element.parent( "label" ) );
		} else {
			error.insertAfter( element );
		}
    },
	submitHandler: function(form) {
		var param = {
			simID: $("#simluationID").val(),
			simName: $("#simName").val(),
			simDesc: $("#simDesc").val()
		}
		$.ajax({
			url : form.action,
			type : form.method,
			contentType: "application/json; charset=utf-8",
			dataType : 'json', 
			data : JSON.stringify(param), 
			async: false,
			success: function(data, status){
				if(data.success == true){
					$(".simt").text("Judul Simulasi : " + param.simName);
					liveToast("Sumilation information has been updated.");
				}
			},
			error: function(){
				liveToast("Ooops.. something wrong.");
			}
		});
	}
});

$("#BtnSim").on( "click", function() {
	var rowParam = tableParam.rows().count();
	var rowGraph = $('#table-graph tbody tr').length;
	if (rowParam > 0 || rowGraph > 0) {
		$('.bg-spinner').show();
		$("#button-wrapper").hide();
		var param = {
			simID: sID
		}
		var params = JSON.stringify(param)
		response = $.post( "/api/simulate", params ).then(
			function( response ) {
				ResultFeature = response;
				sStatus = "1";
				RenderLayer();
				liveToast("Simulasi selesai dilakukan.");
				$('.bg-spinner').hide();
				$('.pred-attr').show();
			},
			function (){
				liveToast("Ooops.. something wrong.");
				$('.bg-spinner').hide();
				$("#button-wrapper").show();
			}
		);
	} else {
		liveToast("Anda belum membuat parameter. Silahkan buat parameter terlebih dahulu.");
	}
} );