# Responsive pass

Checked on the production build (`next start`) in an isolated headless Chrome. Nothing was deployed.

## What I checked

**Sizes:** 16 viewports.

| Group | Sizes |
|---|---|
| Phones | 360×780, 390×844, 430×932, 844×390 (landscape) |
| Tablets | 768×1024, 820×1180, 1024×768, 1180×820 |
| Laptops | 1280×800, 1366×768, 1440×900 |
| Monitors | 1920×1080, 2560×1440 |
| Ultrawide | 2560×1080, 3440×1440 |
| 4K | 3840×2160 |

Phones and tablets ran as touch devices, with no hover.

**Stops:** 8 points along the journey at every size, plus the full-screen menu on burger sizes. The stops were the hero, About, the corridor, the reel, concerts, the gallery, the name world and contact. Every stop was screenshotted and reviewed.

**Automated checks at every stop:**
- horizontal scrolling;
- text cut off at the viewport edges;
- text under 11px;
- tap targets under 24px on touch devices;
- console errors.

**Menu checks at every size:**
- which mode shows (piano bar or burger), and never both or neither;
- whether the octave fits the header and any key label is clipped;
- the burger's size;
- the full-screen menu's key sizes, and whether it scrolls when the screen is short.

## Results that needed no change

- No horizontal scrolling, and no cut-off text, at any size.
- The menu switches cleanly at 1100px. Every size from 360 to 1024 gets the burger with the full-screen piano menu, and every size from 1180 to 3840 gets the piano bar. No size shows both or neither, the octave never overflows the header, and no key label is clipped.
  - Keys are 99px wide at 1180 and 136px at 1440 and up.
  - On wide screens the header stays at its 1392px maximum, centred.
- **Full-screen menu:** the keys are 58–78px tall, well above the 44px touch minimum. On the 844×390 landscape phone the menu scrolls, as intended.
- **Touch:** hover notes are skipped, the menu opens with a tap, and tapping a key navigates.
- **Frame rate:** 122–126 fps at every size on this machine. No console errors.

## What I fixed

1. **The 3D name was cropped on 4:3-ish and narrow screens.**
   - At 1024×768 both ends of "Reza Ohadi" were cut off; at 1180×820 and 1280×800 it touched the edges; at 360, 390 and 430 the final "i" touched the right edge.
   - The camera's dolly-zoom hold now never frames narrower than the name plus a 14% margin.
   - On 16:9 and wider screens the shot is unchanged (`CameraDirector.tsx`).
2. **The sound invitation overlapped the hero title on landscape phones (844×390).**
   - On screens wider than 760px but under 520px tall, "Enter with sound" now sits in the bottom-right corner, clear of the copy.
   - Every other size is unchanged (`journey.module.css`).
3. **Tap targets on touch were too small.**
   - The footer text links were 17px tall and the menu email link was 21px, under the 24px minimum.
   - On touch screens they now have a full-size tap area. The links don't move visually (`portfolio.css`).

After the fixes I re-ran the affected sizes (360, 390, 844×390, 768, 1024, 1180, 1280): no findings left, no errors. The production build passes and 10 of 10 tests pass.

## For you to decide (design changes, not made)

1. **The fixed corner controls on short screens.** The mute button (bottom left) and the TOP button (bottom right) sometimes sit over text for a moment while scrolling. It's most noticeable on landscape phones and at 360px. Moving them or hiding them during copy would be a design change.
2. **The tablet-portrait hero (768×1024, 820×1180).** The 3D piano sits behind the eyebrow and title. Everything stays legible and nothing is cropped, but the composition is busier than on phones or desktop. One option is the phone layout for tablet portrait, with the piano above the copy.
3. **10px labels.** "Solo Piano · 5:12", "SCROLL", "TOP" and "or continue in silence" are spaced small caps at 10px. They're readable, but under 11px. Raising them would change the typographic scale.
4. **1024–1099px landscape tablets get the burger menu,** because seven keys plus the cheek don't fit. A smaller bar variant would be a design change.
5. **Ultrawide (2560×1080, 3440×1440).** The hero title wraps onto two lines and the header is a narrow centred piano slice. Both look intentional; noting them in case you want a wider header there.
