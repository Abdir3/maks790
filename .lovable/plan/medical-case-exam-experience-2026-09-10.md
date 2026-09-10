# Medical Case Exam Experience

## Goal
Build a polished medical exam home screen that closely follows the supplied visual reference, while making dense case reading and answering comfortable on phones and desktops.

## What will be built
- A cinematic dark landing screen with a compact medical brand header, atmospheric hospital backdrop, and restrained coral/amber diagnostic lighting.
- A central “Start exam” control, short and long practice modes, and a concise feature strip matching the reference composition.
- A functional exam workspace shown when a practice mode is selected.
- A six-step long-form patient case with progress, patient presentation, vital signs, findings, investigations, and assessment sections.
- A large readable response area supporting typed answers plus a working browser voice-dictation control when available.
- Back/next navigation, collapsible case sections, and a reset path back to the landing screen.
- Mobile-first behavior with persistent answer controls and efficient use of narrow screens; a balanced two-column reading and response layout on desktop.
- Subtle pulse, glow, entrance, and waveform motion with reduced-motion support.

## Visual direction
- Near-black plum clinical surfaces with coral-red and warm amber accents.
- Crisp sans-serif typography, thin technical labels, fine borders, and compact information density.
- No generic marketing sections or oversized cards; the product experience is the first screen.
- The uploaded image is used only as a design reference, not embedded in the website.

## Technical details
- Implement the experience on the existing `/` page using React state and the current TanStack setup.
- Extend the shared design tokens in `src/styles.css` and use the existing button and textarea controls.
- Use native browser speech recognition with a clear fallback when dictation is unavailable.
- Add route-specific title, description, Open Graph, and Twitter metadata.
- Verify the finished screen at desktop and mobile widths, including interaction and text overflow.
