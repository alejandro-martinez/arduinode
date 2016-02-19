module.exports = function(app)
{
	//Devuelve todos las tareas
	app.get('/tareas', function(req, res)
	{
		res.json(DataStore.getTareas())
	});

	//Devuelve tarea por ID
	app.get('/tarea/id/:id_tarea', function(req, res){

	});

	//Crea o modifica tareas
	app.post('/tarea/save', function(req, res)
	{
		DataStore.save(req.body, function(response)
		{
			res.json(response);
		});
	});

	//Eliminar
	app.post('/tarea/delete', function(req, res)
	{
		DataStore.deleteTarea(req.body,
		function(response)
		{
			res.json(response);
		});
	});
}