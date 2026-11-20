// Local testing only: a fake exercise guide for when api/config.php has no WorkoutX key, so the guide's video
// controls can be tried with `npm run dev`. Turn it on in the browser console, then reopen the guide:
//
//   localStorage.setItem('gymrank.mockGuide', 'video')   // a working sample clip (MDN's CC0 flower video)
//   localStorage.setItem('gymrank.mockGuide', 'broken')  // a video link that fails to load
//   localStorage.removeItem('gymrank.mockGuide')         // back to the real api/exercise_guide.php
//
// It only runs when import.meta.env.DEV is true, so `npm run build` leaves it out and the deployed app never uses it.

const VIDEOS = {
  video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  broken: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/missing-gymrank-mock.mp4',
}

export function mockGuide(name) {
  if (!import.meta.env.DEV) return null
  let mode = null
  try {
    mode = localStorage.getItem('gymrank.mockGuide')
  } catch {
    return null
  }
  if (!VIDEOS[mode]) return null
  return {
    id: `mock-${mode}`,
    name,
    instructions: [
      'Mock guide for local testing: this is not the real exercise.',
      'Press Pause and check the clip stops on the current frame.',
      'Press Play and check it carries on from the same frame.',
    ],
    tips: ['To turn the mock off, remove gymrank.mockGuide from local storage and reload.'],
    video: VIDEOS[mode],
    poster: null,
    watermarked: false,
  }
}
