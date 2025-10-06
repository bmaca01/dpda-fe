#!/usr/bin/env bash

# npx shadcn-vue@latest add input
# npx shadcn-vue@latest add select
# npx shadcn-vue@latest add table
# npx shadcn-vue@latest add card
# npx shadcn-vue@latest add dialog
# npx shadcn-vue@latest add tabs
# npx shadcn-vue@latest add toast
# npx shadcn-vue@latest add alert
# npx shadcn-vue@latest add form
# npx shadcn-vue@latest add label
# npx shadcn-vue@latest add separator
set -ex
mkdir -p src/{api/{endpoints},components/{ui,dpda,compute,visualization,layout},composables,stores,views,schemas,types,utils,router}
mkdir -p tests/{unit,components,e2e/specs}
mkdir -p public/assets

# Create placeholder files for organization
touch src/api/client.ts
touch src/api/types.ts
touch src/router/index.ts
touch src/stores/dpda.ts
touch src/stores/ui.ts

