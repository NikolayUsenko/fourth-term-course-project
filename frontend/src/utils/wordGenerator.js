const EN_WORDS = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on',
  'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we',
  'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when',
  'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into',
  'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now',
  'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
  'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any',
  'these', 'give', 'day', 'most', 'us', 'great', 'between', 'need', 'large', 'often',
  'hand', 'high', 'place', 'hold', 'turn', 'help', 'start', 'keep', 'child', 'begin',
  'got', 'walk', 'example', 'ease', 'paper', 'group', 'always', 'music', 'those', 'both',
  'mark', 'book', 'letter', 'until', 'mile', 'river', 'car', 'feet', 'care', 'second',
  'enough', 'plain', 'girl', 'usual', 'young', 'ready', 'above', 'ever', 'red', 'list',
  'though', 'feel', 'talk', 'bird', 'soon', 'body', 'dog', 'family', 'direct', 'pose',
];

const RU_WORDS = [
  'это', 'не', 'что', 'он', 'на', 'я', 'с', 'как', 'а', 'то', 'все', 'она', 'так', 'его',
  'но', 'да', 'ты', 'к', 'у', 'же', 'вы', 'за', 'бы', 'по', 'только', 'ее', 'мне', 'было',
  'вот', 'от', 'меня', 'еще', 'нет', 'о', 'из', 'ему', 'теперь', 'когда', 'даже', 'ну',
  'вдруг', 'ли', 'если', 'уже', 'или', 'ни', 'быть', 'был', 'него', 'до', 'вас', 'опять',
  'уж', 'вам', 'ведь', 'там', 'потом', 'себя', 'ничего', 'ей', 'может', 'они', 'тут',
  'где', 'есть', 'надо', 'ней', 'для', 'мы', 'тебя', 'их', 'чем', 'была', 'сам', 'чтоб',
  'без', 'будто', 'чего', 'раз', 'тоже', 'себе', 'под', 'будет', 'тогда', 'кто', 'этот',
  'того', 'потому', 'этого', 'какой', 'совсем', 'ним', 'здесь', 'этой', 'три', 'год',
  'мой', 'дом', 'день', 'рука', 'вода', 'путь', 'дело', 'жизнь', 'раз', 'время', 'люди',
  'место', 'слово', 'дать', 'идти', 'стать', 'знать', 'говорить', 'видеть', 'думать',
  'один', 'два', 'большой', 'новый', 'старый', 'другой', 'хороший', 'первый', 'сам',
];

/**
 * Generate an array of random words.
 * @param {'en'|'ru'} language
 * @param {number} count
 * @returns {string[]}
 */
export function generateWords(language, count) {
  const pool = language === 'ru' ? RU_WORDS : EN_WORDS;
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return result;
}