import { Node, Schema } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import hljs from 'highlight.js/lib/core'
import plaintext from 'highlight.js/lib/languages/plaintext'
import typescript from 'highlight.js/lib/languages/typescript'
import javascript from 'highlight.js/lib/languages/javascript'
import markdown from 'highlight.js/lib/languages/markdown'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import less from 'highlight.js/lib/languages/less'
import { HLJSOptions, LanguageFn } from 'highlight.js'
import crelt from 'crelt'

type StactTree = {
    children: StactTree[]
    scope: string
} | string

interface TokenTreeEmitter {
    options: HLJSOptions
    stack: StactTree[]
}

interface CodeInfo {
    from: number
    to: number
    classNames: string[]
    scope: string
}

hljs.registerLanguage('plaintext', plaintext)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('html & xml', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('less', less)

export const Languages = ['plaintext', 'typescript', 'javascript', 'markdown', 'html & xml', 'css', 'less']
const languageSimple = [
    {
        simple: ['html', 'xml'],
        name: 'html & xml'
    },
    {
        simple: ['ts'],
        name: 'typescript'
    },
    {
        simple: ['js'],
        name: 'javascript'
    }
]

export const setLanguages = (languages: { name: string, language: LanguageFn, simple?: string[] }[]) => {
    languages.forEach(item => {
        hljs.registerLanguage(item.name, item.language)
        Languages.push(item.name)

        if (item.simple) {
            languageSimple.push({ simple: item.simple, name: item.name })
        }
    })
}

export const getLanguage = (name: string) => {
    let language = name
    languageSimple.forEach(item => {
        if (item.simple.includes(name)) language = item.name
    })
    return language
}

export default (schema: Schema) => {
    let pos: number = 0
    const startInfos: CodeInfo[] = []
    const endInfos: CodeInfo[] = []

    const codeDecorations = (doc: Node): Decoration[] => {
        let decorations: Decoration[] = []

        const nodes: { node: Node, pos: number }[] = []
        doc.descendants((node, pos) => {
            if (node.type == schema.nodes.code_block) {
                nodes.push({ node, pos })
            }
        })
        nodes.forEach(item => {
            decorations = decorations.concat(lineNumberDecorations(item.node, item.pos))

            let language: string = item.node.attrs.language
            if (!language || !hljs.getLanguage(language)) {
                language = 'plaintext'
            }
            const result = hljs.highlight(item.node.textContent, { language })
            const emitter = (result._emitter as unknown) as TokenTreeEmitter
            pos = item.pos + 1
            emitter.stack.forEach(code => {
                if (typeof (code) == 'object') {
                    codeTreeToArray(code.children, emitter.options.classPrefix)
                }
            })
            if (endInfos.length) {
                const codeDecorations = endInfos.map(codeInfo => Decoration.inline(codeInfo.from, codeInfo.to, {
                    class: codeInfo.classNames.join(' '),
                    nodeName: 'span'
                }))
                decorations = decorations.concat(codeDecorations)
            }
            endInfos.splice(0, endInfos.length)
        })

        return decorations
    }

    const codeTreeToArray = (data: StactTree[], classPrefix: string) => {
        data.forEach(item => {
            if (typeof (item) == 'string') {
                pos += item.length
            } else {
                startInfos.push({
                    from: pos,
                    to: -1,
                    classNames: item.scope.split('.').map((value, index) => index == 0 ? classPrefix + value : value + '_'),
                    scope: item.scope
                })
                if (item.children) codeTreeToArray(item.children, classPrefix)
                const info = startInfos.pop() as CodeInfo
                info.to = pos
                endInfos.push(info)
            }
        })
    }

    const lineNumberDecorations = (node: Node, linePos: number) => {
        linePos = linePos + 1
        const lineArr = node.textContent.split('\n')
        return lineArr.map((item, index) => {
            const span = crelt('span', { class: 'code-line', 'data-line-number': `${index + 1}` })
            const decoration = Decoration.widget(linePos, span, {
                side: -1,
                ignoreSelection: true,
                destroy: () => {
                    span.remove()
                }
            })
            linePos += item.length + 1
            return decoration
        })
    }

    return new Plugin({
        state: {
            init(_, instance) {
                const decorations = codeDecorations(instance.doc)
                return {
                    decorations: DecorationSet.create(instance.doc, decorations)
                }
            },
            apply(tr, data) {
                if (!tr.docChanged) return data
                const decorations = codeDecorations(tr.doc)
                return {
                    decorations: DecorationSet.create(tr.doc, decorations)
                }
            }
        },
        props: {
            decorations(state) {
                const pluginsState = this.getState(state)
                return pluginsState?.decorations
            }
        }
    })
}