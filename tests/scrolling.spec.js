describe('Scrolling', function() {

	var testElement,
		testTemplate,
		testContent,
		container,
		scrolling;

	beforeEach(function() {
		testElement = document.id('test');
		testTemplate = document.id('test-template').get('html');
		testElement.innerHTML = testTemplate;
		container = testElement.getElement('.scrolling');
		testContent = container.getElement('.test-content');
	});

	afterEach(function() {
		scrolling = null;
		testElement.empty();
	});

	describe('getScrollAxes', function() {

		it('should return x and y (auto detection)', function() {
			testContent.addClass('large');
			scrolling = new Scrolling(container);
			expect(scrolling.getScrollAxes()).toEqual(['x', 'y']);
		});

		it('should return x (auto detection)', function() {
			testContent.addClass('horizontal');
			scrolling = new Scrolling(container);
			expect(scrolling.getScrollAxes()).toEqual(['x']);
		});

		it('should return y (auto detection)', function() {
			scrolling = new Scrolling(container);
			expect(scrolling.getScrollAxes()).toEqual(['y']);
		});

		it('should return y (horizontal hidden)', function() {
			testContent.addClass('large');
			scrolling = new Scrolling(container, {
				horizontal: 'hidden'
			});
			expect(scrolling.getScrollAxes()).toEqual(['y']);
		});

		it('should return x (vertical hidden)', function() {
			testContent.addClass('large');
			scrolling = new Scrolling(container, {
				vertical: 'hidden'
			});
			expect(scrolling.getScrollAxes()).toEqual(['x']);
		});

	});

});
