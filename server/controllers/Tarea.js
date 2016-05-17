var programadorTareas = require('../config/programadorTareas'),
	dataStore = require('../App.js').dataStore;

module.exports = function( app )
{
	//Devuelve todos las tareas
	app.get('/tareas', function(req, res)
	{
		res.json(dataStore.getTareas())
	});

	//Crea o modifica tareas
	app.post('/tarea/save', function(req, res)
	{
		dataStore.saveTarea(req.body, function(response, params)
		{
			programadorTareas.socketClient.emit('tareasChanged');
			if (req.body.id_tarea === 9999)
			{
				programadorTareas.importar();
			}
			else
			{
				programadorTareas.reprogramarTarea(params.tarea);
			}
			res.json(response);
		});
	});

	//Eliminar
	app.post('/tarea/delete', function(req, res)
	{
		dataStore.deleteTarea(req.body,
		function(response)
		{
			programadorTareas.apagarTarea(req.body.id_tarea);
			res.json(response);
		});
	});
}