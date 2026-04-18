const drawloop = {
	previousTime: 0,
	boulderTime: 0,
	paused: false,

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
		window.requestAnimationFrame( drawloop.loop )
	},

	/**
	 * Toggles the pause state of the game.
	 */
	pause: () => {
		drawloop.paused = !drawloop.paused
		if ( !drawloop.paused ) {
			drawloop.start()
		}
	},

	/**
	 * Main game loop. Does animation stuff, mostly. State stuff is
	 * done in the tick loop according to numbers.
	 */ 
	loop: ( time ) => {
		// Abort if the game has been paused.
		if ( drawloop.paused ) {
			return
		}

		// Calculate the delta since the last frame.
		delta = time - drawloop.previousTime;
		drawloop.previousTime = time;

		// Check all the boulders and drop the unsupported ones.
		drawloop.boulderTime += delta
		if ( drawloop.boulderTime > 75 ) {
			map.pushable.tick()
			drawloop.boulderTime -= 75
		}
		
		// Move any spirits along.
		map.spirits.forEach( (spirit) => {
			if ( spirit.delta > 0 ) {
				spirit.delta -= delta/4
				spirit.checkDelta -= delta/4

				// If the check delta has run out then we can perform a collision detection.
				if ( spirit.checkDelta <= 0 ) {
					spirit.checkDelta = 16
					map.spirit.checkCollision( spirit )
				}

				// If the delta has run out then it's time for a new one
				if ( spirit.delta <= 0 ) {
					spirit.delta = 0
					map.spirit.route( spirit )
				}

				spirit.elem.style.left = (spirit.x*64 - ((spirit.delta)*spirit.dx)) + 'px'
				spirit.elem.style.top = (spirit.y*64 - ((spirit.delta)*spirit.dy)) + 'px'
			}
		} )
		
		// Move any monsters along.
		map.monsters.forEach( (monster) => {
			if ( monster.delta > 0 ) {
				monster.delta -= delta/4
				monster.checkDelta -= delta/4

				// If the check delta has run out then we can perform a collision detection.
				if ( monster.checkDelta <= 0 ) {
					monster.checkDelta = 16
					//map.monster.checkCollision( monster )
				}

				// If the delta has run out then it's time for a new one
				if ( monster.delta <= 0 ) {
					monster.delta = 0
					map.monster.route( monster )
				}

				monster.elem.style.left = (monster.x*64 - ((monster.delta)*monster.dx)) + 'px'
				monster.elem.style.top = (monster.y*64 - ((monster.delta)*monster.dy)) + 'px'
			}
		} )

		// If bob is dead, leave him that way for a short time.
		if ( bob.deathClock > 0 ) {
			bob.deathClock -= delta/4
			// Bob is now risen again. Move back to show him.
			if ( bob.deathClock <= 0 ) {
				map.loc.setToEmpty( bob )

				bob.viewport.scrollLeft = (bob.x * 64) - bob.offsetX - (bob.delta*bob.dx)
				bob.viewport.scrollTop = (bob.y * 64) - bob.offsetY - (bob.delta*bob.dy)
				bob.elem.style.left = (bob.x*64 - (bob.delta*bob.dx)) + 'px'
				bob.elem.style.top = (bob.y*64 - (bob.delta*bob.dy)) + 'px'
				bob.elem.style.display = null
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
			bob.centreDisplay()
		}

		window.requestAnimationFrame( drawloop.loop );
	},
};