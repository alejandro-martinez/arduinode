//Funciones array utiles
module.exports = function()
{
	var ArrayUtils = {
		mixArrays: function(json, estados)
		{
			console.log("Arr1",json);
			console.log("asdlkajsdlkjaslkdj");
			console.log("Arr2",estados);

			json.forEach(function(j)
			{
				estados.forEach(function(e)
				{
					if (j.nro_salida == e.nro_salida)
					{
						j.estado = e.estado;
						j.ip = e.ip;
						j.temporizada = e.temporizada;
					}
				});
			})

			return json;
		}
	}
	return ArrayUtils;
}