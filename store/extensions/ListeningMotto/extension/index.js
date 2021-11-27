import {
  Extension,
  HPacket,
  HDirection,
  HMessage,
  HUserProfile,
} from "gnode-api";
import processlist from "node-processlist";
import { default as config } from "./config.json";
let spotifyPID, oldMusic, oldMotto, announce;
let state = "off";

const extensionInfo = {
  name: "Listening Motto",
  description: "Display current spotify music you listening in your motto.",
  version: "1.0",
  author: "Lxx",
};

const ext = new Extension(extensionInfo);

process
  .on("unhandledRejection", (reason, p) => {
    ext.writeToConsole(
      `${reason.toString()} Unhandled Rejection at Promise ${p.toString()}`
    );
  })
  .on("uncaughtException", (err) => {
    ext.writeToConsole(`${err.toString()} Uncaught Exception thrown`);
  });

ext.run();

ext.interceptByNameOrHash(HDirection.TOCLIENT, "UserObject", (hMessage) => {
  let hPacket = hMessage.getPacket();
  oldMotto = hPacket.read("iSSSS")[4];
});

ext.interceptByNameOrHash(HDirection.TOSERVER, "Chat", (hMessage) => {
  let hPacket = hMessage.getPacket();
  let message = hPacket.readString();

  if (message.startsWith("!")) {
    hMessage.setBlocked(true);

    if (message.startsWith("!announce")) {
      if (!announce || announce === "off") {
        announce = "on";
        createMessage("You turned on the announce chat message");
      } else {
        announce = "off";
        createMessage("You turned off the announce chat message");
      }
    }
  }
});

ext.on("click", async () => {
  if (state === "off") {
    state = "on";
    getMotto();
    setInterval(() => ListeningMotto(), 1000);
    createMessage("Started ListeningMotto successfully!");
  } else {
    state = "off";
    clearInterval(ListeningMotto());
    setOldMotto();
    createMessage("Stopped ListeningMotto successfully!");
  }
});

async function getSpotify() {
  const spotifyProcesses = await processlist.getProcessesByName("Spotify.exe", {
    verbose: true,
  });
  const spotifyWindow = spotifyProcesses.find(
    (process) =>
      process.windowTitle !== "N/A" &&
      process.windowTitle !== "AngleHiddenWindow"
  );
  spotifyPID = spotifyWindow.pid;
  return spotifyWindow;
}

async function getMusic() {
  let music;
  const spotifyProcess = await processlist.getProcessById(spotifyPID, {
    verbose: true,
  });
  if (spotifyProcess.windowTitle.startsWith("Spotify")) music = "Nothing";
  else if (spotifyProcess.windowTitle === "Advertisement") music = "AD";
  else music = spotifyProcess.windowTitle;

  return music;
}

async function ListeningMotto() {
  const spotify = await getSpotify();
  if (!spotify) return;

  const music = await getMusic();
  if (oldMusic && oldMusic === music) return;
  oldMusic = music;

  let mottoPacket = new HPacket(
    `{out:ChangeMotto}{s:"${config.listening}: ${music}"}`
  );
  ext.sendToServer(mottoPacket);

  let announcePacket = new HPacket(
    `{out:Chat}{s:"${config.listening}: ${music}"}{i:0}{i:0}`
  );

  if (announce && announce === "on") ext.sendToServer(announcePacket);

  createMessage(`${config.listening}: ${music}`);
}

async function createMessage(text) {
  let messagePacket = new HPacket(
    `{in:NotificationDialog}{s:""}{i:3}{s:"display"}{s:"BUBBLE"}{s:"message"}{s:"${text}"}{s:"image"}{s:"https://raw.githubusercontent.com/sirjonasxx/G-ExtensionStore/repo/1.5.1/store/extensions/ListeningMotto/icon.png"}`
  );
  ext.sendToClient(messagePacket);
}

async function getMotto() {
  let infoPacket = new HPacket("{out:InfoRetrieve}");
  ext.sendToServer(infoPacket);
}

async function setOldMotto() {
  let setMottoPacket = new HPacket(`{out:ChangeMotto}{s:"${oldMotto}"}`);
  ext.sendToServer(setMottoPacket);
}
