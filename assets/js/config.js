/*
 * Site-wide settings. Rename the site by changing `name` here —
 * every page title, header and footer reads from this file.
 */
window.SITE = {
  name: "The Rabbit Hole Archive",
  tagline: "Conspiracy theories, unsolved mysteries and true stories that sound made up, sorted by what we actually know.",
  storageKey: "rabbit-hole-archive:v1",
  dataUrl: "data/stories.json",
  achievementsUrl: "data/achievements.json",

  // The four drawers of the archive. `id` must match each story's "category".
  categories: [
    {
      id: "conspiracy-theories",
      name: "Conspiracy Theories",
      short: "Conspiracies",
      icon: "eye",
      blurb: "Big claims about hidden plots, checked against the evidence."
    },
    {
      id: "unsolved-mysteries",
      name: "Unsolved Mysteries",
      short: "Mysteries",
      icon: "magnifier",
      blurb: "Real cases with real clues and no final answer yet."
    },
    {
      id: "hidden-history",
      name: "Hidden History",
      short: "Hidden History",
      icon: "scroll",
      blurb: "True events so strange they sound invented."
    },
    {
      id: "strange-places",
      name: "Strange Places & Phenomena",
      short: "Strange Places",
      icon: "compass",
      blurb: "Spooky seas, odd lakes and places with a reputation."
    }
  ],

  // Verdict stamps. `id` must match each story's "verdict".
  verdicts: [
    { id: "debunked", label: "Debunked", blurb: "Checked thoroughly. The evidence says no." },
    { id: "unproven", label: "Unproven", blurb: "Claimed, but solid evidence is missing. Not impossible, just not shown." },
    { id: "unsolved", label: "Unsolved", blurb: "Something real happened. Nobody can say for sure how or who." },
    { id: "true", label: "Actually True", blurb: "Sounds made up. Isn't. Documented and confirmed." }
  ],

  // Roles for "Persons of interest" and the Who's Who page. Each role gets its own
  // dossier design and colour. `id` must match each person's "role".
  roles: [
    { id: "victim", label: "In memoriam", short: "Lost", color: "#d1d1d6", kicker: "Remembered" },
    { id: "suspect", label: "Suspect", short: "Suspect", color: "#ff453a", kicker: "Suspect file" },
    { id: "witness", label: "Witness", short: "Witness", color: "#ffd60a", kicker: "Testimony" },
    { id: "survivor", label: "Survivor", short: "Survivor", color: "#30d158", kicker: "Survivor" },
    { id: "investigator", label: "Investigator", short: "Investigator", color: "#6e9bff", kicker: "Credential" },
    { id: "expert", label: "Expert", short: "Expert", color: "#3fd5b5", kicker: "Findings" },
    { id: "source", label: "Theory source", short: "Source", color: "#ff9f0a", kicker: "Where the theory came from" },
    { id: "official", label: "Official", short: "Official", color: "#bf5af2", kicker: "Official record" },
    { id: "keeper", label: "Keeper", short: "Keeper", color: "#d4a373", kicker: "Provenance" }
  ],

  // Clearance ranks, earned with points: 100 per file explored, 20 per quiz
  // (+40 if perfect), 5 per random jump (max 20 jumps), 50 per seal.
  clearance: [
    { at: 0, name: "Unclassified", title: "Visitor" },
    { at: 100, name: "Confidential", title: "Reader" },
    { at: 400, name: "Secret", title: "Researcher" },
    { at: 900, name: "Top Secret", title: "Investigator" },
    { at: 1600, name: "Codeword", title: "Senior Investigator" },
    { at: 2500, name: "Cosmic", title: "Archivist" },
    { at: 3600, name: "Eyes Only", title: "Keeper of the Archive" }
  ],

  // Shown on drawers that have no photographs yet (CC0, Mark Buckawicki).
  fallbackImage: {
    src: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Wooden_Card_Catalog_Furniture.jpg",
    w: 4032,
    alt: "A wooden card catalogue with rows of small drawers",
    credit: "Mark Buckawicki",
    license: "CC0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Wooden_Card_Catalog_Furniture.jpg"
  },

  // Rabbit Hole Levels, 1 (shallow) to 5 (bottomless).
  levels: [
    { name: "Shallow end", blurb: "A quick, tidy story. You'll be out in time for lunch." },
    { name: "Ankle deep", blurb: "A few twists, but the answer is fairly clear." },
    { name: "Knee deep", blurb: "Theories start piling up. Bring a snack." },
    { name: "Deep burrow", blurb: "Decades of evidence, arguments and books." },
    { name: "Bottomless", blurb: "People have spent whole lifetimes down this one." }
  ]
};
