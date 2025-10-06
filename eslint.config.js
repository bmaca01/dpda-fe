import js from '@eslint/js'
import typescript from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import prettier from 'eslint-plugin-prettier/recommended'

export default [
  js.configs.recommended,
  ...typescript.configs.recommended,
  ...vue.configs['flat/recommended'],
  prettier,
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: typescript.parser,
      },
    },
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]
