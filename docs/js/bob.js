const bob = {
	// Bob's current position
	x: 0,
	y: 0,

	// Where bob started. He goes back here when he dies.
	startX: 0,
	startY: 0,

	// This determine bob's movements. The latch is triggered by keypresses and records his direction (or none).
	// Delta is how far he has to go and is decreased by the drawloop. Deathclock counts down when bob dies.
	latch: {
		1: false,
		2: false,
		3: false,
		4: false,
		next: bolder.dirs.NONE
	},

	delta: 0,
	deathClock: 0,

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
		bob.dx = 0
		bob.dy = 0
		bob.facing = 'l'
		bob.animLoop = 1
		map.loc.setToEmpty( bob )
		
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
			if ( event.repeat || bob.deathClock > 0 || drawloop.paused || drawloop.completeTime > 0 ) { 
				return
			}

			const keyName = event.key;
			if ( keyName === 'z'  ) { bob.setLatch( bolder.dirs.LEFT ) }
			if ( keyName === 'x' ) { bob.setLatch( bolder.dirs.RIGHT ) }
			if ( keyName === 'k'  ) { bob.setLatch( bolder.dirs.UP ) }
			if ( keyName === 'm' ) { bob.setLatch( bolder.dirs.DOWN ) }
		} )

		// key up results in an un-latching.
		document.addEventListener("keyup", (event) => {
			// Prevent repeated keypresses. Fire exactly once when the key is released.
			if ( event.repeat || bob.deathClock > 0 || drawloop.paused ) { 
				return
			}			

			// Only unlatch if the key being released matches bob's current direction. This ensures
			// bob doesn't 'stick' if the user briefly holds two keys simultaneously.
			const keyName = event.key;
			if ( keyName === 'z'  ) { bob.setLatch( bolder.dirs.LEFT, false ) }
			if ( keyName === 'x' ) { bob.setLatch( bolder.dirs.RIGHT, false ) }
			if ( keyName === 'k'  ) { bob.setLatch( bolder.dirs.UP, false ) }
			if ( keyName === 'm' ) { bob.setLatch( bolder.dirs.DOWN, false ) }
		} )
	},

	/**
	 * Records the direction of travel the user has requested. When bob is next
	 * deciding where to move he'll try and head in that direction. If bob isn't 
	 * currently moving this happens immediately.
	 */
	setLatch: ( dir, set = true ) => {
		bob.latch[dir] = set
		
		// Count the latches being held down
		let latches = bob.latch[bolder.dirs.LEFT] 
					+ bob.latch[bolder.dirs.RIGHT] 
					+ bob.latch[bolder.dirs.UP] 
					+ bob.latch[bolder.dirs.DOWN]
		
		// If nothing is latched then bob will stop.
		if ( latches === 0 ) {
			bob.latch.next = bolder.dirs.NONE
		} 

		// If one latch is down then bob will move in that direction
		else if ( latches === 1 ) {
			if ( bob.latch[bolder.dirs.LEFT] ) { bob.latch.next = bolder.dirs.LEFT }
			if ( bob.latch[bolder.dirs.RIGHT] ) { bob.latch.next = bolder.dirs.RIGHT }
			if ( bob.latch[bolder.dirs.UP] ) { bob.latch.next = bolder.dirs.UP }
			if ( bob.latch[bolder.dirs.DOWN] ) { bob.latch.next = bolder.dirs.DOWN }
		} 

		// If more than one latch is down then bob will move in the direction passed in 
		// to this function as long as set is true
		else if ( latches > 1 && set ) {
			bob.latch.next = dir
		} 

		// If bob has no delta he can move immediately
		if ( set && bob.delta <= 0 ) {
			bob.startToMove()
		}
	},

	/**
	 * Bob has decided to move, so send him on his way. This might be called
	 * from the animation loop when bob finishes a previous movement.
	 */
	startToMove: () => {
		switch ( bob.latch.next ) {
			case bolder.dirs.LEFT:
				bob.left()
				break
			case bolder.dirs.RIGHT:
				bob.right()
				break
			case bolder.dirs.UP:
				bob.up()
				break
			case bolder.dirs.DOWN:
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
		let next = map.dgrid[bob.y-1][bob.x].type
		if ( bob.isBlockedBy( next ) || bob.canPush( next ) ) {
			return
		}
		bob.dx = 0
		bob.dy = -1
		bob.delta = 64
		bob.y -= 1
		map.loc.setToEmpty( bob, true )
	},

	/**
	 * Move bob left, if bob will move left. This can result in a boulder being pushed.
	 */
	left: () => {
		let next = map.dgrid[bob.y][bob.x-1].type
		if ( bob.isBlockedBy( next ) ) {
			return
		}

		// Pushing a boulder depends on what's after
		if ( bob.canPush( next ) ) {
			let after = map.dgrid[bob.y][bob.x-2].type
			if ( after === map.gridtype.EMPTY ) {
				map.pushable.moveLeft( map.pushables[ (bob.x-1) + '_' + bob.y] )
			} else {
				return
			}
		}

		bob.dx = -1
		bob.dy = 0
		bob.delta = 64
		bob.x -= 1
		bob.facing = 'l'
		bob.animLoop = 15
		map.loc.setToEmpty( bob, true )
	},

	/**
	 * Move bob right, if bob will move right. This can result in a boulder being pushed.
	 */
	right: () => {
		// Can't walk through walls.
		let next = map.dgrid[bob.y][bob.x+1].type
		if ( bob.isBlockedBy( next ) ) {
			return
		}

		// Pushing a boulder depends on what's after
		if ( bob.canPush( next ) ) {
			let after = map.dgrid[bob.y][bob.x+2].type
			if ( after === map.gridtype.EMPTY ) {
				let pushable = map.pushables[ (bob.x+1) + '_' + bob.y]
				map.pushable.moveRight( map.pushables[ (bob.x+1) + '_' + bob.y] )
			} else {
				return
			}
		}

		bob.dx = 1
		bob.dy = 0
		bob.delta = 64
		bob.x += 1
		bob.facing = 'r'
		bob.animLoop = 15
		map.loc.setToEmpty( bob, true )
	},

	/**
	 * Move bob left, if bob will move down.
	 */
	down: () => {
		let next = map.dgrid[bob.y+1][bob.x].type
		if ( bob.isBlockedBy( next ) || bob.canPush( next ) ) {
			return
		}
		bob.dx = 0
		bob.dy = 1
		bob.delta = 64
		bob.y += 1
		map.loc.setToEmpty( bob, true )
	},

	/**
	 * These block types stop bob.
	 */
	isBlockedBy: ( type ) => {
		return type === map.gridtype.WALL 
			|| type === map.gridtype.SAFE
			|| type === map.gridtype.CAGE
	},

	/**
	 * These block types can be pushed by bob, but only left and right.
	 */
	canPush: ( type ) => {
		return type === map.gridtype.EGG 
			|| type === map.gridtype.BOULDER
	},

	/**
	 * Kills bob
	 */
	killBob: ( flash = false ) => {
		// Can't kill bob if he's already dead!
		if ( bob.deathClock > 0 ) { 
			return
		}
		bob.deathClock = 500
		bob.flash = flash

		// Hide bob and reset all of his state.
		if ( !flash ) {
			bob.elem.style.display = 'none'
		}
		
		bob.x = bob.startX
		bob.y = bob.startY
		bob.oldX = bob.startX
		bob.oldY = bob.startY
		bob.delta = 0

		bob.latch.next = bolder.dirs.NONE
		bob.latch[bolder.dirs.LEFT] = false
		bob.latch[bolder.dirs.RIGHT] = false
		bob.latch[bolder.dirs.UP] = false
		bob.latch[bolder.dirs.DOWN] = false

		// 100 points off for dying!
		bolder.addToScore( -100 )
		sound.killBob()
	},

	/**
	 * Adjust the viewport to centre on bob.
	 */
	centreDisplay: () => {
		bob.viewport.scrollLeft = (bob.x * 64) - bob.offsetX - (bob.delta*bob.dx)
		bob.viewport.scrollTop = (bob.y * 64) - bob.offsetY - (bob.delta*bob.dy)
		bob.elem.style.left = (bob.x*64 - (bob.delta*bob.dx)) + 'px'
		bob.elem.style.top = (bob.y*64 - (bob.delta*bob.dy)) + 'px'
	}
};