import { NodeViewConstructor } from 'prosemirror-view'
import codeview from './codeview'

export const codeViewConstructor: NodeViewConstructor = (...args) => new codeview(...args)