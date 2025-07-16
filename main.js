
import { startDeltaChat } from "@deltachat/stdio-rpc-server"
import { C } from "@deltachat/jsonrpc-client"

import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  SunnahTimes,
  Prayer,
} from 'adhan'

// --------------------------------

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

// ---------------------------------------------

async function main() {
  const dc = await startDeltaChat("deltachat-data")
  console.log("Using deltachat-rpc-server at " + dc.pathToServerBinary)

  // or only log what you want
  dc.on("Info", (accountId, { msg }) =>
    console.info(accountId, "[core:info]", msg)
  )
  dc.on("Warning", (accountId, { msg }) =>
    console.warn(accountId, "[core:warn]", msg)
  )
  dc.on("Error", (accountId, { msg }) =>
    console.error(accountId, "[core:error]", msg)
  )


  let firstAccount = (await dc.rpc.getAllAccounts())[0]
  if (!firstAccount) {
    firstAccount = await dc.rpc.getAccountInfo(await dc.rpc.addAccount())
  }
  if (firstAccount.kind === "Unconfigured") {
    console.info("account not configured, trying to login now...")
    try {
      if (!!process.env.ADDR && !!process.env.MAIL_PW) {
        await dc.rpc.batchSetConfig(firstAccount.id, {
          addr: process.env.ADDR,
          mail_pw: process.env.MAIL_PW,
        })
      } else if (!!process.env.CHATMAIL_QR) {
        await dc.rpc.setConfigFromQr(firstAccount.id, process.env.CHATMAIL_QR)
      } else {
        throw new Error(
          "Credentials missing, you need to set ADDR and MAIL_PW"
        )
      }
      await dc.rpc.batchSetConfig(firstAccount.id, {
        bot: "1",
        e2ee_enabled: "1",
      })
      await dc.rpc.configure(firstAccount.id)
    } catch (error) {
      console.error("Could not log in to account:", error)
      process.exit(1)
    }
  } else {
    await dc.rpc.startIo(firstAccount.id)
  }

  const botAccountId = firstAccount.id
  const emitter = dc.getContextEvents(botAccountId)

  emitter.on("IncomingMsg", async ({ chatId, msgId }) => {
    const chat = await dc.rpc.getBasicChatInfo(botAccountId, chatId)

    if (chat.chatType === C.DC_CHAT_TYPE_SINGLE) {
      const msg = await dc.rpc.getMessage(botAccountId, msgId)
      function send(content) {
        return dc.rpc.miscSendTextMessage(
          botAccountId,
          chatId,
          content
        )
      }

      if (msg.text == "/azan") {
        const prayerTimes = new PrayerTimes(new Coordinates(35.6944, 51.4215), new Date(), CalculationMethod.Tehran())
        // const sunnahTimes = new SunnahTimes(prayerTimes)

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

        send("Tehran: \n\n" + tab)
      }
      else {
        send(`
          commands:
          - /azan
        `)
      }


    }
  })

  const botAddress = await dc.rpc.getConfig(botAccountId, "addr")
  const verificationQRCode = (
    await dc.rpc.getChatSecurejoinQrCodeSvg(botAccountId, null)
  )[0]

  console.info("=========================================")
  console.info("The email address of your bot is: ", botAddress)
  console.info(`
    Verify Bot contact (if you use chatmail this is nessesary to contact the bot from outside the chatmail instance that the bot uses):
    copy this code and \"scan\" it with delta chat:
    ${verificationQRCode}`)
  console.info("=========================================")
}

main()