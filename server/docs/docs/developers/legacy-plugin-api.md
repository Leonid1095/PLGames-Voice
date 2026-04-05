# Plugin API

:::warning
The Plugin API is very powerful. **Tread carefully.**

**Zero guarantees or sandboxes are provided.** Your code is run as-is.
:::

This document details the experimental plugin API available in the client.

This is a proof of concept but can be used to achieve some simple client modifications.

## Plugin Manifest

Below is the specification for revision 1 of the plugin API. The `format` parameter is not currently enforced but you should set it to `1` to avoid future breakage.

````typescript
type Plugin = {
  format: 1;
  version: string;
  namespace: string;
  id: string;
  entrypoint: string;
  enabled?: boolean;
};
````

An example plugin:

```javascript
{
    format: 1,
    version: "0.0.1",
    namespace: "example",
    id: "my-plugin",
    entrypoint: `(state) => {
        console.log('[my-plugin] Plugin init!');
        return {
            onUnload: () => console.log('[my-plugin] bye!')
        }
    }`
}
```

## Using the Plugin API

To begin, you can load plugins using the global plugin manager at `state.plugins`.

Open the developer console and run:

```javascript
state.plugins.load({ ... });
```

## Plugin API

A plugin's entrypoint is required to return an object which is referred to as the **instance**:

```typescript
interface Instance {
  onUnload?: () => void;
}
```
