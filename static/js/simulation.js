const deleteModal = document.getElementById('deleteModal');
const copyModal = document.getElementById('copyModal');
const toastLiveExample = document.getElementById('liveToast')
const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)

function liveToast(msg) {
	$(".toast-body").html(msg)
	toastBootstrap.show()
}

deleteModal.addEventListener('show.bs.modal', function (event) {
	var button = event.relatedTarget
	var sim_id = button.getAttribute('data-sid')
	var sim_name = button.getAttribute('data-sname')
	var bodyInput = deleteModal.querySelector('.modal-body input.sid')
	var bodyText = deleteModal.querySelector('.modal-body p.sid-text')
	
	bodyInput.value = sim_id
	bodyText.textContent = 'Anda yakin akan menghapus hasil simulasi "' + sim_name + '"?'
});

$(deleteModal).on( "click", "#delete", function() {
	var bodyInput = deleteModal.querySelector('.modal-body input.sid');
	var simulation = {
		simID: bodyInput.value
	}
	
	$.ajax({
		url : "api/remove",
		type : "POST",
		contentType: "application/json; charset=utf-8",
		dataType : 'json', 
		data : JSON.stringify(simulation), 
		async: false,
		success: function(data, status){
			if(data.success == true){
				$('.modal').each(function(){
					$(this).modal('hide');
				});
				location.reload();
			}
		},
		error: function(){
			$('#deleteModal').modal('hide');
			alert('error!');
		}
	});
});

copyModal.addEventListener('show.bs.modal', function (event) {
	var button = event.relatedTarget
	var sim_id = button.getAttribute('data-sid')
	var sim_name = button.getAttribute('data-sname')
	var bodyInput = copyModal.querySelector('.modal-body input.sIDOld')
	var bodyText = copyModal.querySelector('.modal-body p.sid-text')
	
	bodyInput.value = sim_id
	bodyText.textContent = 'Untuk mengcopy simulasi "' + sim_name + '", silahkan isikan nama dan deskripsi baru.'
});

$("form#copy").validate({
	rules: {
		simNameNew: { required: true },          
		simDescNew: { required: true },
	},
	messages: {
		simNameNew: { required: "Silahkan isikan nama baru simulasi" },          
		simDescNew: { required: "Silahkan isikan deskripsi baru simulasi" },
	},
	submitHandler: function(form) {
		var simulation = {
			sIDOld:$(".sIDOld").val(),
			simNameNew:$("#simNameNew").val(),
			simDescNew:$("#simDescNew").val()
		}
		$.ajax({
			url : form.action,
			type : form.method,
			contentType: "application/json; charset=utf-8",
			dataType : 'json', 
			data : JSON.stringify(simulation), 
			async: false,
			success: function(data, status){
				if(data.success == true){
					$('.modal').each(function(){
						$(this).modal('hide');
					});
					location.reload();
				}
			},
			error: function(){
				$('#copyModal').modal('hide');
				alert('error!');
			}
		});
	}
});

$("input#publish").click(function() {
	var simulation = {
		simID: this.getAttribute("data-sid"),
		publish: this.checked
	}
	
	$.ajax({
		url : "api/publish",
		type : "POST",
		contentType: "application/json; charset=utf-8",
		dataType : 'json', 
		data : JSON.stringify(simulation), 
		async: false,
		success: function(data, status){
			if(data.success == true){
				liveToast("Simulation publish updated.")
			}
		},
		error: function(){
			$('#createModal').modal('hide');
			liveToast("Ooops.. something wrong.")
		}
	});
});

$("form#create").validate({
	rules: {
		simName: { required: true },          
		simDesc: { required: true },
	},
	messages: {
		simName: { required: "Silahkan isikan nama simulasi" },          
		simDesc: { required: "Silahkan isikan deskripsi simulasi" },
	},
	submitHandler: function(form) {
		var simulation = {
			simType: $("#simType").val(),
			simName:$("#simName").val(),
			simDesc:$("#simDesc").val()
		}
		$.ajax({
			url : form.action,
			type : form.method,
			contentType: "application/json; charset=utf-8",
			dataType : 'json', 
			data : JSON.stringify(simulation), 
			async: false,
			success: function(data, status){
				if(data.success == true){
					$('.modal').each(function(){
						$(this).modal('hide');
					});
					location.reload();
				}
			},
			error: function(){
				$('#createModal').modal('hide');
				alert('error!');
			}
		});
	}
});