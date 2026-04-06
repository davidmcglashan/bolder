const drawloop = {
	previousTime: 0,

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

		// Perform the drawing operation. Schedule more drawing if there are active people.
		if ( drawloop.drawPeople( delta ) > 0 ) {
			window.requestAnimationFrame( drawloop.loop );
		}
	},

	/**
	 * Drawing loop for map entities. Returns the number of active entities.
	 */
	drawPeople: ( delta ) => {
		let entities = map.getAllEntities()

		entities.forEach(
			([loc, entity]) => {
				// If there's time on the clock move the sprite around by delta.
				if ( entity.timer > 0 ) {
					let div = document.getElementById( entity.id )
					entity.top = entity.top - entity.deltaY*delta
					entity.left = entity.left - entity.deltaX*delta
					div.style.top = entity.top + 'px'
					div.style.left = entity.left + 'px'
					entity.timer = entity.timer - delta
				}
			});

		return entities.length
	},
};