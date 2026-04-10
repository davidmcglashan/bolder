const bolder = {
	fields: [
		{ name: "seed", label: "Level seed", help: "Leave this blank for today's seed", type: "text" },
		{ name: "minWidth", label: "Minimum width", type: "number", value: 25 },
		{ name: "maxWidth", label: "Maximum width", type: "number", value: 45 },
		{ name: "minHeight", label: "Minimum height", type: "number", value: 25 },
		{ name: "maxHeight", label: "Maximum height", type: "number", value: 45 },
		{ name: "minCutaways", label: "Minimum number of cut-aways", type: "number", value: 0 },
		{ name: "maxCutaways", label: "Maximum number of cut-aways", type: "number", value: 8 },
	],

	buildForm: () => {
		let elem = document.getElementById( 'form' )

		bolder.fields.forEach( ( field ) =>  {
			let label = document.createElement( 'label' )
			elem.appendChild( label )

			let text = document.createTextNode( field.label )
			label.appendChild( text )

			let input = document.createElement( 'input' )
			input.setAttribute( 'name', field.name )
			input.setAttribute( 'type', field.type )
			if ( field.value ) {
				input.setAttribute( 'value', field.value )
			}
			label.appendChild( input )
		} )
	},

	submit: () => {
		let payload = {}
		let inputs = document.querySelectorAll("input")
		inputs.forEach( ( input ) => {
  			payload[input.name] = input.value
		} );
		window.location.href = 'game.html?' + btoa(JSON.stringify(payload)) 
	},

	go: ( level ) => {
		if ( level ) {
			map.loadMap( level )
		} else {
			let str = window.location.search
			if ( str ) {
				payload = JSON.parse( atob( str.substring(1) ) )
				console.log( payload )
			}

			map.buildMapFromSeed( payload )
		}

		document.addEventListener("keydown", (event) => {
			const keyName = event.key;
			if ( keyName === "ArrowUp" || keyName === 'k' ) { map.bobUp() }
			if ( keyName === "ArrowDown" || keyName === 'm'  ) { map.bobDown() }
			if ( keyName === "ArrowLeft" || keyName === 'z'  ) { map.bobLeft() }
			if ( keyName === "ArrowRight"  || keyName === 'x' ) { map.bobRight() }
		} )

		drawloop.start()
	}
}