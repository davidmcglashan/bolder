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

		drawloop.boulderTime += delta
		if ( drawloop.boulderTime > 100 ) {
			map.moveUnsupportedBoulders()
			drawloop.boulderTime -= 100
		}
		
		window.requestAnimationFrame( drawloop.loop );
	},
};