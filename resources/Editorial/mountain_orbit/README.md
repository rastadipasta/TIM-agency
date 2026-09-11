# Mountain orbit — reproducible render

Final video: `../mountain_orbit_loop_8s.mp4`.

The compositor uses fixed raster textures on rigid, upright 3-D planes, a locked
perspective camera, and a stationary image-textured mountain relief surface.
Occlusion is resolved per pixel using perspective-correct plane depths. Foreground
and background buffers retain antialiased mountain edges without light halos.
No image generation, optical-flow interpolation, or frame-dependent texture repair
is used. The stone-textured decorative rectangle stays stationary.

## Source reconstruction

The visible poster artwork comes directly from `../source/home.png`. Occluded black
and white areas are extended once; concealed folded artwork and stone texture are
completed deterministically. The sharper rock ridge in the existing related
`../source/graphic.png` supplies the hidden mountain peak; the visible home-image
base and footprint are retained. These unseen areas are reconstructions, not
recoverable original pixels.

A flattened illustration does not establish unique 3-D positions. The initial
camera and poster geometry are fitted to its projected quadrilaterals. A restrained
oblique angle and the nearest collision-free asymmetric angular arrangement are
then used: a literal fit of the original overlaps caused plane intersections during
the full turn. The resulting relative offsets remain fixed throughout the video.
The exact parameters and source-fit comparison are recorded in `scene.json`.

## Timing

192 frames at 24 fps. Frame n uses angle = initial + 2*pi*n/192. Clockwise is viewed
from above; a panel at the front of the orbit moves toward screen-left. An upright
camera-facing orientation follows the viewer with a constant modest oblique offset.
The textures, panel dimensions and heights are fixed. Perspective naturally varies
screen-space speed while world angular speed stays constant.

The mathematical t=8 endpoint is identical to t=0 and is excluded from encoding.
There is no duplicate terminal frame. Rendering is at 2160 square, downsampled to
1080 square. Output is H.264, CRF 16, slow preset, yuv420p, BT.709, silent, with
fast-start metadata.

## Reproduce

Python dependencies: numpy, scipy, Pillow, opencv-python-headless, imageio-ffmpeg, av.
This workspace has the additional video dependencies in `.tmp/mountain_orbit_deps`;
the script discovers that directory automatically. On another machine install the
dependencies in the active Python environment.

Run these commands from this directory:

```powershell
python render_orbit.py prepare
python render_orbit.py calibrate
python render_orbit.py mesh
python render_orbit.py contact
python render_orbit.py encode
python render_orbit.py finalize
```

`finalize` independently rechecks the complete orbit, the supersampled loop
boundary, and the encoded video, and regenerates previews. `verification.json`
records geometry, timing, decoded frame count, fixed-pixel checks and file hash.
The layers directory also contains a textured OBJ representation and camera-depth
array of the stationary mountain surface.

Preview files: `preview_540.mp4` and `preview_432.gif`.
