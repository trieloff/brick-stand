# Geometry facts (extracted from reference STLs)

All in millimeters, in the **Voyager-left-half local frame** of `reference/bottom_plate_left.STL`:

- **Footprint:** X 0 .. 137.85 (pinky → thumb), Y 0 .. 136.87 (front → rear), plate thickness 2.3 mm.
- **Pinky edge:** X = 0. **Thumb edge:** X = 137.85.
- **Front edge:** Y = 0. **Rear edge:** Y = 136.87.
- The Voyager-right half is the mirror of the left about the X axis.

## ZSA tripod-mount interface (the brick's attachment target)

ZSA ships an official tripod-mount plate (~38 × 38 mm, owned by the designer). It mates centrally to the keyboard via four corner pegs and four diamond-pattern magnets. The brick replicates this same interface on its top face.

**Zone center:** (63.10, 81.90) in left-half frame.

### Peg receptacles (verified in STL)

Four small circular features at z ≈ 0.11 mm, Ø ~2.2 mm, on the corners of a **33.26 × 33.26 mm square** around the zone center:

| Position | (X, Y) |
|---|---|
| Front-pinky corner | (46.50, 65.30) |
| Front-thumb corner | (79.70, 65.30) |
| Rear-thumb corner | (79.70, 98.50) |
| Rear-pinky corner | (46.50, 98.50) |

The brick's matching pegs are ~Ø 2.15 mm × 1.5 mm tall (slip-fit into the keyboard receptacles).

### Magnets (per the designer's measurements of the ZSA mount plate)

Four magnets, **Ø 5 mm**, in a diamond rotated 45° from the corner-peg square. **Midpoint-to-midpoint distance between opposing magnets ≈ 18 mm**, so each magnet sits at **r = 9 mm** from the zone center, at the four cardinal directions:

| Direction | (X, Y) |
|---|---|
| Rear (Y+) | (63.10, 90.90) |
| Thumb (X+) | (72.10, 81.90) |
| Front (Y−) | (63.10, 72.90) |
| Pinky (X−) | (54.10, 81.90) |

These positions are not visible in the bottom-plate STL (magnets are embedded internally, flush with the inner face). Verified geometrically against the designer's measurements of the ZSA tripod-mount plate; depends on the assumption that ZSA placed corresponding magnets in matching positions.

### Central feature

A small (~Ø 3.8 mm) feature at the zone center, likely a tripod-screw recess. The brick top face does not need to engage this — it is irrelevant for the brick's attachment.

### Legacy: magnetic leg sockets (NOT used by the brick)

Two Ø 16.5 mm sockets at (119.24, 13.66) and (105.40, 114.36) accept the stock folding magnetic legs. The brick **replaces** the legs, so these sockets are not engaged.

## Measured posture (user-reported corner heights above the desk)

Mapped from user phrasing to the STL frame:

| Corner | (X, Y) | Z above desk |
|---|---|---|
| Front-pinky ("front-left") | (0, 0) | 0 mm (touching desk) |
| Rear-pinky ("rear-left, USB-port") | (0, 136.87) | 17 mm |
| Front-thumb ("front-right") | (137.85, 0) | 79 mm |
| Rear-thumb (derived) | (137.85, 136.87) | ~96 mm |

## Derived mating plane (in desk frame)

The keyboard's bottom face lies on the plane through those four corners. Closed form:

```
z(x, y) = a*x + b*y
a = 79 / 137.85   ≈ 0.57309
b = 17 / 136.87   ≈ 0.12421
```

- **Tent angle (rotation about Y, front-rear axis):** atan(a) ≈ **29.81°**, thumb-up.
- **Tilt angle (rotation about X, pinky-thumb axis):** atan(b) ≈ **7.08°**, rear-up.
- **Plane normal (toward desk):** proportional to (a, b, −1) = (0.57309, 0.12421, −1).

## Mating-pad heights in posture

The brick's top mating pad sits on the keyboard's bottom plane at the tripod-mount zone center and corners. Z above desk at each:

- **Zone center** (63.10, 81.90): z = 0.57309 · 63.10 + 0.12421 · 81.90 ≈ **46.2 mm**
- Front-pinky corner (46.50, 65.30): z ≈ **34.8 mm**
- Front-thumb corner (79.70, 65.30): z ≈ **53.8 mm**
- Rear-thumb corner (79.70, 98.50): z ≈ **57.9 mm**
- Rear-pinky corner (46.50, 98.50) z ≈ **38.9 mm**

The mating pad (~38 × 38 mm) sits on a tilted plane at these heights and tapers down on a tapered pedestal to the wider desk-contact base.

## Bumper feet pattern (Brick's bottom face)

Four feet, 5 mm inset from each Brick corner, suitable for 3M Bumpon SJ5012 (Ø 10 mm).

## Right-half mirror

To produce the right Brick, mirror everything about X (in the **Voyager-pair** frame where the two halves meet at the user's centerline). The footprint, sockets, and corner-height pattern flip; sign of `a` flips, `b` stays.
