const bolder = {
	go: ( level ) => {
		if ( level ) {
			map.loadMap( level )
		} else {
			let payload = {
				minWidth: 25,
				maxWidth: 45,
				minHeight: 25,
				maxHeight: 45
			}

			let str = window.location.search
			if ( str ) {
				payload = JSON.parse( atob( str.substring(1) ) )
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