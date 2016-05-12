var DateConvert = require('../utils/DateConvert')();
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
			var self = this;

			this.reader.readFile( app.get('modelsPath') + file + '.json',
				function(err, obj)
				{
					var This = this;
					This.file = obj;
					if (err)
					{
						//Si el archivo no existe lo creo
						self.reader.writeFile(app.get('modelsPath') + file + '.json',[],
						function (err, obj)
						{
							This.file = obj;
						});
					}
					self.currentFiles.push(obj || []);
					callback(err, obj);
				}
			);
		},
		getTareas: function()
		{
			var tareas = [];
			if (this.currentFiles[1])
			{
				this.currentFiles[1].forEach( function (tarea)
				{
					if (tarea)
					{
						var hora_inicio = DateConvert.parseTimeString(tarea.hora_inicio),
							duracion_ms = DateConvert.horario_a_ms( tarea.duracion ),
							suma = duracion_ms + hora_inicio.getTime();
						tarea.hora_fin = new Date(suma);
						tareas.push(tarea);
					}
				} );
			}
			else
			{
				this.currentFiles[1] = [];
			}
			return tareas;
		},
		findDispositivo: function(key, value)
		{
			return this.currentFiles[0].filter(function(dispositivo)
			{
				return dispositivo[key] == value;
			})
		},
		findTarea: function(id_tarea)
		{
			return this.currentFiles[1].filter(function(tarea)
			{
				return tarea.id_tarea == id_tarea;
			})
		},
		updateDispositivo: function()
		{
			this.currentFiles[0].forEach( function (j)
			{
				j.buffer = "";
				if (j.salidas)
				{
					j.salidas.forEach( function( s ){
						s.ip = j.ip;
						s.estado = null;
						s.temporizada = null;
					});
				}
			});
		},
		deleteTarea: function(params, callback)
		{
			var tarea = this.currentFiles[1].forEach(function(tarea,key)
			{
				if (tarea.id_tarea == params.id_tarea)
				{
					return key;
				}
			});
			this.currentFiles[1].splice(tarea, 1);

			this.writeToJson(this.filesPaths.tareas, this.currentFiles[1],
				function(err)
				{
					callback(err)
				}
			)
		},
		deleteDispositivo: function(params, callback)
		{
			var This = this;
			var dispositivo = this.currentFiles[0].forEach(function( disp, key)
			{
				if (disp.id_disp == parseInt(params.id_disp))
				{
					This.currentFiles[0].splice(key, 1);
				}
			});
			this.writeToJson(this.filesPaths.dispositivos, this.currentFiles[0],
				function(err)
				{
					callback(err)
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

			if (dispositivo.length > 0 && model.hasOwnProperty('id_disp'))
			{
				dispositivo[0].note	= model.note;
				dispositivo[0].ip 	= model.ip;
				dispositivo[0].salidas = model.salidas;
			}
			else
			{
				var dispositivo = {
					id_disp: this.getRandomKey(),
					note: model.note,
					ip: model.ip,
					salidas:[]
				}
				this.currentFiles[0].push(dispositivo);
			}
			this.writeToJson(this.filesPaths.dispositivos, this.currentFiles[0],
				function(err)
				{
					callback(err)
				}
			)
		},
		getRandomKey: function()
		{
			return Math.floor(Math.random() * (15124874 - 520)) + 50;
		},
		saveTarea: function(model, callback)
		{
			var This = this;
			//Edito o creo tareas
			if (model.id_tarea)
			{
				var tarea = this.findTarea(model.id_tarea);
				//Tarea existente?

				if (tarea.length > 0)
				{
					var dispositivosOrig = JSON.parse(JSON.stringify(tarea[0]));
					tarea[0] = This.replicateObj(model, tarea[0]);
				}
				// NO! Nueva tarea
				else
				{
					var id_tarea = this.getNewIDTarea();
						tarea = this.replicateObj(model, {});
					tarea.id_tarea = id_tarea;
					tarea.dispositivos = model.dispositivos;
					this.currentFiles[1].push(tarea);
				}
				this.writeToJson(this.filesPaths.tareas, this.currentFiles[1],
					function(err)
					{
						params = {
							tarea: tarea[0] || tarea,
							dispositivosOrig: dispositivosOrig
						}
						callback(err, params);
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
