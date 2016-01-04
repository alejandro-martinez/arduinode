module.exports = function(config)
{
	var db = config.database;
	var params =
	{
		host: db.hostname,
		port: db.port || 5432,
		dialect: db.databaseVendor
	}
	this.Sequelize = require('sequelize');
	this.sequelize = new this.Sequelize( db.name, db.username, db.password, params );

	return this;
}
