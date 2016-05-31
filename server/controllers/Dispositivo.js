var arduinode = require('../Arduino.js'),
	dispositivo = require('../App.js').Dispositivo,
	DataStore = require('../App.js').DataStore;

module.exports = function(app)
{
	//Devuelve todos los dispositivos
	app.get('/dispositivo', function(req, res)
	{
		res.send( arduinode.dispositivos.getAll() );
	});

	//Devuelve dispositivo por ID
	app.get('/dispositivo/id/:id_disp', function(req, res)
	{
		res.json( DataStore.findDispositivo('id_disp', req.params.id_disp) );
	});

	//Crea o modifica dispositivos
	app.post('/dispositivo/save', function(req, res)
	{
		DataStore.saveModel('dispositivos',req.body,'ip', function(err)
		{
			//Recargo dispositivos en memoria
			arduinode.dispositivos.load();
			res.json(err || DataStore.dispositivos );
		});
	});

		//Crea o modifica dispositivos
	app.get('/dispositivo/delete/:ip', function(req, res)
	{
		DataStore.deleteDispositivo(req.params.ip, function(err, file)
		{
			//Recargo dispositivos en memoria
			arduinode.dispositivos.load();
			res.json(err || DataStore.dispositivos );
		});
	});
}