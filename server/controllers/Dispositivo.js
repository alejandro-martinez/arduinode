module.exports = function(arduinode)
{
	console.log ( arduinode)
	var app = arduinode.app,
		db  = arduinode.dataStore;
	//Devuelve todos los dispositivos
	app.get('/dispositivo', function(req, res)
	{
		res.send( arduinode.dataStore.dispositivosEnMemoria );
	});

	//Devuelve dispositivo por ID
	app.get('/dispositivo/id/:id_disp', function(req, res)
	{
		res.json( DataStore.findDispositivo('id_disp', req.params.id_disp) );
	});

	//Crea o modifica dispositivos
	app.post('/dispositivo/save', function(req, res)
	{
		DataStore.saveDispositivo(req.body, function(err, file)
		{
			res.json(err)
		});
	});

		//Crea o modifica dispositivos
	app.get('/dispositivo/delete/:id_disp', function(req, res)
	{
		DataStore.deleteDispositivo(req.params, function(err, file)
		{
			res.json(err)
		});
	});
}