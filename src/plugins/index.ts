import { history } from 'prosemirror-history'
import { Plugin } from 'prosemirror-state'
import keymap from './keymap'
import { Schema } from 'prosemirror-model'
import inuptrules from './inuptrules'
import placeholder from './placeholder'
import highlight from './highlight'

export default (schema: Schema) => {
    const plugins: Plugin<any>[] = []

    plugins.push(history())
    plugins.push(keymap(schema))
    plugins.push(inuptrules(schema))
    plugins.push(highlight(schema))
    plugins.push(placeholder(schema))

    return plugins
}