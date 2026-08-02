# Treeline

A scrollytelling field record of eight species native to the Colorado Rockies, each placed at
the elevation where it actually lives. Scroll to descend from 14,440 ft to 8,000 ft.

**Live:** https://freakyfrancis.github.io/colorado-rockies-natives/

## The idea

Colorado's ecology is organised vertically. A thousand feet of climb is worth roughly three
hundred miles of travel north, so species stack up the slope in bands rather than spreading
evenly across it. The page is built as a descent: a fixed altimeter tracks your elevation as
you scroll, the life-zone readout changes as you cross 11,500 ft and 9,500 ft, and each
species appears at its own altitude.

## Colour

Every species' accent colour is sampled programmatically from its own photograph — the page
holds exactly one accent at a time and crossfades as you descend. The alpine entries read grey
because the alpine *is* grey; saturation only arrives lower down, with the columbine,
paintbrush and fireweed. Base tones are spruce-shadow near-blacks; the altimeter's zone bands
use hypsometric colours (rock-grey alpine, spruce-fir green subalpine, olive montane).

| # | Species | Accent |
|---|---|---|
| 01 | American pika | `#C4B7AC` |
| 02 | Yellow-bellied marmot | `#C68B58` |
| 03 | Rocky Mountain bighorn sheep | `#C0785F` |
| 04 | Colorado blue columbine | `#8E8ED4` |
| 05 | Indian paintbrush | `#DE6E58` |
| 06 | Rocky Mountain elk | `#AFA07C` |
| 07 | Fireweed | `#CE6BA6` |
| 08 | Quaking aspen | `#C3C3AB` |

## Stack

Static HTML, CSS and JS — no build step. GSAP + ScrollTrigger for scroll-linked motion, Lenis
for smooth scroll, both from CDN. Type is Fraunces, Archivo and IBM Plex Mono. Photography is
hotlinked from Unsplash.

All content is readable without JavaScript: nothing is hidden behind a scroll trigger, and
motion is layered on top rather than required. `prefers-reduced-motion` disables smooth scroll,
parallax, pinning and travel-based reveals.

## Running locally

```bash
python3 -m http.server 8123
```

Then open <http://localhost:8123>.

## Credits

Photography by Rafael Peier, christie greene, Daniel Forster, Caleb Jack, Shelley Johnson,
Elias Null, K8, Steph Wilson, Calvin Weibel, Michael Kirsh, Clint McKoy, David Rupert,
Tim Arterbury and Mike Scheid, via [Unsplash](https://unsplash.com).

Non-commercial personal project. Elevation ranges are typical rather than absolute.
