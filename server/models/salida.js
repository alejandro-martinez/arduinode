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
			allowNull: false
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
		    createOrUpdate: function(model, callback)
			{
				var id = model.nro || model.nro_salida;
				sequelize.models.salidas
				.findOrCreate(
				{
					where:
					{
						nro_salida: id,
						id_disp: model.id_disp
					},
					defaults: model
				})
				.catch(function(err)
				{
					callback({error: err.name})
				})
				.spread(function(salida, created)
				{
					if (created)
					{
						callback({
							res: 'created',
							model: salida
						});
					}
					else
					{
						salida.note = model.note;
						salida.x = model.x;
						salida.y = model.y;
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