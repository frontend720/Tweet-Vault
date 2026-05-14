Code Review — Tweet Vault
Bugs
[x] AuthStateContext.jsx — memory leak + crash on sign-out (AuthStateContext.jsx:10-14): onAuthStateChanged is never unsubscribed (missing return unsubscribe()). Also, user.email will throw if user is null (signed-out state).

[x] AuthStateContext.jsx — entire file is dead code: AuthStateContextProvider wraps the app in main.jsx but AuthStateContext is never imported or consumed anywhere. This context is fully redundant with the auth logic already in FirebaseContext.

[x] FirebaseContext.jsx:86 — comma operator bug in createUser: if ((authentication.email, authentication.password)) uses the JS comma operator — it only evaluates the last operand (password). Should be &&.

[x] FirebaseContext.jsx:128-134 — try/catch in wrong place in logout: await signOut(auth) is outside the try block — errors from it are uncaught.

[x] FirebaseContext.jsx:199,223 — wrong Firestore path for tweets: Tweets are saved/read at doc(db, authenticatedUser, ...) (email as top-level collection), but photos are correctly stored under users/{email}/photos. Tweets should also live under a users subcollection for consistency and security.

[x] Carousel.jsx:88-90 — interval never cleaned up: The cleanup function () => clearInterval(intervalId) is written but not returned from the useEffect. The interval leaks on unmount.

[x] Carousel.jsx:136-138 — typo allowlideNext: swiper.allowlideNext = true (missing S) — this sets a non-existent property and does nothing.

[x] Carousel.jsx:143-146 — getTweets called without event: The onKeyDown handler calls getTweets() with no arguments, but getTweets(e) in AxiosContext calls e.preventDefault() — this will throw Cannot read properties of undefined.

[x] Menu.jsx:163 — wrong selectedTab check for Gallery nav item: Checks selectedTab === "bookmarks" instead of selectedTab === "gallery", so the Gallery item never shows as active.

[x] Menu.jsx:127, 147, 167, 169 — single iconRef applied to multiple elements: All three nav icons share the same iconRef. Only the last one gets the reference, so GSAP icon animations only affect one icon.

[x] Carousel.jsx:406, 508 — class= instead of className= in JSX: These are plain HTML attributes in JSX — they won't apply styles in React.

Dead / Redundant Code
[x] Carousel.jsx:36 — unnamed state variable ____________: const [____________, setIsBookmarked] — the value is never read. The state is toggled via onBookMarkChange but onBookMarkChange itself is never called.

[x] Carousel.jsx:37-53 — dead uniqueMediaMap block: An outer uniqueMediaMap is built via tweets.forEach(...) but is shadowed and replaced by the useMemo version on line 67. The outer block is never used.

[x] Carousel.jsx:55-64 — broken uniqueUsernames logic: A Map is defined outside useEffect, then uniqueUsernames.set(tweet.tweet_id) is called with only a key (no value), and the result is only console.log'd. This does nothing useful.

[x] BookmarkCard.jsx:122 — unnamed state variable _________: const [_________, setIsHovering] — isHovering is never read anywhere, making onHoverChange a no-op.

[x] BookmarkCard.jsx:110-138 — two play toggle functions: videoPlayToggle and togglePlay do essentially the same thing. One should be removed.

[x] AxiosContext.jsx:11 — no-op interceptor: axios.interceptors.request.use() called with no arguments does nothing — should be removed.

[x] CarouselCard.jsx:3 — unused import: AxiosContext is imported but never used.

[x] App.jsx:20 — empty div: <div style={menuToggle ? { display: "none" } : { display: "" }}></div> renders an empty div with no content or purpose.

[x] Authentication.jsx:106 — always-false disabled: disabled={authentication.password ? false : false} always resolves to false — the button is never actually disabled.

[x] FirebaseContext.jsx:282 — debug console.log in render: console.log(sortedTweets.length + sortedImages.length) runs every render.

[x] RecentSavesComponent.jsx:11, 13, 25 — multiple debug console.log calls left in production code.

