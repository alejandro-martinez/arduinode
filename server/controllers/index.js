module.exports = function(app){

	app.get('/', function(req, res){
		res.sendfile('index.html');
	});

	app.post('/mediator/dispositivoAndSalida/', function(req, res){
		var response = {};
		sequelize.models
					.dispositivos
					.findOne({id_disp: req.body.id_disp})
					.then(function(dispositivo)
					{
						response.dispositivo = dispositivo;
				sequelize.models
							.salidas
							.findOne({nro_salida: req.body.nro_salida})
							.then(function(salida)
							{
								response.salida = salida;
								res.json(response);
							});
					});
	});
};