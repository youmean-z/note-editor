import { InputRule, textblockTypeInputRule, inputRules, smartQuotes, emDash, ellipsis, wrappingInputRule } from 'prosemirror-inputrules'
import { MarkType, NodeType, Schema } from 'prosemirror-model'
import { getLanguage } from './highlight'
import { TextSelection } from 'prosemirror-state'

const headingRule = (nodeType: NodeType) => {
    return new InputRule(/^(#{1,6})\s$/, (state, match, start, end) => {
        const { tr, selection } = state
        const { node } = tr.doc.childBefore(selection.$anchor.pos)
        if (node == tr.doc.firstChild) return null
        if (match[1])
            tr.replaceWith(start - 1, end, nodeType.create({ level: match[1].length })).setSelection(TextSelection.create(tr.doc, start))
        return tr
    })
}

const blockQuoteRule = (nodeType: NodeType) => {
    return wrappingInputRule(/^\s*>\s$/, nodeType)
}


const horizontalRule = (nodeType: NodeType) => {
    return new InputRule(/^\s*(\*\*\*)\s$/, (state, match, start, end) => {
        const { tr } = state
        if (match[0])
            tr.replaceWith(start - 1, end, nodeType.create()).setSelection(TextSelection.create(tr.doc, start))
        return tr
    })
}

const orderedListRule = (nodeType: NodeType) => {
    return wrappingInputRule(/^(\d+)\.\s$/, nodeType, match => ({ order: +match[1] }),
        (match, node) => node.childCount + node.attrs.order == +match[1])
}

const bulletListRule = (nodeType: NodeType) => {
    return wrappingInputRule(/^\s*([-+*])\s$/, nodeType)
}

const codeBlockRule = (nodeType: NodeType) => {
    return textblockTypeInputRule(/^```([a-z]*)?\s$/, nodeType, match => {
        const language = getLanguage(match[1])
        return { language }
    })
}

const imageRule = (nodeType: NodeType) => {
    return new InputRule(/\!\[([^![]*)\]\((.+)\)$/, (state, match, start, end) => {
        const { tr, schema } = state
        if (match[1] != null && match[2]) {
            tr.replaceWith(start, end, nodeType.create({ title: match[1], src: match[2] }))
        }
        return tr
    })
}

const strongRule = (markType: MarkType) => {
    return new InputRule(/(?:\*\*)([^*]+)(?:\*\*)$/, (state, _, start, end) => {
        const { tr, schema } = state
        tr.addMark(start + 2, end - 1, markType.create()).delete(end - 1, end).delete(start, start + 2)
        Object.keys(schema.marks).forEach(markKey => {
            tr.removeStoredMark(schema.marks[markKey])
        })
        return tr
    })
}

const emRule = (markType: MarkType) => {
    return new InputRule(/(?:^|[^*])\*([^*]+)\*$/, (state, match, start, end) => {
        const { tr, schema } = state
        tr.addMark(start + (match[0][0] == '*' ? 0 : 1), end, markType.create()).delete(end, end).delete(start + (match[0][0] == '*' ? 0 : 1), start + (match[0][0] == '*' ? 1 : 2))
        Object.keys(schema.marks).forEach(markKey => {
            tr.removeStoredMark(schema.marks[markKey])
        })
        return tr
    })
}

const codeRule = (markType: MarkType) => {
    return new InputRule(/(?:\`)([^`]+)(?:\`)$/, (state, _, start, end) => {
        const { tr, schema } = state
        tr.addMark(start + 1, end, markType.create()).delete(end, end).delete(start, start + 1)
        Object.keys(schema.marks).forEach(markKey => {
            tr.removeStoredMark(schema.marks[markKey])
        })
        return tr
    })
}

const linkRule = (markType: MarkType) => {
    return new InputRule(/\[([^[]+)\]\((.+)\)$/, (state, match, start, end) => {
        const { tr, schema } = state
        if (match[1] && match[2]) {
            tr.replaceWith(start, end, schema.text(match[1], [markType.create({ href: match[2] })]))
        }
        return tr
    })
}

export default (schema: Schema) => {
    const inputrules = smartQuotes.concat(emDash, ellipsis)

    let type
    if (type = schema.nodes.heading) inputrules.push(headingRule(type))
    if (type = schema.nodes.blockquote) inputrules.push(blockQuoteRule(type))
    if (type = schema.nodes.horizontal_rule) inputrules.push(horizontalRule(type))
    if (type = schema.nodes.bullet_list) inputrules.push(bulletListRule(type))
    if (type = schema.nodes.ordered_list) inputrules.push(orderedListRule(type))
    if (type = schema.nodes.code_block) inputrules.push(codeBlockRule(type))
    if (type = schema.nodes.image) inputrules.push(imageRule(type))
    if (type = schema.marks.strong) inputrules.push(strongRule(type))
    if (type = schema.marks.em) inputrules.push(emRule(type))
    if (type = schema.marks.code) inputrules.push(codeRule(type))
    if (type = schema.marks.link) inputrules.push(linkRule(type))

    return inputRules({ rules: inputrules })
}