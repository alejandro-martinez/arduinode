module.exports = function(app)
{
	app.get('/salida', function(req, res)
	{
		sequelize.models.salidas.findAll().then(function(models)
		{
			res.json(models);
		})
	});

	//Guarda salidas, si se modifico el plano
	app.post('/salida/save', function(req, res)
	{
		console.log(req.body)
		sequelize.models.salidas.createOrUpdate(req.body, function(data)
		{
			res.json(data);
		});
	});

	//Eliminar
	app.get('/salida/delete/:id', function(req, res)
	{
		sequelize.models.salidas.findOne({ nro_salida: req.body }).then(function(salida) {
		  return salida.destroy();
		}).then(function() {
			res.json({
				'res': 1
			}); 	
		})
	});
}