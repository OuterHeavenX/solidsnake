# Flag Segment Logistics Milestone

The logistics model is being tightened so flags are operational depots rather than decorative routing markers.

## Rules

- A road section between two flags is a **segment**.
- Each segment owns a dedicated carrier.
- Cargo waits physically at a flag until the carrier for the required outgoing segment can take it.
- At the next flag the cargo is dropped and becomes available to that flag's next segment carrier.
- Adding a flag to an existing road splits that road into additional segments and therefore changes carrier ownership/routing.
- Flag inspection should expose connected segments, assigned carriers, and queued goods.

This milestone intentionally prioritizes visible, understandable logistics before adding further game systems.
