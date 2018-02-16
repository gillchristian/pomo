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

const REST_DURATION = 5 * 60 * 1000
const WORK_DURATION = 25 * 60 * 1000

const root = document.getElementById('root')

const render = getRenderer(root)
const updateState = getStateUpdater({
  REST_DURATION,
  WORK_DURATION,
})

let state = {
  time: WORK_DURATION,
  isWorking: true,
  showNotification: false,
  canShowNotifications: false,
}

render(state)

requestNotificationPermission(state)

setInterval(() => {
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

