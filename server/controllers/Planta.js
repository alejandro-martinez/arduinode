module.exports = function(app)
{
	app.get('/planta', function(req, res)
	{
		sequelize.models.plantas.findAll().then(function(models)
		{
			res.json(models);
		})
	});

	//Guarda plantas
	app.post('/planta/save', function(req, res)
	{
		sequelize.models.plantas.createOrUpdate(req.body, function(data)
		{
			res.json(data);
		});
	});

	//Eliminar
	app.get('/planta/delete/:id', function(req, res)
	{
		sequelize.models.plantas.findOne({ id_planta: req.params.id_planta }).then(function(planta) {
		  return planta.destroy();
		}).then(function() {
			res.json({
				'res': 1
			});
		})
	});
}
