var programadorTareas = require('../config/programadorTareas'),
	DataStore = require('../App.js').DataStore;

module.exports = function( app )
{
	//Devuelve todos las tareas
	app.get('/tareas', function(req, res)
	{
		res.json(DataStore.tareas)
	});

	//Crea o modifica tareas
	app.post('/tarea/save', function(req, res)
	{
		DataStore.saveModel('tareas',req.body,'id_tarea', function(response, tarea)
		{
		//	programadorTareas.sCliente.emit('tareasChanged');
			// Nueva tarea, agregar al scheduler
			if (req.body.isNew) {
				// Creo objeto tarea, parseando la configuracion
				programadorTareas.loadTareas();
			}
			// Tarea existente, se reprograma
			else {
				programadorTareas.reprogramarTarea(tarea);
			}
			res.json(response);
		});
	});
	//Eliminar
	app.post('/tarea/delete', function(req, res)
	{
		console.log(req.body)
		DataStore.deleteModel('tareas',{id_tarea: req.body.id}, function(response)
		{
			//Detiene la tarea, (si estaba ejecutandose), y la quita del scheduler
			programadorTareas.quitarTarea(req.body);
			res.json(response);
		});
	});
}