module.exports = function(sequelize, DataTypes)
{
	return sequelize.define('salidas',
	{
		nro_salida:
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
		id_disp:
		{
			type: DataTypes.INTEGER,
			allowNull: false
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
				if (!id || id === 0) 
				{
					sequelize.models.salidas
					.build(model)
					.save()
					.then(function(model) 
					{
						callback({
							res: 'created',
							model: model
						});
					}).catch(function(error) 
					{
						callback('error');
					})
				}
				else 
				{
					sequelize.models.salidas.findOne({
					  where: 
					  { 
					  	nro_salida: id
					  }
					}).then(function(_model) 
					{
						_model.id_disp  = model.id_disp;
						_model.x		= model.x;
						_model.y 		= model.y;
						_model.note 	= model.note;

						_model.save().then(function()
						{
							callback({
								res: 'updated'
							});
						})
					})
				}
			}
		}
	});
};