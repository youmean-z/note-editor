import { NodeView, NodeViewConstructor } from 'prosemirror-view'
import crelt from 'crelt'
import { Languages } from '../plugins/highlight'

export default class codeview implements NodeView {
    dom: HTMLElement
    contentDOM: HTMLElement

    copyDoc: HTMLElement
    isCopy: boolean = false
    baseIcon: string = '<svg viewbox="0 0 24 24"><path d="M15 20H5V7c0-.55-.45-1-1-1s-1 .45-1 1v13c0 1.1.9 2 2 2h10c.55 0 1-.45 1-1s-.45-1-1-1zm5-4V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h9c1.1 0 2-.9 2-2zm-2 0H9V4h9v12z"></path></svg>'
    successIcon: string = '<svg viewbox="0 0 24 24"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.24 11.28L9.69 11.2c-.38-.39-.38-1.01 0-1.4.39-.39 1.02-.39 1.41 0l1.36 1.37 4.42-4.46c.39-.39 1.02-.39 1.41 0 .38.39.38 1.01 0 1.4l-5.13 5.17c-.37.4-1.01.4-1.4 0zM3 6c-.55 0-1 .45-1 1v13c0 1.1.9 2 2 2h13c.55 0 1-.45 1-1s-.45-1-1-1H5c-.55 0-1-.45-1-1V7c0-.55-.45-1-1-1z"></path></svg>'

    constructor(...args: Parameters<NodeViewConstructor>) {
        const [node, view, getPos] = args;

        this.dom = crelt('pre', { 'data-language': node.attrs.language })

        this.copyDoc = crelt('div')
        this.copyDoc.innerHTML = this.baseIcon

        const codeMenu = crelt('div', { class: 'code-menu', contenteditable: 'false' },
            crelt('select', {
                class: 'code-language-select',
                name: 'language',
                onchange: (event: Event) => {
                    const lanaguage = (event.target as HTMLSelectElement).value
                    const { state, dispatch } = view
                    const pos = getPos()
                    if (pos != undefined) {
                        dispatch(state.tr.setNodeAttribute(pos, 'language', lanaguage))
                    }
                }
            }, Languages.map(item => crelt('option', { value: item, selected: item === node.attrs.language }, item))),
            crelt('div', {
                class: 'code-language-copy',
                onmousedown: () => {
                    if (!this.isCopy) {
                        const { state, dispatch } = view
                        navigator.clipboard.writeText(state.doc.textContent).then(() => {
                            const pos = getPos()
                            if (pos != undefined) {
                                this.isCopy = true
                                dispatch(state.tr.setNodeAttribute(pos, 'copy', !node.attrs.copy))
                            }
                        })
                    }
                }
            }, this.copyDoc)
        )

        const code = crelt('code', { class: 'hljs', lang: node.attrs.language })
        this.contentDOM = code

        this.dom.appendChild(codeMenu)
        this.dom.appendChild(code)
    }

    update(...params: Parameters<Required<NodeView>['update']>) {
        const [node] = params
        const { language } = node.attrs

        if (node.type.name !== 'code_block') {
            return false;
        }

        this.dom.dataset.language = language
        this.contentDOM.lang = language

        if (this.isCopy) {
            this.copyDoc.innerHTML = this.successIcon
            setTimeout(() => {
                this.isCopy = false
            }, 2000)
        } else {
            this.copyDoc.innerHTML = this.baseIcon
        }

        return true
    }
}