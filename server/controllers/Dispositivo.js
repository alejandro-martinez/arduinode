var dataStore = require('../App.js').dataStore;
module.exports = function(app)
{
	//Devuelve todos los dispositivos
	app.get('/dispositivo', function(req, res)
	{
		res.send( dataStore.dispositivosEnMemoria );
	});

	//Devuelve dispositivo por ID
	app.get('/dispositivo/id/:id_disp', function(req, res)
	{
		res.json( dataStore.findDispositivo('id_disp', req.params.id_disp) );
	});

	//Crea o modifica dispositivos
	app.post('/dispositivo/save', function(req, res)
	{
		dataStore.saveDispositivo(req.body, function(err, file)
		{
			res.json(err)
		});
	});

		//Crea o modifica dispositivos
	app.get('/dispositivo/delete/:id_disp', function(req, res)
	{
		dataStore.deleteDispositivo(req.params, function(err, file)
		{
			res.json(err)
		});
	});
}