[x] Carousel.jsx:39, 64 — debug console.log calls left in production code.

HTML / Accessibility Issues
[x] RecentSavesComponent.jsx:41, 48 — <li> nested inside <li>: An <li> element is a child of another <li>, which is invalid HTML.

[x] Menu.jsx:124, 145, 164, 179 — duplicate id "item-visibility-stagger": The same id is used on 4 different elements. IDs must be unique — GSAP's #item-visibility-stagger selector will only target the first one.

[x] Bookmarks.jsx:26 — array index used as React key: key={index} on a list that supports deletion will cause incorrect reconciliation. Should use a stable unique ID like item.tweetId.

Architecture
[x] FirebaseContext does too much: It handles auth (sign-in, sign-up, Google login, sign-out), Firestore CRUD for tweets, Firestore CRUD for photos, form state, and image gallery state — all in one context. Should be split at minimum into an auth context and a data context.

[x] AxiosContext is misnamed and oversized: It manages tweet fetching, pagination, menu visibility, carousel index, and playback state. Rename and/or split — menuToggle state especially doesn't belong here.

[x] FirebaseContext owns auth form state: authentication (email/password) and handleChange live in FirebaseContext, but this state is only relevant to the Authentication component — it should be local state in that component.

[x] Duplicate search inputs in Carousel.jsx: There are two separate search inputs — one in the top form bar, one in the CTA widget — with duplicated logic and no shared state management.

Design / UX
[x] Soften the dark theme: swap pure #0A0A0B for a slightly warmer dark (~#111012) and add a light mode toggle — a significant portion of users prefer light mode.

[x] Reduce glassmorphism: reserve blur/glass for one focal element (e.g. the CommandDock). Use flat, slightly elevated cards with a subtle border elsewhere.

[x] Improve text legibility: enforce font-weight 400 minimum for body text and ensure all text meets WCAG AA contrast (4.5:1). Avoid thin weights and low-contrast secondary text.

[x] Improve onboarding empty state: replace the blank feed with tappable suggested-account chips so new users get immediate value without having to know what to type. The ACCOUNTS array is already there — surface it as buttons.

[x] Add labels to CommandDock: display small text labels ("Feed", "Vault", "Gallery") below each icon — icon-only navigation tests poorly with general audiences.

[x] PWA support: add vite-plugin-pwa with Workbox service worker, web app manifest, SVG app icons (regular + maskable), and safe-area inset fixes across all pages so the app installs cleanly from Chrome on Android/desktop and Safari on iOS.

[x] Fix video controls visibility: controls hide immediately when video plays and reappear on tap or when paused. Scrubber z-index fix (video element was covering controls). Buffered-range check removed so seeks always apply.

[x] Add save/heart microinteraction: scale bounce + color fill animation on save. HeartButton component handles both the video heart and image save button.

[x] Add skeleton loading screens: replace the dot animation with grey placeholder cards matching the content shape so the loading state feels intentional.

[x] Proxy range request support: update the Firebase Cloud Function (proxyVideo) to forward Range headers and return 206 Partial Content so video seeking works without needing preload="auto".

[x] Haptic feedback on save: navigator.vibrate([10, 50, 20]) fires on save with feature detection fallback. Built into HeartButton.

[x] prefers-reduced-motion support: wrap all GSAP and CSS animations in a @media (prefers-reduced-motion: reduce) check. Replace spring/fade transitions with instant or linear 200ms equivalents for users with vestibular disorders.

[x] Vault Collections: allow users to create named collections (folders) within bookmarks — e.g. "Research", "Funny", "Tech". Add a tab bar at the top of the Bookmarks view to filter by collection. Requires a new Firestore field on saved items.

[x] Contextual save prompt: when saving a video, show a brief bottom sheet asking "why are you saving this?" with quick-select tags (Reference, Inspiration, Follow-up, Watch Later) plus an optional text note. Store this metadata on the Firestore document so the Vault is searchable by intent.

