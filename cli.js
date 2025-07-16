import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  SunnahTimes,
  Prayer,
} from 'adhan'

// --------------------------------------------

const emojis = {
  [Prayer.Fajr]: "🌅",
  [Prayer.Sunrise]: "🌞",
  [Prayer.Dhuhr]: "☀️",
  [Prayer.Asr]: "🕒",
  [Prayer.Maghrib]: "🌄",
  [Prayer.Isha]: "🌙",
}

function toLocalTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Tehran'
  }).format(date)
}

// --------------------------------------------

const prayerTimes = new PrayerTimes(new Coordinates(35.6944, 51.4215), new Date(), CalculationMethod.Tehran())

let rows = [
  Prayer.Fajr,
  Prayer.Sunrise,
  Prayer.Dhuhr,
  Prayer.Asr,
  Prayer.Maghrib,
  Prayer.Isha,
].map(p => [emojis[p], toLocalTime(prayerTimes[p])])

let tab = rows
  .map(i => i.join(": "))
  .join("\n")

console.log("Tehran: \n\n" + tab)