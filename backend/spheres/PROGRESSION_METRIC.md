# Sphere progression metric

`SphereSerializer` now exposes a `progression` field computed on the backend.

## Calculation

The current formula is:

```
progression = clamp(impact_score, 0, 100)
```

Where:

- `impact_score` is the persisted sphere score.
- `clamp(x, 0, 100)` means any value below `0` becomes `0`, and any value above `100` becomes `100`.

## Why this exists

- Guarantees the frontend receives a defined numeric value.
- Prevents rendering artifacts such as `undefined%`.
- Keeps the progress bar range consistent with a 0-100 UI percentage.
