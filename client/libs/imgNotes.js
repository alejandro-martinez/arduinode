/*! jQuery imgNotes - v0.7.6 - 2015-06-13
* https://github.com/waynegm/imgNotes
* Copyright (c) 2015 Wayne Mogg; Licensed MIT */
;(function($) {
	$.widget("wgm.imgNotes", {
		options: {
			zoom: 1,
			zoomStep: 0.2,
			zoomable: true,
			canEdit: false,
			vAll: "middle",
			hAll: "middle",
/*
 * Default callback to create a marker indicating a note location
 *	See the examples for more elaborate alternatives.
 */
			onAdd: function() {
				this.options.vAll = "bottom";
				this.options.hAll = "middle";

				return  $(document.createElement('span'))
								  .attr("id",String(this.id_disp) + String(this.nro_salida))
								  .addClass("marker " + this.tipo)
								  .html(this.estado);
			},
/*
 *	Default callback when the marker is clicked and the widget has canEdit = true
 *	Opens a dialog with a textarea to write a note.
 *	See the examples for a more elaborate alternative that includes a WYSIWYG editor
 */
			onEdit: function(ev, elem) {

				var $elem = $(elem);

				$(document).off('RemoveImgNotesMarker').on('RemoveImgNotesMarker', function()
				{
					$elem.trigger("remove");
				});
				$(document).trigger('ImgNotesEditing', [$elem.data()]);
			},
/*
 *	Default callback when the marker is clicked and the widget has canEdit = false
 *	Opens a dialog displaying the contents of the marker's note
 *	See examples for alternatives such as using tooltips.
 */
			onShow: function(ev, elem) {
				var $elem = $(elem);
				$(document).on('UpdateImgNotesMarker', function(e, note)
				{

					var idMarker = "#".concat(note.id_disp,note.nro_salida);

					console.log("set state",idMarker);
					if (note.estado == "on")
					{
						$(idMarker).addClass("on");
					}
					else
					{
						$(idMarker).removeClass("on");
					}
					$(idMarker).html(note.estado);
					$elem.data("note", note.note);
				});

				$(document).trigger('ImgNotesShow', [$elem.data()]);
			},
/*
 *	Default callback when the markers are repainted
 */
			onUpdateMarker: function(elem) {

				if ($(elem).data("estado") == 'on')
				{
					$(elem).addClass('on');
				}
				var $elem = $(elem);
				var $img = $(this.img);
				var pos = $img.imgViewer("imgToView", $elem.data("relx"), $elem.data("rely"));
				if (pos) {
					$elem.css({
						left: (pos.x - $elem.data("xOffset")),
						top: (pos.y - $elem.data("yOffset")),
						position: "absolute"
					});
				}
			},
/*
 *	Default callback when the image view is repainted
 */
		onUpdate: function() {
				var self = this;
				$.each(this.notes, function() {
					self.options.onUpdateMarker.call(self, this);
				});
			}
		},


		_create: function() {

			var self = this;
			if (!this.element.is("img")) {
				$.error('imgNotes plugin can only be applied to img elements');
			}
//		the note/marker elements
			self.notes = [];
//		the number of notes
			self.noteCount = 0;
//		the original img element
			self.img = self.element[0];
			var $img = $(self.img);
//		attach the imgViewer plugin for zooming and panning with a custon click and update callbacks
			$img.imgViewer({
							onClick: function(ev, imgv) {
								if (self.options.canEdit) {
									ev.preventDefault();
									var rpos = imgv.cursorToImg(ev.pageX, ev.pageY);

									if (rpos)
									{
										$(document).trigger('ImgNotesClick',[{
											x: rpos.x,
											y: rpos.y
										}])
										//var elem = self.addNote(id_disp,);
										//self._trigger("onEdit", ev, elem);
									}
								}
							},
							onUpdate: function(ev, imgv) {
								self.options.zoom = imgv.options.zoom;
								self.options.onUpdate.call(self);
							},
							zoom: self.options.zoom,
							zoomStep: self.options.zoomStep,
							zoomable: self.options.zoomable
			});
			$img.imgViewer("update");
		},
/*
 *	Remove the plugin
 */
		destroy: function() {
			this.clear();
			$(this.img).imgViewer("destroy");
			$.Widget.prototype.destroy.call(this);
		},

		_setOption: function(key, value) {
			switch(key) {
				case 'vAll':
					switch(value) {
						case 'top': break;
						case 'bottom': break;
						default: value = 'middle';
					}
					break;
				case 'hAll':
					switch(value) {
						case 'left': break;
						case 'right': break;
						default: value = 'middle';
					}
					break;
			}
			var version = $.ui.version.split('.');
			if (version[0] > 1 || version[1] > 8) {
				this._super(key, value);
			} else {
				$.Widget.prototype._setOption.apply(this, arguments);
			}
			switch(key) {
				case 'zoom':
					$(this.img).imgViewer("option", "zoom", value);
					break;
				case 'zoomStep':
					$(this.img).imgViewer("option", "zoomStep", value);
					break;
				case 'zoomable':
					$(this.img).imgViewer("option", "zoomable", value);
					break;
			}
		},
/*
 *	Pan the view to be centred at the given relative image location
 */
		panTo: function(relx, rely) {
			return $(this.img).imgViewer("panTo", relx, rely);
		},

/*
 *	Add a note
 */
		addNote: function(id_disp,relx, rely, text,nro_salida,ip,estado,tipo,id_planta) {
			var self = this;
			this.noteCount++;
			this.tipo = tipo;
			this.estado = estado;
			this.nro_salida = nro_salida;
			this.id_disp = id_disp;
			var elem = this.options.onAdd.call(this);
			var $elem = $(elem);
			$(this.img).imgViewer("addElem",elem);
			$elem.data("id_disp",id_disp).data("nro_salida",nro_salida);
			$elem.data("relx", relx).data("rely", rely).data("note", text);
			$elem.data("ip", ip).data("estado",estado).data("tipo",tipo);
			$elem.data("id_planta", id_planta);

			switch (this.options.vAll) {
				case "top": $elem.data("yOffset", 0); break;
				case "bottom": $elem.data("yOffset", $elem.height()); break;
				default: $elem.data("yOffset", Math.round($elem.height()/2));
			}
			switch (this.options.hAll) {
				case "left": $elem.data("xOffset", 0); break;
				case "right": $elem.data("xOffset", $elem.width()); break;
				default: $elem.data("xOffset", Math.round($elem.width()/2));
			}
			$elem.click(function(ev) {
				ev.preventDefault();
				if (self.options.canEdit) {
					self._trigger("onEdit", ev, elem);
				} else {
					self._trigger("onShow", ev, elem);
				}
			});
			$elem.on("remove", function() {
				self._delete(elem);
			});
			this.notes.push(elem);
			$(this.img).imgViewer("update");
			return elem;
		},
/*
 *	Number of notes
 */
		count: function() {
			return this.noteCount;
		},
/*
 *	Delete a note
 */
		_delete: function(elem) {
			this.notes = this.notes.filter(function(v) { return v!== elem; });
			$(elem).off();
			$(elem).remove();
			$(this.img).imgViewer("update");
		},
/*
 *	Clear all notes
 */
		clear: function() {
			var self = this;
			var total = self.notes.length;
			for ( var i = 0; i < total; i++ ){
				var $this = self.notes[i];
				$this.off();
				$this.remove();
			}
			self.notes=[];
			self.noteCount = 0;
		},
/*
 *	Add notes from a javascript array
 */
		import: function(notes) {
			var self = this;
			$.each(notes, function()
			{
				self.addNote(this.id_disp,this.x, this.y, this.note, this.nro_salida, this.ip, this.estado,this.tipo,this.id_planta);
			});
			$(this.img).imgViewer("update");
		},
/*
 *	Export notes to an array
 */
		export: function() {
			var notes = [];
			$.each(this.notes, function() {
				var $elem = $(this);
				notes.push({
						id_disp: $elem.data("id_disp"),
						nro_salida: $elem.data("nro_salida"),
						x: $elem.data("relx"),
						y: $elem.data("rely"),
						note: $elem.data("note"),
						ip: $elem.data("ip"),
						estado:  $elem.data("estado"),
						tipo:  $elem.data("tipo"),
						id_planta:  $elem.data("id_planta"),
				});
			});
			return notes;
		}
	});
})(jQuery);
