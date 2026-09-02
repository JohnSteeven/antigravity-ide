const quotes = [
  {
    id: "quote-1",
    text: "Small, consistent actions create extraordinary lives.",
    author: "MyJourney Reflections",
    topic: "Consistency"
  },
  {
    id: "quote-2",
    text: "Difficulties strengthen the mind, as labor does the body.",
    author: "Seneca",
    topic: "Discipline"
  },
  {
    id: "quote-3",
    text: "The happiness of your life depends upon the quality of your thoughts.",
    author: "Marcus Aurelius",
    topic: "Reflection"
  },
  {
    id: "quote-4",
    text: "We are often more frightened than hurt; and we suffer more from imagination than from reality.",
    author: "Seneca",
    topic: "Courage"
  },
  {
    id: "quote-5",
    text: "No man is free who is not master of himself.",
    author: "Epictetus",
    topic: "Discipline"
  },
  {
    id: "quote-6",
    text: "It is not because things are difficult that we do not dare; it is because we do not dare that they are difficult.",
    author: "Seneca",
    topic: "Courage"
  },
  {
    id: "quote-7",
    text: "Waste no more time arguing about what a good man should be. Be one.",
    author: "Marcus Aurelius",
    topic: "Discipline"
  },
  {
    id: "quote-8",
    text: "He who has a why to live can bear almost any how.",
    author: "MyJourney Reflections",
    topic: "Faith"
  },
  {
    id: "quote-9",
    text: "The best way to predict your future is to create it.",
    author: "MyJourney Reflections",
    topic: "Success"
  },
  {
    id: "quote-10",
    text: "What you do today is what matters most. Consistency builds the bridge.",
    author: "MyJourney Reflections",
    topic: "Consistency"
  },
  {
    id: "quote-11",
    text: "He who fears death will never do anything worth of a man who is alive.",
    author: "Seneca",
    topic: "Courage"
  },
  {
    id: "quote-12",
    text: "The only wealth which you will keep forever is the wealth you have given away.",
    author: "Marcus Aurelius",
    topic: "Life"
  },
  {
    id: "quote-13",
    text: "Control your perception. Direct your actions. Willingly accept what's outside your control.",
    author: "MyJourney Reflections",
    topic: "Reflection"
  },
  {
    id: "quote-14",
    text: "Great things are done by a series of small things brought together.",
    author: "MyJourney Reflections",
    topic: "Consistency"
  },
  {
    id: "quote-15",
    text: "Do not say more than is necessary, but do more than is expected.",
    author: "MyJourney Reflections",
    topic: "Discipline"
  },
  {
    id: "quote-16",
    text: "Associate with people who are likely to improve you.",
    author: "Seneca",
    topic: "Growth"
  },
  {
    id: "quote-17",
    text: "If you want to improve, be content to be thought foolish and stupid.",
    author: "Epictetus",
    topic: "Growth"
  },
  {
    id: "quote-18",
    text: "First say to yourself what you would be; and then do what you have to do.",
    author: "Epictetus",
    topic: "Discipline"
  },
  {
    id: "quote-19",
    text: "A ship should not ride on a single anchor, nor life on a single hope.",
    author: "Epictetus",
    topic: "Life"
  },
  {
    id: "quote-20",
    text: "To be calm under pressure is the ultimate sign of discipline.",
    author: "MyJourney Reflections",
    topic: "Discipline"
  },
  {
    id: "quote-21",
    text: "He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has.",
    author: "Epictetus",
    topic: "Reflection"
  },
  {
    id: "quote-22",
    text: "The sun is new each day, and so are the opportunities to grow.",
    author: "MyJourney Reflections",
    topic: "Growth"
  },
  {
    id: "quote-23",
    text: "We begin to lose our hesitation when we decide to move forward anyway.",
    author: "MyJourney Reflections",
    topic: "Courage"
  },
  {
    id: "quote-24",
    text: "Faith is the first step even when you don't see the whole staircase.",
    author: "MyJourney Reflections",
    topic: "Faith"
  },
  {
    id: "quote-25",
    text: "A true leader does not seek followers, but seeks to inspire others.",
    author: "MyJourney Reflections",
    topic: "Leadership"
  },
  {
    id: "quote-26",
    text: "Do not fear failure. Fear only the lack of effort.",
    author: "MyJourney Reflections",
    topic: "Failure"
  },
  {
    id: "quote-27",
    text: "The master of your fate is the one who controls your daily habit.",
    author: "MyJourney Reflections",
    topic: "Discipline"
  },
  {
    id: "quote-28",
    text: "True consistency is not about perfection, but about showing up every single day.",
    author: "MyJourney Reflections",
    topic: "Consistency"
  },
  {
    id: "quote-29",
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "MyJourney Reflections",
    topic: "Consistency"
  },
  {
    id: "quote-30",
    text: "It does not matter how slowly you go as long as you do not stop.",
    author: "MyJourney Reflections",
    topic: "Consistency"
  },
  {
    id: "quote-31",
    text: "Quiet your mind and the truth will speak for itself.",
    author: "MyJourney Reflections",
    topic: "Reflection"
  },
  {
    id: "quote-32",
    text: "Every difficulty is an opportunity to practice patience and perseverance.",
    author: "MyJourney Reflections",
    topic: "Growth"
  },
  {
    id: "quote-33",
    text: "To lead others, one must first learn to manage oneself.",
    author: "MyJourney Reflections",
    topic: "Leadership"
  },
  {
    id: "quote-34",
    text: "Failure is not the opposite of success; it is a stepping stone toward it.",
    author: "MyJourney Reflections",
    topic: "Failure"
  },
  {
    id: "quote-35",
    text: "Believe in the path you have chosen, even when it is hidden in mist.",
    author: "MyJourney Reflections",
    topic: "Faith"
  },
  {
    id: "quote-36",
    text: "Courage is not the absence of fear, but the triumph over it.",
    author: "MyJourney Reflections",
    topic: "Courage"
  },
  {
    id: "quote-37",
    text: "The greatest victory is the one over oneself.",
    author: "MyJourney Reflections",
    topic: "Discipline"
  },
  {
    id: "quote-38",
    text: "Nothing is more noble, nothing more venerable than fidelity.",
    author: "Seneca",
    topic: "Faith"
  },
  {
    id: "quote-39",
    text: "Luck is what happens when preparation meets opportunity.",
    author: "Seneca",
    topic: "Success"
  },
  {
    id: "quote-40",
    text: "Begin at once to live, and count each separate day as a separate life.",
    author: "Seneca",
    topic: "Life"
  },
  {
    id: "quote-41",
    text: "If a man knows not to which port he sails, no wind is favorable.",
    author: "Seneca",
    topic: "Reflection"
  },
  {
    id: "quote-42",
    text: "You must live for another, if you wish to live for yourself.",
    author: "Seneca",
    topic: "Life"
  },
  {
    id: "quote-43",
    text: "No master is more demanding than the one who is self-appointed.",
    author: "MyJourney Reflections",
    topic: "Discipline"
  },
  {
    id: "quote-44",
    text: "True growth is a quiet process, unseen from day to day.",
    author: "MyJourney Reflections",
    topic: "Growth"
  },
  {
    id: "quote-45",
    text: "Let consistency be your signature and success will be your echo.",
    author: "MyJourney Reflections",
    topic: "Consistency"
  },
  {
    id: "quote-46",
    text: "Leadership is not a title; it is a daily action of guidance.",
    author: "MyJourney Reflections",
    topic: "Leadership"
  },
  {
    id: "quote-47",
    text: "Have faith in the seed you planted; it will rise in its own time.",
    author: "MyJourney Reflections",
    topic: "Faith"
  },
  {
    id: "quote-48",
    text: "In the middle of difficulty lies opportunity.",
    author: "MyJourney Reflections",
    topic: "Reflection"
  },
  {
    id: "quote-49",
    text: "Do not let what you cannot do interfere with what you can do.",
    author: "MyJourney Reflections",
    topic: "Discipline"
  },
  {
    id: "quote-50",
    text: "The path to success is always under construction.",
    author: "MyJourney Reflections",
    topic: "Success"
  },
  {
    id: "quote-51",
    text: "Do not pray for an easy life, pray for the strength to endure a difficult one.",
    author: "MyJourney Reflections",
    topic: "Faith"
  },
  {
    id: "quote-52",
    text: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    author: "MyJourney Reflections",
    topic: "Failure"
  },
  {
    id: "quote-53",
    text: "It is not the man who has too little, but the man who craves more, that is poor.",
    author: "Seneca",
    topic: "Reflection"
  },
  {
    id: "quote-54",
    text: "He who is brave is free.",
    author: "Seneca",
    topic: "Courage"
  },
  {
    id: "quote-55",
    text: "One of the most beautiful qualities of true friendship is to understand and to be understood.",
    author: "Seneca",
    topic: "Life"
  },
  {
    id: "quote-56",
    text: "While we teach, we learn.",
    author: "Seneca",
    topic: "Growth"
  },
  {
    id: "quote-57",
    text: "As is a tale, so is life: not how long it is, but how good it is, is what matters.",
    author: "Seneca",
    topic: "Life"
  },
  {
    id: "quote-58",
    text: "Only those who dare to fail greatly can ever achieve greatly.",
    author: "MyJourney Reflections",
    topic: "Failure"
  },
  {
    id: "quote-59",
    text: "Patience and perseverance have a magical effect before which difficulties disappear.",
    author: "MyJourney Reflections",
    topic: "Consistency"
  },
  {
    id: "quote-60",
    text: "Keep your face always toward the sunshine—and shadows will fall behind you.",
    author: "MyJourney Reflections",
    topic: "Faith"
  },
  {
    id: "quote-61",
    text: "Act as if what you do makes a difference. It does.",
    author: "MyJourney Reflections",
    topic: "Success"
  },
  {
    id: "quote-62",
    text: "Courage is grace under pressure.",
    author: "MyJourney Reflections",
    topic: "Courage"
  },
  {
    id: "quote-63",
    text: "With self-discipline, most anything is possible.",
    author: "MyJourney Reflections",
    topic: "Discipline"
  },
  {
    id: "quote-64",
    text: "Never let your failures define you. Let them refine you.",
    author: "MyJourney Reflections",
    topic: "Failure"
  },
  {
    id: "quote-65",
    text: "Leadership is the capacity to translate vision into reality.",
    author: "MyJourney Reflections",
    topic: "Leadership"
  },
  {
    id: "quote-66",
    text: "To think is easy. To act is hard. To act according to one's thoughts is the hardest thing.",
    author: "MyJourney Reflections",
    topic: "Reflection"
  },
  {
    id: "quote-67",
    text: "Believe you can and you're halfway there.",
    author: "MyJourney Reflections",
    topic: "Faith"
  },
  {
    id: "quote-68",
    text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
    author: "Emerson",
    topic: "Reflection"
  },
  {
    id: "quote-69",
    text: "Adopt the pace of nature: her secret is patience.",
    author: "Emerson",
    topic: "Growth"
  },
  {
    id: "quote-70",
    text: "Without ambition one starts nothing. Without work one finishes nothing.",
    author: "Emerson",
    topic: "Discipline"
  },
  {
    id: "quote-71",
    text: "The only person you are destined to become is the person you decide to be.",
    author: "Emerson",
    topic: "Growth"
  },
  {
    id: "quote-72",
    text: "Concentrate every minute like a Roman on doing what's in front of you.",
    author: "Marcus Aurelius",
    topic: "Discipline"
  },
  {
    id: "quote-73",
    text: "Think of yourself as dead. You have lived your life. Now take what's left and live it properly.",
    author: "Marcus Aurelius",
    topic: "Life"
  },
  {
    id: "quote-74",
    text: "Loss is nothing else but change, and change is Nature's delight.",
    author: "Marcus Aurelius",
    topic: "Reflection"
  },
  {
    id: "quote-75",
    text: "Accept the things to which fate binds you, and love the people with whom fate brings you together.",
    author: "Marcus Aurelius",
    topic: "Life"
  },
  {
    id: "quote-76",
    text: "Every soul is deprived of truth against its will.",
    author: "Marcus Aurelius",
    topic: "Reflection"
  },
  {
    id: "quote-77",
    text: "Whenever you are about to find fault with someone, ask yourself: What fault of mine resembles the one I am about to criticize?",
    author: "Marcus Aurelius",
    topic: "Reflection"
  },
  {
    id: "quote-78",
    text: "If it is not right, do not do it; if it is not true, do not say it.",
    author: "Marcus Aurelius",
    topic: "Discipline"
  },
  {
    id: "quote-79",
    text: "To stand up straight, not to be held straight.",
    author: "Marcus Aurelius",
    topic: "Discipline"
  },
  {
    id: "quote-80",
    text: "Leave the past behind, let the future take care of itself, and focus on the present.",
    author: "Marcus Aurelius",
    topic: "Reflection"
  },
  {
    id: "quote-81",
    text: "The best revenge is to be unlike him who performed the injury.",
    author: "Marcus Aurelius",
    topic: "Reflection"
  },
  {
    id: "quote-82",
    text: "Because your own strength is unequal to the task, do not assume that it is beyond the powers of man.",
    author: "Marcus Aurelius",
    topic: "Courage"
  },
  {
    id: "quote-83",
    text: "Receive wealth without arrogance, and be ready to let it go without struggle.",
    author: "Marcus Aurelius",
    topic: "Reflection"
  },
  {
    id: "quote-84",
    text: "The art of living is more like wrestling than dancing.",
    author: "Marcus Aurelius",
    topic: "Life"
  },
  {
    id: "quote-85",
    text: "Do every act of your life as if it were your last.",
    author: "Marcus Aurelius",
    topic: "Discipline"
  },
  {
    id: "quote-86",
    text: "A man's worth is no greater than the worth of his ambitions.",
    author: "Marcus Aurelius",
    topic: "Success"
  },
  {
    id: "quote-87",
    text: "In the long run, we shape our lives, and we shape ourselves.",
    author: "MyJourney Reflections",
    topic: "Growth"
  },
  {
    id: "quote-88",
    text: "Discipline is the bridge between goals and accomplishment.",
    author: "MyJourney Reflections",
    topic: "Discipline"
  },
  {
    id: "quote-89",
    text: "Consistency of effort is what separates dreamers from builders.",
    author: "MyJourney Reflections",
    topic: "Consistency"
  },
  {
    id: "quote-90",
    text: "The most difficult thing is the decision to act; the rest is merely tenacity.",
    author: "MyJourney Reflections",
    topic: "Courage"
  },
  {
    id: "quote-91",
    text: "A leader is one who knows the way, goes the way, and shows the way.",
    author: "MyJourney Reflections",
    topic: "Leadership"
  },
  {
    id: "quote-92",
    text: "I am not bound to win, but I am bound to be true.",
    author: "Lincoln",
    topic: "Faith"
  },
  {
    id: "quote-93",
    text: "Let no feeling of discouragement prey upon you, and in the end you are sure to succeed.",
    author: "Lincoln",
    topic: "Success"
  },
  {
    id: "quote-94",
    text: "The best way to destroy an enemy is to make him a friend.",
    author: "Lincoln",
    topic: "Life"
  },
  {
    id: "quote-95",
    text: "Be sure you put your feet in the right place, then stand firm.",
    author: "Lincoln",
    topic: "Discipline"
  },
  {
    id: "quote-96",
    text: "Always bear in mind that your own resolution to succeed is more important than any other.",
    author: "Lincoln",
    topic: "Success"
  },
  {
    id: "quote-97",
    text: "We can complain because rose bushes have thorns, or rejoice because thorn bushes have roses.",
    author: "Lincoln",
    topic: "Reflection"
  },
  {
    id: "quote-98",
    text: "Commitment is what transforms a promise into reality.",
    author: "MyJourney Reflections",
    topic: "Consistency"
  },
  {
    id: "quote-99",
    text: "Strength does not come from winning. Your struggles develop your strengths.",
    author: "MyJourney Reflections",
    topic: "Growth"
  },
  {
    id: "quote-100",
    text: "Character is like a tree and reputation like its shadow. The shadow is what we think of it; the tree is the real thing.",
    author: "Lincoln",
    topic: "Life"
  }
];

module.exports = quotes;
