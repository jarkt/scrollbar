Scrolling
=========

Adds custom scrollbars to *native* scrolling area.

<!--- keep screenshot image size at about 200x100 -->
![Screenshot](https://github.com/inta/scrolling/raw/master/screen.png)

How to use
----------

You need a container element for scrolling:

	<div class="scrolling">
		<p>Scroll content</p>
	</div>

If you do not use the scrolling class, it will be applied to the container. Elements inside the container will be moved to the scrolling area which is placed inside the container beside the scrollbar elements.

You may provide the scrolling area element and it will be grabbed instead of creating a new one:

	<div class="scrolling">
		<div class="scrolling-area">
			<p>Scroll content</p>
		</div>
	</div>

This is useful if you want to provide elements within the container which should not scroll but be positioned absolutely.


If you are happy with the defaults, just grab the container element:

	var scrolling = new Scrolling(document.getElements('.scrolling')[0]);

Otherwise you may adjust any of these options to your needs:

	var scrolling = new Scrolling(document.getElements('.scrolling')[0], {
		/**
		 * Overrides overflow-x style, currently only 'hidden' is supported
		 *
		 * @type {string}
		 */
		horizontal: null,

		/**
		 * Overrides overflow-y style, currently only 'hidden' is supported
		 *
		 * @type {string}
		 */
		vertical: null,

		/**
		 * Show small scrollbars
		 *
		 * 'scroll', 'hover', true (always) or false (never)
		 *
		 * @type {bool|string}
		 */
		indicator: true,

		/**
		 * Show large click- and dragable scrollbars
		 *
		 * 'scroll', 'hover', true (for both) or false (never)
		 *
		 * @type {bool|string}
		 */
		interactive: true,

		/**
		 * Label to show scroll position
		 *
		 * Placeholders: {currentPage} and {pages}
		 * null = disabled
		 *
		 * @type {string}
		 */
		label: '<strong>{currentPage}</strong>{pages}',

		/**
		 * Prefix for CSS classes and class name for container
		 *
		 * If you change this, default CSS will no longer work, you have to provide your own.
		 *
		 * @type {string}
		 */
		className: 'scrolling',

		/**
		 * Scroll duration if scrollbar is moved
		 *
		 * @type {number}
		 */
		scrollDuration: 260,

		/**
		 * Transition for scrollbar movement
		 *
		 * @type {string}
		 */
		scrollTransition: 'quad:out',

		/**
		 * Delay to hide scrollbar after scrolling stops
		 *
		 * @type {number}
		 */
		hideDelay: 500
	});
