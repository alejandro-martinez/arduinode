//Manejo de fechas y horarios
module.exports = function()
{
	var DateConvert =
	{
		//Recibe 15, devuelve 00:15
		min_a_horario: function(min)
		{
			console.log("Minutos",min);
 			if (min == 0)
			{
				return null;
			}
			console.log("Convirtiendo",min," a HH:MM");
			var hrs = Math.floor(min/60);
			hrs = hrs % 60;
			if( hrs < 10 )
			{
				hrs = "0" + hrs;
			}
			min = min % 60;
			if( min < 10 )
			{
				min = "0" + min;
			}

			return hrs + ":" + min;
		},
		//Recibe "00:15" (HH-MM), devuelve 15
		horario_a_min: function ( horario )
		{
			console.log("el horario",horario.length);
			if (horario && horario.length == 5)
			{
				var hrs = parseInt(horario.substr(0,2)),
				min = parseInt(horario.substr(-2));
				return (hrs * 60) + min;
			}
			return "Horario inválido";
		},
		//Recibe "01-05" (mes-dia), devuelve 5
		fechaADia: function(fecha)
		{
			return parseInt(fecha.substr(-2));
		},
		horarioEnHHMM: function()
		{
			var time = new Date();
			var horario = ("0" + time.getHours()).slice(-2)
						+ ":" + ("0" + time.getMinutes()).slice(-2);
			return horario;
		},
		//Recibe "01-05" (mes-dia), devuelve 1
		fechaAMes: function(fecha)
		{
			return parseInt(fecha.substr(0,2));
		},
		//Convierte "1,2,3,4,5" en [1,2,3,4,5]
		strToArray: function(str)
		{
			return str.replace(/, +/g, ",").split(",").map(Number)
		},
		// Chequea si fechaActual esta entre 2 fechas
		fechaBetween: function(config)
		{
			var fechaActual = new Date(),
				diaActual = parseInt( fechaActual.getDate() ),
				mesActual = parseInt( fechaActual.getMonth()) + 1;

			return ( config.dia_ini <= diaActual
				&& 	 config.mes_ini <= mesActual )
				&& ( config.dia_fin >= diaActual
				&& 	 config.mes_fin >= mesActual );
		},
		//Retorna la diferencia en minutos, de la horaActual vs otra hora
		difHoraConActual: function(hora)
		{
			var minHoraParam = this.horario_a_min(hora),
				minHoraActual = this.horario_a_min(this.horarioEnHHMM());
				return Math.abs(minHoraActual - minHoraParam);
		},
		addMinutosAHoraActual: function(minutos)
		{
			minHoraActual = this.horario_a_min(this.horarioEnHHMM());
			if (minutos.length == 5)
				minutos = this.horario_a_min(minutos);
			return this.min_a_horario(minHoraActual + minutos);
		},
		//Suma 2 horarios HH:MM y retorna la suma en minutos
		sumarHoras: function(hora1, hora2)
		{
// 			console.log("H1",hora1,"H2",hora2);
			var minHora1 = this.horario_a_min(hora1);
				minHora2 = this.horario_a_min(hora2);

			return minHora1 + minHora2;
		},
		mayorAHoraActual: function(min)
		{

			var hora_actual_min = this.horario_a_min(this.horarioEnHHMM())
// 			console.log("comparo:", min,"con ",hora_actual_min);
			return min > hora_actual_min;
		}
	}

	return DateConvert;
}
