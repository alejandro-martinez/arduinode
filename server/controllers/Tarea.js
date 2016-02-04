module.exports = function(app)
{
	//Devuelve todos las tareas
	app.get('/tareas', function(req, res)
	{
		sequelize.models.tareas.getAll(function(models)
		{	
			res.json(models);
		});
	});

	//Devuelve tarea por ID
	app.get('/tarea/id/:id_tarea', function(req, res){
		sequelize.models.tareas.findAll({
						where:
							{
								'id_tarea': parseInt(req.params.id_tarea)
							}
						})
						.then(function(model)
						{
							res.json(model);
						});
	});

	//Crea o modifica tareas
	app.post('/tarea/save', function(req, res)
	{
		console.log(req.body);
		sequelize.models.tareas.save(req.body, function(response)
		{
			res.json(response);
		})

	});

	//Eliminar
	app.get('/tarea/delete/:id', function(req, res)
	{
		sequelize.models.tareas
						.findOne({id_tarea: req.params.id })
						.then(function(tarea)
						{
							return tarea.destroy();
						}).then(function(){
							res.json({'res': 1});
						});
	});
}