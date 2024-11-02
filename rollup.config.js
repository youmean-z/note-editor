import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import copy from 'rollup-plugin-copy'
import { dts } from 'rollup-plugin-dts'
import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript2'

export default [
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/index.js',
                format: 'es'
            }
        ],
        plugins: [
            typescript(),
            copy({
                targets: [{ src: 'src/style', dest: 'dist' }]
            }),
            terser(),
            nodeResolve(),
            commonjs()
        ]
    },
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/index.d.ts',
                format: 'es'
            }
        ],
        plugins: [
            dts()
        ]
    }
]