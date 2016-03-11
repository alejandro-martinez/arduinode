//Manejo de fechas y horarios
module.exports = function()
{
	var DateConvert =
	{
		restarHoras: function(_inicio, _fin)
		{
			var inicio_min = this.horario_a_min(_inicio);
				fin_min = this.horario_a_min(_fin);
			return fin_min - inicio_min;
		},
		//Recibe 15, devuelve 00:15
		min_a_horario: function(min)
		{
 			if (min == 0)
			{
				return null;
			}
			var hrs = Math.floor(min/60);
			hrs = hrs % 60;
			if (hrs >= 24)
			{
				hrs = hrs - 24;
			}
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
			if (horario && horario.length == 5)
			{
				var hrs = parseInt(horario.substr(0,2)),
				min = parseInt(horario.substr(-2));
				return (hrs * 60) + min;
			}
			else
			{
				return horario;
			}
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
		//Recibe DDMMAAAA devuelve MM
		fechaAMes: function(fecha)
		{
			return parseInt(fecha.substr(5,2));
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
			if (config.mes_inicio <= mesActual )
			{
				if (config.mes_inicio == mesActual)
				{
					return config.dia_inicio <= diaActual;
				}
				if (config.mes_fin >= mesActual )
				{
					if (config.mes_fin == mesActual)
					{
						return config.dia_fin >= diaActual;
					}
					return true;
				}
			}
			return false;
		},
		diaActualValido: function(dias)
		{
			var fecha = new Date();
			return (dias.indexOf((fecha.getDay() -1)) > -1);
		},
		//Retorna la diferencia en minutos, de la horaActual vs otra hora
		difHoraConActual: function(hora)
		{
			var minHoraParam = this.horario_a_min(hora),
				minHoraActual = this.horario_a_min(this.horarioEnHHMM());

				return Math.abs(minHoraActual - minHoraParam);
		},
		//Recibe 06:00 devuelve un Date Obj
		parseTimeString: function(time)
		{
			var date = new Date();
			return new Date(date.getFullYear(),date.getMonth(),
									   date.getDate(),parseInt(time.substr(0,2)),
									   parseInt(time.substr(3,2)));
		},
		currentTime: function()
		{
			var date = new Date();
			return date.getTime();
		},
		horaActualBetween: function(hora1, hora2)
		{
			var date = new Date(),
				hora_1 = this.parseTimeString(hora1),
				hora_2 = this.parseTimeString(hora2),
				now    = this.currentTime();

			return (now >= hora_1.getTime() && now < hora_2.getTime());
			//Ej hora1 = 09:30 hora2 = 18:30
			if (hora_1.getTime() > hora_2.getTime())
			{
				console.log("1")

			}
			else
			{
				console.log("hora 1,hora2",hora1,hora2)
				if (now > hora_2.getTime())
				{
					return (now >= hora_1.getTime() && now < hora_2.getTime());
				}
				else
				{
					return (now >= hora_1.getTime() && now < hora_2.getTime());
				}

			}
			return false;
		},
		addMinutosAHoraActual: function(minutos)
		{
			minHoraActual = this.horario_a_min(this.horarioEnHHMM());
			if (minutos.length == 5)
				minutos = this.horario_a_min(minutos);
			return this.min_a_horario(minHoraActual + minutos);
		},
		horario_a_ms: function(horario)
		{
			if (horario.length == 5)
			{
				var hs = parseInt( horario.substr(0,2) );
				var min = parseInt( horario.substr(-2) );
				return  ( (hs * 60) + min ) * 60000;
			}
		},
		//Suma 2 horarios HH:MM y retorna la suma en minutos
		sumarHoras: function(hora1, hora2)
		{
			var minHora1 = this.horario_a_min(hora1);
				minHora2 = this.horario_a_min(hora2);
			return minHora1 + minHora2;
		},
		mayorAHoraActual: function(min)
		{
			var hora_actual_min = this.horario_a_min(this.horarioEnHHMM())
			return min > hora_actual_min;
		},
		aMin: function(seg)
		{
			return parseInt(seg) / 60;
		}
	}

	return DateConvert;
}
