module.exports = function(app)
{
	app.get('/salida/:id_planta', function(req, res)
	{
		sequelize.models.salidas.getAll(req.params.id_planta,function(models)
		{
			res.json(models);
		})
	});

	//Devuelve todos los salidas filtrados por id planta
	app.get('/salida/planta/:id_planta', function(req, res)
	{
		console.log(req.params);
		sequelize.models.salidas
				 .getByPlanta(parseInt(req.params.id_planta), function(models)
				 {
					res.json(models);
				});
	})

	//Guarda salidas, si se modifico el plano
	app.post('/salida/save', function(req, res)
	{
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