# spoil6

A browser extension that hides GTA 6 spoilers on X, Reddit, YouTube, TikTok and Instagram until you choose to see them.

GTA 6 is out, and every feed is full of it: clips from the last mission, thumbnails of the ending, people posting reactions with no warning. Scrolling past them isn't enough, because by the time you see a picture or a video it's already too late. spoil6 checks every post before it shows up on your screen and covers anything about GTA 6, so you can keep using social media while you play at your own pace.

## What it does

- **Covers GTA 6 posts before they show.** Posts, videos, comments, Shorts and search results get a blurred cover with a label like "Possible GTA 6 spoiler · Show". Click the cover to see that one post. Clicking a cover never opens the post by accident.
- **Stops on GTA 6 pages.** Opening an X post, a Reddit thread, a YouTube video or Short, a TikTok video or an Instagram post about GTA 6 shows a full-page stop with **Go back** and **Show page**. Show page opens the post you came for. Replies, comments and other videos that mention GTA 6 stay covered.
- **Keeps videos paused.** Videos under a cover or behind the stop don't play, and hovering a covered YouTube video doesn't start its preview. When YouTube moves to the next video on its own, the video waits until spoil6 knows what it is, so autoplay can't roll into GTA 6.
- **Shows a count.** The spoil6 icon in your toolbar shows how many things are hidden on the page you're on.

## How it decides

- **GTA 6 written any way:** GTA 6, GTA VI, GTA6, #GTA6Spoilers, Grand Theft Auto VI, fancy fonts (𝐆𝐓𝐀 𝟔), the Ⅵ symbol and the 6️⃣ emoji.
- **Plain "GTA"** counts too, since that's what most people call it now. Posts that use GTA for the Toronto area or a teaching assistant are left alone.
- **Names from the trailers:** the main characters, places like Leonida and Vice City, and Rockstar Games. These come from Rockstar's own pre-launch trailers and site, so the list itself doesn't spoil anything.
- **GTA subreddits:** everything from r/GTA6, r/GTAVI, r/GTA and similar, even posts that never say GTA.
- **Image text on Instagram:** Instagram describes pictures for screen readers, including any text inside the image, and spoil6 reads that too.
- **Spoiler words** like ending, mission, dies, twist and credits mark a post as a possible spoiler.

## Settings

Click the spoil6 icon in your toolbar.

- **On/off** switch, and **Pause for 1 hour** for when you want to look things up.
- **What to hide:** All GTA 6 posts, or Only spoilers (GTA 6 posts about the story, missions, deaths or the ending).
- **Where you are:** type the last story mission you finished. Posts about later missions, or characters you haven't met yet, get covered as "Later in the story". The names are saved as scrambled codes, so the list itself doesn't spoil anything.
- **Sites:** turn spoil6 off for any of the five sites.
- **Always hide posts with:** your own words, like a character you don't want to hear about yet. These hide posts even when they don't say GTA.
- **Never hide posts with:** words that always let a post through, like GTA Online.

Settings sync to your other computers if you're signed in to Chrome.

## Good to know

- **Everything stays on your computer.** spoil6 reads the page in your browser and never sends anything anywhere. Its only permission is storage, for your settings.
- **Phone apps aren't covered.** A browser extension only works in the browser, so the X, TikTok and Instagram apps on your phone still show everything.
- **Pictures with no words** can still get through. spoil6 reads text: captions, titles, hashtags, image descriptions and subreddit names. A screenshot posted with no caption doesn't give it anything to read.

## Install

spoil6 isn't on the Chrome Web Store yet, so you load it yourself. It works in Chrome, Edge, Brave and Arc.

1. Download this repo (Code → Download ZIP) and unzip it, or clone it.
2. Open `chrome://extensions` in your browser.
3. Turn on **Developer mode** in the top right.
4. Click **Load unpacked** and pick the `extension` folder inside spoil6.
5. Pin spoil6 from the puzzle-piece menu so the icon and count stay in your toolbar.

## Development

You need [Node.js](https://nodejs.org) 22 or newer.

```
npm install
npm test               # word matching tests
npm run test:browser   # loads the extension in Chromium and tests each site on sample pages
```

- `node scripts/live-check.mjs <url>` opens a real page with the extension loaded and reports how many things were covered and whether anything GTA-looking got through. It only prints counts, never post text.
- `node scripts/icons.mjs` renders `scripts/icon.svg` into the toolbar icons.
- Site rules live in `extension/src/sites.js` and the word lists in `extension/src/terms.js`.
