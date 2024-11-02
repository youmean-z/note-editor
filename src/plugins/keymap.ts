import { baseKeymap, chainCommands, exitCode, toggleMark } from 'prosemirror-commands'
import { redo, undo } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { Schema } from 'prosemirror-model'
import { Command, TextSelection } from 'prosemirror-state'
import { getLanguage } from './highlight'

export default (schema: Schema) => {
    let type

    const keys: { [key: string]: Command } = {
        ...baseKeymap,
        'Mod-z': undo,
        'Shift-Mod-z': redo,
        Backspace: chainCommands((state, dipatch) => {
            const { tr, schema, selection } = state
            const { pos } = selection.$anchor
            const { node, offset } = tr.doc.childBefore(pos)
            if (dipatch && node) {
                if (node == tr.doc.firstChild) return false
                if (pos == offset + 1 && pos == selection.$head.pos && node.type == schema.nodes.heading) {
                    const { level } = node.attrs
                    if (level > 1)
                        tr.setNodeAttribute(pos - 1, 'level', level - 1)
                    else
                        tr.setBlockType(pos - 1, pos, schema.nodes.paragraph)
                    dipatch(tr)
                    return true
                }
            }
            return false
        }, baseKeymap['Backspace']),
        Enter: chainCommands((state, dipatch) => {
            const { tr, schema, selection } = state
            const { pos } = selection.$anchor
            const { node } = tr.doc.childBefore(pos)
            if (selection.$anchor.pos + selection.$from.depth == tr.doc.content.size) {
                document.activeElement?.scrollIntoView({ behavior: 'smooth', block: 'end' })
            }
            let update = false
            if (node) {
                const match = node.textContent.match(/^```([a-z]*)?$/)
                if (match) {
                    const language = getLanguage(match[1])
                    if (type = schema.nodes.code_block) tr.setBlockType(pos - node.textContent.length, pos, type, { language })
                    tr.delete(pos - node.textContent.length, pos)
                    update = true
                }
                const isHr = node.textContent.match(/^(?:\*\*\*)$/)
                if (isHr) {
                    if (type = schema.nodes.horizontal_rule) tr.replaceWith(pos - node.textContent.length - 1, pos, type.create())
                    update = true

                }
            }
            if (dipatch && update) {
                dipatch(tr)
                return true
            }
            return false
        }, (state, dipatch) => {
            const { tr, schema, selection } = state
            const { pos } = selection.$anchor
            const { node } = tr.doc.childBefore(pos)
            if (node && dipatch && pos == selection.$head.pos) {
                if (node.type == schema.nodes.ordered_list || node.type == schema.nodes.bullet_list) {
                    if (selection.$from.node().content.size == 0) {
                        if (selection.$from.node(-1).content.size == 2) {
                            if (node.childCount == 1) return false
                            tr.delete(pos - 3, pos)
                            if (selection.$from.node(-3).type == schema.nodes.list_item)
                                tr.insert(pos - 1, schema.nodes.list_item.create()).insert(pos + 1, schema.nodes.paragraph.create())
                            else
                                tr.insert(pos - 1, schema.nodes.paragraph.create())
                        } else {
                            tr.delete(pos - 2, pos)
                            if (selection.$from.node(-3).type == schema.nodes.list_item)
                                tr.insert(pos + 1, schema.nodes.list_item.create()).insert(pos + 3, schema.nodes.paragraph.create()).setSelection(TextSelection.near(tr.doc.resolve(pos + 3)))
                            else
                                tr.insert(pos, schema.nodes.paragraph.create()).setSelection(TextSelection.near(tr.doc.resolve(pos)))
                        }
                    } else {
                        tr.split(pos, 2)
                    }
                    dipatch(tr)
                    return true
                }
            }
            return false
        }, baseKeymap['Enter'])
    }

    if (type = schema.marks.strong) keys['Mod-b'] = toggleMark(type)
    if (type = schema.marks.em) keys['Mod-i'] = toggleMark(type)
    if (type = schema.marks.code) keys['Mod-o'] = toggleMark(type)
    if (type = schema.nodes.hard_break) {
        let br = type, cmd = chainCommands(exitCode, (state, dispatch) => {
            if (dispatch) dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView())
            return true
        })
        keys['Mod-Enter'] = cmd
    }

    if (type = schema.nodes.code_block) {
        keys['Mod-a'] = chainCommands((state, dispatch) => {
            const { selection, tr, doc } = state
            let update = false
            const block = doc.childBefore(selection.$anchor.pos)
            if (block.node?.type == schema.nodes.code_block) {
                tr.setSelection(TextSelection.create(tr.doc, block.offset + 1, block.offset + block.node.nodeSize - 1))
                update = true
            } else {
                if (block.node == tr.doc.firstChild)
                    tr.setSelection(TextSelection.create(tr.doc, 1, tr.doc.firstChild?.nodeSize as number - 1))
                else
                    tr.setSelection(TextSelection.create(tr.doc, TextSelection.near(doc.resolve(doc.firstChild?.nodeSize as number)).$anchor.pos, TextSelection.near(doc.resolve(doc.nodeSize - 3), -1).$anchor.pos))
                update = true
            }
            if (dispatch && update) {
                dispatch(tr)
                return true
            }
            return false
        }, baseKeymap['Mod-a'])

    }

    return keymap(
        keys
    )
}