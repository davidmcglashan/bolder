const map = {
	diamonds: 0,
	pushables: {},
	safes: {},
	spirits: [],
	monsters: [],

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
		SPIRIT: '*',
		EGG: 'G'
	},

	dirs: {
		UP: 0,
		RIGHT: 1,
		DOWN: 2,
		LEFT: 3,
		NONE: 4
	},
	
	/**
	 * Generates a map from a seed value - either the random one or the one
	 * contained in the payload object. Payload contains the various world
	 * probabilities.
	 */
	buildMapFromSeed: ( payload ) => {
		random.SEED = parseInt( payload.seed ) | 0

		// Initialise the map and set its dimensions.
		map.width = random.get( payload.minWidth, payload.maxWidth )
		map.height = random.get( payload.minHeight, payload.maxHeight )
		
		map.pushable.fatal = payload.bouldersFatal
		map.spiritsFatal = payload.spiritsFatal
		map.monstersSlow = payload.monstersSlow
		map.monstersDirt = payload.monstersDirt

		// Fill the map with walls
		for ( let y = 0; y < map.height; y++ ) {
			map.grid[y] = []
			for ( let x = 0; x < map.width; x++ ) {
				map.grid[y][x] = map.gridtype.WALL
			}
		}

		// There are up to four cutaways in eight "compass" locations, only if the level is larger than 10x10
		// - generate cutaway number between 2..4
		// - choose a 0..7 location for it
		// - derive x,y,w,h based on loc and rng
		if ( map.width > 10 && map.height > 10 ) {
			for ( let cw=0; cw < random.get( payload.minCutaways, payload.maxCutaways ); cw += 1 ) {
				let loc = random.get(0,7)
				let x,y,w,h,z

				switch ( loc ) {
					case 0:
						x = 0
						y = 0
						w = random.get(2,map.width/3)
						h = random.get(2,map.height/3)
						break
					case 1:
						z = random.get(1,map.width/4)
						w = random.get(2,map.width/3)
						x = parseInt(map.width/2 - z)
						y = 0
						h = random.get(2,map.height/3)
						break
					case 2:
						w = random.get(2,map.width/3)
						x = map.width-w
						y = 0
						h = random.get(2,map.height/3)
						break
					case 3:
						z = random.get(1,map.width/4)
						y = parseInt(map.height/2 - z)
						h = random.get(2,map.height/3)
						x = 0
						w = random.get(2,map.width/3)
						break
					case 4:
						z = random.get(1,map.width/4)
						y = parseInt(map.height/2 - z)
						h = random.get(2,map.height/3)
						w = random.get(2,map.width/3)
						x = map.width-w
						break
					case 5:
						h = random.get(2,map.height/3)
						y = map.height-h
						x = 0
						w = random.get(2,map.width/3)
						break
					case 6:
						z = random.get(1,map.width/4)
						w = random.get(2,map.width/3)
						x = parseInt(map.width/2 - z)
						h = random.get(2,map.height/3)
						y = map.height-h
						break
					case 7:
						w = random.get(2,map.width/3)
						x = map.width-w
						h = random.get(2,map.height/3)
						y = map.height-h
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
		for ( let y=1; y<map.height-1; y++ ) {
			for ( let x=1; x<map.width-1; x++ ) {
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
			let x = 0
			let y = 0
			let dir = 0

			// have five attempts to ...
			// - pick a random x,y,dir and draw from there to the edge
			let placed = false
			for ( let a=0; a<5; a++ ) {
				// random x, y, dir, length
				x = random.get(1,map.width-1)
				y = random.get(1,map.height-1)
				dir = random.get(0,3)

				// If we're not in the map, try again.
				if ( map.grid[y][x] !== 0 ) {
					placed = true
					break
				}
			}

			// We didn't place, so forget this wall.
			if ( !placed ) {
				continue
			}

			// Loop while we build the wall.
			while ( placed ) {
				// Put in a wall or something else?
				if ( random.diceRoll( { oneIn:payload.extraWallHoles, attempts:1 } ) ) {
					if ( random.diceRoll( { oneIn:payload.safeChance, attempts:1 } ) ) {
						map.grid[y][x] = map.gridtype.SAFE
						safes += 1
					} 

					// ... or a cage ... ?
					else if ( random.diceRoll( { oneIn: payload.cageChance, attempts:1 } ) ) {
						map.grid[y][x] = map.gridtype.CAGE
						cages.push( {x:x,y:y} )
					} 

					// Doing nothing here will result in empty space in the wall.
				} else {
					map.grid[y][x] = map.gridtype.WALL
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

				if ( x < 0 || y < 0 || x >= map.width || y >= map.height || map.grid[y][x] === 0 ) {
					placed = false;
				}
			}
		}

		// We have a bunch of walls filled with earth and boulders! Let's put
		// the shiny game elements in. This is done last to prevent other structural
		// elements overwriting them.
		for ( let y=1; y<map.height-1; y++ ) {
			for ( let x=1; x<map.width-1; x++ ) {
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

						// ... or an egg ... ?
						else if ( random.diceRoll( { oneIn: payload.eggChance, attempts:1 } ) ) {
							map.grid[y][x] = map.gridtype.EGG
							map.pushables[x+'_'+y] = {x:x,y:y}
						} 
					} 
				}
			}
		}

		// find a place for bob in the top 20% of the level for 100 tries, then everywhere ...
		let counter = 0
		while ( bob.x === 0 && bob.y === 0 ) {
			let x = random.get(1,map.width-1)
			let y = random.get(1,( counter < 100 ? map.height/payload.startFraction : map.height-1 ) )

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
				let x = random.get(1,map.width-1)
				let y = random.get(1,map.height-1 )

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
				let x = random.get(1,map.width-1)
				let y = random.get(1,map.height-1 )

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
		let jsonVal = '{"map":{"width":' + map.width + ',"height":' + map.height + ',"map":"'
		let c = 0

		for ( let y=0; y<map.height; y++ ) {
			for ( let x=0; x<=map.width; x++ ) {
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
							map.pushables[x+'_'+y] = {x:x, y:y, type: map.gridtype.BOULDER} 
							break
						case map.gridtype.EGG:
							jsonVal += 'G'
							elem.setAttribute( 'class', 'egg entity' )
							map.grid[y][x] = { type: map.gridtype.EGG, elem:elem }
							map.pushables[x+'_'+y] = {x:x, y:y, type: map.gridtype.EGG, crackTimer:0} 
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

	spirit: {
		/**
		 * Detect if the passed-in spirit has collided with bob.
		 */
		checkCollision: ( spirit ) => {
			// Nothing to do with caged spirits
			if ( !map.spiritsFatal || spirit.isCaged ) {
				return
			}

			// A collision occurs if the spirit x,y coincides with either of bob's.
			if  ( 
				( spirit.x === bob.x && spirit.y === bob.y )
				|| ( spirit.x === bob.oldX && spirit.y === bob.oldY )
			) {
				bob.killBob()
			}
		},

		/**
		 * Move the spirits around the map.
		 */
		route: ( spirit ) => {
			// Nought to do if the spirit has a delta already
			if ( spirit.delta > 0 || spirit.isCaged ) {
				return
			}

			// if the spirit is actually in a cage right now then all we need do is
			// turn it into a diamond!
			let entity = map.grid[spirit.y][spirit.x]
			if ( entity.type === map.gridtype.CAGE ) {
				spirit.isCaged = true
				spirit.elem.remove()
				entity.elem.setAttribute( 'class', 'entity diamond' )
				entity.type = map.gridtype.DIAMOND
			}

			spirit.dx = 0
			spirit.dy = 0
			spirit.delta = 64
			spirit.checkDelta = 16

			switch  ( spirit.dir ) {
				case map.dirs.UP:
					if ( map.spirit.isTransparentToLeft( spirit ) ) {
						spirit.dir = map.dirs.LEFT
						spirit.x -= 1
						spirit.dx = -1
					} else if ( map.spirit.isTransparentAbove( spirit ) ) {
						spirit.dir = map.dirs.UP
						spirit.y -= 1
						spirit.dy = -1
					} else if ( map.spirit.isTransparentToRight( spirit ) ) {
						spirit.dir = map.dirs.RIGHT
						spirit.x += 1
						spirit.dx = 1
					} else if ( map.spirit.isTransparentBelow( spirit ) ) {
						spirit.dir = map.dirs.DOWN
						spirit.y += 1
						spirit.dy = 1
					}
					break

				case map.dirs.RIGHT:
					if ( map.spirit.isTransparentAbove( spirit ) ) {
						spirit.dir = map.dirs.UP
						spirit.y -= 1
						spirit.dy = -1
					} else if ( map.spirit.isTransparentToRight( spirit ) ) {
						spirit.dir = map.dirs.RIGHT
						spirit.x += 1
						spirit.dx = 1
					} else if ( map.spirit.isTransparentBelow( spirit ) ) {
						spirit.dir = map.dirs.DOWN
						spirit.y += 1
						spirit.dy = 1
					} else if ( map.spirit.isTransparentToLeft( spirit ) ) {
						spirit.dir = map.dirs.LEFT
						spirit.x -= 1
						spirit.dx = -1
					}
					break

				case map.dirs.DOWN:
					if ( map.spirit.isTransparentToRight( spirit ) ) {
						spirit.dir = map.dirs.RIGHT
						spirit.x += 1
						spirit.dx = 1
					} else if ( map.spirit.isTransparentBelow( spirit ) ) {
						spirit.dir = map.dirs.DOWN
						spirit.y += 1
						spirit.dy = 1
					} else if ( map.spirit.isTransparentToLeft( spirit ) ) {
						spirit.dir = map.dirs.LEFT
						spirit.x -= 1
						spirit.dx = -1
					} else if ( map.spirit.isTransparentAbove( spirit ) ) {
						spirit.dir = map.dirs.UP
						spirit.y -= 1
						spirit.dy = -1
					} 
					break

				case map.dirs.LEFT:
					if ( map.spirit.isTransparentBelow( spirit ) ) {
						spirit.dir = map.dirs.DOWN
						spirit.y += 1
						spirit.dy = 1
					} else if ( map.spirit.isTransparentToLeft( spirit ) ) {
						spirit.dir = map.dirs.LEFT
						spirit.x -= 1
						spirit.dx = -1
					} else if ( map.spirit.isTransparentAbove( spirit ) ) {
						spirit.dir = map.dirs.UP
						spirit.y -= 1
						spirit.dy = -1
					} else if ( map.spirit.isTransparentToRight( spirit ) ) {
						spirit.dir = map.dirs.RIGHT
						spirit.x += 1
						spirit.dx = 1
					}
					break
			}
		},

		isTransparent: ( loc ) => {
			let type = map.grid[loc.y][loc.x].type
			return type === map.gridtype.EARTH 
				|| type === map.gridtype.EMPTY
				|| type === map.gridtype.CAGE
		},
		
		isTransparentAbove: ( loc ) => {
			return map.spirit.isTransparent( { x:loc.x, y:loc.y-1 } )
		},
		
		isTransparentBelow: ( loc ) => {
			return map.spirit.isTransparent( { x:loc.x, y:loc.y+1 } )
		},
		
		isTransparentToLeft: ( loc ) => {
			return map.spirit.isTransparent( { x:loc.x-1, y:loc.y } )
		},
		
		isTransparentToRight: ( loc ) => {
			return map.spirit.isTransparent( { x:loc.x+1, y:loc.y } )
		},
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
	 * Utility functions for pushables: eggs and boulders.
     */
	pushable: {
		/**
		 * Can a pushable move ino the square at loc?
		 */
		canMoveInto: ( loc ) => {
			// Pushables can't move into where bob is now, assuming he's alive.
			if ( bob.deathClock <= 0 && loc.x === bob.x && loc.y === bob.y ) {
				return false
			}
			// Pushables can't move into where bob was previously if he's still moving from there.
			if ( bob.deathClock <= 0 && loc.x === bob.oldX && loc.y === bob.oldY ) {
				return false
			}

			// Pushables can move into empty spaces.
			let type = map.grid[loc.y][loc.x].type
			if ( type === map.gridtype.EMPTY ) {
				return true
			}

			// Didn't match a rule, so this one can't go there.
			return false
		},

		/**
		 * Move the pushable into the square to its right.
		 */
		moveRight: ( pushable ) => {
			// Clear the grid cell the pushable is in.
			map.loc.setToEmpty( pushable )
			delete( map.pushables[(pushable.x)+'_'+pushable.y] )

			// Move the pushable and update the new grid cell
			pushable.x += 1
			pushable.pushDirection = map.dirs.RIGHT

			map.pushables[pushable.x+'_'+pushable.y] = pushable
			map.loc.setToPushable( pushable )
		},

		/**
		 * Move the pushable into the square to its left.
		 */
		moveLeft: ( pushable ) => {
			// Clear the grid cell the pushable is in.
			map.loc.setToEmpty( pushable )
			delete( map.pushables[(pushable.x)+'_'+pushable.y] )

			// Move the pushable and update the new grid cell
			pushable.x -= 1
			pushable.pushDirection = map.dirs.LEFT

			map.pushables[pushable.x+'_'+pushable.y] = pushable
			map.loc.setToPushable( pushable )
		},

		/**
		 * Move a pushable down one square, i.e. let it fall. This adds 1 to the
		 * score, but can kill bob if he's down there.
		 */
		moveDown: ( pushable ) => {
			// Clear the grid cell the pushable is in.
			map.loc.setToEmpty( pushable )
			delete( map.pushables[(pushable.x)+'_'+pushable.y] )

			// Move the pushable and update the new grid cell
			pushable.y += 1

			map.pushables[pushable.x+'_'+pushable.y] = pushable
			map.loc.setToPushable( pushable )

			// Update the score
			bolder.addToScore( 1 )

			// Did we hit bob?
			if ( map.pushable.fatal && pushable.x === bob.x && pushable.y+1 === bob.y ) {
				bob.killBob()
			}

			// Is the pushable an egg? In which case we crack it!
			if ( pushable.type === map.gridtype.EGG ) {
				pushable.crackTimer = 30
				let grid = map.grid[pushable.y][pushable.x]
				grid.elem.setAttribute( 'class', 'egg-cracked entity' )
			}
		},

		/**
		 * Update tick for pushables:
		 * - Are there any unsupported pushables that should fall?
		 * - Are there any eggs which are cracked and need to hatch?
		 */
		tick: () => {
			for ( const[key,pp] of Object.entries(map.pushables) ) {
				// If this is a cracked egg decrement the counter until it hatches.
				if ( pp.crackTimer ) {
					pp.crackTimer -= 1

					// Hatch the egg if its counter gets below zero.
					if ( pp.crackTimer === 0 ) {
						map.loc.setToEmpty( pp )
						delete( map.pushables[(pp.x)+'_'+pp.y] )
						map.monster.hatch( pp )
					}
				}

				if ( map.pushable.canMoveInto( map.loc.below( pp ) ) ) {
					map.pushable.moveDown( pp )
					continue
				}

				// Boulders are unsupported if they're on a slopey object with space
				// on either side ...
				switch ( map.sloping.get( pp ) ) {
					case map.dirs.LEFT:
						map.pushable.moveLeft( pp )
						continue
					case map.dirs.RIGHT:
						map.pushable.moveRight( pp )
						continue
				}
			}
		},
	},

	/**
	 * Utility functions for pushable objects needing to deal with sloped bricks.
	 */
	sloping: {
		/**
		 * Returns a direction for loc which is a pushable. The pushable should
		 * move in that direction in its next action. Direction is calculated from
		 * the map squares around the loc.
		 */
		get: ( loc ) => {
			// What is the loc sitting on? Some types are slopey.
			let type = map.grid[loc.y+1][loc.x].type
			if ( 	type === map.gridtype.BOULDER
				 || type === map.gridtype.DIAMOND
				 || type === map.gridtype.KEY
				 || type === map.gridtype.EGG
			) {
				// Left takes precedence if there's no pushDirection in the loc
				if ( !loc.pushDirection || loc.pushDirection === map.dirs.LEFT ) {
					if ( 
						map.pushable.canMoveInto( map.loc.toLeft( loc ) ) 
						&& map.pushable.canMoveInto( map.loc.toLeftAndBelow( loc ) ) 
					) {
						return map.dirs.LEFT
					}
					if ( 
						map.pushable.canMoveInto( map.loc.toRight( loc ) ) 
						&& map.pushable.canMoveInto( map.loc.toRightAndBelow( loc ) ) 
					) {
						return map.dirs.RIGHT
					}
				} else {
					if ( 
						map.pushable.canMoveInto( map.loc.toRight( loc ) ) 
						&& map.pushable.canMoveInto( map.loc.toRightAndBelow( loc ) ) 
					) {
						return map.dirs.RIGHT
					}
					if ( 
						map.pushable.canMoveInto( map.loc.toLeft( loc ) ) 
						&& map.pushable.canMoveInto( map.loc.toLeftAndBelow( loc ) ) 
					) {
						return map.dirs.LEFT
					}
				}
			}

			// Didn't return before, so there's no slope.
			return map.dirs.NONE
		}
	},

	/**
	 * Utility functions for converting locs into other locations.
	 */
	loc: {
		above: ( loc ) => {
			return { x:loc.x, y:loc.y-1 }
		},
		below: ( loc ) => {
			return { x:loc.x, y:loc.y+1 }
		},
		toLeft: ( loc ) => {
			return { x:loc.x-1, y:loc.y }
		},
		toLeftAndBelow: ( loc ) => {
			return { x:loc.x-1, y:loc.y+1}
		},
		toRight: ( loc ) => {
			return { x:loc.x+1, y:loc.y }
		},
		toRightAndBelow: ( loc ) => {
			return { x:loc.x+1, y:loc.y+1 }
		},

		/**
		 * Converts the loc into a pushable. Usually this happens when a pushable
		 * moves into a loc and replaces an empty.
		 */
		setToPushable: ( loc ) => {
			let grid = map.grid[loc.y][loc.x]
			grid.type = loc.type

			switch ( loc.type ) {
				case map.gridtype.BOULDER:
					grid.elem.setAttribute( 'class', 'entity boulder' )
					break
				case map.gridtype.EGG:
					grid.elem.setAttribute( 'class', loc.crackTimer>0 ? 'entity egg-cracked': 'entity egg' )
					break
			}

			// If this loc is occupied by a monster then kill it!
			map.monsters.forEach( (monster) => {
				if ( monster.x === loc.x && monster.y === loc.y ) {
					map.monster.kill( monster )
				}
			} )
		},

		/**
		 * Empties a square on the map at the given loc. Send scoring = true to add to bob's score.
		 */
		setToEmpty: ( loc, scoring = false ) => {
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
		},
	},

	/**
	 * Functions for monsters!
	 */
	monster: {
		/**
		 * Hatch a new monster at the given loc.
		 */
		hatch: ( loc ) => {
			let elem = document.createElement( 'div' )
			elem.setAttribute( 'class', 'monster' )
			elem.style.left = loc.x*64 + 'px'
			elem.style.top = loc.y*64 + 'px'

			let canvas = document.getElementById( '-canvas' )
			canvas.appendChild( elem )

			map.monsters.push( {
				alive: true,
				x: loc.x,
				y: loc.y,
				dx: 0,
				dy: 0,
				delta: 1,
				elem: elem
			} )
		},

		/**
		 * Detect if the passed-in monster has collided with bob.
		 */
		checkCollision: ( monster ) => {
			// Nothing to do with dead monsters
			if ( !monster.alive ) {
				return
			}

			// A collision occurs if the monster x,y coincides with either of bob's.
			if  ( 
				( monster.x === bob.x && monster.y === bob.y )
				|| ( monster.x === bob.oldX && monster.y === bob.oldY )
			) {
				bob.killBob()
			}
		},

		/**
		 * Kills the monster
		 */
		kill: ( monster ) => {
			monster.elem.remove()
			monster.alive = false
			bolder.addToScore( 100 )
		},

		/**
		 * 
		 */
		route: ( monster ) => {
			// Nought to do if the monster has a delta already
			if ( monster.delta > 0 || !monster.alive ) {
				return
			}

			monster.dx = 0
			monster.dy = 0
			monster.delta = 64
			monster.checkDelta = 16

			// Monster's naively move toward bob, x first and then y. If bob isn't alive they wait ...
			if ( bob.deathClock > 0 ) {
				return
			} else if ( monster.x > bob.x && map.monster.isTransparentToLeft( monster ) ) {
				monster.x -= 1
				monster.dx = -1
			} else if ( monster.x < bob.x && map.monster.isTransparentToRight( monster ) ) {
				monster.x += 1
				monster.dx = 1
			} else if ( monster.y > bob.y && map.monster.isTransparentAbove( monster ) ) {
				monster.y -= 1
				monster.dy = -1
			} else if ( monster.y < bob.y && map.monster.isTransparentBelow( monster ) ) {
				monster.y += 1
				monster.dy = 1
			} 
		},

		/**
		 * Transparency convenience methods.
		 */
		isTransparent: ( loc ) => {
			let type = map.grid[loc.y][loc.x].type

			if ( map.monstersDirt ) {
				return type === map.gridtype.EMPTY || type === map.gridtype.EARTH
			} else {
				return type === map.gridtype.EMPTY 
			}
		},
		
		isTransparentAbove: ( loc ) => {
			return map.monster.isTransparent( { x:loc.x, y:loc.y-1 } )
		},
		
		isTransparentBelow: ( loc ) => {
			return map.monster.isTransparent( { x:loc.x, y:loc.y+1 } )
		},
		
		isTransparentToLeft: ( loc ) => {
			return map.monster.isTransparent( { x:loc.x-1, y:loc.y } )
		},
		
		isTransparentToRight: ( loc ) => {
			return map.monster.isTransparent( { x:loc.x+1, y:loc.y } )
		},
	}
}