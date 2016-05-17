//Para trabajar con archivos y directorios
var fs = require('fs');

//Recorre todo el directorio controllers y carga todos los archivos, excepto routes.js
module.exports = function( app ){

    fs.readdirSync('controllers').forEach(function(file) {
        if (file == "controllers.js") return;
        var controller = file.substr(0, file.indexOf('.'));
        require('./controllers/' + controller)(app);
    });
}