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

	});

	//Eliminar
	app.get('/tarea/delete/:id', function(req, res)
	{

	});
}