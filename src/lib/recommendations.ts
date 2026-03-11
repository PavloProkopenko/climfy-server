import type { WeatherSnapshot } from '../types/index.ts'

interface RuleInput extends WeatherSnapshot {
  hour: number
  language: 'en' | 'de' | 'ua'
}

// Rule-based recommendations for anonymous users.
// Returns a short, practical paragraph in the requested language.
export function getRuleBasedRecommendation(input: RuleInput): string {
  const { temp, humidity, wind_speed, hour, language } = input
  const tips: string[] = []

  // Clothing
  if (temp < 0) {
    tips.push(
      t(language, {
        en: 'It is freezing outside — wear a heavy coat, gloves, and a hat.',
        de: 'Es ist eisig kalt — tragen Sie einen schweren Mantel, Handschuhe und eine Mütze.',
        ua: 'Надворі морозно — одягніть важке пальто, рукавички та шапку.',
      }),
    )
  } else if (temp < 10) {
    tips.push(
      t(language, {
        en: 'It is quite cold — a warm jacket and layers are recommended.',
        de: 'Es ist ziemlich kalt — eine warme Jacke und Schichten werden empfohlen.',
        ua: 'Досить холодно — рекомендується тепла куртка та кілька шарів одягу.',
      }),
    )
  } else if (temp < 20) {
    tips.push(
      t(language, {
        en: 'Mild temperatures — a light jacket or sweater should be enough.',
        de: 'Milde Temperaturen — eine leichte Jacke oder ein Pullover reicht aus.',
        ua: 'Помірна температура — легкої куртки або светра буде достатньо.',
      }),
    )
  } else if (temp > 30) {
    tips.push(
      t(language, {
        en: 'It is very hot — stay hydrated, wear light and breathable clothing.',
        de: 'Es ist sehr heiß — trinken Sie viel Wasser und tragen Sie leichte Kleidung.',
        ua: 'Дуже жарко — пийте більше води та одягайте легкий одяг.',
      }),
    )
  } else {
    tips.push(
      t(language, {
        en: 'Comfortable temperatures — dress as you like.',
        de: 'Angenehme Temperaturen — kleiden Sie sich nach Belieben.',
        ua: 'Комфортна температура — одягайтесь на свій розсуд.',
      }),
    )
  }

  // Wind
  if (wind_speed > 10) {
    tips.push(
      t(language, {
        en: 'Strong wind — consider a windbreaker or secure loose items.',
        de: 'Starker Wind — eine Windjacke wäre sinnvoll.',
        ua: 'Сильний вітер — рекомендується вітрозахисна куртка.',
      }),
    )
  }

  // Humidity
  if (humidity > 80) {
    tips.push(
      t(language, {
        en: 'High humidity — opt for breathable fabrics and expect it to feel warmer.',
        de: 'Hohe Luftfeuchtigkeit — wählen Sie atmungsaktive Stoffe.',
        ua: 'Висока вологість — обирайте одяг із дихаючих матеріалів.',
      }),
    )
  }

  // Night reminder
  if (hour >= 21 || hour < 6) {
    tips.push(
      t(language, {
        en: 'It is late — temperatures may drop overnight, dress accordingly.',
        de: 'Es ist spät — die Temperaturen könnten über Nacht fallen.',
        ua: 'Вже пізно — вночі температура може знизитись, одягніться тепліше.',
      }),
    )
  }

  return tips.join(' ')
}

function t(
  lang: 'en' | 'de' | 'ua',
  strings: { en: string; de: string; ua: string },
): string {
  return strings[lang]
}
