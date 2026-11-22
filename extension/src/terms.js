(() => {
  const S = (globalThis.spoil6 ??= {});

  S.terms = {
    gta6: String.raw`(?<![\p{L}\p{N}])(?:g\.?t\.?a|grand ?theft ?auto)[\s\-:.]*(?:6(?!\p{N})|six(?!\p{L})|vi(?![\p{L}\p{N}]))`,

    series: String.raw`(?<![\p{L}\p{N}])(?:g\.?t\.?a|grand ?theft ?auto)(?!\p{L})`,

    notTheGame: [
      'toronto', 'ontario', 'mississauga', 'brampton', 'markham', 'vaughan', 'oakville', 'scarborough', 'etobicoke',
      'teaching assistant', 'alfa romeo', 'charged with', 'arrested for', "sheriff's",
    ],

    // Names from Rockstar's pre-launch trailers and site, not story spoilers.
    topic: [
      'leonida', 'vice city', 'port gellhorn', 'grassrivers', 'mount kalaga',
      'jason duval', 'lucia caminos', 'jason and lucia', 'lucia and jason', 'jason & lucia', 'lucia & jason',
      'cal hampton', 'boobie ike', "dre'quan priest", 'real dimez', 'raul bautista', 'brian heder',
      'rockstar games', 'rockstar north',
    ],

    spoiler: [
      'spoiler', 'spoiled', 'spoil', 'spoiling',
      'ending', 'the end', 'final mission', 'last mission', 'final chapter', 'finale', 'epilogue',
      'credits', 'post credits', 'true ending', 'secret ending',
      'dies', 'died', 'death', 'dead', 'killed', 'kills', 'murdered', 'rip',
      'twist', 'plot', 'betray', 'betrayed', 'betrayal', 'traitor', 'reveal', 'revealed', 'turns out',
      'final boss', 'boss fight', 'story', 'storyline', 'cutscene', 'cut scene', 'chapter',
      'beat the game', 'beat gta', 'finished the game', 'finished the story', 'finished gta', '100%', 'cameo',
    ],

    subreddit: String.raw`^(?:gta(?:_?(?:6|vi)\w*)?|grandtheftauto\w*|rockstar(?:games)?|gtaonline)$`,
  };
})();
