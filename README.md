## A simple markdown WYSIWYG editor

### index.d.ts
```ts
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
```

### example
```js
editorView(document.getElementById('editor'), res => { //The first parameter is HTMLElement
    console.log(res) //Click mod+s to trigger, res is the entire content object
}, url => {
    console.log(url) //Click on tag a to trigger, url is the link address
    window.open(url)
}, (file) => new Promise(resolve => {
    console.log(file) //Click mod+u to trigger, file is the selected image, return the uploaded address string
    setTimeout(() => {
        resolve('/it/u=446981511,947966320&fm=253&fmt=auto&app=120&f=JPEG?w=750&h=500')
    }, 2000)
}), {
    imgUrl: 'https://img2.baidu.com' //Image prefix address
})
```