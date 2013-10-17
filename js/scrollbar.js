var Scrollbar = new Class({

	container: null,
	barContainer: null,
	bar: null,
	maxBarOffset: 0,
	maxScrollOffset: 0,


	initialize: function(container) {
		this.container = container;
		this.containerInner = container.getElement('div');

		this._createBar();
		this.update();

		// Drag bar:
		this.bar.addEvent('mousedown', function(e) {
			this.barContainer.addClass('active');

			var startOffset = e.client.y - parseInt(this.bar.getStyle('top'));
			var mouseMove = function(e) {
				e.preventDefault(); // Prevents text selection
				var offset = e.client.y - startOffset;
				offset = offset < 0 ? 0 : offset;
				offset = offset > this.maxBarOffset ? this.maxBarOffset : offset;
				var scroll = this.containerInner.getScroll();
				scroll.y = (offset / this.maxBarOffset) * this.maxScrollOffset;
				this.containerInner.scrollTo(scroll.x, scroll.y);
			}.bind(this);

			mouseMove(e);
			window.addEvent('mousemove', mouseMove);
			window.addEvent('mouseup:once', function() {
				window.removeEvent('mousemove', mouseMove);
				this.barContainer.removeClass('active');
			}.bind(this));
		}.bind(this));

		// Page by page:
		var fxScroll;
		this.barContainer.addEvent('click', function(e) {
			if(!this.bar.contains(e.target)) {
				var scroll = this.containerInner.getScroll();
				if(e.client.y <= this.bar.getPosition().y) {
					// Scroll up:
					scroll.y -= this.container.getHeight();
					scroll.y = scroll.y < 0 ? 0 : scroll.y;
				} else {
					// Scroll down:
					scroll.y += this.container.getHeight();
					scroll.y = scroll.y > this.maxScrollOffset ? this.maxScrollOffset : scroll.y;
				}

				fxScroll = fxScroll || new Fx.Scroll(this.containerInner, {
					"duration": 250,
					"transition": "quad:out"
				});
				fxScroll.start(scroll.x, scroll.y);
			}
		}.bind(this));

		// Move bar:
		var mousewheel = function(e) {
			var offset = (this.containerInner.getScroll().y / this.maxScrollOffset) * this.maxBarOffset;
			this.bar.setStyle('top', offset);
		}.bind(this);
		this.containerInner.addEvent('scroll', mousewheel);
	},

	_createBar: function() {
		this.barContainer = new Element('span', {"class": "scrollbar"});
		var coord = this.container.getCoordinates();
		this.barContainer.setStyles({
			"position": "absolute",
			"top": 0,
			"right": 0,
			"bottom": 0,
			"display": "block",
			"width": 25,
			"height": coord.height
		});

		this.bar = new Element('span', {"html": "<span></span>"});
		this.bar.setStyles({
			"position": "relative",
			"display": "block"
		});
		this.bar.inject(this.barContainer);

		this.barContainer.inject(this.container, 'bottom');
	},

	update: function() {
		var scrollHeight = this.containerInner.getScrollSize().y;
		var visibleHeight = this.container.getHeight();
		this.maxScrollOffset = scrollHeight - visibleHeight;
		var barHeight = visibleHeight * (visibleHeight / scrollHeight);
		this.bar.setStyle('height', barHeight);
		this.maxBarOffset = visibleHeight - barHeight;

		if(barHeight === visibleHeight) {
			this.barContainer.setStyle('display', 'none');
		} else {
			this.barContainer.setStyle('display', 'block');
		}
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