// Vite's `?asset` suffix imports a file and yields its emitted path as a
// string. The declarations for it used to arrive via `types:
// ["electron-vite/node"]` in tsconfig — but electron-vite is not a dependency
// of this project (it builds with @electron-forge/plugin-vite), so that entry
// only ever resolved to nothing and made tsc bail out before it typechecked
// anything at all. Declaring the module shape here instead keeps the imports
// typed without pulling in a build tool we do not use.
declare module "*?asset" {
  const src: string;
  export default src;
}
