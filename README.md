# Ali's Project Island

My portfolio as a small 3D island you can drive around. Each landmark is one of my projects. Drive up to one (or click it) to open its dossier with the live website, the repository, an image, and Pitch / Design / Tech / Docs tabs.

| Landmark | Project | Website |
|---|---|---|
| Turntable + EQ bars | [Remixt](https://github.com/AliTaheriMotlagh/remixt) | https://remixt-free.vercel.app |
| Runway + circling A320 | [Khalabani](https://github.com/AliTaheriMotlagh/khalabani) | https://khalabani.vercel.app |
| Mini city with cars | [Gridways](https://github.com/AliTaheriMotlagh/gridways) | https://gridways.vercel.app |
| Two pins + midpoint | [VasatYab](https://github.com/AliTaheriMotlagh/vasat-yab) | https://vasatyab.vercel.app |
| Giant red button | Siktir ([frontend](https://github.com/AliTaheriMotlagh/siktir-frontend), [backend](https://github.com/AliTaheriMotlagh/siktir-backend)) | https://siktir.fun |
| Tower of Hanoi | [TS Algorithms](https://github.com/AliTaheriMotlagh/typescript-algorithms-and-data-structures) | none |
| House in the middle | About me ([profile](https://github.com/AliTaheriMotlagh/alitaherimotlagh)) | https://linktr.ee/alanfilm |

## Controls

- Desktop: `W A S D` or arrow keys to drive, `Shift` to boost, `E` to open a landmark, `M` for the project list, `Esc` to close.
- Phone: joystick bottom left, Boost button, tap a landmark to open it.
- Deep links: `/#remixt`, `/#gridways`, `/#about`, and so on.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

It's one static HTML file, so there's no build step.

```bash
npx vercel --prod
```

GitHub Pages or Netlify work the same way.

## Edit content

All project text lives in the `ALL` array near the top of the script in `index.html`: tagline, links, pitch, design, tech stack and setup docs. To add a project, add an entry there and give it a `landmark` builder (copy one of the functions under `B.`).

## Images

Each project's image is rendered from its own landmark when the page loads. Put real screenshots in `images/` (see `images/README.md`) and they replace the renders.

Built with Three.js r128, loaded from cdnjs.
