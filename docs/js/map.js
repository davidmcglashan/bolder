const map = {
	diamonds: 0,
	boulders: {},
	safes: {},
	spirits: [],

	grid: [],
	gridtype: {
		EMPTY: ' ',
		WALL: '#',
		EARTH: '.',
		BOULDER: 'O',
		DIAMOND: '^',
		SAFE: 'S',
		KEY: 'k',
		CAGE: '/',
		SPIRIT: '*'
	},

	dirs: {
		UP: 0,
		RIGHT: 1,
		DOWN: 2,
		LEFT: 3
	},

	/**
	 * loads the numbered level 
	 */
	loadMap: ( ln ) => {
		map.parseMap( levels.maps[ln] )
	},
	
	/**
	 * Generates a map from a seed value - either the random one or the one
	 * contained in the payload object. Payload contains the various world
	 * probabilities.
	 */
	buildMapFromSeed: ( payload ) => {
		random.SEED = parseInt( payload.seed ) | 0

		// Initialise the map and set its dimensions.
		let width = random.get( payload.minWidth, payload.maxWidth )
		let height = random.get( payload.minHeight, payload.maxHeight )
		
		map.boulders['fatal'] = payload.bouldersFatal

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
					// Don't change if any neighbouring cell is a zero. This maintains
					// a 1-wide strip of walls around the world's perimeter.
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

					// Everything in the interior is now earth.
					map.grid[y][x] = map.gridtype.EARTH

					// Randomly change some earths into boulders ...
					if ( random.diceRoll( { oneIn:payload.boulderChance, attempts:1 } ) ) {
						map.grid[y][x] = map.gridtype.BOULDER
					} 
					
					// ... or gaps and holes (but not underneath boulders to minimise starting falls) ...
					if ( map.grid[y-1][x] !== map.gridtype.BOULDER && random.diceRoll( { oneIn:payload.holeChance, attempts:1 } ) ) {
						map.grid[y][x] = map.gridtype.EMPTY
					} 
					
					// ... or back into some kind of wall.
					if ( random.diceRoll( { oneIn:payload.wallChance, attempts:1 } ) ) {
						map.grid[y][x] = map.gridtype.WALL
					} 
				}
			}
		}
		
		// Draw some arbitrary straight walls through the world to try and break it up
		// into rooms or create barriers to progress.
		let safes = 0
		let cages = []
		for ( let z=0; z<random.get( payload.extraWallMin, payload.extraWallMax); z+=1 ) {
			// random x, y, dir, length
			let x = random.get(1,width-1)
			let y = random.get(1,height-1)
			let dir = random.get(0,3)
			let len = random.get(20,40)

			for ( let i=0; i<len; i+=1 ) {
				// Add a new wall block as long as it's within bounds.
				if ( x>0 && x<width-1 && y>0 && y<height-1 && map.grid[y][x] !== 0 ) {
					// Put in a wall or something else?
					if ( random.diceRoll( { oneIn:payload.extraWallHoles, attempts:1 } ) ) {
						if ( random.diceRoll( { oneIn: payload.safeChance, attempts:1 } ) ) {
							map.grid[y][x] = map.gridtype.SAFE
							safes += 1
						} 

						// ... or a cage ... ?
						else if ( random.diceRoll( { oneIn: payload.cageChance, attempts:1 } ) ) {
							map.grid[y][x] = map.gridtype.CAGE
							cages.push( {x:x,y:y} )
						} 
					} else {
						map.grid[y][x] = map.gridtype.WALL
					}
				}
						
				// Move to the next square.
				switch ( dir ) {
					case map.dirs.RIGHT: 
						x+=1
						break
					case map.dirs.UP: 
						y-=1
						break
					case map.dirs.LEFT: 
						x-=1
						break
					case map.dirs.DOWN: 
						y+=1
						break
				}

				// Is there a chance for a direction change.
				if ( random.diceRoll( { oneIn: payload.extraWallDirChange, attempts:1 } ) ) {
					// A 90 degree turn is achieved by adding or subtracting one.
					if ( random.get(0,1) === 0 ) {
						dir = (dir+1) % 4
					} else {
						dir = (dir+4) % 4
					}
				}
			}
		}

		// We have a bunch of walls filled with earth and boulders! Let's put
		// the shiny game elements in. This is done last to prevent other structural
		// elements overwriting them.
		for ( let y=1; y<height-1; y++ ) {
			for ( let x=1; x<width-1; x++ ) {
				// Is this a cell we can change?
				if ( map.grid[y][x] === map.gridtype.EARTH ) {
		
					if ( random.diceRoll( { oneIn: payload.diamondChance, attempts:1 } ) ) {
						map.grid[y][x] = map.gridtype.DIAMOND

						// Turn this diamond into a safe ... ?
						if ( random.diceRoll( { oneIn: payload.safeChance, attempts:1 } ) ) {
							map.grid[y][x] = map.gridtype.SAFE
							safes += 1
						} 

						// ... or a cage ... ?
						else if ( random.diceRoll( { oneIn: payload.cageChance, attempts:1 } ) ) {
							map.grid[y][x] = map.gridtype.CAGE
							cages.push( {x:x,y:y} )
						} 
					} 
				}
			}
		}

		// find a place for bob in the top 20% of the level for 100 tries, then everywhere ...
		let counter = 0
		while ( bob.x === 0 && bob.y === 0 ) {
			let x = random.get(1,width-1)
			let y = random.get(1,( counter < 100 ? height/payload.startFraction : height-1 ) )

			if ( map.grid[y][x] === map.gridtype.EARTH || map.grid[y][x] === map.gridtype.EMPTY ) {
				bob.x = x
				bob.y = y
				map.grid[y][x] = map.gridtype.EMPTY
			}

			// If we fail to place bob in 200 goes we put him in the middle.
			counter += 1
			if ( counter === 200 ) {
				bob.x = x
				bob.y = y
			}
		}

		// if we have safes then we need at least one key
		counter = 0
		if ( safes > 0 ) {
			let keys = random.get( 1,3 )
			while ( keys > 0 ) {
				let x = random.get(1,width-1)
				let y = random.get(1,height-1 )

				// Replace an earth or an empty
				if ( map.grid[y][x] === map.gridtype.EARTH || map.grid[y][x] === map.gridtype.EMPTY ) {
					map.grid[y][x] = map.gridtype.KEY
					keys -= 1
				}

				// Don't loop around this forever - let the level be playable but impossible if a key can't be placed in 100 goes.
				counter += 1
				if ( counter === 100 ) {
					keys = 0
				}
			}
		}

		// If we have cages then we need a corresponding number of spirits. These are placed
		// at earths or empties on the map but don't replace those squares. If we can't place
		// a spirit then the level simply becomes impossible.
		while ( cages.length > 0 ) {
			let cage = cages.pop()
			let canvas = document.getElementById( '-canvas' )
			counter = 0

			// Find a place for a spirit
			while ( counter < 100 ) {
				let x = random.get(1,width-1)
				let y = random.get(1,height-1 )

				if ( map.grid[y][x] === map.gridtype.EARTH || map.grid[y][x] === map.gridtype.EMPTY ) {
					let elem = document.createElement( 'div' )
					elem.setAttribute( 'class', 'spirit' )
					elem.style.left = x*64 + 'px'
					elem.style.top = y*64 + 'px'
					canvas.appendChild( elem )

					map.spirits.push( {
						x: x,
						y: y,
						dx: 0,
						dy: -1,
						dir: map.dirs.UP,
						delta: 64,
						elem: elem
					} )
					break
				}

				counter += 1
			}
		}

		// Turn the map grid into a proper model with DOM elements
		let canvas = document.getElementById( "-canvas" )
		let jsonElem = document.getElementById( "-json" )
		let jsonVal = '{"map":{"width":' + width + ',"height":' + height + ',"map":"'
		let c = 0

		for ( let y=0; y<height; y++ ) {
			for ( let x=0; x<=width; x++ ) {
				if ( map.grid[y][x] !== 0 ) {
					let elem = document.createElement( 'div' )
					elem.style.left = x*64 + 'px'
					elem.style.top = y*64 + 'px'
					canvas.appendChild( elem )
					
					switch ( map.grid[y][x] ) {
						case map.gridtype.EMPTY:
							if ( x === bob.x & y === bob.y ) {
								jsonVal += 'x'
							} else {
								jsonVal += ' '
							}
							elem.setAttribute( 'class', 'entity' )
							map.grid[y][x] = { type: map.gridtype.EMPTY, elem:elem }
							break
						case map.gridtype.WALL:
							jsonVal += '#'
							elem.setAttribute( 'class', 'wall entity' )
							map.grid[y][x] = { type: map.gridtype.WALL, elem:elem }
							break
						case map.gridtype.EARTH:
							jsonVal += '.'
							elem.setAttribute( 'class', 'earth entity' )
							map.grid[y][x] = { type: map.gridtype.EARTH, elem:elem }
							break
						case map.gridtype.DIAMOND:
							jsonVal += '^'
							elem.setAttribute( 'class', 'diamond entity' )
							map.grid[y][x] = { type: map.gridtype.DIAMOND, elem:elem }
							map.diamonds += 1
							break
						case map.gridtype.SAFE:
							jsonVal += 'S'
							elem.setAttribute( 'class', 'safe entity' )
							map.grid[y][x] = { type: map.gridtype.SAFE, elem:elem }
							map.safes[x+'_'+y] = {x:x, y:y} 
							map.diamonds += 1
							break
						case map.gridtype.CAGE:
							jsonVal += '/'
							elem.setAttribute( 'class', 'cage entity' )
							map.grid[y][x] = { type: map.gridtype.CAGE, elem:elem }
							map.diamonds += 1
							break
						case map.gridtype.KEY:
							jsonVal += 'k'
							elem.setAttribute( 'class', 'key entity' )
							map.grid[y][x] = { type: map.gridtype.KEY, elem:elem }
							break
						case map.gridtype.BOULDER:
							jsonVal += 'O'
							elem.setAttribute( 'class', 'boulder entity' )
							map.grid[y][x] = { type: map.gridtype.BOULDER, elem:elem }
							map.boulders[x+'_'+y] = {x:x, y:y} 
							break
					}
					c += 1
				} else {
					jsonVal += '!'
				}
			}
		}

		jsonVal += '"}}'
		jsonElem.innerHTML = jsonVal
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
				canvas.appendChild( elem )

				let loc = { type: mapObj.map[c], elem:elem }
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
						bob.x = x
						bob.y = y
						break
				}
				c=c+1
			}
		}
	},

	/**
	 * Move the spirits around the map.
	 */
	routeSpirit: ( spirit ) => {
		// Nought to do if the spirit has a delta already
		if ( spirit.delta > 0 || spirit.isCaged ) {
			return
		}

		// if the spirit is actually in a cage right now then all we need do is
		// turn it into a diamond!
		let entity = map.grid[spirit.y][spirit.x]
		if ( entity.type === map.gridtype.CAGE ) {
			spirit.isCaged = true
			spirit.elem.style.display = 'none'
			entity.elem.setAttribute( 'class', 'entity diamond' )
			entity.type = map.gridtype.DIAMOND
		}

		spirit.dx = 0
		spirit.dy = 0
		spirit.delta = 64

		switch  ( spirit.dir ) {
			case map.dirs.UP:
				if ( map.transparent.isToLeft( spirit ) ) {
					spirit.dir = map.dirs.LEFT
					spirit.x -= 1
					spirit.dx = -1
				} else if ( map.transparent.isAbove( spirit ) ) {
					spirit.dir = map.dirs.UP
					spirit.y -= 1
					spirit.dy = -1
				} else if ( map.transparent.isToRight( spirit ) ) {
					spirit.dir = map.dirs.RIGHT
					spirit.x += 1
					spirit.dx = 1
				} else if ( map.transparent.isBelow( spirit ) ) {
					spirit.dir = map.dirs.DOWN
					spirit.y += 1
					spirit.dy = 1
				}
				break

			case map.dirs.RIGHT:
				if ( map.transparent.isAbove( spirit ) ) {
					spirit.dir = map.dirs.UP
					spirit.y -= 1
					spirit.dy = -1
				} else if ( map.transparent.isToRight( spirit ) ) {
					spirit.dir = map.dirs.RIGHT
					spirit.x += 1
					spirit.dx = 1
				} else if ( map.transparent.isBelow( spirit ) ) {
					spirit.dir = map.dirs.DOWN
					spirit.y += 1
					spirit.dy = 1
				} else if ( map.transparent.isToLeft( spirit ) ) {
					spirit.dir = map.dirs.LEFT
					spirit.x -= 1
					spirit.dx = -1
				}
				break

			case map.dirs.DOWN:
				if ( map.transparent.isToRight( spirit ) ) {
					spirit.dir = map.dirs.RIGHT
					spirit.x += 1
					spirit.dx = 1
				} else if ( map.transparent.isBelow( spirit ) ) {
					spirit.dir = map.dirs.DOWN
					spirit.y += 1
					spirit.dy = 1
				} else if ( map.transparent.isToLeft( spirit ) ) {
					spirit.dir = map.dirs.LEFT
					spirit.x -= 1
					spirit.dx = -1
				} else if ( map.transparent.isAbove( spirit ) ) {
					spirit.dir = map.dirs.UP
					spirit.y -= 1
					spirit.dy = -1
				} 
				break

			case map.dirs.LEFT:
				if ( map.transparent.isBelow( spirit ) ) {
					spirit.dir = map.dirs.DOWN
					spirit.y += 1
					spirit.dy = 1
				} else if ( map.transparent.isToLeft( spirit ) ) {
					spirit.dir = map.dirs.LEFT
					spirit.x -= 1
					spirit.dx = -1
				} else if ( map.transparent.isAbove( spirit ) ) {
					spirit.dir = map.dirs.UP
					spirit.y -= 1
					spirit.dy = -1
				} else if ( map.transparent.isToRight( spirit ) ) {
					spirit.dir = map.dirs.RIGHT
					spirit.x += 1
					spirit.dx = 1
				}
				break
		}
	},

	/**
	 * Opens all the safes, turning them into diamonds!
	 */
	openSafes: () => {
		for ( const[key,safe] of Object.entries(map.safes)) {
			let entity = map.grid[safe.y][safe.x]
			entity.elem.setAttribute( 'class', 'entity diamond' )
			entity.type = map.gridtype.DIAMOND
		}
		map.safes = {}
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
					bolder.decreaseDiamonds()
					break
				case map.gridtype.KEY:
					map.openSafes()
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

	/**
	 * Move a boulder down one square. This adds 1 to the score, but can kill bob if he's down there.
	 */
	moveBoulderDown: ( loc ) => {
		// Update the models
		map.emptyLoc( loc )
		loc.y += 1
		map.boulderLoc( loc )

		// Update the score
		bolder.addToScore( 1 )

		// Did we hit bob?
		if ( map.boulders['fatal'] && loc.x === bob.x && loc.y+1 === bob.y ) {
			bob.killBob()
		}
	},

	boulderLoc: ( loc ) => {
		let entity = map.grid[loc.y][loc.x]
		entity.elem.setAttribute( 'class', 'entity boulder' )
		entity.type = map.gridtype.BOULDER
		map.boulders[loc.x + '_' + loc.y] = loc
	},

	moveUnsupportedBoulders: () => {
		for ( const[key,boulder] of Object.entries(map.boulders)) {
			if ( key === 'fatal' ) {
				continue
			}

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
		// boulders can't move into where bob is now, assuming he's alive.
		if ( bob.deathClock <= 0 && x === bob.x && y === bob.y ) {
			return false
		}
		// boulders can't move into where bob was previously if he's still moving from there.
		if ( bob.deathClock <= 0 && x === bob.oldX && y === bob.oldY ) {
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
	},

	/**
	 * Utility functions for checking transparency relative to a loc.
	 */
	transparent: {
		is: ( loc ) => {
			let type = map.grid[loc.y][loc.x].type
			return type === map.gridtype.EARTH 
				|| type === map.gridtype.EMPTY
				|| type === map.gridtype.CAGE
		},
		
		isAbove: ( loc ) => {
			return map.transparent.is( { x:loc.x, y:loc.y-1 } )
		},
		
		isBelow: ( loc ) => {
			return map.transparent.is( { x:loc.x, y:loc.y+1 } )
		},
		
		isToLeft: ( loc ) => {
			return map.transparent.is( { x:loc.x-1, y:loc.y } )
		},
		
		isToRight: ( loc ) => {
			return map.transparent.is( { x:loc.x+1, y:loc.y } )
		},
	}
}