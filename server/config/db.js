module.exports = function(app, config)
{
	this.DataStore =
	{
		currentFile: {},
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
				j.socket = null;
				j.salidas.forEach( function( s ){
					s.ip = j.ip;
					s.estado = null
					s.temporizada = null
				});
			} );
		},
		save: function(model, callback)
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
						This.reader.writeFile(This.jsonFile,This.currentFile,
							function(err)
							{
								callback(err);
							});
						return true;
					}
				});
			}
		}
	}
	return this.DataStore;
}