Product Identity
[x] Add app name and logo: display the app name/brand visibly after login — currently nothing identifies this as a finished product vs. a prototype. Add a wordmark or logo to the empty feed state and/or the auth screen.

[ ] Redesign the Bookmarks page: the current stacked full-width video list reads like a debug view. Redesign it as a true curated vault — thumbnail grid or card layout with username, timestamp, and a visual preview — so it feels like a collection rather than a feed.

[x] Landing/onboarding flow: new users see a blank screen with a search box and no explanation of what the app does. Add a brief onboarding moment (one screen or animated empty state) that communicates the value proposition before the user has to do anything.

[x] Surface the app name on the feed: the main feed has no persistent header or identity marker. A minimal fixed top bar with the app name or logo would make the app feel cohesive and intentional.

Feed Bugs / Polish
[x] Carousel video cropping on mobile: API-provided dimensions (extended_entities.media[0].sizes.small) didn't match actual media proportions, causing crops. Fixed by computing aspect-ratio from raw API width/height and applying it to the container, letting the browser scale correctly.

[x] Video fullscreen cropping on desktop: a global video { max-width: 480px !important } rule was applied inside fullscreen context. Removed the rule; container now owns all sizing via aspect-ratio + max-height: 75dvh.

[x] Heart/save button drifting off-screen on desktop: caused by a global label { min-width: 80vw } rule. Removed the rule and restructured the button's parent to use flexbox justify-content: flex-end instead.

[x] Video poster overflowing into text-container: ReactPlayer light prop rendered a poster that didn't respect the container's max-height, pushing the metadata card off screen. Replaced with a custom absolutely-positioned poster overlay (inset: 0, object-fit: cover) that stays fully inside the video container.

[x] text-container disappearing on iPad-sized screens: tall videos with no max-height consumed the full viewport. Added max-height: 75dvh to the video container so at least 25% of the viewport is always reserved for the metadata card below.

[x] GSAP "target null not found" firing every ~4000ms: accountRef was declared and passed to gsap.to() inside a setInterval but was never attached to any JSX element. Removed the entire dead-code block (accountRef, interval, state, GSAP effect, and gsap import).

Resume / Session Feature
[x] Save continuation token with bookmarks: resumeToken and browseUsername are now persisted on every saved tweet in Firestore, enabling the user to resume browsing from the exact point where they saved a video.

[x] Resume sessions component on feed CTA: the empty-feed screen now shows a horizontal scroll strip of saved sessions as poster cards with @username and a relative timestamp. Sessions older than 6 hours show an amber ⚠ stale indicator.

[x] "Continue browsing" strip on bookmark cards: each BookmarkCard with a saved resumeToken shows a tappable strip below the card — "Continue browsing @username from here" — that resumes the feed and navigates to /.

[x] Expired token error handling: if resumeFeed returns 0 results (token expired), a dismissable banner appears — "Session expired — start fresh from @username?" — with Start fresh / Dismiss actions.

[x] Resume info slide: when a feed is resumed via a continuation token, Swiper prepends an info slide at virtualIndex 0 explaining that these are not the user's most recent posts. Swiper initialises at slide 1 so the user lands on the first video; swiping left reveals the info card with a "Load most recent posts" button. virtualIndex offset applied (+1) so tweet slides don't collide with the info slide.

Bookmarks / Playlist
[x] Playlist mode: Bookmarks now has a Play All button that enters a full-screen playlist view — tap to play/pause, scrubber, speed control (0.1–2×), skip forward/back, and native fullscreen. Controls auto-hide after 3 s and reappear on tap.

AI Personas
[x] Persona builder: persona mode toggle in Settings collects text-only, non-retweet tweets as the user browses. A chip appears on the carousel showing a live count and collection strength (WEAK/MODERATE/STRONG, colour-coded). Once 40+ tweets are collected a "Build persona" button fires a Venice AI call that produces a detailed persona document (writing style, tone, themes, worldview, roleplay instructions) and saves it to Firestore.

