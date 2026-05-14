# Geometry facts (extracted from reference STLs)

All in millimeters, in the **Voyager-left-half local frame** of `reference/bottom_plate_left.STL`:

- **Footprint:** X 0 .. 137.85 (pinky → thumb), Y 0 .. 136.87 (front → rear), plate thickness 2.3 mm.
- **Pinky edge:** X = 0. **Thumb edge:** X = 137.85.
- **Front edge:** Y = 0. **Rear edge:** Y = 136.87.
- The Voyager-right half is the mirror of the left about the X axis.

## Magnetic leg sockets (the ZSA attachment interface)

Two circular sockets recessed into the **bottom face** of the plate:

| Name | Center (X, Y) | Diameter | Depth |
|---|---|---|---|
| Front socket | (119.24, 13.66) | Ø 16.50 mm | 1.0 mm (Z 0 → Z 1.0) |
| Rear socket | (105.40, 114.36) | Ø 16.50 mm | 1.0 mm |

Both sockets sit on the **thumb side** of the half (high X). The Brick attaches by pushing two registration pegs up into these sockets; magnets at the peg tips hold against whatever ferromagnetic / magnetic feature ZSA has inside.

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

## Socket heights in posture

Where each Brick mounting post must terminate (Z above desk at the socket center):

- Front post top (at 119.24, 13.66): z = 0.57309 · 119.24 + 0.12421 · 13.66 ≈ **70.0 mm**
- Rear post top (at 105.40, 114.36): z = 0.57309 · 105.40 + 0.12421 · 114.36 ≈ **74.6 mm**

## Bumper feet pattern (Brick's bottom face)

Four feet, 5 mm inset from each Brick corner, suitable for 3M Bumpon SJ5012 (Ø 10 mm).

## Right-half mirror

To produce the right Brick, mirror everything about X (in the **Voyager-pair** frame where the two halves meet at the user's centerline). The footprint, sockets, and corner-height pattern flip; sign of `a` flips, `b` stays.
