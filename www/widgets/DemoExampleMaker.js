/* global Widget, WIDGETS, Convo, NNE, NNW, utils */
class DemoExampleMaker extends Widget {
  constructor (opts) {
    super(opts)
    this.key = 'demo-example-maker'
    this.listed = false
    this.title = 'Demo/Example Maker'
    this._curStep = 0
    this._sections = null
    this._data = {
      name: null, toc: true, tags: [], layout: 'dock-left', key: null, code: null, steps: []
    }
    utils.get('api/examples', (res) => {
      this._data.key = Math.max(...Object.keys(res.data)) + 1
      this._sections = res.sections
      this._createHTML(res.sections.map(o => o.name))
    })

    const loadData = () => {
      if (!this.$('.demo-example-maker')) {
        return setTimeout(() => loadData(), 100)
      }

      if (utils.url.example) {
        const obj = WIDGETS['code-examples'].exData
        console.log('loadData', obj)
        const data = JSON.parse(NNE._decode(obj.hash))
        console.log('loadData', data)
        this._data = {
          name: obj.name,
          tags: obj.tags,
          toc: obj.toc,
          layout: obj.layout,
          key: Number(obj.key),
          code: obj.code,
          steps: obj.info
        }
      } else if (window.location.hash.includes('#example/')) {
        const hash = window.location.hash.split('#example/')[1]
        const data = JSON.parse(NNE._decode(hash))
        console.log(NNE._decode(hash))
        console.log(data)
        data.steps = data.info
        this._data = data
      }

      console.log(this._data)
      if (this._data.steps) this._selectStep(this._data.steps[0])
      this.$('[name="dem-demo-name"]').value = this._data.name
      this.$('[name="dem-demo-layout"]').value = this._data.layout
      this.$('[name="dem-demo-toc"]').checked = this._data.toc
      if (this._data.tags && this._data.tags instanceof Array) {
        this.$('[name="dem-demo-tags"]').value = this._data.tags.join(',')
      } else if (this._data.tags && typeof this._data.tags === 'string') {
        this.$('[name="dem-demo-tags"]').value = this._data.tags.join(',')
      }
    }

    this.on('open', () => {
      if (utils.url.example || window.location.hash.includes('#example/')) {
        WIDGETS['code-examples'].close()
        loadData()
      }
    })
  }

