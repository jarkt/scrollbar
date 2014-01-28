/*
---

description: Scrolling class adds custom scrollbars to a native scrolling element.

license: MIT-style

authors:
- Jark
- Christoph

requires:
- more: Fx.Scroll

provides: [Scrolling]

...
*/
var Scrolling = new Class({

	Implements: Options,

	options: {
		horizontal: null,
		vertical: null,
		indicator: true,
		interactive: true,
		label: '<strong>{currentPage}</strong>{pages}',
		className: 'scrolling',
		biggerPages: false,
		scrollDuration: 260,
		scrollTransition: 'quad:out',
		hideDelay: 500
	},

	container: null,
	containerInner: null,
	barContainer: [null, null],
	bar: [null, null],
	maxBarOffset: [0, 0],
	maxScrollOffset: [0, 0],
	axes: [],
	timeout: null,
	fx: null,
	scroll: null,

	initialize: function(container, options) {
		if (!container) {
			throw new Error('First parameter "container" is missing');
		}

		this.container = container.addClass(this.options.className);
		this.setOptions(options);

		this.setupScrollArea();
		this.axes = this.getScrollAxes();

		this.createBars();
		this.update();

		var deleteScroll = function() {
			this.scroll = null;
		}.bind(this);
		this.fx = new Fx.Scroll(this.containerInner, {
			duration: this.options.scrollDuration,
			transition: this.options.scrollTransition,
			link: 'cancel',
			onComplete: deleteScroll,
			onCancel: deleteScroll
		});

		// move bar
		this.containerInner.addEvent('scroll', function(e) {
			this.updateLabels();

			if (this.options.indicator === 'scroll') {
				this.showBars();
				this.hideBars();
			}

			if (this.options.interactive === 'scroll' || this.options.interactive === true) {
				this.activateBars();
			}

			var scroll = this.containerInner.getScroll();
			if (this.bar.x) {
				var progressX = scroll.x / this.maxScrollOffset.x;
				this.bar.x.setStyle('left', this.maxBarOffset.x * progressX);
			}

			if (this.bar.y) {
				var progressY = scroll.y / this.maxScrollOffset.y;
				this.bar.y.setStyle('top', this.maxBarOffset.y * progressY);
			}
		}.bind(this));

		// mouseover scrolling area
		if (this.options.indicator === 'hover') {
			this.containerInner.addEvents({
				mouseenter: this.showBars.bind(this),
				mouseleave: this.hideBars.bind(this)
			});
		}

		return this;
	},

	setupScrollArea: function() {
		var scrollingAreaClass = this.options.className + '-area';

		// setup inner container (scrolling area)
		this.containerInner = this.container.getFirst('.' + scrollingAreaClass);
		if (!this.containerInner) {
			this.containerInner = new Element('div', {
				'class': scrollingAreaClass
			}).adopt(this.container.getChildren().dispose());
			this.container.grab(this.containerInner);
		}

		// hide native scrollbars
		var nativeBarSize = this.containerInner.offsetWidth - this.containerInner.clientWidth;
		if (nativeBarSize <= 0) {
			nativeBarSize = this.containerInner.offsetHeight - this.containerInner.clientHeight;
		}
		this.containerInner.setStyles({
			margin: '0 -' + nativeBarSize + 'px -' + nativeBarSize + 'px 0',
			padding: '0 ' + nativeBarSize + 'px ' + nativeBarSize + 'px 0'
		});
	},

	getScrollAxes: function() {
		var axes = ['x', 'y'];
		var scrollAxes = [];
		var scrollValues = ['auto', 'scroll'];

		var containerSize = this.container.getSize();
		var scrollSize = this.containerInner.getScrollSize();

		for (var i = 0, axis; i < axes.length, axis = axes[i]; i++) {
			var overflow = this.containerInner.getStyle('overflow-' + axis);
			var alignment = (axis === 'x') ? 'horizontal' : 'vertical';

			if (this.options[alignment] === 'hidden') {
				continue;
			}

			if (this.options[alignment] && scrollValues.indexOf(this.options[alignment]) > -1) {
				overflow = this.options[alignment];
			}

			if (overflow === 'scroll' || (overflow === 'auto' && scrollSize[axis] > containerSize[axis])) {
				scrollAxes.push(axis);
			}
		}

		return scrollAxes;
	},

	createBars: function() {
		this.axes.each(function(axis) {
			this.barContainer[axis] = new Element('span', {
				'class': this.options.className + '-bar ' + this.options.className + '-' + axis
			});
			var coord = this.container.getCoordinates();
			var styles = {
				position: 'absolute',
				display: 'block',
				bottom: 0,
				right: 0
			};
			switch(axis) {
				case 'x':
					styles.left = 0;
					styles.width = coord.width;
					break;
				case 'y':
					styles.top = 0;
					styles.height = coord.height;
					break;
			}
			this.barContainer[axis].setStyles(styles).set('tween', {
				duration: this.options.hideDelay
			});

			if (this.options.indicator !== true) {
				this.barContainer[axis].fade('hide');
			}

			var html;
			if (this.options.label) {
				html = '<span><span class="' + this.options.className + '-label"></span></span>';
			} else {
				html = '<span></span>';
			}
			this.bar[axis] = new Element('span', {html: html});
			this.bar[axis].setStyles({
				position: 'relative',
				display: 'block'
			});
			this.bar[axis].inject(this.barContainer[axis]);

			this.barContainer[axis].inject(this.container, 'bottom');

			// dragable bar
			this.bar[axis].addEvent('mousedown', function(e) {
				clearTimeout(this.timeout);
				this.fx.cancel();

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

			// scroll by page
			this.barContainer[axis].addEvent('click', function(e) {
				if (!this.bar[axis].contains(e.target)) {
					var scroll = this.scroll || this.containerInner.getScroll();

					switch(axis) {
						case 'x':
							if (e.client.x <= this.bar.x.getPosition().x) {
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
							if (e.client.y <= this.bar.y.getPosition().y) {
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

					this.scroll = scroll;

					this.fx.stop(); // Prevent firing of cancel-event by stopping :)
					this.fx.start(scroll.x, scroll.y);
				}
			}.bind(this));

			// prevent scrolling of outer container
			this.barContainer[axis].addEvent('mousewheel', function(e) {
				e.preventDefault();
			});

			// clear timout
			this.barContainer[axis].addEvents({
				mouseenter: function() {
					clearTimeout(this.timeout);
				}.bind(this),
				mouseleave: this.deactivateBars.bind(this)
			});
		}.bind(this));
	},

	showBars: function() {
		clearTimeout(this.timeout);

		if (this.barContainer.x) {
			this.barContainer.x.fade('show');
		}
		if (this.barContainer.y) {
			this.barContainer.y.fade('show');
		}
	},

	hideBars: function() {
		this.timeout = function() {
			if (this.barContainer.x) {
				this.barContainer.x.fade('out');
			}
			if (this.barContainer.y) {
				this.barContainer.y.fade('out');
			}
		}.delay(this.options.hideDelay, this);
	},

	activateBars: function() {
		var activeClass = this.options.className + '-active';

		clearTimeout(this.timeout);

		if (this.barContainer.x) {
			this.barContainer.x.addClass(activeClass);
		}
		if (this.barContainer.y) {
			this.barContainer.y.addClass(activeClass);
		}

		this.deactivateBars();
	},

	deactivateBars: function() {
		var activeClass = this.options.className + '-active';

		this.timeout = function() {
			if (this.barContainer.x) {
				this.barContainer.x.removeClass(activeClass);
			}
			if (this.barContainer.y) {
				this.barContainer.y.removeClass(activeClass);
			}
		}.delay(this.options.hideDelay, this);
	},

	updateLabels: function() {
		if (this.options.label) {
			var scroll = this.containerInner.getScroll();
			var size = this.container.getSize();
			this.axes.each(function(axis) {
				var span = this.bar[axis].getElement('.' + this.options.className + '-label');
				var f = this.options.biggerPages ? Math.ceil : parseInt;
				var currentPage = f((scroll[axis] / size[axis]) + 1);
				var pages = f(this.maxScrollOffset[axis] / size[axis]) + 1;
				span.set('html', this.options.label.substitute({
					currentPage: currentPage,
					pages: pages
				}));
			}.bind(this));
		}
	},

	update: function() {
		var visibleSize = this.container.getSize();
		var scrollSize = this.containerInner.getScrollSize();

		this.axes = this.getScrollAxes();

		for (var i = 0, axis; i < this.axes.length, axis = this.axes[i]; i++) {
			this.barContainer[axis].setStyle('display', 'block');
			this.maxScrollOffset[axis] = scrollSize[axis] - visibleSize[axis];
			var barSize = visibleSize[axis] * (visibleSize[axis] / scrollSize[axis]);
			this.bar[axis].setStyle(axis == 'x' ? 'width' : 'height', barSize);
			barSize = this.bar[axis].getSize()[axis]; // Update value, because of min size
			this.maxBarOffset[axis] = visibleSize[axis] - barSize;
		}

		this.updateLabels();
	}

});
