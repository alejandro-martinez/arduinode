//Manejo de fechas y horarios
module.exports = function()
{
	var DateConvert =
	{
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
		horarioEnHHMM: function()
		{
			var time = new Date();
			var horario = ("0" + time.getHours()).slice(-2)
						+ ":" + ("0" + time.getMinutes()).slice(-2);
			return horario;
		},
		//Convierte "1,2,3,4,5" en [1,2,3,4,5]
		strToArray: function(str)
		{
			if (typeof str === 'string') {
				return str.replace(/, +/g, ",").split(",").map(Number);
			}
			else {
				return str;
			}
		},
		//Devuelve diferencia en minutos
		diffHoras: function(hora1,hora2)
		{
			var date = new Date(),
				hora_1 = this.parseTimeString(hora1),
				hora_2 = this.parseTimeString(hora2);

			if (hora_2.getTime() < hora_1.getTime())
			{
				var timeTo0 = 24 - hora_1.getHours();
				var past0hours = hora_2.getHours();
				var total = (timeTo0 + past0hours) * 60;
				return total;
			}
			return Math.abs((((hora_1.getTime() - hora_2.getTime() ) / 1000) / 60));
		},
		// Chequea si fechaActual esta entre 2 fechas
		fechaBetween: function(config)
		{
			var fechaActual = new Date(),
			desde = new Date(),
			hasta = new Date();

			//desde y hasta pertenecen a la tarea
			//se usan para comparar con fecha Actual
			desde.setDate(config.dia_inicio);

			//Resto 1 ya que los meses arrancan en 0
			desde.setMonth( parseInt( config.mes_inicio) - 1);
			hasta.setDate(config.dia_fin);
			hasta.setMonth( parseInt( config.mes_fin) - 1);

			// valida tareas que arrancan en año actual y terminan en el siguiente
			// suma 1 año a desde para comparar inicio y fin
			if (fechaActual > desde) {
				hasta.setYear( desde.getFullYear() + 1);
			}
			else {
				desde.setYear( desde.getFullYear() - 1);
			}

			if (fechaActual > hasta) {
				hasta.setYear( hasta.getFullYear() + 1);
				desde.setYear( desde.getFullYear() + 1);
			}

			return (fechaActual >= desde && fechaActual <= hasta);
		},
		diaActualValido: function(dias)
		{
			var fecha = new Date();
			return (dias.indexOf(fecha.getDay()) > -1);
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
		horario_a_ms: function(horario)
		{
			if (horario && horario.length == 5)
			{
				var hs = parseInt( horario.substr(0,2) );
				var min = parseInt( horario.substr(-2) );
				return  ( (hs * 60) + min ) * 60000;
			}
		},
		horaActualValida: function(horaIni, duracion)
		{

			//Tomo la Hora Actual
			var horaActual = new Date();

			//Calculo la hora inicial y seteo la hora y los minutos
			var horaInicial = new Date( horaActual );
			horaInicial.setHours( parseInt(horaIni.substr(0,2)) );
			horaInicial.setMinutes( parseInt( horaIni.substr(-2) ) );

			//Calculo la hora de finalizacion
			var horaFinal = new Date( horaInicial );
			horaFinal.setHours( horaInicial.getHours() + parseInt( duracion.substr(0,2) ) );
			horaFinal.setMinutes( horaInicial.getMinutes() + parseInt( duracion.substr(-2) ) );

			//Verifico si la Hora inicial es mayor que la final (cambio de dia)
			if( horaInicial.getHours() > horaFinal.getHours() && horaActual.getHours() <= horaFinal.getHours() ){

				//Atraso un dia
				horaInicial.setDate( horaInicial.getDate() -1 )
				horaFinal.setDate( horaFinal.getDate() -1 )

			}
			return ( horaActual >= horaInicial && horaActual <= horaFinal );
		},
		minutosRestantes: function(horaIni, duracion)
		{

			//Tomo la Hora Actual
			var horaActual = new Date();

			//Calculo la hora inicial y seteo la hora y los minutos
			var horaInicial = new Date( horaActual );
			horaInicial.setHours( parseInt(horaIni.substr(0,2)) );
			horaInicial.setMinutes( parseInt( horaIni.substr(-2) ) );

			//Calculo la hora de finalizacion
			var horaFinal = new Date( horaInicial );
			horaFinal.setHours( horaInicial.getHours() + parseInt( duracion.substr(0,2) ) );
			horaFinal.setMinutes( horaInicial.getMinutes() + parseInt( duracion.substr(-2) ) );

			//Verifico si la Hora inicial es mayor que la final (cambio de dia)
			if( horaInicial.getHours() > horaFinal.getHours() && horaActual.getHours() <= horaFinal.getHours() ){

				//Atraso un dia
				horaInicial.setDate( horaInicial.getDate() -1 )
				horaFinal.setDate( horaFinal.getDate() -1 )

			}

            return  parseInt( (horaFinal - horaActual)/60/1000 );
        }

	}

	return DateConvert;
}
