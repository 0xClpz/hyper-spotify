import { isEqual } from 'lodash'
import SpotifyManager from '../lib/SpotifyManager'
import IconFactory from '../components/Icon'
import TrackInfoFactory from '../components/TrackInfo'

const HyperSpotifyWidgetFactory = (React) => {
  const { Component } = React

  const Icon = IconFactory(React) // eslint-disable-line no-unused-vars
  const TrackInfo = TrackInfoFactory(React) // eslint-disable-line no-unused-vars

  const skipActions = {
    previous: 'PREV',
    next: 'NEXT'
  }

  const initialState = {
    isRunning: false,
    isPlaying: false,
    track: {
      name: '',
      artist: ''
    }
  }

  return class extends Component {
    constructor (props) {
      super(props)

      this.state = {
        isRunning: false,
        isPlaying: false,
        track: {
          name: '',
          artist: ''
        }
      }
    }

    performSoundCheck () {
      // console.log('SoundCheck...', new Date(), 'at', this)

      if (!this._reactInternalInstance) {
        // Kill this interval since its container does not exists anymore
        if (this.soundCheck) {
          clearInterval(this.soundCheck)
        }

        return
      }

      SpotifyManager.isRunning()
        .then(isRunning => {
          this.setState({ isRunning })

          if (isRunning) {
            // Get Play/Pause state
            SpotifyManager.getState()
              .then((spotifyState) => {
                this.setState({ isPlaying: (spotifyState.state === 'playing') })

                // Get Track details
                return SpotifyManager.getTrack()
              })
              .then((track) => {
                // console.log('currentTrack', track)
                this.setState({ track })
              })
              .catch(() => {
                this.setState({ ...initialState })
              })
          }
        })
        .catch(() => {
          this.setState({ ...initialState })
        })
    }

    togglePlayState () {
      const { isRunning } = this.state

      if (isRunning) {
        SpotifyManager.togglePlayPause()
          .then((spotifyState) => {
            this.setState({ isPlaying: (spotifyState.state === 'playing') })
          })
          .catch(() => {
            this.setState({ ...initialState })
          })
      }
    }

    _getSkipPromise (skipAction) {
      const { previous, next } = skipActions

      switch (skipAction) {
        case previous:
          return SpotifyManager.previousTrack()

        case next:
          return SpotifyManager.nextTrack()
      }
    }

    skipTo (skipAction) {
      const { isRunning } = this.state

      if (isRunning) {
        this._getSkipPromise(skipAction)
            .then((track) => {
              // console.log('newTrack', track)
              this.setState({ track })
            })
            .catch(() => {
              this.setState({ ...initialState })
            })
      }
    }

    componentDidMount () {
      // console.log('HyperSpotifyWidget didMount')

      if (!this.soundCheck) {
        this.soundCheck = setInterval(() => this.performSoundCheck(), 5000)
      }

      this.performSoundCheck()
    }

    componentWillUnmount () {
      // console.log('HyperSpotifyWidget willUnmount')

      if (this.soundCheck) {
        clearInterval(this.soundCheck)
      }
    }

    shouldComponentUpdate (nextProps, nextState) {
      return !isEqual(nextState, this.state)
    }

    renderControls () {
      const {
        previous,
        next
      } = skipActions

      const {
        isRunning,
        isPlaying
      } = this.state

      if (isRunning) {
        return (
          <div style={styles.constrolsContainerStyle}>
            <Icon
              iconName='previous'
              onClick={() => this.skipTo(previous)}
              style={styles.iconStyle}
            />

            <Icon
              iconName={isPlaying ? 'pause' : 'play'}
              onClick={() => this.togglePlayState()}
              style={styles.iconStyle}
            />

            <Icon
              iconName='next'
              onClick={() => this.skipTo(next)}
              style={styles.iconStyle}
            />
          </div>
        )
      }

      return (
        <Icon
          iconName='spotify'
          onClick={() => console.log('Start spotify')}
          style={styles.iconStyle}
        />
      )
    }

    render () {
      const {
        track
      } = this.state

      return (
        <div style={styles.widgetStyle}>
          {this.renderControls()}
          <TrackInfo
            track={track}
          />
        </div>
      )
    }
  }
}

const styles = {
  'widgetStyle': {
    height: 30,
    fontSize: 12,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  'constrolsContainerStyle': {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  'iconStyle': {
    height: 16,
    width: 16,
    marginRight: 6,
    backgroundColor: '#FFF'
  }
}

export default HyperSpotifyWidgetFactory
