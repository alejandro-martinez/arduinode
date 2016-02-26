var programadorTareas = require('../config/programadorTareas');
module.exports = function(app)
{
	//Devuelve todos las tareas
	app.get('/tareas', function(req, res)
	{
		res.json(DataStore.getTareas())
	});

	//Crea o modifica tareas
	app.post('/tarea/save', function(req, res)
	{
		DataStore.saveTarea(req.body, function(response, params)
		{
			if (req.body.id_tarea === 9999)
			{
				programadorTareas.importar();
			}
			else
			{
				programadorTareas.reprogramarTarea(params);
			}
			res.json(response);
		});
	});

	//Eliminar
	app.post('/tarea/delete', function(req, res)
	{
		DataStore.deleteTarea(req.body,
		function(response)
		{
			programadorTareas.apagarTarea(req.body.id_tarea);
			res.json(response);
		});
	});
}