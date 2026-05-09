const sound = {
	synth: null,
	earthEnvelope: null,
	pinkEnvelope: null,
	whiteEnvelope: null,
	brownEnvelope: null,
	muted: localStorage['bolder.muted'],

	/**
	 * Sounds on or off. Stores the value in localstorage for future visits.
	 */
	toggleMute: () => {
		sound.muted = !sound.muted
		localStorage['bolder.muted'] = sound.muted
	},

	/**
	 * This synth is used by all the musical sounds.
	 */
	getSynth: () => {
		if ( !sound.synth ) {
			sound.synth = new Tone.Synth().toDestination()	
		}
		return sound.synth
	},

	/**
	 * Play the sounds for collecting a diamond - a bright D major chord
	 */
	diamond: () => {
		// Don't play if we're muted.
		if ( sound.muted ) { 
			return
		}

		let synth = sound.getSynth()
		let now = Tone.now();

		synth.triggerAttackRelease("D6", "8n", now, 0.5)
		synth.triggerAttackRelease("F#6", "8n", now + 0.05, 0.5)
		synth.triggerAttackRelease("A6", "8n", now + 0.1, 0.5)
	},

	/**
	 * A caged spirit plays an A7 chord
	 */
	cageSpirit: () => {
		// Don't play if we're muted.
		if ( sound.muted ) { 
			return
		}

		let synth = sound.getSynth()
		let now = Tone.now();
		
		synth.triggerAttackRelease("A4", "8n", now, 1)
		synth.triggerAttackRelease("C#5", "8n", now + 0.05, 1)
		synth.triggerAttackRelease("E5", "8n", now + 0.1, 1)
		synth.triggerAttackRelease("G5", "8n", now + 0.15, 1)
	},
	
	/**
	 * The safes opening plays a Bm7 chord
	 */
	openSafes: () => {
		// Don't play if we're muted.
		if ( sound.muted ) { 
			return
		}

		let synth = sound.getSynth()
		let now = Tone.now();

		synth.triggerAttackRelease("B2", "8n", now, 1)
		synth.triggerAttackRelease("D3", "8n", now + 0.05, 1)
		synth.triggerAttackRelease("F#3", "8n", now + 0.1, 1)
		synth.triggerAttackRelease("A3", "8n", now + 0.15, 1)
	},

	/**
	 * The sound of bob dying is a C# diminished chord
	 */
	killBob: () => {
		// Don't play if we're muted.
		if ( sound.muted ) { 
			return
		}

		let synth = sound.getSynth()
		let now = Tone.now();

		synth.triggerAttackRelease("C#3", "8n", now, 1)
		synth.triggerAttackRelease("E3", "8n", now + 0.05, 1)
		synth.triggerAttackRelease("G3", "8n", now + 0.1, 1)
	},

	/**
	 * The sound of bob dying is a G major chord
	 */
	killMonster: () => {
		// Don't play if we're muted.
		if ( sound.muted ) { 
			return
		}

		let synth = sound.getSynth()
		let now = Tone.now();

		synth.triggerAttackRelease("G3", "8n", now, 1)
		synth.triggerAttackRelease("B3", "8n", now + 0.05, 1)
		synth.triggerAttackRelease("D4", "8n", now + 0.1, 1)
	},

	/**
	 * Return the pinnk noise envelope used to play earth sounds.
	 */
	getEarthEnvelope: () => {
		if ( !sound.earthEnvelope ) {
			const noise = new Tone.Noise("pink")
	
			const filter = new Tone.Filter({
				type: "highpass",
				frequency: 4000, // Adjust this higher for a thinner hiss
				rolloff: -24
			})
	
			sound.earthEnvelope = new Tone.AmplitudeEnvelope( {
				attack: 0.1,
				decay: 0.1,
				sustain: 0.01,
				release: 0.01
			} )
			
			noise.connect(filter);
			filter.connect( sound.earthEnvelope )
			sound.earthEnvelope.toDestination()
			noise.start()
		}

		return sound.earthEnvelope
	},

	/**
	 * Play the sound of earth being dug.
	 */
	earth: () => {
		// Don't play if we're muted.
		if ( sound.muted ) { 
			return
		}

		let envelope = sound.getEarthEnvelope()
		envelope.triggerAttackRelease("8n");	
	},

	/**
	 * Play the sound of a boulder landing.
	 */
	boulderLanding: () => {
		// Don't play if we're muted.
		if ( sound.muted ) { 
			return
		}

		let envelope = sound.getPinkEnvelope()
		envelope.triggerAttackRelease( "8n" );
	},

	/**
	 * Play the sound of an egg landing and cracking.
	 */
	eggLanding: () => {
		// Don't play if we're muted.
		if ( sound.muted ) { 
			return
		}

		let envelope = sound.getWhiteEnvelope()
		envelope.triggerAttackRelease( "8n" );
	},

	/**
	 * Play the sound of a boulder rolling to the side.
	 */
	pushBoulder: () => {
		// Don't play if we're muted.
		if ( sound.muted ) { 
			return
		}

		let envelope = sound.getBrownEnvelope()
		envelope.triggerAttackRelease( "8n" );
	},
	
	/**
	 * Play the sound of a egg sliding along.
	*/
	pushEgg: () => {
		// Don't play if we're muted.
		if ( sound.muted ) { 
			return
		}

		let envelope = sound.getBrownEnvelope()
		envelope.triggerAttackRelease( "8n" );
	},
	
	getPinkEnvelope: () => {
		if ( !sound.pinkEnvelope ) {
			sound.pinkEnvelope = sound.getEnvelope( 'pink' )
		}
		return sound.pinkEnvelope
	},

	getWhiteEnvelope: () => {
		if ( !sound.whiteEnvelope ) {
			sound.whiteEnvelope = sound.getEnvelope( 'white' )
		}
		return sound.whiteEnvelope
	},

	getBrownEnvelope: () => {
		if ( !sound.brownEnvelope ) {
			sound.brownEnvelope = sound.getEnvelope( 'brown', 0.1, 0.1 )
		}
		return sound.brownEnvelope
	},

	/**
	 * Noises are white/brown/pink noises used for various in-game sounds.
	 */
	getEnvelope: ( colour, attack = 0.001, sustain = 0.1 ) => {
		let noise = new Tone.Noise( colour );
		let envelope = new Tone.AmplitudeEnvelope({
				attack: attack,
				decay: 0.2,
				sustain: sustain,
				release: 0.1
			} );

		noise.connect( envelope );
		envelope.toDestination();
		
		noise.start();
		return envelope

	}
};