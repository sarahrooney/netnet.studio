/* global
  StateManager, Netitor,
  TutorialManager, WindowManager, MenuManager,
  NetitorErrorHandler, NetitorEduInfoHandler
*/

const STORE = new StateManager({
  log: true
})

const NNE = new Netitor({
  ele: '#nn-editor',
  render: '#nn-output',
  background: false,
  code: window.greetings.starterCode
})

window.NNT = new TutorialManager()
window.NNW = new WindowManager()
window.NNM = new MenuManager()

// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*
// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•* EVENT LISTENERS

NNE.on('lint-error', (e) => {
  // if (e.length > 0) {
  //   catchError = JSON.stringify({ rule: e[0].rule, message: e[0].message })
  //   console.log(catchError);
  // }
  const errz = NetitorErrorHandler.parse(e)
  if (errz) STORE.dispatch('SHOW_ERROR_ALERT', errz)
  else if (!errz && STORE.is('SHOWING_ERROR')) STORE.dispatch('CLEAR_ERROR')
})

NNE.on('cursor-activity', (e) => {
  if (STORE.is('SHOWING_EDU_ALERT')) STORE.dispatch('HIDE_EDU_ALERT')
  window.localStorage.setItem('code', NNE._encode(NNE.code))
})

NNE.on('edu-info', (e) => {
  const edu = NetitorEduInfoHandler.parse(e)
  if (edu) {
    if (STORE.is('SHOWING_EDU_TEXT')) STORE.dispatch('SHOW_EDU_TEXT', edu)
    else STORE.dispatch('SHOW_EDU_ALERT', edu)
  }
})

// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*

window.addEventListener('DOMContentLoaded', (e) => {
  window.greetings.loader()
})

window.addEventListener('resize', (e) => {
  window.utils.windowResize()
  window.utils.keepWidgetsInFrame()
})

window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.keyCode === 83) { // s
    e.preventDefault()
    STORE.dispatch('OPEN_WIDGET', 'functions-menu')
  } else if ((e.ctrlKey || e.metaKey) && e.keyCode === 79) { // o
    e.preventDefault()
    window.WIDGETS['functions-menu'].openFile()
  } else if ((e.ctrlKey || e.metaKey) && e.keyCode === 190) { // >
    e.preventDefault()
    STORE.dispatch('NEXT_LAYOUT')
  } else if ((e.ctrlKey || e.metaKey) && e.keyCode === 188) { // <
    e.preventDefault()
    STORE.dispatch('PREV_LAYOUT')
  } else if ((e.ctrlKey || e.metaKey) && e.keyCode === 59) { // :
    e.preventDefault()
    STORE.dispatch('OPEN_WIDGET', 'tutorials-menu')
  } else if ((e.ctrlKey || e.metaKey) && e.keyCode === 222) { // "
    e.preventDefault()
    STORE.dispatch('OPEN_WIDGET', 'widgets-menu')
  } else if ((e.ctrlKey || e.metaKey) && e.keyCode === 191) { // ?
    e.preventDefault()
    STORE.dispatch('CHANGE_OPACITY', 1)
  } else if ((e.ctrlKey || e.metaKey) && e.keyCode === 13) { // enter
    if (!NNE.autoUpdate) NNE.update()
  } else if (e.keyCode === 27) { // esc
    if (window.NNM.search.opened) window.NNM.search.close()
    else window.utils.closeTopMostWidget()
  } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode === 80) {
    e.preventDefault() // CTRL/CMD+SHIFT+P
    e.stopPropagation() // TODO... not working :(
    window.NNM.search.open()
    return false
  }
})
