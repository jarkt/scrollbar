/**
 * Scrolling adds custom scrollbars to a native scrolling element.
 *
 * Example (pseudo) HTML:
 * <div data-scrolling(="scrolling") data-scrolling-interactive>
 *     <div data-scrolling-area>
 *         scrollable content goes here
 *     </div>
 * </div>
 *
 * Example JS initialization:
 * for (const container of document.querySelectorAll('[data-scrolling]')) {
 *     new Scrolling(container);
 * }
 *
 * Example CSS:
 * .scrolling {
 *     position: relative;
 *     overflow: hidden;
 * }
 * .scrolling-area {
 *     overflow: auto;
 *     width: inherit;
 *     height: inherit;
 * }
 *
 * @param {HTMLElement} container
 * @param {Object} options
 */
function Scrolling(container, options) {
	options = Object.assign({
		/**
		 * Show (large) click- and dragable scrollbars
		 *
		 * @type {Bool}
		 */
		interactive: 'scrollingInteractive' in container.dataset,
		/**
		 * CSS classes for styling, if you change this, default CSS will no
		 * longer work and you have to provide your own.
		 *
		 * @type {Object}
		 */
		classes: {
			base: container.dataset.scrolling || 'scrolling',
			get area() {
				return `${this.base}-area`;
			},
			get active() {
				return `${this.base}-active`;
			},
			get track() {
				return `${this.base}-track`;
			},
			get bar() {
				return `${this.base}-bar`;
			},
			get interactive() {
				return `${this.base}-interactive`;
			}
		},
		/**
		 * Delay to hide scrollbar after scrolling stops
		 *
		 * @type {Number}
		 */
		hideDelay: 500
	}, options);

	const scrollingArea = container.querySelector('[data-scrolling-area]');
	const nativeBarSize = {x: 0, y: 0};
	const scrollbar = {};
	const range = document.createRange();
	const fragment = string => {
		const html = range.createContextualFragment(string);
		return html.children.length === 1 ? html.children[0] : html;
	};

	let currentScrollPosition;
	let scrollTicking = false;
	let scrollTimeout;

	// setup once
	container.classList.add(options.classes.base);
	if (options.interactive) container.classList.add(options.classes.interactive);
	container.addEventListener('update', update);
	scrollingArea.classList.add(options.classes.area);
	scrollingArea.addEventListener('scroll', scroll);

	update();


	/**
	 * Update scrolling context (initial or on content or element size change)
	 */
	function update() {
		hideNativeScrollbars();
		setCustomScrollbars();
		moveScrollbars();
	}

	/**
	 * Move the native scrollbars out of sight
	 */
	function hideNativeScrollbars() {
		nativeBarSize.x = scrollingArea.offsetHeight - scrollingArea.clientHeight;
		nativeBarSize.y = scrollingArea.offsetWidth - scrollingArea.clientWidth;
		Object.assign(scrollingArea.style, {
			margin: `0 -${nativeBarSize.y}px -${nativeBarSize.x}px 0`,
			padding: `0 ${nativeBarSize.y}px ${nativeBarSize.x}px 0`
		});
	}

	/**
	 * Create, delete or update the custom scrollbar elements
	 */
	function setCustomScrollbars() {
		for (const axis of Object.keys(nativeBarSize)) {
			if (!(axis in scrollbar) && nativeBarSize[axis] > 0) {
				scrollbar[axis] = {
					bar: fragment(`<div class="${options.classes.bar}"></div>`),
					track: fragment(`<div class="${options.classes.track} ${options.classes.track}-${axis}"></div>`)
				};
				if (options.interactive) {
					addBarMoveEvent(scrollbar[axis], axis);
					addTrackClickEvent(scrollbar[axis], axis);
				}
				scrollbar[axis].track.appendChild(scrollbar[axis].bar);
				container.appendChild(scrollbar[axis].track);
			} else if (nativeBarSize[axis] === 0 && axis in scrollbar) {
				container.removeChild(scrollbar[axis].track);
				delete scrollbar[axis];
				continue;
			}

			if (axis in scrollbar) {
				// additional class if both scrollbars are active
				if (nativeBarSize.x > 0 && nativeBarSize.y > 0) {
					scrollbar[axis].track.classList.add(`${options.classes.track}-xy`);
				} else if (axis in scrollbar) {
					scrollbar[axis].track.classList.remove(`${options.classes.track}-xy`);
				}

				// set bar size and everything for later scrollbar calculation
				if (axis === 'x') {
					scrollbar[axis].size = Math.round(scrollingArea.clientWidth * (scrollingArea.clientWidth / scrollingArea.scrollWidth));
					scrollbar[axis].bar.style.width = `${scrollbar[axis].size}px`;
					scrollbar[axis].maxBarOffset = scrollbar[axis].track.offsetWidth - scrollbar[axis].bar.offsetWidth;
					scrollbar[axis].maxScrollOffset = scrollingArea.scrollWidth - scrollingArea.clientWidth;
					scrollbar[axis].prop = {
						offset: 'offsetLeft',
						scroll: 'scrollLeft',
						client: 'clientX',
						layer: 'layerX',
						style: 'left'
					};
				} else {
					scrollbar[axis].size = Math.round(scrollingArea.clientHeight * (scrollingArea.clientHeight / scrollingArea.scrollHeight));
					scrollbar[axis].bar.style.height = `${scrollbar[axis].size}px`;
					scrollbar[axis].maxBarOffset = scrollbar[axis].track.offsetHeight - scrollbar[axis].bar.offsetHeight;
					scrollbar[axis].maxScrollOffset = scrollingArea.scrollHeight - scrollingArea.clientHeight;
					scrollbar[axis].prop = {
						offset: 'offsetTop',
						scroll: 'scrollTop',
						client: 'clientY',
						layer: 'layerY',
						style: 'top'
					};
				}
			}
		}
	}

	/**
	 * Set offset for scrollbar elements
	 */
	function moveScrollbars() {
		for (const axis of Object.keys(scrollbar)) {
			const progress = scrollingArea[scrollbar[axis].prop.scroll] / scrollbar[axis].maxScrollOffset;
			const offset = `${Math.round(scrollbar[axis].maxBarOffset * progress)}px`;
			scrollbar[axis].bar.style[scrollbar[axis].prop.style] = offset;
		}
	}

	/**
	 * Update scroll position
	 */
	function scroll() {
		currentScrollPosition = {
			x: scrollingArea.scrollLeft,
			y: scrollingArea.scrollTop
		};
		if (!scrollTicking) {
			requestAnimationFrame(() => {
				container.classList.add(options.classes.active);
				moveScrollbars();
				clearTimeout(scrollTimeout);
				scrollTimeout = setTimeout(() => container.classList.remove(options.classes.active), options.hideDelay);
				scrollTicking = false;
			});
			scrollTicking = true;
		}
	}

	/**
	 * Make custom scrollbar click and movable
	 *
	 * @param {Object} scrollbar
	 * @param {String} axis
	 */
	function addBarMoveEvent(scrollbar, axis) {
		scrollbar.bar.addEventListener('mousedown', e => {
			// prevent text selection
			e.preventDefault();
			const startOffset = e[scrollbar.prop.client] - scrollbar.bar[scrollbar.prop.offset];
			let moveTicking = false;
			const moveBar = e => {
				if (!moveTicking) {
					requestAnimationFrame(() => {
						let offset = e[scrollbar.prop.client] - startOffset;
						offset = offset < 0 ? 0 : offset > scrollbar.maxBarOffset ? scrollbar.maxBarOffset : offset;
						scrollingArea[scrollbar.prop.scroll] = offset / scrollbar.maxBarOffset * scrollbar.maxScrollOffset;
						moveTicking = false;
					});
					moveTicking = true;
				}
			}
			const removeWindowEventListener = () => {
				window.removeEventListener('mousemove', moveBar);
				window.removeEventListener('mouseup', removeWindowEventListener);
			}
			window.addEventListener('mousemove', moveBar)
			window.addEventListener('mouseup', removeWindowEventListener);
		});
	}

	/**
	 * Make custom track clickable to page up or down
	 *
	 * @param {Object} scrollbar
	 * @param {String} axis
	 */
	function addTrackClickEvent(scrollbar, axis) {
		scrollbar.track.addEventListener('click', e => {
			// ignore clicks on the bar, the move handler is responsible for them
			if (e.target !== scrollbar.track) return;
			scrollingArea[scrollbar.prop.scroll] = (e[scrollbar.prop.layer] - scrollbar.size / 2) / scrollbar.maxBarOffset * scrollbar.maxScrollOffset;
		});
	}

	return {update};
}

export default Scrolling;
