module.exports = function(app)
{
	//Devuelve todos los dispositivos
	app.get('/dispositivo', function(req, res){
		sequelize.models.dispositivos.findAll().then(function(models)
		{
			res.json(models);
		})
	});

	//Devuelve dispositivo por ID
	app.get('/dispositivo/id/:id_disp', function(req, res){
		console.log(req.body)
		sequelize.models.dispositivos
						.findOne({'id_disp': req.body.id_disp})
						.then(function(model)
						{
							res.json(model);
						});
	});

	//Crea o modifica dispositivos
	app.post('/dispositivo/save', function(req, res)
	{
		sequelize.models.dispositivos.save(req.body, function(response)
		{
			res.json(response);
		})

	});

	//Eliminar
	app.get('/dispositivo/delete/:id', function(req, res)
	{
		sequelize.models.dispositivos.findOne({id_disp: req.params.id }).then(function(salida)
		{
			return salida.destroy();
		}).then(function(){
			res.json({'res': 1});
		});
	});
}