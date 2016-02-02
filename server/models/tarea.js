var programadorTareas = require('../programadorTareas')();

module.exports = function(sequelize, DataTypes)
{
	return sequelize.define('tareas',
	{
		id_tarea:
		{
			type: DataTypes.INTEGER,
			primaryKey: true,
			allowNull: true
		},
		descripcion:
		{
			type: DataTypes.TEXT,
			allowNull: false
		},
		id_disp:
		{
			type: DataTypes.INTEGER,
			allowNull: false
		},
		nro_salida:
		{
			type: DataTypes.INTEGER,
			allowNull: false
		},
		accion:
		{
			type: DataTypes.INTEGER,
			allowNull: false
		},
		hora_inicio:
		{
			type: DataTypes.STRING,
			allowNull: false
		},
		hora_fin:
		{
			type: DataTypes.STRING,
			allowNull: false
		},
		fecha_inicio:
		{
			type: DataTypes.STRING,
			allowNull: false
		},
		fecha_fin:
		{
			type: DataTypes.STRING,
			allowNull: false
		},
		activa:
		{
			type: DataTypes.INTEGER,
			allowNull: true
		},
		ip_dispositivo:
		{
			type: DataTypes.STRING,
			allowNull: false
		},
		dias_ejecucion:
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
			getAll: function(callback)
			{
				sequelize.models.tareas.findAll().then(function(models)
				{
					callback(models);
				})
			},
			save: function(model, callback)
			{
				model.accion = (model.accion) ? 0 : 1;
				model.fecha_inicio = model.fecha_inicio.substr(-5);
				model.fecha_fin = model.fecha_fin.substr(-5);
				sequelize.models.tareas
				.findOrCreate({
					where: {id_tarea: model.id_tarea},
					defaults: model
				})
				.catch(function(err)
				{
					console.log(err);
					callback({error: err.name});
				})
				.spread(function(tarea, created)
				{

					if (created)
					{
						programadorTareas.reprogramarTarea(created.dataValues)
						callback(1);
					}
					else
					{
						tarea.hora_inicio	= model.hora_inicio;
						tarea.hora_fin 		= model.hora_fin;
						tarea.dias_ejecucion= model.dias_ejecucion;
						tarea.id_disp= model.id_disp;
						tarea.accion = model.accion;
						tarea.ip_dispositivo = model.ip_dispositivo;
						tarea.activa = model.activa || 0;

						tarea.save().then(function()
						{
							programadorTareas.reprogramarTarea(tarea.dataValues)
							callback(0);
						});
					}
				})
			}
		}
	});
};
