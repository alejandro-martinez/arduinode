module.exports = function(app)
{
	//Devuelve todos los dispositivos
	app.get('/dispositivo', function(req, res)
	{
		res.json(DataStore.currentFile);
	});

	//Devuelve dispositivo por ID
	app.get('/dispositivo/id/:id_disp', function(req, res){
		res.json(DataStore.findDispositivo('id_disp', req.params.id_disp));
	});

	//Crea o modifica dispositivos
	app.post('/dispositivo/save', function(req, res)
	{
		DataStore.writeFile(app.get('modelsPath')+'dispositivos.json',
		function(err, file)
		{
			res.json(err || file)
		});

	});

	//Eliminar
	app.get('/dispositivo/delete/:id', function(req, res)
	{
		sequelize.models.dispositivos.findOne({id_disp: req.params.id }).then(function(dispositivo)
		{
			return dispositivo.destroy();
		}).then(function(){
			res.json({'res': 1});
		});
	});
}