//Para trabajar con archivos y directorios
var fs = require('fs');

//Recorre todo el directorio models y carga todos los archivos, excepto models.js
module.exports = function(app, db){
    fs.readdirSync('models').forEach(function(file) {
        if (file == "models.js") return;
        var model = file.substr(0, file.indexOf('.'));
		module.exports[model] = file;
    });
}