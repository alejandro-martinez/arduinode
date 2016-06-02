YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "Arduinode",
        "Dispositivo",
        "Programador",
        "Tarea"
    ],
    "modules": [
        "Arduinode",
        "DataStore",
        "Programador de Tareas"
    ],
    "allModules": [
        {
            "displayName": "Arduinode",
            "name": "Arduinode",
            "description": "Modulo Principal de la aplicación\nInteractua con Dispositivo y Socket, a través de una clase Facade (Arduinode)"
        },
        {
            "displayName": "DataStore",
            "name": "DataStore",
            "description": "Almacena en memoria, y archivos JSON, los modelos de la aplicación.\nLista de dispositivos y salidas asociadas.\nLista de tareas programadas."
        },
        {
            "displayName": "Programador de Tareas",
            "name": "Programador de Tareas",
            "description": "Relacionado a la programacion y ejecucion de tareas sobre los dispositivos"
        }
    ],
    "elements": []
} };
});