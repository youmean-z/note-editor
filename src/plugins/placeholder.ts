import crelt from 'crelt'
import { Schema } from 'prosemirror-model'
import { Plugin, TextSelection } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

const span = crelt('span', { class: 'placeholder' })
const decoration = Decoration.widget(1, span, {
    ignoreSelection: true,
    destroy: () => {
        span.remove()
    }
})

span.innerHTML = '请输入标题......'
export const setPlaceholder = (placeholder: string) => {
    span.innerHTML = placeholder
}

export default (schema: Schema) => {
    return new Plugin({
        state: {
            init(_, instance) {
                return {
                    decorations: DecorationSet.create(instance.doc, [decoration])
                }
            },
            apply(tr, data) {
                if (!tr.docChanged) return data

                if (tr.doc.firstChild?.textContent == '') {
                    return {
                        decorations: DecorationSet.create(tr.doc, [decoration])
                    }
                }
                return {
                    decorations: DecorationSet.create(tr.doc, [])
                }
            },
        },
        props: {
            decorations(state) {
                const pluginsState = this.getState(state)
                return pluginsState?.decorations
            }
        },
        filterTransaction(tr) {
            if (tr.selection.$anchor.pos == 0 && tr.doc.firstChild?.textContent == '') {
                tr.setSelection(TextSelection.create(tr.doc, 1))
            }
            return true
        },
    })
}