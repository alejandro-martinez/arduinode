module.exports = function(app)
{
	app.get('/salida/:id_planta', function(req, res)
	{
		DataStore.getFile('salidas', function(err, obj)
		{
			res.json(err || obj);
		});
	});

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