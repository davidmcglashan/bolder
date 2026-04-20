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
		{ name: "startFraction", label: "Start in top fraction (1/...)", type: "number", value: 5, after: 'column' },
		
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
		let form = document.getElementById( 'form' )
		let elem = null
		
		// If there was a payload in the URL use that to put values in the form elems
		let payload = null		
		let str = window.location.search
		if ( str ) {
			payload = JSON.parse( atob( str.substring(1) ) )	
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
				input.setAttribute( 'value', payload ? payload[field.name] : field.value )
				input.setAttribute( 'placeholder', field.value )
			}

			label.appendChild( input )
		} )

		// Put today's date in the seed box
		elem = document.getElementById( 'seed' )
		elem.setAttribute( 'value', payload ? payload['seed'] : random.getSeed() )
	},

	/**
	 * Submit's the user's form. This builds a small JSON object representing the form's state,
	 * base64 encodes it and sticks that in the GET of game.html.
	 */
	submit: () => {
		let payload = {}

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

		// Load the game with the encoded form in a parameter.
		window.location.href = 'game.html?' + btoa(JSON.stringify(payload)) 
	},

	go: ( ) => {
		// Unpack the payload
		let str = window.location.search
		if ( str ) {
			payload = JSON.parse( atob( str.substring(1) ) )
		}

		// Build the map and update the UI
		map.gen.start( payload )
		let elem = document.getElementById( '-diamonds' )
		elem.innerHTML = 'diamonds: ' + map.diamonds
		elem = document.getElementById( '-home' )
		elem.setAttribute( 'href', 'index.html' + str )
				
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
		elem.style.display = 'block'
		elem = document.getElementById( '-viewport' )
		elem.style.display = 'none'
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
	}
}