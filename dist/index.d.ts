import { EditorView } from 'prosemirror-view';
import { LanguageFn } from 'highlight.js';

/**
 * 入口文件
 * @param el
 * @param store
 * @param goUrl
 * @param upload
 * @param props
 */
declare const editorView: (el: HTMLElement, store: (res: object) => void, goUrl: (url: string) => void, upload: (file: File) => Promise<string>, props?: {
    placeholder?: string;
    imgUrl?: string;
    languages?: {
        name: string;
        language: LanguageFn;
        simple?: string[];
    }[];
}) => EditorView;

export { editorView };
