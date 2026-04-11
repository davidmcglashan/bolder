const bolder = {
	score: 0,

	fields: [
		{ name: "seed", label: "Level seed", help: "Leave this blank for today's seed", type: "text", after: true },

		{ name: "minWidth", label: "Minimum width", type: "number", value: 25 },
		{ name: "maxWidth", label: "Maximum width", type: "number", value: 45 },
		{ name: "minHeight", label: "Minimum height", type: "number", value: 25 },
		{ name: "maxHeight", label: "Maximum height", type: "number", value: 45, after: true },

		{ name: "minCutaways", label: "Minimum number of cut-aways", type: "number", value: 2 },
		{ name: "maxCutaways", label: "Maximum number of cut-aways", type: "number", value: 8, after: true },

		{ name: "diamondChance", label: "Diamond likelihood (1 in ...)", type: "number", value: 5 },
		{ name: "safeChance", label: "Safe likelihood (1 in ...)", type: "number", value: 20 },
		{ name: "boulderChance", label: "Boulder likelihood (1 in ...)", type: "number", value: 5 },
		{ name: "holeChance", label: "Hole likelihood (1 in ...)", type: "number", value: 10 },
		{ name: "wallChance", label: "Wall likelihood (1 in ...)", type: "number", value: 10, after: true },

		{ name: "extraWallMin", label: "Minimum number of extra walls", type: "number", value: 4 },
		{ name: "extraWallMax", label: "Maximum number of extra walls", type: "number", value: 8 },
		{ name: "extraWallHole", label: "Extra wall holey-ness (1 in ...)", type: "number", value: 2 },
		{ name: "extraWallDirChange", label: "Extra wall direction change (1 in ...)", type: "number", value: 4, after: true },

		{ name: "startFraction", label: "Start in top fraction (1/...)", type: "number", value: 5, after: true },

		{ name: "bouldersFatal", label: "Falling boulders are fatal", type: "checkbox", value: true },
		{ name: "spiritsFatal", label: "Spirits are fatal", type: "checkbox", value: true },
	],

	/**
	 * Builds the form on the index page with all the payload parameters as <input>s.
	 */
	buildForm: () => {
		let elem = document.getElementById( 'form' )

		bolder.fields.forEach( ( field ) =>  {
			// Everything has a label.
			let label = document.createElement( 'label' )
			elem.appendChild( label )
			if ( field.after ) {
				label.setAttribute( 'class', 'gapAfter' )
			}

			// Labels have text
			let text = document.createTextNode( field.label )
			label.appendChild( text )

			// All fields become inputs.
			let input = document.createElement( 'input' )
			input.setAttribute( 'name', field.name )
			input.setAttribute( 'type', field.type )

			// Put the default value from the JSON into the form field so default play is sensible.
			if ( field.value ) {
				// Checkboxes need slightly different HTML.
				if ( field.type === 'checkbox' && field.value ) {
					input.setAttribute( 'checked', 'checked' )
				} else {
					input.setAttribute( 'value', field.value )
				}
			}
			label.appendChild( input )
		} )
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
				payload[input.name] = input.value
			}
		} );

		// Load the game with the encoded form in a parameter.
		window.location.href = 'game.html?' + btoa(JSON.stringify(payload)) 
	},

	go: ( level ) => {
		if ( level ) {
			map.loadMap( level )
		} else {
			let str = window.location.search
			if ( str ) {
				payload = JSON.parse( atob( str.substring(1) ) )
			}

			map.buildMapFromSeed( payload )
			let elem = document.getElementById( '-diamonds' )
			elem.innerHTML = 'diamonds: ' + map.diamonds
		}
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

	json: () => {
		let elem = document.getElementById( '-json' )
		elem.style.display = 'block'
		elem = document.getElementById( '-viewport' )
		elem.style.display = 'none'
	}
}