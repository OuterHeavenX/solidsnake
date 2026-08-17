# JSettlers Browser Port

This repository is becoming a browser-native port/reimplementation of the MIT-licensed JSettlers project at `paulwedeck/settlers-remake`.

## Porting rule

The original Java simulation is the behavioral reference. We will port mechanics, data structures, algorithms, and state machines subsystem-by-subsystem rather than replacing them with unrelated timer-only city-builder logic.

Browser-specific systems (rendering, input, storage, audio, threading and networking) are implemented with Web APIs.

Original Settlers III proprietary GFX/SND/MAP assets are not copied into this repository. Browser artwork must be original, permissively licensed, or supplied with appropriate rights.

## Phase 1: world + logistics

Source areas being audited first:

- `jsettlers.logic/.../map/grid/MainGrid.java`
- `jsettlers.logic/.../map/grid/flags/FlagsGrid.java`
- `jsettlers.logic/.../movable/Movable.java`
- `jsettlers.logic/.../movable/MovableManager.java`
- `jsettlers.logic/.../movable/cargo/CargoMovable.java`
- trading / transportation request classes

### Browser architecture target

- Grid state: typed arrays / compact indexed storage inspired by JSettlers grid classes.
- Blocked/protected/marked flags: browser port of `FlagsGrid` semantics.
- Movement: deterministic tick-driven movable state rather than purely cosmetic oscillation.
- Logistics: explicit transportation requests with pickup, waypoint travel, delivery and completion.
- Goods: physical cargo assigned to transporters instead of instantly teleporting between global inventory counters.
- Roads/flags: graph nodes and paths that constrain transport.
- Rendering: remains Canvas2D initially so the simulation can be validated on iPhone before an art overhaul.

## Compatibility

`stable/pages-working-2026-08-16` preserves the first known-good GitHub Pages browser build before the real JSettlers port begins.

## Licensing

See `LICENSE-JSETTLERS.txt`. Copyright and MIT notice from the upstream project are retained for portions derived from JSettlers.
