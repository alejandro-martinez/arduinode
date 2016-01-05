module.exports = function(sequelize, DataTypes)
{

	return sequelize.define('dispositivos',
	{
		id_disp:
		{
			type: DataTypes.INTEGER,
			allowNull: false,
			autoIncrement: true,
			primaryKey: true
		},
		note:
		{
			type: DataTypes.TEXT,
			allowNull: false
		},
		ip:
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
				sequelize.models.dispositivos
				.findOrCreate({
					where: {id_disp: model.id_disp},
					defaults: model
				})
				.catch(function(err)
				{
					if (err.name == 'SequelizeUniqueConstraintError')
						callback({error: 'Ya existe un dispositivo con esa IP!'})
				})
				.spread(function(dispositivo, created) {
					if (created)
						callback(1);
					else
					{
						dispositivo.ip = model.ip;
						dispositivo.note = model.note;
						dispositivo.save().then(function()
						{
							callback(0);
						});
					}
				})
			}
		}
	});
};