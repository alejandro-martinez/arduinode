module.exports = function(app, config)
{
	this.DataStore =
	{
		reader: require('jsonfile'),
		getFile: function(file, callback)
		{
			this.reader.readFile( app.get('modelsPath') + file + '.json',
				function(err, obj)
				{
					callback(err, obj);
				}
			);
		}
	}
	return this.DataStore;
}
