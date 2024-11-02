import { EditorState, TextSelection } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import plugins from './plugins'
import schema, { setImgUrl } from './schema'
import { setPlaceholder } from './plugins/placeholder'
import { codeViewConstructor } from './nodeviews'
import { LanguageFn } from 'highlight.js'
import { setLanguages } from './plugins/highlight'
import { keymap } from 'prosemirror-keymap'
import { Node } from 'prosemirror-model'
import { loading } from './plugins/loading'

/**
 * 入口文件
 * @param el
 * @param store 
 * @param goUrl 
 * @param upload
 * @param props
 */
export default (el: HTMLElement, store: (res: object) => void, goUrl: (url: string) => void, upload: (file: File) => Promise<string>, props?: { placeholder?: string, imgUrl?: string, languages?: { name: string, language: LanguageFn, simple?: string[] }[] }) => {
    if (props && props.placeholder) setPlaceholder(props.placeholder)
    if (props && props.languages) setLanguages(props.languages)
    if (props && props.imgUrl) setImgUrl(props.imgUrl)

    let storeDoc: Node
    const options = {
        types: [{
            description: '只允许上传图片文件',
            accept: {
                'image/*': ['.png', '.gif', '.jpeg', '.jpg', '.webp']
            }
        }]
    }

    const editorState = EditorState.create({
        schema,
        doc: schema.nodeFromJSON({ type: 'doc', content: [{ type: 'title' }] }),
        plugins: plugins(schema).concat(loading).concat(keymap({
            'Mod-s': (state, dispatch) => {
                if (dispatch) {
                    if (storeDoc != state.doc)
                        store(state.doc.toJSON())
                    storeDoc = state.doc
                }
                return true
            }
        }))
    })

    const editorView = new EditorView(el, {
        state: editorState,
        nodeViews: {
            'code_block': codeViewConstructor
        },
        attributes: {
            'spellcheck': 'false'
        }
    })

    editorView.dom.addEventListener('click', e => {
        let url
        if (url = (e.target as HTMLElement).getAttribute('href'))
            goUrl(url)
    })

    editorView.dom.addEventListener('keydown', e => {
        if (navigator.userAgent.indexOf('Mac') != -1) {
            if (e.metaKey && e.key == 'u') uploadImg()
        } else {
            if (e.ctrlKey && e.key == 'u') uploadImg()
        }
    })
    let uploadLoading = false
    const uploadImg = () => {
        if (uploadLoading == false) {
            uploadLoading = true
            const id = {};
            (window as any).showOpenFilePicker(options).then((files: FileSystemFileHandle[]) => {
                return files[0].getFile()
            }).then((file: File) => {
                if (!editorView.state.tr.selection.empty) editorView.state.tr.deleteSelection()
                editorView.dispatch(editorView.state.tr.setMeta(loading, { add: { id, pos: editorView.state.tr.selection.from } }))
                return upload(file)
            }).then((res: string) => {
                const decos = loading.getState(editorView.state)
                const found = decos?.find(undefined, undefined, spec => spec.id == id)
                const pos = found?.length ? found[0].from : null
                if (pos == null) return
                editorView.dispatch(editorView.state.tr.replaceWith(pos, pos, schema.nodes.image.create({ src: res })).setMeta(loading, { remove: { id } }))
            }).catch(() => {
                editorView.dispatch(editorView.state.tr.setMeta(loading, { remove: { id } }))
                console.log('上传取消或错误')
            }).finally(() => {
                uploadLoading = false
            })
        }
    }

    return editorView
}