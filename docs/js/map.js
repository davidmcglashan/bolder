const map = {
	diamonds: 0,
	boulders: {},

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
		map.parseMap( levels.maps[ln] )
	},
	
	buildMapFromSeed: ( payload ) => {
		random.SEED = parseInt( payload.seed )

		// Initialise the map and set its dimensions.
		let width = random.get( payload.minWidth, payload.maxWidth )
		let height = random.get( payload.minHeight, payload.maxHeight )
		
		// Fill the map with walls
		for ( let y = 0; y < height; y++ ) {
			map.grid[y] = []
			for ( let x = 0; x < width; x++ ) {
				map.grid[y][x] = map.gridtype.WALL
			}
		}

		// There are up to four cutaways in eight "compass" locations, only if the level is larger than 10x10
		// - generate cutaway number between 2..4
		// - choose a 0..7 location for it
		// - derive x,y,w,h based on loc and rng
		if ( width > 10 && height > 10 ) {
			for ( let cw=0; cw < random.get( payload.minCutaways, payload.maxCutaways ); cw += 1 ) {
				let loc = random.get(0,7)
				let x,y,w,h,z

				switch ( loc ) {
					case 0:
						x = 0
						y = 0
						w = random.get(2,width/3)
						h = random.get(2,height/3)
						break
					case 1:
						z = random.get(1,width/4)
						w = random.get(2,width/3)
						x = parseInt(width/2 - z)
						y = 0
						h = random.get(2,height/3)
						break
					case 2:
						w = random.get(2,width/3)
						x = width-w
						y = 0
						h = random.get(2,height/3)
						break
					case 3:
						z = random.get(1,width/4)
						y = parseInt(height/2 - z)
						h = random.get(2,height/3)
						x = 0
						w = random.get(2,width/3)
						break
					case 4:
						z = random.get(1,width/4)
						y = parseInt(height/2 - z)
						h = random.get(2,height/3)
						w = random.get(2,width/3)
						x = width-w
						break
					case 5:
						h = random.get(2,height/3)
						y = height-h
						x = 0
						w = random.get(2,width/3)
						break
					case 6:
						z = random.get(1,width/4)
						w = random.get(2,width/3)
						x = parseInt(width/2 - z)
						h = random.get(2,height/3)
						y = height-h
						break
					case 7:
						w = random.get(2,width/3)
						x = width-w
						h = random.get(2,height/3)
						y = height-h
						break
				}

				// Fill the map with zeroes where this cutaway is
				for ( let yy=y; yy<y+h; yy++ ) {
					for ( let xx=x; xx<x+w; xx++ ) {
						map.grid[yy][xx] = 0
					}
				}
			}
		}

		// All the world is walls, so fill the interior with interesting things.
		for ( let y=1; y<height-1; y++ ) {
			for ( let x=1; x<width-1; x++ ) {
				// Is this a cell we can change?
				if ( map.grid[y][x] === map.gridtype.WALL ) {
					// Don't change if any neighbouring cell is a zero
					if ( 
						map.grid[y-1][x-1] === 0
						|| map.grid[y-1][x] === 0
						|| map.grid[y-1][x+1] === 0
						|| map.grid[y][x-1] === 0
						|| map.grid[y][x+1] === 0
						|| map.grid[y+1][x-1] === 0
						|| map.grid[y+1][x] === 0
						|| map.grid[y+1][x+1] === 0
					) { continue }

					map.grid[y][x] = map.gridtype.EARTH

					// 20% chance of becoming a diamond
					if ( random.diceRoll( { oneIn: payload.diamondChance, attempts:1 } ) ) {
						map.grid[y][x] = map.gridtype.DIAMOND
					} 
					
					// 25% chance of becoming a rock
					if ( random.diceRoll( { oneIn:payload.boulderChance, attempts:1 } ) ) {
						map.grid[y][x] = map.gridtype.BOULDER
					} 
					
					// 10% chance of becoming a hole
					if ( map.grid[y-1][x] !== map.gridtype.BOULDER && random.diceRoll( { oneIn:payload.holeChance, attempts:1 } ) ) {
						map.grid[y][x] = map.gridtype.EMPTY
					} 
					
					// 10% chance of becoming a wall again
					if ( random.diceRoll( { oneIn:payload.wallChance, attempts:1 } ) ) {
						map.grid[y][x] = map.gridtype.WALL
					} 
				}
			}
		}
		
		// Draw some arbitrary straight walls.
		for ( let z=0; z<random.get( payload.extraWallMin, payload.extraWallMax); z+=1 ) {
			// random x, y, dir, length
			let x = random.get(1,width-1)
			let y = random.get(1,height-1)
			let dir = random.get(0,3)
			let len = random.get(20,40)

			for ( let i=0; i<len; i+=1 ) {
				// Add a new wall as long as it's within bounds.
				if ( x>0 && x<width && y>0 && y<height && map.grid[y][x] !== 0 && !random.diceRoll( { oneIn:payload.extraWallHoles, attempts:1 } )) {
					map.grid[y][x] = map.gridtype.WALL
				}
						
				switch ( dir ) {
					case 0: 
						x+=1
						break
					case 1: 
						y-=1
						break
					case 2: 
						x-=1
						break
					case 3: 
						y+=1
						break
				}

				// 10% chance of a direction change
				if ( random.diceRoll( { oneIn: payload.extraWallDirChange, attempts:1 } ) ) {
					dir = random.get(0,3)
				}
			}
		}

		// find a place for bob in the top 20% of the level for 100 tries, then everywhere ...
		let bc = 0
		while ( bob.x === 0 && bob.y === 0 ) {
			let x = random.get(1,width-1)
			let y = random.get(1,parseInt( ( bc < 100 ? height/5 : height-1 ) ) )

			if ( map.grid[y][x] === map.gridtype.EARTH || map.grid[y][x] === map.gridtype.EMPTY ) {
				bob.x = x
				bob.y = y
				map.grid[y][x] = map.gridtype.EMPTY
			}

			// If we fail to place bob in 200 goes we put him in the middle.
			bc += 1
			if ( bc === 200 ) {
				bob.x = x
				bob.y = y
			}
		}

		// Turn the map grid into a proper model with DOM elements
		let canvas = document.getElementById( "-canvas" )
		let c = 0

		for ( let y=0; y<height; y++ ) {
			for ( let x=0; x<=width; x++ ) {
				if ( map.grid[y][x] !== 0 ) {
					let elem = document.createElement( 'div' )
					elem.style.left = x*64 + 'px'
					elem.style.top = y*64 + 'px'
					elem.setAttribute( 'id', 'entity'+c )
					canvas.appendChild( elem )
					
					switch ( map.grid[y][x] ) {
						case map.gridtype.EMPTY:
							elem.setAttribute( 'class', 'entity' )
							map.grid[y][x] = { type: map.gridtype.EMPTY, id:'entity'+c, elem:elem }
							break
						case map.gridtype.WALL:
							elem.setAttribute( 'class', 'wall entity' )
							map.grid[y][x] = { type: map.gridtype.WALL, id:'entity'+c, elem:elem }
							break
						case map.gridtype.EARTH:
							elem.setAttribute( 'class', 'earth entity' )
							map.grid[y][x] = { type: map.gridtype.EARTH, id:'entity'+c, elem:elem }
							break
						case map.gridtype.DIAMOND:
							elem.setAttribute( 'class', 'diamond entity' )
							map.grid[y][x] = { type: map.gridtype.DIAMOND, id:'entity'+c, elem:elem }
							map.diamonds += 1
							break
						case map.gridtype.BOULDER:
							elem.setAttribute( 'class', 'boulder entity' )
							map.grid[y][x] = { type: map.gridtype.BOULDER, id:'entity'+c, elem:elem }
							map.boulders[x+'_'+y] = {x:x, y:y} 
							break
					}
					c += 1
				}
			}
		}
	},

	parseMap( mapObj ) {
		map.entities = []

		let c = 0
		let canvas = document.getElementById( "-canvas" )

		for ( let y = 0; y < mapObj.height; y++ ) {
			map.grid[y] = []

			for ( let x = 0; x < mapObj.height; x++ ) {
				let elem = document.createElement( 'div' )
				elem.style.left = x*64 + 'px'
				elem.style.top = y*64 + 'px'
				elem.setAttribute( 'id', 'entity'+c )
				canvas.appendChild( elem )

				let loc = { type: mapObj.map[c], id:'entity'+c, elem:elem }
				map.grid[y][x] = loc

				switch( mapObj.map[c] ) {
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
						bob.x = x
						bob.y = y
						break
				}
				c=c+1
			}
		}
		map.moveBob()
	},

	/**
	 * Empties a square on the map at the given loc. Send scoring = true to add to bob's score.
	 */
	emptyLoc: ( loc, scoring = false ) => {
		let entity = map.grid[loc.y][loc.x]

		if ( scoring ) {
			switch ( entity.type ) {
				case map.gridtype.EARTH:
					bolder.addToScore( 10 )
					break
				case map.gridtype.DIAMOND:
					bolder.addToScore( 50 )
					break
			}
		}
		entity.elem.setAttribute( 'class', 'entity' )
		entity.type = map.gridtype.EMPTY
		
		// Get rid of the boulder that was here
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
		bolder.addToScore( 1 )
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
		if ( x === bob.x && y === bob.y ) {
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