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

[ ] Vault Collections: allow users to create named collections (folders) within bookmarks — e.g. "Research", "Funny", "Tech". Add a tab bar at the top of the Bookmarks view to filter by collection. Requires a new Firestore field on saved items.

[x] Contextual save prompt: when saving a video, show a brief bottom sheet asking "why are you saving this?" with quick-select tags (Reference, Inspiration, Follow-up, Watch Later) plus an optional text note. Store this metadata on the Firestore document so the Vault is searchable by intent.

Product Identity
[ ] Add app name and logo: display the app name/brand visibly after login — currently nothing identifies this as a finished product vs. a prototype. Add a wordmark or logo to the empty feed state and/or the auth screen.

[ ] Redesign the Bookmarks page: the current stacked full-width video list reads like a debug view. Redesign it as a true curated vault — thumbnail grid or card layout with username, timestamp, and a visual preview — so it feels like a collection rather than a feed.

[x] Landing/onboarding flow: new users see a blank screen with a search box and no explanation of what the app does. Add a brief onboarding moment (one screen or animated empty state) that communicates the value proposition before the user has to do anything.

[ ] Surface the app name on the feed: the main feed has no persistent header or identity marker. A minimal fixed top bar with the app name or logo would make the app feel cohesive and intentional.
