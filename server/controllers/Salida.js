module.exports = function(app)
{
	app.get('/salida/:id_planta', function(req, res)
	{
		DataStore.getFile('salidas', function(err, obj)
		{
			res.json(err || obj);
		});
	});

	//Guarda salidas
	app.post('/salida/save', function(req, res)
	{
		DataStore.save(req.body, function(response)
		{
			res.json(response);
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