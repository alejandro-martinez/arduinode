//Funciones array utiles
module.exports = function()
{
	var ArrayUtils = {
		mixArrays: function(json, estados)
		{
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
		},
		unique: function(obj)
		{
			var uniques=[];
			var stringify={};
			for(var i=0;i<obj.length;i++){
			var keys=Object.keys(obj[i]);
			keys.sort(function(a,b) {return a-b});
			var str='';
				for(var j=0;j<keys.length;j++){
				str+= JSON.stringify(keys[j]);
				str+= JSON.stringify(obj[i][keys[j]]);
				}
				if(!stringify.hasOwnProperty(str)){
					uniques.push(obj[i]);
					stringify[str]=true;
				}
			}
			return uniques;
		}
	}
	return ArrayUtils;
}