[x] Model selection: Settings fetches available Venice models via /listModels, filters out expensive (>$10/M output) and deprecated models, groups them into use-case categories (Persona & Roleplay, General Chat, Reasoning & Analysis, Technical & Code) using <optgroup>, and shows a cost-tier badge ($ / $$ / $$$) next to each model. Selected model is persisted in localStorage.

[x] PersonaChat: full-screen chat interface at /chat/:username. Sends messages to /chatWithPersona Firebase Function, which injects the current date/time into the system prompt and roleplays as the persona. Supports Chat and Play tabs.

[x] Chat persistence via Firebase RTDB: messages stored at /chats/{uid}/{username} and synced in real time via onValue listener. Conversations persist across devices and sessions. Security rules restrict read/write to the owning UID. Clear chat button removes the RTDB node.

[x] Markdown rendering: AI responses rendered through react-markdown so lists, bold, code blocks, and headers display correctly.

[x] Message timestamps: each message pushed to RTDB with a unix timestamp. Displayed below each bubble — time only for today, "Yesterday HH:MM" for yesterday, weekday name within the last week, "Mon DD HH:MM" for older. Model also receives the current date/time in the system prompt so it doesn't give temporally incorrect responses.

[x] Play tab (scenario launcher): replaces the earlier Rewrite tab. On first open, calls /generateScenarios which asks the persona model to suggest 3 contextually relevant roleplay scenarios (title, description, opening line). Cards are tappable — selecting one clears the chat, pushes the persona's opener as the first message, and switches to the Chat tab. "Feeling Lucky" button picks a random scenario instantly. Retry button on error.

[x] Vision in chat: paperclip button in the chat input opens an attach panel with two options — paste an image URL or upload a file. Uploaded files are compressed client-side via Canvas (max 1024px, JPEG 85%) before base64 encoding. Images are stored in the RTDB message and rendered in chat bubbles. The /chatWithPersona function detects image-bearing messages and builds OpenAI-compatible vision content arrays, auto-switching to qwen3-vl-235b-a22b if the selected model isn't vision-capable.

[x] ToriiGate integration: separate /chatWithToriiGate Firebase Function routes chat through Hugging Face Inference API using Minthy/ToriiGate-v0.4-7B (multimodal, qwen2_vl-based). Supports vision content arrays, same persona system prompt, returns 503 with user-friendly message on model cold-start (HF 503).

[x] Persona customisation: each persona in Settings has a pencil button that opens a bottom sheet editor. Users can upload a custom avatar (compressed to 256px) or paste an image URL, and set a display name. Changes write displayName and avatarUrl fields to Firestore via updatePersona. twitterAvatarUrl (the account's actual profile pic, captured at build time) is used as fallback when no custom avatar is set. Persona list rows and the PersonaChat header both respect the displayName → twitterAvatarUrl → icon priority chain.

[x] Avatar tap-to-feed: tapping the persona avatar in the PersonaChat header calls retweetRequest(username) and navigates to / so the Carousel immediately starts loading that user's tweet feed.

[x] Persona chip visibility: chip hides during video playback (same behaviour as the TweetVault logo and search button) and reappears on pause or mount. Chip position moved to match the logo/search button height. Chip text truncates with ellipsis on narrow screens via min-width: 0 + text-overflow: ellipsis flex chain.

[x] Persona state reset on user navigation: username change useEffect resets personaBuilt, isBuildingPersona, isVideoPlaying, and autoFetchAttempts.current so the builder starts clean when navigating to a new profile via a retweet handle.

Feed Bugs
[x] Stale continuation token on retweet navigation: when the user tapped a retweet handle mid-chain, in-flight chained fetchTweets calls for the previous user completed after the new feed started and appended old tweets via setTweets(prev => [...prev, ...results]). Fixed with a requestGeneration ref that increments on every new feed request (getTweets, getSearchResults, retweetRequest, resumeFeed). Each fetchTweets/fetchSearchResults call captures the generation at call time and discards results in .then() if the generation has since advanced. continuationTokenRef.current is also cleared immediately on new feed requests to prevent handleReachEnd from firing with a stale token during the loading window.
