module.exports = function(app, config)
{
	this.DataStore =
	{
		currentFile: {},
		replicateObj: function(orig, copy)
		{
			for (var key in orig)
			{
				copy[key] = orig[key];
			}
			return copy;
		},
		jsonFile: app.get('modelsPath') + 'dispositivos.json',
		reader: require('jsonfile'),
		getFile: function(file, callback)
		{
			var This = this;
			this.reader.readFile( this.jsonFile, function(err, obj)
				{
					if (!err)
					{
						This.currentFile = obj;
					}
					callback(err, obj);
				}
			);
		},
		getTareas: function()
		{
			var tareas = [];
			this.currentFile.forEach( function (j)
			{
				if (j.tareas)
				{
					j.tareas.forEach(function(tarea)
					{
						if (tarea)
						{
							tarea.id_disp = j.id_disp;
							tareas.push(tarea);
						}
					});
				}
			} );
			return tareas;
		},
		findDispositivo: function(key, value)
		{
			return this.currentFile.filter(function(dispositivo)
			{
				return dispositivo[key] == value;
			})
		},
		updateDispositivo: function(_socket)
		{
			this.currentFile.forEach( function (j)
			{
				j.buffer = "";
				j.salidas.forEach( function( s ){
					s.ip = j.ip;
					s.estado = null;
					s.temporizada = null;
				});
			} );
		},
		getNextID: function(dispositivo, tabla)
		{
			var tabla = dispositivo['tareas'];
		},
		deleteTarea: function(params, callback)
		{
			var dispositivo = this.findDispositivo('id_disp',params.id_disp);
			dispositivo[0].tareas.filter(function(t, key)
			{
				if (t && t.id_tarea == params.id_tarea)
				{
					delete dispositivo[0].tareas[key];
				}
			})
			this.reader.writeFile(this.jsonFile,this.currentFile,
				function(err)
				{
					callback(err);
				}
			);
		},
		getNewIDTarea: function()
		{
			var tareas = this.getTareas();
			if (tareas.length > 0)
			{
				return tareas[tareas.length - 1].id_tarea + 1;
			}
			else
			{
				return 1;
			}
		},
		save: function(model, callback)
		{
			var This = this;
			var dispositivo = this.findDispositivo('id_disp',model.id_disp);
			if (dispositivo.length > 0)
			{
				//Edito o creo tareas
				if (model.id_tarea)
				{
					console.log(dispositivo)
					if (!dispositivo[0].hasOwnProperty('tareas'))
					{
						dispositivo[0].tareas = [];
					}
					var tareas = dispositivo[0].tareas;
					//Tarea existente
					var tarea = tareas.filter(function(t)
					{
						if (t && t.id_tarea == model.id_tarea)
						{
							return This.replicateObj(model, t);
						}
					});

					//Nueva tarea
					if (tarea.length == 0)
					{
						var id_tarea = this.getNewIDTarea();
							tarea = this.replicateObj(model, {});
						tarea.id_tarea = id_tarea;
						tareas.push ( tarea );
					}
				}
				//Edito salidas
				else
				{
					var salida = dispositivo[0].salidas.filter(function(s)
					{
						if (s.nro_salida == model.nro_salida)
						{
							s.note = model.note;
						}
					});
				}
				This.reader.writeFile(This.jsonFile,This.currentFile,
					function(err)
					{
						callback(err, tarea[0] || tarea);
					});
				return true;
			}
		}
	}
	return this.DataStore;
}
