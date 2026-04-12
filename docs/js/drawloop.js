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
		
		// Move any spirits along.
		map.spirits.forEach( (spirit) => {
			if ( spirit.delta > 0 ) {
				spirit.delta -= delta/4
				if ( spirit.delta < 0 ) {
					spirit.delta = 0
					map.routeSpirit( spirit )
				}
				spirit.elem.style.left = (spirit.x*64 - ((spirit.delta)*spirit.dx)) + 'px'
				spirit.elem.style.top = (spirit.y*64 - ((spirit.delta)*spirit.dy)) + 'px'
			}
		} )

		// If bob is dead, leave him that way for a short time.
		if ( bob.deathClock > 0 ) {
			bob.deathClock -= delta/4
			// Bob is now risen again. Move back to show him.
			if ( bob.deathClock <= 0 ) {
				map.emptyLoc( bob )

				bob.viewport.scrollLeft = (bob.x * 64) - bob.offsetX - (bob.delta*bob.dx)
				bob.viewport.scrollTop = (bob.y * 64) - bob.offsetY - (bob.delta*bob.dy)
				bob.elem.style.left = (bob.x*64 - (bob.delta*bob.dx)) + 'px'
				bob.elem.style.top = (bob.y*64 - (bob.delta*bob.dy)) + 'px'
				bob.elem.style.display = 'block'
			}
		}

		// Move bob if he has a delta
		if ( bob.delta > 0 ) {
			bob.delta -= delta/4
			if ( bob.delta < 0 ) {
				bob.delta = 0
			}
			
			// When bob gets a bit of the way through a move, tidy the map up.
			if ( bob.delta < 32 ) {
				bob.finishMove()
			}

			// If bob reaches the end of a move he can start the next one.
			if ( bob.delta <= 0 ) {
				bob.startToMove()
			}

			// Move the display to keep bob centred.
			bob.viewport.scrollLeft = (bob.x * 64) - bob.offsetX - (bob.delta*bob.dx)
			bob.viewport.scrollTop = (bob.y * 64) - bob.offsetY - (bob.delta*bob.dy)
			bob.elem.style.left = (bob.x*64 - (bob.delta*bob.dx)) + 'px'
			bob.elem.style.top = (bob.y*64 - (bob.delta*bob.dy)) + 'px'
		}

		window.requestAnimationFrame( drawloop.loop );
	},
};