  _createHTML (types) {
    this.innerHTML = `
      <style>
        .demo-example-maker > textarea {
          width: 100%;
          margin: 10px 5px;
          border-radius: 5px;
          padding: 5px;
          border: none;
        }
        textarea[name="dem-s-text"] {
          background: var(--netizen-meta);
        }
        textarea[name="dem-url"] {
          display: none;
          color: var(--netizen-meta);
          background-color: var(--netizen-hint-shadow);
        }
        .demo-example-maker-row {
          display: flex;
          justify-content: space-between;
        }
      </style>
      <div class="demo-example-maker">
        editing step <select name="dem-current-step"></select>
        <button name="dem-add-step" style="float: right">add new step</button>
        <br>
        <br>
        <hr>
        <input placeholder="step title" type="text" name="dem-s-title">
        <input type="text" placeholder="line numbers (comma separated)" name="dem-s-focus">
        <br>
        <textarea name="dem-s-text" placeholder="explain step"></textarea>
        <br>
        <button name="dem-preview-step">preview</button>
        <button name="dem-update-step">update this step</button>
        <button name="dem-remove-step">remove this step</button>
        <br>
        <br>
        <hr>
        <div style="margin: 10px 15px;">
          <div class="demo-example-maker-row">
            <span>layout <select name="dem-demo-layout"></select></span>
            <span>
              display toc <input type="checkbox" name="dem-demo-toc">
              (table of contents)
            </span>
          </div>
          tags (for json) <input type="text" placeholder="(comma separated)"
            name="dem-demo-tags" style="width: 370px">
        </div>
        <hr>
        <div style="float: right">
          <button name="dem-gen-url">generate link</button>
          <button name="dem-up-json">upload json</button>
          <button name="dem-dl-json">download json</button>
          <input name="dem-demo-name" placeholder="demo name (for json file)" type="text">
        </div>
        <br>
        <br>
        <textarea name="dem-url"></textarea>
      </div>
    `
    this._addStep({
      title: 'getting started',
      focus: null,
      text: 'in this step...'
    })

    this.$('[name="dem-current-step"]').addEventListener('change', (e) => {
      const s = Number(e.target.value)
      this._selectStep(this._data.steps[s])
    })

    this.$('[name="dem-preview-step"]').addEventListener('click', () => {
      this._previewStep(this._curStep)
    })

    this.$('[name="dem-add-step"]').addEventListener('click', () => {
      this._addStep()
    })

    this.$('[name="dem-update-step"]').addEventListener('click', () => {
      this._updateStep(this._curStep)
    })

    this.$('[name="dem-remove-step"]').addEventListener('click', () => {
      this._updateStep(this._curStep, 'remove')
    })

    this.$('[name="dem-gen-url"]').addEventListener('click', () => {
      this._generateURL()
    })

    this.$('[name="dem-up-json"]').addEventListener('click', () => {
      this._uploadJSON(this)
    })

    this.$('[name="dem-dl-json"]').addEventListener('click', () => {
      if (!this._data.name) window.alert('you must enter a name for this file')
      else this._downloadJSON()
    })

    this.$('[name="dem-s-focus"]').addEventListener('click', () => {
      if (NNE.cm.getSelection().length > 0) {
        const arr = []
        const lines = NNE.cm.getSelection().split('\n')
        const code = NNE.code.split('\n')
        lines.forEach(l => {
          const idx = code.indexOf(l)
          if (idx >= 0) arr.push(idx + 1)
        })
        this.$('[name="dem-s-focus"]').value = arr.join(',')
      }
    })

    // ...
    const urlReset = (e, key) => {
      this._data[key] = key === 'tags'
        ? e.target.value.split(',').map(s => s.trim())
        : e.target.value
      this.$('[name="dem-url"]').value = null
      this.$('[name="dem-url"]').style.display = 'none'
    }

    this.$('[name="dem-demo-name"]')
      .addEventListener('input', e => urlReset(e, 'name'))

    this.$('[name="dem-url"]').addEventListener('click', (e) => {
      // e.target.focus()
      // e.target.select()
      // navigator.clipboard.writeText(e.target.value)
      utils.copyLink(e.target)
    })

    NNW.layouts.filter(l => l !== 'welcome').forEach(layout => {
      const o = document.createElement('option')
      o.textContent = layout
      o.value = layout
      this.$('[name="dem-demo-layout"]').appendChild(o)
    })
    this.$('[name="dem-demo-layout"]').value = 'dock-left'
    this.$('[name="dem-demo-layout"]')
      .addEventListener('input', e => urlReset(e, 'layout'))

    this.$('[name="dem-demo-toc"]').checked = true
    this.$('[name="dem-demo-toc"]')
      .addEventListener('input', e => urlReset(e, 'toc'))

    this.$('[name="dem-demo-tags"]')
      .addEventListener('input', e => urlReset(e, 'tags'))
  }

  // ------------------------------

  _previewStep (step) {
    window.convo = new Convo({ content: this.$('[name="dem-s-text"]').value })
    if (this.$('[name="dem-s-focus"]').value.length > 0) {
      const lines = this.$('[name="dem-s-focus"]').value.match(/\d+/g).map(Number)
      NNE.spotlight([...lines])
    } else NNE.spotlight(null)
  }

  _addStep (step) {
    step = step || { title: null, focus: null, text: null }
    this._data.steps.push(step)
    this._selectStep(step)
  }

  _updateStep (step, remove) {
    if (remove) {
      const prev = step - 1
      if (prev < 0) return window.alert('need at least 1 step')
      this._data.steps.splice(step, 1)
      this._selectStep(prev)
    } else {
      this._data.steps[step] = {
        title: this.$('[name="dem-s-title"]').value,
        focus: this.$('[name="dem-s-focus"]').value || null,
        text: this.$('[name="dem-s-text"]').value
      }
      this._selectStep(step)
    }
  }

