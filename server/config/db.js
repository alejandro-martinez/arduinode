module.exports = function(app, config)
{
	this.DataStore =
	{
		currentFiles: [],
		filesPaths: {
			dispositivos: app.get('modelsPath') + 'dispositivos.json',
			tareas: app.get('modelsPath') + 'tareas.json',
		},
		replicateObj: function(orig, copy)
		{
			for (var key in orig)
			{
				copy[key] = orig[key];
			}
			return copy;
		},
		reader: require('jsonfile'),
		getFile: function(file, callback)
		{
			var This = this;
			this.reader.readFile( app.get('modelsPath') + file + '.json',
				function(err, obj)
				{
					if (!err)
					{
						This.currentFiles.push(obj);
					}
					callback(err, obj);
				}
			);
		},
		getTareas: function()
		{
			var tareas = [];
			this.currentFiles[1].forEach( function (tarea)
			{
				console.log("It",tarea);
				if (tarea)
				{
					tareas.push(tarea);
				}
			} );
			return tareas;
		},
		findDispositivo: function(key, value)
		{
			return this.currentFiles[0].filter(function(dispositivo)
			{
				return dispositivo[key] == value;
			})
		},
		updateDispositivo: function(_socket)
		{
			this.currentFiles[0].forEach( function (j)
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
		saveDispositivo: function(model, callback)
		{

			var This = this;
			var dispositivo = this.findDispositivo('id_disp',model.id_disp);
			if (dispositivo.length > 0)
			{
				var salida = dispositivo[0].salidas.filter(function(s)
				{
					if (s.nro_salida == model.nro_salida)
					{
						s.note = model.note;
					}
				});
				this.writeToJson(this.filesPaths.dispositivos, this.currentFiles[0],
					function(err)
					{
						callback(err)
					}
				)
			}
		},
		saveTarea: function(model, callback)
		{
			var This = this;
			//Edito o creo tareas
			if (model.id_tarea)
			{
				//Tarea existente?
				var tarea = this.currentFiles[1].filter(function(t)
				{
					if (t && t.id_tarea == model.id_tarea)
					{
						return This.replicateObj(model, t);
					}
				});

				// NO! Nueva tarea
				if (tarea.length == 0)
				{
					tarea.dispositivos = [];

					var id_tarea = this.getNewIDTarea();
						tarea = this.replicateObj(model, {});
					tarea.id_tarea = id_tarea;
					tareas.push ( tarea );
				}
				this.writeToJson(this.filesPaths.tareas, this.currentFiles[1],
					function(err)
					{
						callback(err, tarea[0]);
					}
				);
			}
		},
		writeToJson: function(file, content, callback)
		{
			this.reader.writeFile( file, content, function(err)
			{
				callback(err);
			});
			return true;
		},
	}
	return this.DataStore;
}
