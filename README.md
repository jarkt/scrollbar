Scrolling
=========

Adds custom scrollbars to *native* scrolling area.

<!--- keep screenshot image size at about 200x100 -->
![Screenshot](https://github.com/inta/scrolling/raw/master/screen.png)

How to use
----------

You need a container and scroll area element for scrolling:

	<div data-scrolling data-scrolling-interactive>
		<div data-scrolling-area>
			scrollable content goes here
		</div>
	</div>

You can set data-scrolling to a custom class name which will be used as
base/prefix for all classes.

You have to create an instance for every scrolling element:

	new Scrolling(document.querySelector('[data-scrolling]'));

	// or for multiple elements

	for (const container of document.querySelectorAll('[data-scrolling]')) {
		new Scrolling(container);
	}

DOM has to be ready for initialization, because the size of the elements is
required to be known.

If scroll content changes, trigger the update event on the container element,
or if you are holding a reference to the instance, call the update method on it.
