const bob = {
	// Bob's current position
	x: 0,
	y: 0,

	// Where bob started. He goes back here when he dies.
	startX: 0,
	startY: 0,

	// This determine bob's movements. The latch is triggered by keypresses and records his direction (or none).
	// Delta is how far he has to go and is decreased by the drawloop.
	moveLatch: 0,
	delta: 0,

	// DOM elements for bob's display. Elem is his main sprite and viewport is the parent element showing the map.
	elem: null,
	viewport: null,

	/**
	 * Initialise bob so that he's ready to go and dig!
	 */
	init: () => {
		// Get bob in the right place.
		bob.startX = bob.x
		bob.startY = bob.y
		bob.oldX = bob.x
		bob.oldY = bob.y
		map.emptyLoc( bob )
		
		// Move bob's sprite to its proper location.
		bob.elem = document.getElementById( '-bob' )
		bob.elem.style.left = bob.x*64 + 'px'
		bob.elem.style.top = bob.y*64 + 'px'
		
		// Given bob's x & y, move the viewport to show him. After this the drawloop will take care of him.
		bob.viewport = document.getElementById( '-viewport' )
		bob.offsetX = bob.viewport.getBoundingClientRect().width/2
		bob.offsetY = bob.viewport.getBoundingClientRect().height/2
		bob.viewport.scrollLeft = (bob.x * 64) - bob.offsetX
		bob.viewport.scrollTop = (bob.y * 64) - bob.offsetY
		
		// Key downs fire movement events in the game.
		document.addEventListener("keydown", (event) => {
			// Prevent repeated keypresses. Fire exactly once when the key is pressed.
			if ( event.repeat ) { 
				return
			}

			const keyName = event.key;
			if ( keyName === 'z'  ) { bob.latch( 'left' ) }
			if ( keyName === 'x' ) { bob.latch( 'right' ) }
			if ( keyName === 'k'  ) { bob.latch( 'up' ) }
			if ( keyName === 'm' ) { bob.latch( 'down' ) }
		} )

		// key up results in an un-latching.
		document.addEventListener("keyup", (event) => {
			// Prevent repeated keypresses. Fire exactly once when the key is released.
			if ( event.repeat ) { 
				return
			}			

			// Only unlatch if the key being released matches bob's current direction. This ensures
			// bob doesn't 'stick' if the user briefly holds two keys simultaneously.
			const keyName = event.key;
			if ( keyName === 'z' && bob.moveLatch === 'left' ) { bob.latch() }
			if ( keyName === 'x' && bob.moveLatch === 'right' ) { bob.latch() }
			if ( keyName === 'k' && bob.moveLatch === 'up' ) { bob.latch() }
			if ( keyName === 'm' && bob.moveLatch === 'down') { bob.latch() }
		} )
	},

	/**
	 * Records the direction of travel the user has requested. When bob is next
	 * deciding where to move he'll try and head in that direction. If bob isn't 
	 * currently moving this happens immediately.
	 */
	latch: ( dir ) => {
		// If this was a release latch event we forget the next direction.
		if ( !dir ) {
			bob.moveLatch = 0
			return
		}

		// Record the move latch. When bob's delta reaches zero this will move him in that direction.
		bob.moveLatch = dir

		// If bob has no delta he can move immediately
		if ( bob.delta <= 0 ) {
			bob.startToMove()
		}
	},

	/**
	 * Bob has decided to move, so send him on his way. This might be called
	 * from the animation loop when bob finishes a previous movement.
	 */
	startToMove: () => {
		switch ( bob.moveLatch ) {
			case 'left':
				bob.left()
				break
			case 'right':
				bob.right()
				break
			case 'up':
				bob.up()
				break
			case 'down':
				bob.down()
				break
		}
	},

	/**
	 * Bob finished moving somewhere so his old x,y is now his new x,y!
	 */
	finishMove: () => {
		bob.oldX = bob.x
		bob.oldY = bob.y
	},

	/**
	 * Move bob up, if bob will move up.
	 */
	up: () => {
		let next = map.grid[bob.y-1][bob.x].type
		if ( next === map.gridtype.WALL || next === map.gridtype.BOULDER ) {
			return
		}
		bob.dx = 0
		bob.dy = -1
		bob.delta = 64
		bob.y -= 1
		map.emptyLoc( bob, true )
	},

	/**
	 * Move bob left, if bob will move left. This can result in a boulder being pushed.
	 */
	left: () => {
		let next = map.grid[bob.y][bob.x-1].type
		if ( next === map.gridtype.WALL ) {
			return
		}

		// Pushing a boulder depends on what's after
		if ( next === map.gridtype.BOULDER ) {
			let after = map.grid[bob.y][bob.x-2].type
			if ( after === map.gridtype.EMPTY ) {
				map.moveBoulderLeft({y:bob.y,x:bob.x-1})
			} else {
				return
			}
		}

		bob.dx = -1
		bob.dy = 0
		bob.delta = 64
		bob.x -= 1
		map.emptyLoc( bob, true )
	},

	/**
	 * Move bob right, if bob will move right. This can result in a boulder being pushed.
	 */
	right: () => {
		// Can't walk through walls.
		let next = map.grid[bob.y][bob.x+1].type
		if ( next === map.gridtype.WALL ) {
			return
		}

		// Pushing a boulder depends on what's after
		if ( next === map.gridtype.BOULDER ) {
			let after = map.grid[bob.y][bob.x+2].type
			if ( after === map.gridtype.EMPTY ) {
				map.moveBoulderRight({y:bob.y,x:bob.x+1})
			} else {
				return
			}
		}

		bob.dx = 1
		bob.dy = 0
		bob.delta = 64
		bob.x += 1
		map.emptyLoc( bob, true )
	},

	/**
	 * Move bob left, if bob will move down.
	 */
	down: () => {
		let next = map.grid[bob.y+1][bob.x].type
		if ( next === map.gridtype.WALL || next === map.gridtype.BOULDER ) {
			return
		}
		bob.dx = 0
		bob.dy = 1
		bob.delta = 64
		bob.y += 1
		map.emptyLoc( bob, true )
	},
};