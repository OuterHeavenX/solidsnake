# Browser engine modules

This directory is the replacement for the early runtime source-transform approach.

The currently deployed `app-v7.js` remains the known-good playable engine while systems are migrated and tested module-by-module.

- `config.js` — building/world definitions
- `state.js` — authoritative simulation state
- `logistics.js` — cargo/flag/segment domain helpers
- `construction.js` — construction sites, delivered materials and builders

No module in this directory patches JavaScript source strings at runtime. Once parity is reached, `index.html` will switch from the legacy runtime to a normal ES-module entry point.
