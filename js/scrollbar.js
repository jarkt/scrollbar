var Scrollbar = new Class({

	Implements: [Options],

	options: {
		"biggerPages": false,
		"label": '<strong>{currentPage}</strong>{pages}', // null = disabled
		"hideDelay": 500
	},

	container: null,
	containerInner: null,
	barContainer: [null, null],
	bar: [null, null],
	maxBarOffset: [0, 0],
	maxScrollOffset: [0, 0],
	axes: [],


	initialize: function(container, options) {
		this.setOptions(options);

		this.container = container;
		this.containerInner = container.getElement('div');

		this._createBars();
		this.update();

		var timeout;
		var fxScroll = new Fx.Scroll(this.containerInner, {
			"duration": 260,
			"transition": "quad:out",
			"link": "cancel"
		});
		var scroll;
		var deleteScroll = function() {
			scroll = null;
		};
		fxScroll.addEvent('complete', deleteScroll);
		fxScroll.addEvent('cancel', deleteScroll);

		['x', 'y'].each(function(axis) {
			// Drag bar:
			this.bar[axis].addEvent('mousedown', function(e) {
				clearTimeout(timeout);
				fxScroll.cancel();

				var startOffset = e.client[axis] - parseInt(this.bar[axis].getStyle(axis == 'x' ? 'left' : 'top'));
				var mouseMove = function(e) {
					e.preventDefault(); // Prevents text selection
					var offset = e.client[axis] - startOffset;
					offset = offset < 0 ? 0 : offset;
					offset = offset > this.maxBarOffset[axis] ? this.maxBarOffset[axis] : offset;
					var scroll = this.containerInner.getScroll();
					scroll[axis] = (offset / this.maxBarOffset[axis]) * this.maxScrollOffset[axis];
					this.containerInner.scrollTo(scroll.x, scroll.y);
				}.bind(this);

				mouseMove(e);
				window.addEvent('mousemove', mouseMove);
				window.addEvent('mouseup:once', function() {
					window.removeEvent('mousemove', mouseMove);
				}.bind(this));
			}.bind(this));

			// Page by page:
			this.barContainer[axis].addEvent('click', function(e) {
				if(!this.bar[axis].contains(e.target)) {
					scroll = scroll || this.containerInner.getScroll();

					switch(axis) {
						case 'x':
							if(e.client.x <= this.bar.x.getPosition().x) {
								// Scroll left:
								scroll.x -= this.container.getWidth();
								scroll.x = scroll.x < 0 ? 0 : scroll.x;
							} else {
								// Scroll right:
								scroll.x += this.container.getWidth();
								scroll.x = scroll.x > this.maxScrollOffset.x ? this.maxScrollOffset.x : scroll.x;
							}
							break;
						case 'y':
							if(e.client.y <= this.bar.y.getPosition().y) {
								// Scroll up:
								scroll.y -= this.container.getHeight();
								scroll.y = scroll.y < 0 ? 0 : scroll.y;
							} else {
								// Scroll down:
								scroll.y += this.container.getHeight();
								scroll.y = scroll.y > this.maxScrollOffset.y ? this.maxScrollOffset.y : scroll.y;
							}
							break;
					}

					fxScroll.stop(); // Prevent firing of cancel-event by stopping :)
					fxScroll.start(scroll.x, scroll.y);
				}
			}.bind(this));

			// Prevents scrolling of outer container:
			this.barContainer[axis].addEvent('mousewheel', function(e) {
				e.preventDefault();
			}.bind(this));
		}.bind(this));

		// Move bar:
		this.containerInner.addEvent('scroll', function(e) {
			this._updateLabels();

			clearTimeout(timeout);
			this.barContainer.x.addClass('active');
			this.barContainer.y.addClass('active');
			timeout = (function() {
				this.barContainer.x.removeClass('active');
				this.barContainer.y.removeClass('active');
			}).delay(this.options.hideDelay, this);

			var scroll = this.containerInner.getScroll();
			var progressX = scroll.x / this.maxScrollOffset.x;
			this.bar.x.setStyle('left', this.maxBarOffset.x * progressX);

			var progressY = scroll.y / this.maxScrollOffset.y;
			this.bar.y.setStyle('top', this.maxBarOffset.y * progressY);
		}.bind(this));
	},

	_createBars: function() {
		['x', 'y'].each(function(axis) {
			this.barContainer[axis] = new Element('span', {"class": "scrollbar " + axis});
			var coord = this.container.getCoordinates();
			this.barContainer[axis].setStyles({
				"position": "absolute",
				"display": "block",
				"bottom": 0,
				"right": 0,
			});
			switch(axis) {
				case 'x':
					this.barContainer[axis].setStyles({
						"left": 0,
						"width": coord.width
					});
					break;
				case 'y':
					this.barContainer[axis].setStyles({
						"top": 0,
						"height": coord.height
					});
					break;
			}

			var html;
			if(this.options.label) {
				html = '<span><span class="label"></span></span>';
			} else {
				html = '<span></span>';
			}
			this.bar[axis] = new Element('span', {"html": html});
			this.bar[axis].setStyles({
				"position": "relative",
				"display": "block"
			});
			this.bar[axis].inject(this.barContainer[axis]);

			this.barContainer[axis].inject(this.container, 'bottom');
		}.bind(this));
	},

	_updateLabels: function() {
		if(this.options.label) {
			var scroll = this.containerInner.getScroll();
			var size = this.container.getSize();
			this.axes.each(function(axis) {
				var span = this.bar[axis].getElement('span.label');
				var f = this.options.biggerPages ? Math.ceil : parseInt;
				var currentPage = f((scroll[axis] / size[axis]) + 1);
				var pages = f(this.maxScrollOffset[axis] / size[axis]) + 1;
				span.set('html', this.options.label.substitute({
					"currentPage": currentPage,
					"pages": pages
				}));
			}.bind(this));
		}
	},

	update: function() {
		var scrollSize = this.containerInner.getScrollSize();
		var visibleSize = this.container.getSize();
		this.axes = [];
		['x', 'y'].each(function(axis) {
			var overflow = this.containerInner.getStyle('overflow-' + axis);
			if(scrollSize[axis] - visibleSize[axis] > 0 && overflow == 'scroll') {
				this.axes.push(axis);
				this.barContainer[axis].setStyle('display', 'block');
				this.maxScrollOffset[axis] = scrollSize[axis] - visibleSize[axis] - 100;
				var barSize = visibleSize[axis] * (visibleSize[axis] / scrollSize[axis]);
				this.bar[axis].setStyle(axis == 'x' ? 'width' : 'height', barSize);
				barSize = this.bar[axis].getSize()[axis]; // Update value, because of min size
				this.maxBarOffset[axis] = visibleSize[axis] - barSize;
			} else {
				this.barContainer[axis].setStyle('display', 'none');
			}
		}.bind(this));
		this._updateLabels();
	}
});



/* Startup: */
var scrollbar = function(root) {

	root.getElements('.scrollbar').each(function(container) {
		new Scrollbar(container);
	});
};

window.addEvent('domready', function() {
	scrollbar(window.document);
});