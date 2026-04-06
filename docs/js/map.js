const map = {
	level: 0,
	entities: [],

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
			for ( let x = 0; x < lobj.height; x++ ) {
				let elem = document.createElement( 'div' )
				elem.style.left = x*64 + 'px'
				elem.style.top = y*64 + 'px'
				view.appendChild( elem )

				switch( lobj.map[c] ) {
					case '#':
						elem.setAttribute( 'class', 'wall entity' )
						break
					case '.':
						elem.setAttribute( 'class', 'earth entity' )
						break
					case 'O':
						elem.setAttribute( 'class', 'boulder entity' )
						break
					case '^':
						elem.setAttribute( 'class', 'diamond entity' )
						break
					case 'x':
						elem.setAttribute( 'class', 'bob entity' )
						break
				}
				c=c+1
			}
		}
	}
}