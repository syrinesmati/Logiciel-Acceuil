import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['out/**', 'dist/**', 'release/**', 'node_modules/**', 'src/renderer/src/components/ui/**'] },
  {
    files: ['src/main/**/*.ts', 'src/preload/**/*.ts', 'src/shared/**/*.ts', '*.ts'],
    extends: [tseslint.configs.recommended],
    languageOptions: {
      globals: { ...globals.node }
    }
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    languageOptions: {
      globals: { ...globals.browser }
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
      // Le fetch-on-mount via IPC (window.api.*) est notre seul mecanisme de
      // chargement de donnees (pas de lib de data-fetching) : ce pattern est
      // volontaire, pas une erreur.
      'react-hooks/set-state-in-effect': 'off'
    }
  }
)
