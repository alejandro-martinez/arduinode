module.exports = function(app, config)
{
	this.DataStore =
	{
		currentFile: {},
		reader: require('jsonfile'),
		getFile: function(file, callback)
		{
			var This = this;
			this.reader.readFile( app.get('modelsPath') + file + '.json',
				function(err, obj)
				{
					console.log(err);
					if (!err)
					{
						console.log("guar");
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
		}
	}
	return this.DataStore;
}
