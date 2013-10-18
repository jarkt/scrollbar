var Scrollbar = new Class({

	container: null,
	containerInner: null,
	barContainer: null,
	bar: null,
	maxBarOffset: 0,
	maxScrollOffset: 0,


	initialize: function(container) {
		this.container = container;
		this.containerInner = container.getElement('div');

		this._createBar();
		this.update();

		var fxScroll = new Fx.Scroll(this.containerInner, {
			"duration": 300,
			"transition": "quad:out",
			"link": "cancel"
		});
		var scroll;
		var deleteScroll = function() {
			scroll = null;
		};
		fxScroll.addEvent('complete', deleteScroll);
		fxScroll.addEvent('cancel', deleteScroll);

		// Drag bar:
		this.bar.addEvent('mousedown', function(e) {
			fxScroll.cancel();
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
		this.barContainer.addEvent('click', function(e) {
			if(!this.bar.contains(e.target)) {
				fxScroll.stop();
				scroll = scroll || this.containerInner.getScroll();

				if(e.client.y <= this.bar.getPosition().y) {
					// Scroll up:
					scroll.y -= this.container.getHeight();
					scroll.y = scroll.y < 0 ? 0 : scroll.y;
				} else {
					// Scroll down:
					scroll.y += this.container.getHeight();
					scroll.y = scroll.y > this.maxScrollOffset ? this.maxScrollOffset : scroll.y;
				}

				fxScroll.start(scroll.x, scroll.y);
			}
		}.bind(this));

		// Move bar:
		this.containerInner.addEvent('scroll', function(e) {
			var offset = (this.containerInner.getScroll().y / this.maxScrollOffset) * this.maxBarOffset;
			this.bar.setStyle('top', offset);
		}.bind(this));

		// Prevents scrolling of outer container:
		this.barContainer.addEvent('mousewheel', function(e) {
			e.preventDefault();
		}.bind(this));
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
		barHeight = this.bar.getHeight(); // Update value, because of min-height
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