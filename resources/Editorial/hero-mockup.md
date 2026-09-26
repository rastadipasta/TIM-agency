# Home hero: laptop video mockup

The HR and EN homepages share `hero-laptop.webp` and the existing
`../TIMDSGN — Kinetic Typography Intro.mp4`. Service pages use their original
artwork inside the same hero grid.

## Replace the screen video

1. Add the new MP4 under `resources/`.
2. In both `index.html` and `en/index.html`, change the `<source>` inside
   `#hero-screen-video`. Keep the `../` prefix on the EN page.
3. Export a 16:9 poster from the new video. Update both `poster` on the video and
   `src` on `.laptop-poster` in each homepage. The current poster is the frame at
   2 seconds, exported at 1280 × 720.

Keep `muted`, `playsinline`, `loop`, and `autoplay`. Different video aspect ratios
are contained against black, without cropping. There is no external video embed,
tracking, or upload service. The visible text in the existing animation is part
of the video and is shared between languages.

The pause/play control is keyboard accessible and localized. Playback pauses
offscreen, in a hidden tab, and during the site intro. User pause persists while
scrolling. Reduced motion and media errors show the separate static poster;
blocked autoplay leaves a play button for an explicit retry.

## Screen geometry

The SVG scene has a fixed `viewBox="0 0 1536 1024"`. Its HTML `foreignObject`
contains an 800 × 450 video plane. A CSS `matrix3d` projects its four corners to:

| Corner | Scene X | Scene Y |
| --- | ---: | ---: |
| Top left | 484 | 229 |
| Top right | 1213 | 208 |
| Bottom right | 1199 | 678 |
| Bottom left | 455 | 653 |

A second instance of the same scene image is masked with a transparent screen
opening and drawn above the video. It supplies the foreground bezel without a
second image download. The shared SVG coordinate system keeps all layers aligned
at every viewport; no resize script is required. `xMidYMid slice` fills the hero
cell while cropping only the outer architecture when its proportions change.

Replacing only the video needs no geometry changes. Replacing the laptop artwork
requires recalibrating these four corners, the SVG aperture, and the CSS matrix.

## Artwork provenance

`hero-laptop.webp` was generated with the built-in image generation tool, then
encoded as WebP (1536 × 1024, approximately 142 KiB). No API/CLI generation was
used. The original generated PNG remains in Codex's generated image directory.
The dark panel reuses the existing `mountain_orbit/source_ridge_detail.png` with a
CSS gradient. The gray panel is `#E7E7E4`; its SVG symbols are decorative geometry,
not client logos.

Generation prompt:

> Use case: product-mockup. Create a photorealistic premium website hero background asset, landscape 1536x1024. Monochrome warm-neutral architectural product photograph. One open slim dark silver laptop, entire laptop visible centered and large, occupying roughly 78% of width and 66% of height, resting on a pale raw concrete plinth. View from front slightly to the left, display almost front facing with gentle perspective: right edge of screen slightly higher than left. Screen is a perfectly blank uniform pure black plane with no glare, no graphics, no text; its four inner corners must be clearly visible and straight, no occlusion, to receive an HTML video overlay. Thin black bezel, fine silver outer rim, realistic keyboard and thin laptop base. Background: light warm gray raw concrete wall, strong diagonal architectural sunlight and broad shadow from upper left, subtle grain. Restrained beautiful composition, sophisticated minimalist architectural photography, crisp detail, believable materials. Do not add any words, logos, interface, UI, watermarks, objects or plants. Enough margin around laptop; do not crop any laptop edge. This is only the right half hero visual, not an entire webpage.
