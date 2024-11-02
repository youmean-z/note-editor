import crelt from 'crelt'
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

const loadingIcon: string = '<svg viewbox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8zm4 18H6V4h7v5h5zM8 15.01l1.41 1.41L11 14.84V19h2v-4.16l1.59 1.59L16 15.01 12.01 11z"></path></svg>'
export const loading = new Plugin({
  state: {
    init() { return DecorationSet.empty },
    apply(tr, set) {
      set = set.map(tr.mapping, tr.doc)
      const action = tr.getMeta(loading)
      if (action && action.add) {
        const widget = crelt('span', { class: 'img_loading' })
        widget.innerHTML = loadingIcon + ' <span>正在上传...</span>'
        const deco = Decoration.widget(action.add.pos, widget, { id: action.add.id, side: -1 })
        set = set.add(tr.doc, [deco])
      } else if (action && action.remove) {
        set = set.remove(set.find(undefined, undefined, spec => spec.id == action.remove.id))
      }
      return set
    }
  },
  props: {
    decorations(state) { return this.getState(state) }
  }
})