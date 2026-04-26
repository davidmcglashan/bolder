const map = {
	diamonds: 0,
	pushables: {},
	safes: {},
	spirits: [],
	monsters: [],
	monsterCount: 0,

	dgrid: [],
	gridtype: {
		EMPTY: ' ',
		WALL: '#',
		EARTH: '.',
		BOULDER: '@',
		DIAMOND: '^',
		SAFE: '$',
		KEY: '%',
		CAGE: '[',
		EGG: '&',

		// These two aren't used in the game but are for parsing levels from JSON.
		SPIRIT: '*',
		SPIRIT_IN_EARTH: '8',
		BOB_START: '!'
	},
	
	cssClasses: {
		'#': 'wall',
		'.': 'earth',
		'@': 'boulder',
		'^': 'diamond',
		'$': 'safe',
		'%': 'key',
		'[': 'cage',
		'&': 'egg'
	},

	wallVariants: { 
		// Grey brick
		q: 'l-aaa-nw',
		w: 'b-aaa-n',
		e: 'r-aaa-ne',
		a: 'l-aaa-w',
		d: 'r-aaa-e',
		z: 'x-aaa-sw',
		x: 'x-aaa-s',
		c: 'x-aaa-se',

		// Grey brick with yellow edging
		Q: 'l-aao-nw',
		W: 'x-aao-n',
		E: 'r-aao-ne',
		A: 'x-aao-w',
		D: 'x-aao-e',
		Z: 'x-aao-sw',
		X: 'x-aao-s',
		C: 'x-aao-se',

		// Red brick
		r: 'l-bbb-nw',
		t: 'b-bbb-n',
		y: 'r-bbb-ne',
		f: 'l-bbb-w',
		g: 'x-bbb',
		h: 'r-bbb-e',
		v: 'x-bbb-sw',
		b: 'x-bbb-s',
		n: 'x-bbb-se',

		// Red brick
		R: 'l-bbo-nw',
		T: 'x-bbo-n',
		Y: 'r-bbo-ne',
		F: 'x-bbo-w',
		G: 'x-bbb',
		H: 'x-bbo-e',
		V: 'x-bbo-sw',
		B: 'x-bbo-s',
		N: 'x-bbo-se',
	},
	
	dirs: {
		UP: 0,
		RIGHT: 1,
		DOWN: 2,
		LEFT: 3,
		NONE: 4
	},
	
	/**
	 * Generator functions
	 */
	gen: {
		/**
		 * Generates a map from a seed value - either the random one or the one
		 * contained in the options object. Options contains the various world
		 * probabilities.
		 */
		start: ( options ) => {
			random.SEED = parseInt( options.seed ) | 0
		
			// Initialise the map and set its dimensions.
			map.width = random.get( options.minWidth, options.maxWidth )
			map.height = random.get( options.minHeight, options.maxHeight )
			map.options = options

			// Fill the map with emptiness
			for ( let y = 0; y < map.height; y++ ) {
				map.dgrid[y] = []
				for ( let x = 0; x < map.width; x++ ) {
					map.dgrid[y][x] = {type:map.gridtype.EMPTY}
				}
			}

			// Now do the interesting world features one by one.
			map.gen.cutaways()
			map.gen.outline()
			map.gen.buildStructures()
			map.gen.brackets()
			//map.gen.interiorWalls()
			map.gen.fillTheInterior()

			map.gen.addDiamonds()
			map.gen.placeBob()
			map.gen.buildDOM()
		},

		/**
		 * Loads a numbered game level ready for playing.k
		 */
		parse: ( lvl ) => {
			let level = levels.maps[lvl-1]

			// Set up the map.
			map.width = level.width
			map.height = level.height
			map.options = { 
				spiritsFatal: true, 
				bouldersFatal: true, 
				monstersDirt: false, 
				monstersSlow: false
			}
			
			for ( let y = 0; y < map.height; y++ ) {
				map.dgrid[y] = []
				for ( let x = 0; x < map.width; x++ ) {
					map.dgrid[y][x] = {type:level.map[y][x], preserve:true}

					// A couple of chars get special treatment.
					switch( map.dgrid[y][x].type ) {
						// Bob's start position
						case map.gridtype.BOB_START:
							bob.x = x
							bob.y = y
							map.dgrid[y][x].type = map.gridtype.EMPTY
							break

						// Add spirits
						case map.gridtype.SPIRIT:
							map.gen.addSpirit( x,y )
							map.dgrid[y][x].type = map.gridtype.EMPTY
							break
						case map.gridtype.SPIRIT_IN_EARTH:
							map.gen.addSpirit( x,y )
							map.dgrid[y][x].type = map.gridtype.EARTH
							break
					}

					// Wall variants can be detected.
					if ( map.wallVariants[ map.dgrid[y][x].type ] ) {
						map.dgrid[y][x].variant = map.wallVariants[ map.dgrid[y][x].type ]
						map.dgrid[y][x].type = map.gridtype.WALL
					}
				}
			}

			map.gen.buildDOM()
		},

		/**
		 * Cuts away random rectangles from the principal compass points of the level grid
		 * to stop the level looking too boxy and square.
		 */
		cutaways: () => {		
			// There are up to four cutaways in eight "compass" locations, only if the level is larger than 10x10
			// - generate cutaway number between 2..4
			// - choose a 0..7 location for it
			// - derive x,y,w,h based on loc and rng
			if ( map.width > 10 && map.height > 10 ) {
				for ( let cw=0; cw < random.get( map.options.minCutaways, map.options.maxCutaways ); cw += 1 ) {
					let x,y,w,h,z

					switch ( random.get(0,7) ) {
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
							map.dgrid[yy][xx] = 0
						}
					}
				}
			}
		},

		/**
		 * Replaces the cells on the edge of the map with walls.
		 */
		outline: () => {
			for ( let y=0; y<map.height; y++ ) {
				for ( let x=0; x<map.width; x++ ) {
					// Is this a cell we can change? 
					if ( map.dgrid[y][x] === 0 ) {
						continue
					}

					// Don't change if any neighbouring cell is a zero. This maintains a 1-wide
					// strip of walls around the world's perimeter.
					if ( 
						x === 0 || y === 0 || x === map.width-1 || y === map.height-1
						|| map.dgrid[y-1][x-1] === 0
						|| map.dgrid[y-1][x] === 0
						|| map.dgrid[y-1][x+1] === 0
						|| map.dgrid[y][x-1] === 0
						|| map.dgrid[y][x+1] === 0
						|| map.dgrid[y+1][x-1] === 0
						|| map.dgrid[y+1][x] === 0
						|| map.dgrid[y+1][x+1] === 0
					) { 
						map.dgrid[y][x] = {type:map.gridtype.WALL}
					}
				}
			}
		},

		/**
		 * Brackets are C, U, or L shaped-structures strewn through out the level
		 */
		brackets: () => {
			for ( let z=0; z<10; z+=1 ) {
				map.gen.buildBracket()
			}
		},

		buildBracket: () => {
			let width = random.get(3,5)
			let height = random.get(3,5)
			let bracket = []
			let variant = random.get(0,2) === 0

			// Build the bracket into its own array.
			for ( let y=0; y<height; y++ ) {
				bracket[y] = []
				for ( let x=0; x<width; x++ ) {
					// All the edges are walls.
					if ( y === 0 ) {
						bracket[y][x] = {type:map.gridtype.WALL, variant:'x-bbo-n'}
					} else if ( x === 0 ) {
						bracket[y][x] = {type:map.gridtype.WALL, variant:'x-bbo-w'}
					} else if ( y === height-1 ) {
						bracket[y][x] = {type:map.gridtype.WALL, variant:'x-bbo-s'}
					} else if ( x === width-1 ) {
						bracket[y][x] = {type:map.gridtype.WALL, variant:'x-bbo-e'}
					}
				}
			}

			// Adjust the corners
			bracket[0][0].variant = 'l-bbo-nw'
			bracket[0][width-1].variant = 'r-bbo-ne'
			bracket[height-1][0].variant = 'x-bbo-sw'
			bracket[height-1][width-1].variant = 'x-bbo-se'

			// Becoming true here means we'll turn that side of the box off.
			let top = random.get( 0,1 )
			let bottom = random.get( 0,1 )
			let left = random.get( 0,1 )
			let right = random.get( 0,1 )

			// Prevent the sillier configurations from happening.
			while ( top + bottom + left + right === 4 || top + bottom + left + right === 0 || ( top+bottom === 2 && left+right === 0 )  || ( top+bottom === 0 && left+right === 2 )) {
				top = random.get( 0,1 )
				bottom = random.get( 0,1 )
				left = random.get( 0,1 )
				right = random.get( 0,1 )
			}

			// Remove any adjoining corners.
			if ( top && left ) {
				bracket[0][0] = 0
			}
			if ( top && right ) {
				bracket[0][width-1] = 0
			}
			if ( bottom && left ) {
				bracket[height-1][0] = 0
			}
			if ( bottom && right ) {
				bracket[height-1][width-1] = 0
			}

			// Copy the bracket onto the map. 5 goes at this - the only criteria are that it 
			// fits within the map's bounds and the every cell underneath it is empty.
			for ( let a=0; a<5; a++ ) {
				let ox = random.get(0,map.width-width)
				let oy = random.get(0,map.height-height)
				let canPlace = true

				// See if the gaps align with earths and empties
				check: for ( let y=0; y<height; y++ ) {
					for ( let x=0; x<width; x++ ) {
						if ( bracket[y][x] !== 0 ) {
							let type = map.dgrid[y+oy][x+ox].type
							if ( type !== map.gridtype.EMPTY  ) {
								canPlace = false
								break check
							}
						}
					}
				}

				if ( canPlace ) {
					for ( let y=0; y<height; y++ ) {
						for ( let x=0; x<width; x++ ) {
							if ( top && y === 0 && x>0 && x<width-1 ) {
								continue
							}
							if ( bottom && y === height-1 && x>0 && x<width-1 ) {
								continue
							}
							if ( left && x === 0 && y>0 && y<height-1 ) {
								continue
							}
							if ( right && x === width-1 && y>0 && y<height-1 ) {
								continue
							}
							if ( bracket[y][x] ) {
								map.dgrid[y+oy][x+ox] = bracket[y][x]
								map.dgrid[y+oy][x+ox].preserve = true
								if ( variant ) 
									delete( map.dgrid[y+oy][x+ox].variant )
							}
						}
					}
				}
			}
		},

		/**
		 * Draws interior walls within the map, according to some rules ...
		 *   - pick a random x,y
		 *   - must be 3x3 clear of walls
  		 *   - can't start within 9x9 of a previously laid wall
  		 *   - goes until it hits a wall
  		 *   - %age chance of direction change after 2...6 blocks
		 */
		interiorWalls: () => {
			let previous = []

			for ( let z=0; z<random.get( map.options.extraWallMin, map.options.extraWallMax); z+=1 ) {
				let counter = 10

				while ( counter > 0 ) {
					let startPos = map.gen.buildInteriorWall( previous )
					if ( startPos ) {
						previous.push( startPos )
						counter = 0
					} else {
						counter -= 1 
					}
				}
			}
		},

		/**
		 * Builds a single interior wall.
		 */
		buildInteriorWall: ( previous ) => {
			// Random start location
			let x = random.get( 3, map.width-4 )
			let y = random.get( 3, map.height-4 )

			// Can't be in proximity to a previous start position
			previous.forEach( (prev) => {
				if ( Math.abs( prev.x - x ) < 5 && Math.abs( prev.y - y ) < 5 ) {
					return null
				}
			} )

			// Must be an empty square
			if ( map.dgrid[y][x] === 0 || map.dgrid[y][x].type !== map.gridtype.EMPTY ) {
				return null
			}

			// Must be clear all around.
			if ( map.dgrid[y-1][x-1].type === map.gridtype.EMPTY
				&& map.dgrid[y-1][x].type === map.gridtype.EMPTY
				&& map.dgrid[y-1][x+1].type === map.gridtype.EMPTY
				&& map.dgrid[y][x-1].type === map.gridtype.EMPTY
				&& map.dgrid[y][x+1].type === map.gridtype.EMPTY
				&& map.dgrid[y+1][x-1].type === map.gridtype.EMPTY
				&& map.dgrid[y+1][x].type === map.gridtype.EMPTY
				&& map.dgrid[y+1][x+1].type === map.gridtype.EMPTY
			) {
				// random direction
				dir = random.get(0,3)
				
				let startPos = { x:x, y:y }
				while ( true ) {
					map.dgrid[y][x].type = map.gridtype.WALL
					
					// Move to the next square.
					switch ( dir ) {
						case map.dirs.RIGHT: 
							if ( map.dgrid[y-1][x].type !== map.gridtype.EMPTY || map.dgrid[y+1][x].type !== map.gridtype.EMPTY ) {
								return startPos
							}
							x+=1
							break
						case map.dirs.UP: 
							if ( map.dgrid[y][x-1].type !== map.gridtype.EMPTY || map.dgrid[y][x+1].type !== map.gridtype.EMPTY ) {
								return startPos
							}
							y-=1
							break
						case map.dirs.LEFT: 
							if ( map.dgrid[y-1][x].type !== map.gridtype.EMPTY || map.dgrid[y+1][x].type !== map.gridtype.EMPTY ) {
								return startPos
							}
							x-=1
							break
						case map.dirs.DOWN: 
							if ( map.dgrid[y][x-1].type !== map.gridtype.EMPTY || map.dgrid[y][x+1].type !== map.gridtype.EMPTY ) {
								return startPos
							}
							y+=1
							break
					}

					// Until we hit something 
					if ( map.dgrid[y][x].type !== map.gridtype.EMPTY ) {
						return startPos
					}
				}
			}

			// We didn't build a wall so return null
			return null
		},

		fillTheInterior: () => {
			for ( let y=1; y<map.height-1; y++ ) {
				for ( let x=1; x<map.width-1; x++ ) {
					// Is this a cell we can change?
					if ( map.dgrid[y][x] !== 0 && map.dgrid[y][x].type === map.gridtype.EMPTY && !map.dgrid[y][x].preserve ) {

						// Everything in the interior is now earth.
						map.dgrid[y][x].type = map.gridtype.EARTH

						// Randomly change some earths into boulders ...
						if ( random.diceRoll( { oneIn:payload.boulderChance, attempts:1 } ) ) {
							map.dgrid[y][x].type = map.gridtype.BOULDER
						} 
						
						// ... or gaps and holes (but not underneath boulders to minimise starting falls) ...
						if ( map.dgrid[y-1][x] !== map.gridtype.BOULDER && random.diceRoll( { oneIn:payload.holeChance, attempts:1 } ) ) {
							map.dgrid[y][x].type = map.gridtype.EMPTY
						} 
						
						// ... or back into some kind of wall.
						if ( random.diceRoll( { oneIn:payload.wallChance, attempts:1 } ) ) {
							map.dgrid[y][x].type = map.gridtype.WALL
						} 
					}
				}
			}
		},

		buildStructures: () => {
			for ( let i=0; i<random.get(5,10); i++ ) {
				map.gen.buildBox()
			}
		},

		buildBox: () => {
			let width = random.get(4,8)
			let height = random.get(4,8)
			let fill = random.get(0,2) === 0
			let variant = random.get(0,2) === 0
			let struc = []
			
			// Build the structure into its own array.
			for ( let y=0; y<height; y++ ) {
				struc[y] = []
				for ( let x=0; x<width; x++ ) {
					// All the edges are walls.
					if ( y === 0 ) {
						struc[y][x] = {type:map.gridtype.WALL, variant:'x-bbo-n'}
					} else if ( x === 0 ) {
						struc[y][x] = {type:map.gridtype.WALL, variant:'x-bbo-w'}
					} else if ( y === height-1 ) {
						struc[y][x] = {type:map.gridtype.WALL, variant:'x-bbo-s'}
					} else if ( x === width-1 ) {
						struc[y][x] = {type:map.gridtype.WALL, variant:'x-bbo-e'}
					} else if ( fill ) {
						struc[y][x] = {type:map.gridtype.DIAMOND}
					} else {
						switch ( random.get(0,6) ) {
							case 0:
								struc[y][x] = {type:map.gridtype.EMPTY}
								break
							case 1:
							case 2:
							case 3:
								struc[y][x] = {type:map.gridtype.EARTH}
								break
							case 4:
							case 5:
								struc[y][x] = {type:map.gridtype.DIAMOND}
								break
							case 6:
								struc[y][x] = {type:map.gridtype.BOULDER}
								break

						}
					}
				}
			}

			// Adjust the corners
			struc[0][0].variant = 'l-bbo-nw'
			struc[0][width-1].variant = 'r-bbo-ne'
			struc[height-1][0].variant = 'x-bbo-sw'
			struc[height-1][width-1].variant = 'x-bbo-se'

			// Remove a non-corner wall or two
			for ( let i=0; i < random.get(2,parseInt(width*height/5)); i++ ) {
				if ( random.get(0,1) ) {
					struc[random.get(1,height-2)][random.get(0,1) ? 0 : width-1] = 0
				} else {
					struc[random.get(0,1) ? 0 : height-1][random.get(1,width-2)] = 0
				}
			}

			// Copy the structure onto the map. 5 goes at this - the only criteria are that
			// it fits within the map's bounds and the empty cells align with existing empties
			// or earths.
			for ( let a=0; a<5; a++ ) {
				let ox = random.get(0,map.width-width)
				let oy = random.get(0,map.height-height)
				let canPlace = true

				// See if the gaps align with earths and empties
				check: for ( let y=0; y<height; y++ ) {
					for ( let x=0; x<width; x++ ) {
						let type = map.dgrid[y+oy][x+ox].type
						if ( type !== map.gridtype.EMPTY  ) {
							canPlace = false
							break check
						}
						if ( struc[y][x] === 0 ) {
							let type = map.dgrid[y+oy][x+ox].type
							if ( type !== map.gridtype.EMPTY && type !== map.gridtype.EARTH ) {
								canPlace = false
								break check
							}
						}
					}
				}

				if ( canPlace ) {
					for ( let y=0; y<height; y++ ) {
						for ( let x=0; x<width; x++ ) {
							if ( struc[y][x] !== 0 ) {
								map.dgrid[y+oy][x+ox] = struc[y][x]
								map.dgrid[y+oy][x+ox].preserve = true
								if ( variant ) {
									delete( map.dgrid[y+oy][x+ox].variant )
								}
							} else {
								map.dgrid[y+oy][x+ox] = { 
									type: random.get(0,1) === 0 ? map.gridtype.EMPTY : map.gridtype.EARTH,
									preserve:true 
								}
								if ( variant ) {
									delete( map.dgrid[y+oy][x+ox].variant )
								}
							}
						}
					}
					return
				}
			}
		},

		/**
		 * Add the diamonds, safes, and spirits to the level.
		 */
		addDiamonds: () => {
			let safes = 0
			let cages = []

			// We have a bunch of walls filled with earth and boulders! Let's put
			// the shiny game elements in. This is done last to prevent other structural
			// elements overwriting them.
			for ( let y=1; y<map.height-1; y++ ) {
				for ( let x=1; x<map.width-1; x++ ) {
					// Is this a cell we can change?
					if ( map.dgrid[y][x].type === map.gridtype.EARTH ) {
			
						if ( random.diceRoll( { oneIn: payload.diamondChance, attempts:1 } ) ) {
							map.dgrid[y][x].type = map.gridtype.DIAMOND

							// Turn this diamond into a safe ... ?
							if ( random.diceRoll( { oneIn: payload.safeChance, attempts:1 } ) ) {
								map.dgrid[y][x].type = map.gridtype.SAFE
								safes += 1
							} 

							// ... or a cage ... ?
							else if ( random.diceRoll( { oneIn: payload.cageChance, attempts:1 } ) ) {
								map.dgrid[y][x].type = map.gridtype.CAGE
								cages.push( {x:x,y:y} )
							} 

							// ... or an egg ... ?
							else if ( random.diceRoll( { oneIn: payload.eggChance, attempts:1 } ) ) {
								map.dgrid[y][x].type = map.gridtype.EGG
								map.pushables[x+'_'+y] = {x:x,y:y}
							} 
						} 
					}
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
					if ( map.dgrid[y][x].type === map.gridtype.EARTH || map.dgrid[y][x].type === map.gridtype.EMPTY ) {
						map.dgrid[y][x].type = map.gridtype.KEY
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

					if ( map.dgrid[y][x].type === map.gridtype.EARTH || map.dgrid[y][x].type === map.gridtype.EMPTY ) {
						map.gen.addSpirit( x,y )
						break
					}

					counter += 1
				}
			}
		},

		/**
		 * Add a new spirit to the map, starting at x,y
		 */
		addSpirit: ( x,y ) => {
			let elem = document.createElement( 'div' )
			elem.setAttribute( 'class', 'spirit' )
			elem.style.left = x*64 + 'px'
			elem.style.top = y*64 + 'px'

			let canvas = document.getElementById( '-canvas' )
			canvas.appendChild( elem )

			map.spirits.push( {
				x: x,
				y: y,
				dx: 0,
				dy: -1,
				dir: map.dirs.UP,
				delta: 64,
				animLoop: 0,
				elem: elem
			} )
		},

		placeBob: () => {
			// Find all the empty squares
			let empties = []
			for ( let y=1; y<map.height-1; y++ ) {
				for ( let x=1; x<map.width-1; x++ ) {
					if ( map.dgrid[y][x].type === map.gridtype.EMPTY ) {
						empties.push( {x:x, y:y} )
					}
				}
			}

			// Pick a random empty and put bob in it.
			let start = empties[ random.get( 0, empties.length ) ]
			bob.x = start.x
			bob.y = start.y
		},

		/**
		 * Turn the map model into DOM elements so the game can be played in a web browser!
		 */
		buildDOM: () => {
			let canvas = document.getElementById( "-canvas" )
			let pushable = null
			let v = 0

			for ( let y=0; y<map.height; y++ ) {
				for ( let x=0; x<map.width; x++ ) {
					let dgrid = map.dgrid[y][x]

					if ( dgrid !== 0 ) {
						let elem = document.createElement( 'div' )
						elem.style.left = x*64 + 'px'
						elem.style.top = y*64 + 'px'
						canvas.appendChild( elem )
						dgrid.elem = elem

						// Some dgrids require additional setup
						switch ( dgrid.type ) {
							// Earth can have one of three variants
							case map.gridtype.EARTH:
								v = random.get( 0,3 )
								if ( v ) {
									dgrid.variant = 'r' + v
								}
								break

							// Walls can have one of their defined variants
							case map.gridtype.WALL:
								if ( dgrid.preserve ) {
									break
								}
								// Don't change wall variants for walls neighbouring the abyss ...
								if (
									x === 0 || y === 0 || x === map.width-1 || y === map.height-1 
									|| map.dgrid[y-1][x-1] === 0
									|| map.dgrid[y-1][x] === 0
									|| map.dgrid[y-1][x+1] === 0
									|| map.dgrid[y][x-1] === 0
									|| map.dgrid[y][x+1] === 0
									|| map.dgrid[y+1][x-1] === 0
									|| map.dgrid[y+1][x] === 0
									|| map.dgrid[y+1][x+1] === 0
								) {
									break
								}

								let keys = Object.keys( map.wallVariants )
								v = random.get( 0, keys.length )
								if ( v ) {
									dgrid.variant = map.wallVariants[keys[v]]
								}
								break

							case map.gridtype.DIAMOND:
								v = random.get( 0,3 )
								if ( v ) {
									dgrid.variant = 'r' + v
								}
								break
								map.diamonds += 1
								break

							case map.gridtype.SAFE:
								map.safes[x+'_'+y] = {x:x, y:y} 
								map.diamonds += 1
								break

							case map.gridtype.CAGE:
								map.diamonds += 1
								break

							case map.gridtype.BOULDER:
								pushable = {x:x, y:y, type: map.gridtype.BOULDER} 
								map.pushables[x+'_'+y] = pushable
								dgrid.pushable = pushable

								v = random.get( 0,3 )
								if ( v ) {
									pushable.variant = 'r' + v
									dgrid.variant = 'r' + v
								}
								break

							case map.gridtype.EGG:
								pushable = {x:x, y:y, type: map.gridtype.EGG, crackTimer:0} 
								map.pushables[x+'_'+y] = pushable
								dgrid.pushable = pushable
								map.monsterCount += 1
								break
						}

						// Fully set up, we can eet its DOM element and CSS class correctly.
						map.updateType( dgrid )
					}
				}
			}
		}
	},

	/**
	 * Forces and update for the correct type on a dgrid. You can pass in the type
	 * to set it on the dgrid first. This is then reflected in the CSS.
	 */
	updateType: ( dgrid, type = null ) => {
		// If we got a type passed in we can set it on the dgrid first.
		if ( type ) {
			dgrid.type = type
		}

		let css = map.cssClasses[ dgrid.type ]
		if ( dgrid.variant ) {
			dgrid.elem.setAttribute( 'class', 'entity ' + css + '-' + dgrid.variant )
		} else {
			dgrid.elem.setAttribute( 'class', 'entity ' + css )
		}

		// Eggs also have a cracked state
		if ( dgrid.type === map.gridtype.EGG && dgrid.pushable.crackTimer > 0 ) {
			dgrid.elem.setAttribute( 'class', 'entity egg-cracked' )
		}
	},

	spirit: {
		/**
		 * Detect if the passed-in spirit has collided with bob.
		 */
		checkCollision: ( spirit ) => {
			// Nothing to do with caged spirits
			if ( !map.options.spiritsFatal || spirit.isCaged ) {
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
			let dgrid = map.dgrid[spirit.y][spirit.x]
			if ( dgrid.type === map.gridtype.CAGE ) {
				spirit.isCaged = true
				spirit.elem.remove()
				map.updateType( dgrid, map.gridtype.DIAMOND )
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
			let type = map.dgrid[loc.y][loc.x].type
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
			map.updateType( map.dgrid[safe.y][safe.x], map.gridtype.DIAMOND )
		}
		map.safes = {}
	},

	/**
	 * Utility functions for pushables: eggs and boulders.
     */
	pushable: {
		/**
		 * Can a pushable move into the square at loc?
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

			// We can use canFallInto() to do the check.
			return map.pushable.canFallInto( loc )
		},

		/**
		 * Can a pushable fall into the square at loc? This is the same as
		 * canMoveInto but without the bob checks.
		 */
		canFallInto: ( loc ) => {
			// Pushables can move into empty spaces.
			let type = map.dgrid[loc.y][loc.x].type
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
			if ( map.options.bouldersFatal && pushable.x === bob.x && pushable.y+1 === bob.y ) {
				bob.killBob()
			}

			// Is the pushable an egg? In which case we crack it!
			if ( pushable.type === map.gridtype.EGG && !map.pushable.canFallInto( map.loc.below( pushable ) ) ) {
				pushable.crackTimer = 30
				map.updateType( map.dgrid[pushable.y][pushable.x] )
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
		get: ( pushable ) => {
			// What is the pushable sitting on? Some types are slopey.
			let dgrid = map.dgrid[pushable.y+1][pushable.x]
			let slopesLeft = 
					dgrid.type === map.gridtype.BOULDER
				 || dgrid.type === map.gridtype.DIAMOND
				 || dgrid.type === map.gridtype.KEY
				 || dgrid.type === map.gridtype.EGG
			let slopesRight = slopesLeft

			// Some walls variants slope only one way.
			if ( dgrid.type === map.gridtype.WALL && dgrid.variant ) {
				slopesLeft = dgrid.variant[0] === 'l' || dgrid.variant[0] === 'b'
				slopesRight = dgrid.variant[0] === 'r' || dgrid.variant[0] === 'b'
			}

			// Abort if there's no check to be made in either direction.
			if ( !(slopesLeft || slopesRight) ) {
				return map.dirs.NONE
			}

			// If our objects slopes to the left, AND it was pushed that way, try moving it left. 
			if ( slopesLeft && ( !pushable.pushDirection || pushable.pushDirection === map.dirs.LEFT ) ) {
				// Try to the left first
				if ( 
					map.pushable.canMoveInto( map.loc.toLeft( pushable ) ) 
					&& map.pushable.canMoveInto( map.loc.toLeftAndBelow( pushable ) ) 
				) {
					return map.dirs.LEFT
				}
			}

			// If our objects slopes to the right, AND it was pushed that way, try moving it right. 
			if ( slopesRight && pushable.pushDirection === map.dirs.RIGHT ) {
				if ( 
					map.pushable.canMoveInto( map.loc.toRight( pushable ) ) 
					&& map.pushable.canMoveInto( map.loc.toRightAndBelow( pushable ) ) 
				) {
					return map.dirs.RIGHT
				}
			}

			// Try again without push direction
			if ( slopesLeft ) {
				// Try to the left first
				if ( 
					map.pushable.canMoveInto( map.loc.toLeft( pushable ) ) 
					&& map.pushable.canMoveInto( map.loc.toLeftAndBelow( pushable ) ) 
				) {
					return map.dirs.LEFT
				}
			} 
			if ( slopesRight ) {
				if ( 
					map.pushable.canMoveInto( map.loc.toRight( pushable ) ) 
					&& map.pushable.canMoveInto( map.loc.toRightAndBelow( pushable ) ) 
				) {
					return map.dirs.RIGHT
				}
			}

			// Didn't return before, so there's no slope.
			return map.dirs.NONE
		}
	},

	/**
	 * Utility functions for getting new locs based on other locations.
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
			let dgrid = map.dgrid[loc.y][loc.x]
			dgrid.pushable = loc
			dgrid.variant = loc.variant
			map.updateType( dgrid, loc.type )

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
			let dgrid = map.dgrid[loc.y][loc.x]

			if ( scoring ) {
				switch ( dgrid.type ) {
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

			// Clear the dgrid of all of its extra state.
			delete( dgrid.pushable )
			delete( dgrid.variant )
			map.updateType( dgrid, map.gridtype.EMPTY )
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
			if ( monster.alive ) {
				monster.elem.remove()
				monster.alive = false
				bolder.addToScore( 100 )
				
				map.monsterCount -= 1
				let elem = document.getElementById( '-monsters' )
				elem.innerHTML = 'monsters: ' + map.monsterCount
			}
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
			let type = map.dgrid[loc.y][loc.x].type

			if ( map.options.monstersDirt ) {
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