  _selectStep (step) {
    this._curStep = (typeof step === 'number')
      ? step
      : this._data.steps.indexOf(step)
    step = (typeof step === 'number') ? this._data.steps[step] : step

    const stepSelect = this.$('[name="dem-current-step"]')
    stepSelect.innerHTML = ''
    this._data.steps.forEach((s, i) => {
      const o = document.createElement('option')
      o.textContent = `${i}. ${s.title}`
      o.value = i
      stepSelect.appendChild(o)
    })
    stepSelect.selectedIndex = this._curStep

    this.$('[name="dem-s-title"]').value = step.title
    this.$('[name="dem-s-focus"]').value = step.focus
    this.$('[name="dem-s-text"]').value = step.text
  }

  // ------------------------------

  _getData () {
    const name = this._data.name
    const key = this._data.key
    const toc = this._data.toc
    const tags = this._data.tags
    const layout = this._data.layout
    const info = this._data.steps.map(s => {
      if (s.focus && typeof s.focus === 'string') {
        s.focus = s.focus.split(',').map(n => Number(n))
      }
      return s
    })
    const code = `#code/${NNE._encode(NNE.code)}`
    return { name, toc, tags, layout, key, code, info }
  }

  _generateURL () {
    const data = this._getData()
    const str = JSON.stringify(data)
    const loc = window.location
    const l = this._data.layout !== 'dock-left' ? `?layout=${this._data.layout}` : ''
    const url = `${loc.protocol}//${loc.host}/${l}#example/${NNE._encode(str)}`
    this.$('[name="dem-url"]').value = url
    this.$('[name="dem-url"]').style.display = 'block'
  }

  _uploadJSON (dem) {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.addEventListener('change', function () {
      const file = fileInput.files[0]
      if (file.type !== 'application/json') {
        throw new Error('File uploaded was not a JSON file')
      } else {
        const reader = new window.FileReader()
        reader.onload = function () {
          const e = JSON.parse(reader.result)
          NNE.code = NNE._decode(e.code.split('#code/').pop())
          if (e.info) {
            if (dem._data.steps.length > e.info.length) {
              const extra = dem._data.steps.length - e.info.length
              for (let step = 0; step < extra; step++) {
                dem._updateStep(dem._data.steps.length - step, 'remove')
              }
              dem._data.steps.forEach((step, i) => {
                if (i > 0) {
                  dem._updateStep(step, 'remove')
                }
              })
            }
            e.info.forEach((step, i) => {
              if (i === 0 || i < dem._data.steps.length) {
                dem._data.steps[i] = {
                  title: step.title,
                  focus: step.focus || null,
                  text: step.text
                }
              } else { dem._addStep(step) }
              dem._selectStep(0)
            })
          } else {
            for (let step = dem._data.steps.length; step >= 1; step--) { dem._updateStep(step, 'remove') }
            dem._data.steps[0] = {
              title: 'getting started',
              focus: null,
              text: 'in this step...'
            }
            dem._selectStep(dem._data.steps[0])
          }
          dem.$('[name="dem-demo-name"]').value = e.name
          if (e.tags) { dem.$('[name="dem-demo-tags"]').value = e.tags }
          dem.$('[name="dem-demo-layout"]').value = e.layout
          dem.$('[name="dem-demo-toc"]').checked = e.toc
        }
        reader.readAsText(file)
      }
    })
    fileInput.click()
  }

  _downloadJSON () {
    const data = this._getData()
    const str = JSON.stringify(data, null, 2)
    const uri = `data:application/json;base64,${utils.btoa(str)}`
    const name = data.name.toLowerCase().replace(/\s/g, '_')
    const a = document.createElement('a')
    a.setAttribute('download', `${data.key}--${name}.json`)
    a.setAttribute('href', uri)
    a.click()
    a.remove()
  }
}

window.DemoExampleMaker = DemoExampleMaker
