YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "Arduinode",
        "DataStore",
        "Dispositivo",
        "Luz",
        "Persiana",
        "Programador",
        "Salida",
        "Tarea"
    ],
    "modules": [
        "Arduinode",
        "DataStore",
        "Main",
        "Programador de Tareas"
    ],
    "allModules": [
        {
            "displayName": "Arduinode",
            "name": "Arduinode",
            "description": "Modulo con clase Principal de la aplicación\nInteractua con Dispositivo y Socket, a través de una clase Facade (Arduinode)"
        },
        {
            "displayName": "DataStore",
            "name": "DataStore",
            "description": "Almacena en memoria, y archivos JSON, los modelos de la aplicación.\nLista de dispositivos y salidas asociadas.\nLista de tareas programadas."
        },
        {
            "displayName": "Main",
            "name": "Main",
            "description": "Modulo con clases Dispositivo y Salida"
        },
        {
            "displayName": "Programador de Tareas",
            "name": "Programador de Tareas",
            "description": "Módulo para la programacion y ejecucion de tareas sobre los dispositivos"
        }
    ],
    "elements": []
} };
});