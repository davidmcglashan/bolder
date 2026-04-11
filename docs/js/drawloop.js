const drawloop = {
	previousTime: 0,
	boulderTime: 0,

	/**
	 * Start the drawloop.
	 */
	start: () => {
		window.requestAnimationFrame( drawloop.recordStartTime );
	},

	/**
	 * Intermediate starting step. This records a previousTime before scheduling a further drawloop. 
	 * This daisychaining prevents massive deltas finding their way into loop() if it has been paused
	 * for a short while.
	 */
	recordStartTime: ( time ) => {
		drawloop.previousTime = time
		window.requestAnimationFrame( drawloop.loop );
	},

	/**
	 * Main game loop. Does animation stuff, mostly. State stuff is
	 * done in the tick loop according to numbers.
	 */ 
	loop: ( time ) => {
		// Calculate the delta since the last frame.
		delta = time - drawloop.previousTime;
		drawloop.previousTime = time;

		// Check all the boulders and drop the unsupported ones.
		drawloop.boulderTime += delta
		if ( drawloop.boulderTime > 75 ) {
			map.moveUnsupportedBoulders()
			drawloop.boulderTime -= 75
		}
		
		// Move bob if he has a delta
		if ( bob.delta > 0 ) {
			bob.delta -= delta/4
			if ( bob.delta <= 0 ) {
				bob.startToMove()
			}

			bob.viewport.scrollLeft = (bob.x * 64) - bob.offsetX - (bob.delta*bob.dx)
			bob.viewport.scrollTop = (bob.y * 64) - bob.offsetY - (bob.delta*bob.dy)

			bob.elem.style.left = (bob.x*64 - (bob.delta*bob.dx)) + 'px'
			bob.elem.style.top = (bob.y*64 - (bob.delta*bob.dy)) + 'px'
		}

		window.requestAnimationFrame( drawloop.loop );
	},
};