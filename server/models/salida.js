module.exports = function(sequelize, DataTypes)
{
	return sequelize.define('salidas',
	{
		nro_salida:
		{
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		},
		note:
		{
			type: DataTypes.TEXT,
			allowNull: true
		},
		id_planta:
		{
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		id_disp:
		{
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			references: { model: "dispositivos", key: "id_disp" }
		},
		x:
		{
			type: DataTypes.FLOAT,
			allowNull: false
		},
		y:
		{
			type: DataTypes.FLOAT,
			allowNull: false
		}
	},
	{
		timestamps: false,
		freezeTableName: true,
		classMethods: {
			getAll: function(id_planta,callback)
			{
				var sql = "SELECT s.id_disp,id_planta,tipo,ip,nro_salida,s.note, s.y,s.x";
				sql+= " FROM salidas s, dispositivos d";
				sql+= " WHERE d.id_disp = s.id_disp AND id_planta = " + id_planta;
				sequelize.query(sql).then(function(salidas)
				{
					callback(salidas[0]);
				})
			},
			addNotes: function(_params)
			{
				console.log("Adding");
				_params.salidasDB.forEach(function(x, i)
				{
					_params.salidasArduino.filter(function(s, j)
					{
						s.id_disp = _params.id_disp;
						if (s.nro_salida == x.nro_salida)
						{
							s.note = x.note;
						}
					});
				});
				return _params.salidasArduino;
			},
			getByPlanta: function( id ,callback)
			{
				console.log(id);
				var sql = "SELECT s.*,d.id_disp,d.ip,d.note as noteDispositivo";
				sql+= " FROM salidas s, dispositivos d";
				sql+= " WHERE id_planta = " + id;
				sql+= " AND d.id_disp = s.id_disp ";
				sql+= " ORDER BY s.id_disp";
				sequelize.query(sql).then(function(salidas)
				{
					callback(salidas);
				})
			},
		    createOrUpdate: function(model, callback)
			{
				delete model.ngDialogId;
				sequelize.models.salidas
				.findOrCreate(
				{
					where:
					{
						nro_salida: model.nro_salida,
						id_disp: parseInt(model.id_disp)
					},
					defaults: model
				})
				.catch(function(err)
				{
					console.log(err);
					callback({error: err.name})
				})
				.spread(function(salida, created)
				{
					console.log("existe",salida)


					if (created)
					{
						console.log(salida)
						callback({
							res: 'created',
							model: salida
						});
					}
					else
					{
						salida.note = model.note;
						if (model.x || model.y)
						{
							salida.x = model.x;
							salida.y = model.y;
						}
						salida.save().then(function()
						{
							callback({
								res: 'updated'
							});
						});
					}
				})
			}
		}
	});
};