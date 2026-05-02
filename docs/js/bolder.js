const bolder = {
	score: 0,

	fields: [
		{ name: "minWidth", label: "Minimum width", type: "number", value: 25 },
		{ name: "maxWidth", label: "Maximum width", type: "number", value: 45 },
		{ name: "minHeight", label: "Minimum height", type: "number", value: 25 },
		{ name: "maxHeight", label: "Maximum height", type: "number", value: 45, after: 'gap' },

		{ name: "minCutaways", label: "Minimum number of cut-aways", type: "number", value: 2 },
		{ name: "maxCutaways", label: "Maximum number of cut-aways", type: "number", value: 8, after: 'gap' },
		
		{ name: "extraWallMin", label: "Minimum number of extra walls", type: "number", value: 6 },
		{ name: "extraWallMax", label: "Maximum number of extra walls", type: "number", value: 14 },
		{ name: "extraWallHoles", label: "Extra wall holey-ness (1 in ...)", type: "number", value: 5, after: 'gap' },
		{ name: "startFraction", label: "Start in top fraction (1/...)", type: "number", value: 5 },
		
		{ name: "boulderChance", label: "Boulder likelihood (1 in ...)", type: "number", value: 5 },
		{ name: "holeChance", label: "Hole likelihood (1 in ...)", type: "number", value: 10 },
		{ name: "wallChance", label: "Wall likelihood (1 in ...)", type: "number", value: 10 },
		{ name: "diamondChance", label: "Diamond likelihood (1 in ...)", type: "number", value: 5 },
		{ name: "safeChance", label: "Safe likelihood (1 in ...)", type: "number", value: 10 },
		{ name: "cageChance", label: "Cage likelihood (1 in ...)", type: "number", value: 20 },
		{ name: "eggChance", label: "Egg likelihood (1 in ...)", type: "number", value: 15, after: 'column' },

		{ name: "bouldersFatal", label: "Falling boulders are fatal", type: "checkbox", value: true },
		{ name: "spiritsFatal", label: "Spirits are fatal", type: "checkbox", value: true },
		{ name: "monstersSlow", label: "Monsters are slow", type: "checkbox", value: false },
		{ name: "monstersDirt", label: "Monsters move through dirt", type: "checkbox", value: false },
	],

	/**
	 * Builds the form on the index page with all the payload parameters as <input>s.
	 */
	buildForm: () => {
		let progress = localStorage['bolder.progress']
		if ( progress ) {
			progress = parseInt( progress )
			if ( progress < 3 ) {
				progress = 3
			}
		} else {
			progress = 3
		}
		let elem = document.getElementById( '-levels' )
		for ( let i=1; i<=30; i +=1 ) {
			let a = document.createElement( 'a' )
			a.setAttribute( 'href', 'javascript:void(0)' )
			if ( i <= progress ) {
				a.setAttribute( 'onclick', `bolder.submit(${i})` )
			} else {
				a.setAttribute( 'class', 'locked' )
			}

			a.innerHTML = String( i ).padStart( 3, '0' )
			elem.appendChild( a )
		}

		let form = document.getElementById( '-form' )
		elem = null

		// If there was a payload in the URL use that to put values in the form elems
		let payload = null		
		let str = window.location.search
		if ( str ) {
			payload = JSON.parse( atob( str.substring(1) ) )
			// If the payload contains a level then we last played a level and so the payload
			// won't contain any fields for the form, therefore we can nullify it.
			if ( payload.level ) {
				payload = null
			}	
		}

		bolder.fields.forEach( ( field ) =>  {
			if ( elem === null ) {
				elem = document.createElement( 'div' )
				form.appendChild( elem )
			}

			// Everything has a label.
			let label = document.createElement( 'label' )
			elem.appendChild( label )
			if ( field.after === 'gap' ) {
				label.setAttribute( 'class', 'gapAfter' )
			} else if ( field.after === 'column' ) {
				elem = null
			}

			// Labels have text
			let text = document.createTextNode( field.label )
			label.appendChild( text )

			// All fields become inputs.
			let input = document.createElement( 'input' )
			input.setAttribute( 'name', field.name )
			input.setAttribute( 'type', field.type )

			// Put the values in. Checkboxes need slightly different HTML.
			if ( field.type === 'checkbox' ) {
				let val = payload ? payload[field.name] : field.value
				if ( val ) {
					input.setAttribute( 'checked', 'checked' )
				}
			} else {
				input.value = payload ? payload[field.name] : field.value
				input.setAttribute( 'placeholder', field.value )
			}

			label.appendChild( input )
		} )

		// Put today's date in the seed box
		elem = document.getElementById( 'seed' )
		elem.value = parseInt( payload ? payload['seed'] : random.getSeed() )

		// Make Enter submit the form
		elem.addEventListener( 'keypress', function(event) {
			if ( event.key === 'Enter' ) {
				event.preventDefault()
				bolder.submit()
			}
		} )	

		// Select the tab that got selected last.
		bolder.tab( localStorage['bolder.tab'] | 0 )
	},

	/**
	 * Generates a new random seed and puts it in the form UI element.
	 */
	randomSeed: () => {
		elem = document.getElementById( 'seed' )
		elem.value = random.get( 1, 99999999 ) 
	},

	/**
	 * Changes the seed by the specified amount and puts it in the form UI element.
	 */
	changeSeed: ( diff ) => {
		elem = document.getElementById( 'seed' )
		elem.value = parseInt(elem.value) + diff
	},

	/**
	 * Called from the play button on the "How To Play" tab. Starts the game at the
	 * player's next 'progress' level.
	 */
	resume: () => {
		let progress = localStorage['bolder.progress']
		console.log( progress )
		bolder.submit( progress ? progress : 1 )
	},

	/**
	 * Submit's the user's form. This builds a small JSON object representing the form's state,
	 * base64 encodes it and sticks that in the GET of game.html.
	 */
	submit: ( level = null ) => {
		let payload = {}

		// If a level was passed in we build a very simple payload with the level in it.
		if ( level ) {
			payload = { level:level }
		} 
		
		// Otherwise we grab every form element and stick its value in the payload.
		else {
			let inputs = document.querySelectorAll("input")
			inputs.forEach( ( input ) => {
				// Checkboxes used 'checked' for their value, rather than value. Because 1994 ...
				if ( input.type === 'checkbox' ) {
					payload[input.name] = input.checked
				} else {
					// If the form proivdes a value put it in.
					if ( input.value > 0 ) {
						payload[input.name] = input.value
					} 
					
					// Otherwise, use the default from the fields JSON.
					else {
						bolder.fields.forEach( ( field ) =>  {
							if ( field.name === input.name ) {
								payload[input.name] = field.value
							}
						} )
					}
				}
			} );
		}
			
		// Encode the payload and then load the game with the encoded payload in a parameter.
		window.location.href = 'game.html?' + btoa(JSON.stringify(payload)) 
	},

	/**
	 * 
	 */
	play: () => {
		// Unpack the payload
		let str = window.location.search
		if ( str ) {
			payload = JSON.parse( atob( str.substring(1) ) )
		}

		// This link takes us back home.
		let elem = document.getElementById( '-home' )
		elem.setAttribute( 'href', 'index.html' + str )

		// Build the map and update the UI
		if ( payload.level ) {
			map.gen.parse( payload.level )

			elem = document.getElementById( '-level' )
			elem.innerHTML = String( payload.level ).padStart( 3, '0' )

			elem = document.getElementById( '-description' )
			if ( levels.maps[payload.level-1].description ) {
				elem.innerHTML = levels.maps[payload.level-1].description
			} else {
				elem.innerHTML = ''
			}
		} else {
			map.gen.start( payload )

			elem = document.getElementById( '-level' )
			elem.innerHTML = payload.seed
			elem = document.getElementById( '-description' )
			elem.innerHTML = 'good luck!'
		}

		elem = document.getElementById( '-diamonds' )
		elem.innerHTML = 'diamonds: ' + map.diamonds
		elem = document.getElementById( '-monsters' )
		elem.innerHTML = 'monsters: ' + map.monsterCount
		
		// Key downs fire movement events in the game.
		document.addEventListener("keydown", (event) => {
			// Prevent repeated keypresses. Fire exactly once when the key is pressed.
			if ( event.repeat ) { 
				return
			}

			const keyName = event.key;
			if ( keyName === 'p' ) { 
				bolder.map()
			}
		} )

		bob.init()
		drawloop.start()
	},

	/**
	 * Adds an increment to Bob's score and updates the UI.
	 */
	addToScore: ( inc ) => {
		bolder.score += inc
		let elem = document.getElementById( '-score' )
		elem.innerHTML = 'score: ' + bolder.score
	},

	/**
	 * Adds an increment to Bob's score and updates the UI.
	 */
	decreaseDiamonds: () => {
		map.diamonds -= 1
		let elem = document.getElementById( '-diamonds' )
		elem.innerHTML = 'diamonds: ' + map.diamonds
		bolder.checkComplete()
	},

	/**
	 * Checks if the level is complete, and if it is, starts the next level sequence
	 */
	checkComplete: () => {
		if ( map.diamonds === 0 ) {
			// Display the banner again with a 'well done' message.
			let elem = document.getElementById( '-level' )
			elem.innerHTML = 'Well done'
			elem = document.getElementById( '-description' )
			elem.innerHTML = 'level complete'
			elem = document.getElementById( '-banner' )
			elem.setAttribute( 'class', 'level-complete')

			// Set the complete timer to 3 seconds. This will call nextLevel() when it runs out.
			drawloop.completeTime = 3000
		}
	},

	/**
	 * Takes us to the next level
	 */
	nextLevel: () => {
		let str = window.location.search
		if ( str ) {
			let payload = JSON.parse( atob( str.substring(1) ) )

			// If this payload had a level we can progress to the next one.
			if ( payload.level ) {
				bolder.submit( payload.level+1 )
				localStorage['bolder.progress'] = Math.max( localStorage['bolder.progress'] | 0, parseInt(payload.level)+1 )
			} 
			
			// This was a random level. There's nowhere to go next so lets follow the home link.
			else {
				let elem = document.getElementById( '-home' )
				window.location.href = elem.getAttribute( 'href' )
			}
		}
	},

	/**
	 * Called from the UI when the player is stuck. Kills bob.
	 */
	stuck: () => {
		bob.killBob()
	},

	/**
	 * Makes the DOM element displaying the level's JSON visible.
	 */
	json: () => {
		let elem = document.getElementById( '-json' )
		if ( elem.style.display === 'none' ) {
			elem.style.display = 'block'
		} else {
			elem.style.display = 'none'
		}
	},

	/**
	 * Opens the map version of the full level.
	 */
	map: () => {
		// Pause the drawloop and put a 'paused' class on <body>. CSS will take care of the UI.
		drawloop.pause()
		document.getElementById( '-body' ).classList.toggle( 'paused' )

		// Centre the map nicely in the display.
		if ( drawloop.paused ) {
			let viewport = document.getElementById( '-viewport' )
			let canvas = document.getElementById( '-canvas' )
	
			let offsetX = ( viewport.getBoundingClientRect().width - ( map.width*64*0.3 ) ) / 2
			let offsetY = ( viewport.getBoundingClientRect().height - ( map.height*64*0.3 ) ) / 2
			canvas.style.left = offsetX + 'px'
			canvas.style.top = offsetY + 'px'
		} else {
			bob.centreDisplay()
		}
	},

	/**
	 * Switch to the selected tab in the index.html UI.
	 */
	tab: ( index ) => {
		// Select the tab itself.
		let tabs = document.getElementById( '-tabs' )
		for ( let i=0; i < tabs.children.length; i++ ) {
  			let tab = tabs.children[i];
			tab.setAttribute( 'class', i === index ? 'selected' : '' )
		}

		// Make the tab's content appear.
		tabs = document.getElementById( '-content' )
		for ( let i=0; i < tabs.children.length; i++ ) {
  			let tab = tabs.children[i];
			tab.setAttribute( 'class', i === index ? '' : 'hidden' )
		}

		localStorage['bolder.tab'] = index
	}
};