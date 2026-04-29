---
name: readme-from-screen
description: Find screen.jpg files and generate readme.md with component documentation template. Optionally scoped to a specific component by name or path.
---

Your task is to generate `readme.md` documentation files for UI components that have a `screen.jpg` screenshot.

## Steps

1. **Find targets**: If an argument was provided (component name or path), locate that specific component directory. Otherwise, use Glob to find all `screen.jpg` files in the project (pattern `**/screen.jpg`, excluding `node_modules`).

2. **For each found directory with `screen.jpg`**, do the following:
   - Skip if `readme.md` already exists (unless user explicitly asked to overwrite).
   - Find all screen images in the directory: `screen.jpg`, `screen-1.jpg`, `screen-2.jpg`, etc. (glob `screen*.jpg`).
   - Read the component source file (look for `index.tsx`, `index.ts`, or a file matching the directory name).
   - Analyze the component: its purpose (what it renders/does) and its props interface/type.
   - Generate `readme.md` using the template below.

## Template

```
# <ComponentName>

![screen](./screen.jpg)
![screen](./screen-1.jpg)
![screen](./screen-2.jpg)

<One or two sentences: what the component does. No type descriptions.>

## Пропсы

- `<propName>` — <brief description of what it controls or represents>
- ...
```

Rules for the template:
- Component name = PascalCase name from the source file (or directory name if unclear).
- Include only the image lines that actually exist in the directory (e.g. if only `screen.jpg` and `screen-1.jpg` exist, include only those two lines).
- Description must be concise, in Russian, focused on behavior/purpose — not types.
- List only props from the component's own props interface (not inherited/HTML props).
- Prop descriptions in Russian, one line each, no type info.
- If the component has no props, omit the `## Пропсы` section entirely.

After writing all files, briefly report: how many `readme.md` files were created and which directories.
