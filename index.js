const formatTime = t => {
  const s = t / 1000
  const m = `${Math.floor(s / 60)}`.padStart(2, '0')
  const sr = `${s % 60}`.padStart(2, '0')
  return `${m}:${sr}`
}

const getRenderer = target => ({ time, isWorking }) => {
  const color = isWorking ? 'white' : '#333'
  const bgColor = isWorking ? '#333' : 'white'

  target.innerHTML = `
    <div class="container" style="background-color: ${bgColor};">
      <h1 style="color: ${color};">
        ${formatTime(time)}
      </h1>
    <div>
  `
}

const getStateUpdater = config => s => {
  const time = s.time - 1000

  if (time === 0) {
    return {
      ...s,
      time: s.isWorking ? config.REST_DURATION : config.WORK_DURATION,
      isWorking: !s.isWorking,
      showNotification: true,
    }
  }

  return {
    ...s,
    time,
    showNotification: false,
  }
}

const showNotification = (s, title, options) => {
  if (s.canShowNotifications) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, options)
    })
  }
}

const requestNotificationPermission = (state) => {
  Notification.requestPermission((result) => {
    if (result === 'granted') {
      state.canShowNotifications = true
    }
  })
}

// ------------------------------------------------------

navigator.serviceWorker.register('sw.js')

const REST_DEFAULT = 5 * 60 * 1000
const WORK_DEFAULT = 25 * 60 * 1000

const getPomo = (config = {})  => {

  const REST_DURATION = config.rest || REST_DEFAULT
  const WORK_DURATION = config.work || WORK_DEFAULT

  const root = document.getElementById('root')

  const render = getRenderer(root)
  const updateState = getStateUpdater({
    REST_DURATION,
    WORK_DURATION,
  })

  const defaultState = {
    time: WORK_DURATION,
    isWorking: true,
    showNotification: false,
    canShowNotifications: false,
  }

  let state = { ...defaultState }
  let interval

  render(state)

  requestNotificationPermission(state)

  const start = () => setInterval(() => {
    state = updateState(state)

    if (state.showNotification) {
      const title = state.isWorking ? 'Back to work' : 'Get some rest yo!'
      const body = state.isWorking
        ? 'Time to concentrate and be productive!'
        : 'Time to stretch your legs and get some water...'

      showNotification(state, title, {
        body,
        icon: './pomo.jpg',
      })
    }

    render(state)
  }, 1000)

  return {
    stop() {
      clearInterval(interval)

      state = { ...defaultState }
    },

    pause() {
      clearInterval(interval)
    },

    start() {
      interval = start()
    }
  }
}

const pomo = getPomo()

pomo.start()
