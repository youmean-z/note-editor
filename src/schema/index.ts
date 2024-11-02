import { Schema } from 'prosemirror-model'

let imgUrl = 'http://img.test.com'
export const setImgUrl = (url: string) => {
    imgUrl = url
}

export default new Schema({
    nodes: {
        doc: {
            content: 'title block*'
        },
        paragraph: {
            content: 'inline*',
            group: 'block',
            parseDOM: [{ tag: 'p' }],
            toDOM: () => ['p', 0]
        },
        title: {
            content: 'inline*',
            group: 'block',
            marks: '',
            defining: true,
            toDOM: () => ['h1', 0]
        },
        text: {
            group: 'inline'
        },
        hard_break: {
            inline: true,
            group: 'inline',
            selectable: false,
            parseDOM: [{ tag: 'br' }],
            toDOM: () => ['br']
        },
        horizontal_rule: {
            group: 'block',
            parseDOM: [{ tag: 'hr' }],
            toDOM: () => ['hr']
        },
        heading: {
            attrs: { level: { default: 1 } },
            content: 'inline*',
            group: 'block',
            marks: '',
            defining: true,
            parseDOM: [
                { tag: 'h1', attrs: { level: 1 } },
                { tag: 'h2', attrs: { level: 2 } },
                { tag: 'h3', attrs: { level: 3 } },
                { tag: 'h4', attrs: { level: 4 } },
                { tag: 'h5', attrs: { level: 5 } },
                { tag: 'h6', attrs: { level: 6 } },
            ],
            toDOM: (node) => ['h' + node.attrs.level, 0]
        },
        blockquote: {
            content: 'block+',
            group: 'block',
            defining: true,
            parseDOM: [{ tag: 'blockquote' }],
            toDOM() {
                return ['blockquote', 0]
            }
        },
        ordered_list: {
            content: 'list_item+',
            group: 'block',
            attrs: { order: { default: 1 } },
            parseDOM: [{
                tag: 'ol',
                getAttrs: (node) => {
                    return {
                        order: (node as HTMLElement).hasAttribute('start') ? +(node as HTMLElement).getAttribute('start')! : 1
                    }
                }
            }],
            toDOM: (node) => {
                return node.attrs.order == 1 ? ['ol', 0] : ['ol', { start: node.attrs.order }, 0]
            }
        },
        bullet_list: {
            content: 'list_item+',
            group: 'block',
            parseDOM: [{ tag: 'ul' }],
            toDOM: () => ['ul', 0]
        },
        list_item: {
            content: 'paragraph (paragraph | ordered_list | bullet_list)*',
            defining: true,
            parseDOM: [{ tag: 'li' }],
            toDOM: () => ['li', 0]
        },
        code_block: {
            content: 'text*',
            group: 'block',
            marks: 'em',
            defining: true,
            code: true,
            attrs: { language: { default: 'plaintext' }, copy: { default: false } },
            parseDOM: [{
                tag: 'pre',
                preserveWhitespace: 'full',
                getAttrs: (node) => {
                    return {
                        language: (node as HTMLElement).dataset.language
                    }
                }
            }],
            toDOM: (node) => ['pre', { 'data-language': node.attrs.language }, ['code', { 'lang': node.attrs.language, 'class': 'hljs' }, 0]]
        },
        image: {
            inline: true,
            attrs: {
                src: { default: '' },
                alt: { default: null },
                title: { default: null }
            },
            group: 'inline',
            draggable: true,
            parseDOM: [{
                tag: 'img[src]',
                getAttrs(node) {
                    return {
                        src: (node as HTMLElement).getAttribute('src'),
                        title: (node as HTMLElement).getAttribute('title'),
                        alt: (node as HTMLElement).getAttribute('alt')
                    }
                }
            }],
            toDOM: (node) => {
                let { src, alt, title } = node.attrs;
                src = /^http/.test(src) ? src : imgUrl + src
                return ['img', { src, alt, title }]
            }
        },
    },
    marks: {
        strong: {
            parseDOM: [
                { tag: 'strong' },
                { tag: 'b', getAttrs: (node) => (node as HTMLElement).style.fontWeight != 'normal' && null },
                { style: 'font-weight=400', clearMark: m => m.type.name == 'strong' },
                { style: 'font-weight', getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null }
            ],
            toDOM: () => ['strong', 0]
        },
        em: {
            parseDOM: [
                { tag: 'i' }, { tag: 'em' },
                { style: 'font-style=italic' },
                { style: 'font-style=normal', clearMark: m => m.type.name == 'em' }
            ],
            toDOM: () => ['em', 0]
        },
        code: {
            parseDOM: [
                { tag: 'code' },
            ],
            excludes: '_',
            toDOM: () => ['code', 0]
        },
        link: {
            attrs: {
                href: { default: '' },
                title: { default: null }
            },
            inclusive: false,
            excludes: '_',
            parseDOM: [{
                tag: 'a[href]',
                getAttrs(node) {
                    return { href: (node as HTMLElement).getAttribute('href'), title: (node as HTMLElement).getAttribute('title') }
                }
            }],
            toDOM: (node) => ['a', { href: node.attrs.href, title: node.attrs.title }, 0]
        },
    }
})