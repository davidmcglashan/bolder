const bob = {
	x: 0,
	y: 0,
	moveLatch: 0,
	delta: 0,
	elem: null,
	viewport: null,

	init: () => {
		// Get bob in the right place.
		map.emptyLoc( bob )
		
		bob.elem = document.getElementById( '-bob' )
		bob.moveBob()
		
		// Given bob's x & y, move the viewport to show him.
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

		// Any key up results in an un-latching.
		document.addEventListener("keyup", (event) => {
			// Prevent repeated keypresses. Fire exactly once when the key is released.
			if ( event.repeat ) { 
				return
			}			

			const keyName = event.key;
			if ( keyName === 'z' && bob.moveLatch === 'left' ) { bob.latch() }
			if ( keyName === 'x' && bob.moveLatch === 'right' ) { bob.latch() }
			if ( keyName === 'k' && bob.moveLatch === 'up' ) { bob.latch() }
			if ( keyName === 'm' && bob.moveLatch === 'down') { bob.latch() }
		} )
	},

	latch: ( dir ) => {
		if ( !dir ) {
			bob.moveLatch = 0
			return
		}

		bob.moveLatch = dir

		// If bob has no delta he can move immediately
		if ( bob.delta <= 0 ) {
			bob.startToMove()
		}
	},

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
	 * Move bob up, if bob will move up.
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
	 * Move bob up, if bob will move up.
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
	 * Move bob up, if bob will move up.
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

	moveBob: () => {
		// Move bob's sprite
		bob.elem.style.left = bob.x*64 + 'px'
		bob.elem.style.top = bob.y*64 + 'px'
		if ( bob.viewport ) {
			bob.viewport.scrollLeft = (bob.x * 64) - bob.offsetX
			bob.viewport.scrollTop = (bob.y * 64) - bob.offsetY
		}
	},
};