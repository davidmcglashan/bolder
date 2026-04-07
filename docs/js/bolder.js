const bolder = {
	go: () => {
		map.loadMap(0)

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