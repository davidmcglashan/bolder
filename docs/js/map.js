const map = {
	level: 0,
	diamonds: 0,
	boulders: {},
	bob: {},

	grid: [],
	gridtype: {
		EMPTY: ' ',
		WALL: '#',
		EARTH: '.',
		BOULDER: 'O',
		DIAMOND: '^'
	},

	/**
	 * loads the numbered level 
	 */
	loadMap: ( ln ) => {
		map.level = ln
		map.entities = []

		let lobj = levels.maps[ln]
		let c = 0
		let view = document.getElementById( "-viewport" )

		for ( let y = 0; y < lobj.height; y++ ) {
			map.grid[y] = []

			for ( let x = 0; x < lobj.height; x++ ) {
				let elem = document.createElement( 'div' )
				elem.style.left = x*64 + 'px'
				elem.style.top = y*64 + 'px'
				elem.setAttribute( 'id', 'entity'+c )
				view.appendChild( elem )

				let loc = { type: lobj.map[c], id:'entity'+c, elem:elem }
				map.grid[y][x] = loc

				switch( lobj.map[c] ) {
					case map.gridtype.WALL:
						elem.setAttribute( 'class', 'wall entity' )
						break
					case map.gridtype.EARTH:
						elem.setAttribute( 'class', 'earth entity' )
						break
					case map.gridtype.BOULDER:
						elem.setAttribute( 'class', 'boulder entity' )
						map.boulders[x+'_'+y] = {x:x, y:y} 
						break
					case map.gridtype.DIAMOND:
						elem.setAttribute( 'class', 'diamond entity' )
						map.diamonds += 1
						break
					
					// 'x' is Bob, so set him up.
					case 'x':
						loc.type = map.gridtype.EMPTY
						elem.setAttribute( 'class', 'entity' )
						map.bob = { x:x, y:y, id:'bob' }
						break
				}
				c=c+1
			}
		}
		map.moveBob()
	},

	/**
	 * Move bob up, if bob will move up.
	 */
	bobUp: () => {
		let next = map.grid[map.bob.y-1][map.bob.x].type
		if ( next === map.gridtype.WALL || next === map.gridtype.BOULDER ) {
			return
		}
		map.bob.y -= 1
		map.emptyLoc( map.bob )
		map.moveBob()
	},

	/**
	 * Move bob up, if bob will move up.
	 */
	bobLeft: () => {
		let next = map.grid[map.bob.y][map.bob.x-1].type
		if ( next === map.gridtype.WALL ) {
			return
		}

		// Pushing a boulder depends on what's after
		if ( next === map.gridtype.BOULDER ) {
			let after = map.grid[map.bob.y][map.bob.x-2].type
			if ( after === map.gridtype.EMPTY ) {
				map.moveBoulderLeft({y:map.bob.y,x:map.bob.x-1})
			} else {
				return
			}
		}

		map.bob.x -= 1
		map.emptyLoc( map.bob )
		map.moveBob()
	},

	/**
	 * Move bob up, if bob will move up.
	 */
	bobRight: () => {
		// Can't walk through walls.
		let next = map.grid[map.bob.y][map.bob.x+1].type
		if ( next === map.gridtype.WALL ) {
			return
		}

		// Pushing a boulder depends on what's after
		if ( next === map.gridtype.BOULDER ) {
			let after = map.grid[map.bob.y][map.bob.x+2].type
			if ( after === map.gridtype.EMPTY ) {
				map.moveBoulderRight({y:map.bob.y,x:map.bob.x+1})
			} else {
				return
			}
		}

		map.bob.x += 1
		map.emptyLoc( map.bob )
		map.moveBob()
	},

	/**
	 * Move bob up, if bob will move up.
	 */
	bobDown: () => {
		let next = map.grid[map.bob.y+1][map.bob.x].type
		if ( next === map.gridtype.WALL || next === map.gridtype.BOULDER ) {
			return
		}
		map.bob.y += 1
		map.emptyLoc( map.bob )
		map.moveBob()
	},

	moveBob: () => {
		// Move bob's sprite
		let elem = document.getElementById( map.bob.id )
		elem.style.left = map.bob.x*64 + 'px'
		elem.style.top = map.bob.y*64 + 'px'
	},

	emptyLoc: ( loc ) => {
		let entity = map.grid[loc.y][loc.x]
		entity.elem.setAttribute( 'class', 'entity' )
		entity.type = map.gridtype.EMPTY
		delete( map.boulders[loc.x + '_' + loc.y] )
	},

	moveBoulderRight: ( loc ) => {
		map.emptyLoc( loc )
		loc.x += 1
		map.boulderLoc( loc )
	},

	moveBoulderLeft: ( loc ) => {
		map.emptyLoc( loc )
		loc.x -= 1
		map.boulderLoc( loc )
	},

	moveBoulderDown: ( loc ) => {
		map.emptyLoc( loc )
		loc.y += 1
		map.boulderLoc( loc )
	},

	boulderLoc: ( loc ) => {
		let entity = map.grid[loc.y][loc.x]
		entity.elem.setAttribute( 'class', 'entity boulder' )
		entity.type = map.gridtype.BOULDER
		map.boulders[loc.x + '_' + loc.y] = loc
	},

	moveUnsupportedBoulders: () => {
		for ( const[key,boulder] of Object.entries(map.boulders)) {
			if ( map.boulderCanMoveInto( boulder.x, boulder.y+1 ) ) {
				map.moveBoulderDown( boulder )
				continue
			}

			// Boulders are unsupported if they're on a slopey object with space
			// on either side ...
			if ( map.slopesLeft( boulder.x, boulder.y+1 ) ) {
				if ( map.boulderCanMoveInto( boulder.x-1, boulder.y ) && map.boulderCanMoveInto( boulder.x-1, boulder.y+1 ) ) {
					map.moveBoulderLeft( boulder )
					continue
				}
			}
			if ( map.slopesRight( boulder.x, boulder.y+1 ) ) {
				if ( map.boulderCanMoveInto( boulder.x+1, boulder.y ) && map.boulderCanMoveInto( boulder.x+1, boulder.y+1 ) ) {
					map.moveBoulderRight( boulder )
					continue
				}
			}
		}
	},

	boulderCanMoveInto: ( x, y ) => {
		// boulders can't move into bob.
		if ( x === map.bob.x && y === map.bob.y ) {
			return false
		}

		// Boulders can move into empty spaces.
		let type = map.grid[y][x].type
		if ( type === map.gridtype.EMPTY ) {
			return true
		}
		return false
	},

	slopesLeft: ( x, y ) => {
		let type = map.grid[y][x].type
		return type === map.gridtype.BOULDER || type === map.gridtype.DIAMOND
	},

	slopesRight: ( x, y ) => {
		let type = map.grid[y][x].type
		return type === map.gridtype.BOULDER || type === map.gridtype.DIAMOND
	}
}