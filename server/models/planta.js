module.exports = function(sequelize, DataTypes)
{
	return sequelize.define('plantas',
	{
		id_planta:
		{
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		},
		descripcion:
		{
			type: DataTypes.TEXT,
			allowNull: false
		},
		plano:
		{
			type: DataTypes.STRING,
			allowNull: false
		}
	},
	{
		timestamps: false,
		freezeTableName: true,
		classMethods:
		{
			save: function(model, callback)
			{
				sequelize.models.plantas
				.findOrCreate({
					where: {id_planta: model.id_planta},
					defaults: model
				})
				.catch(function(err)
				{
					callback({error: err.name});
				})
				.spread(function(planta, created) {
					if (created)
						callback(1);
					else
					{
						planta.save().then(function()
						{
							callback(0);
						});
					}
				})
			}
		}
	});
};
