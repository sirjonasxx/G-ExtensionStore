const {
  Extension,
  HDirection,
  HEntity,
  HUserProfile,
  HPacket,
} = require("gnode-api");
const fetch = require("node-fetch");
const fs = require("fs");
const settings = require("./settings.json");
let extensionInfo = require("./package.json");
let ext = new Extension(extensionInfo);
ext.run();

let ownName;
let ownIndex;
let stuff;
let fullFigureSetIdsPacket;
let currentFigure;

// credits https://github.com/WiredSpast/FullWardrobe/blob/master/index.js
ext.on("connect", (host) => {
  switch (host) {
    case "game-br.habbo.com":
      fetchFigureSetIds("www.habbo.com.br");
      break;
    case "game-de.habbo.com":
      fetchFigureSetIds("www.habbo.de");
      break;
    case "game-es.habbo.com":
      fetchFigureSetIds("www.habbo.es");
      break;
    case "game-fi.habbo.com":
      fetchFigureSetIds("www.habbo.fi");
      break;
    case "game-fr.habbo.com":
      fetchFigureSetIds("www.habbo.fr");
      break;
    case "game-it.habbo.com":
      fetchFigureSetIds("www.habbo.it");
      break;
    case "game-nl.habbo.com":
      fetchFigureSetIds("www.habbo.nl");
      break;
    case "game-s2.habbo.com":
      fetchFigureSetIds("sandbox.habbo.com");
      break;
    case "game-tr.habbo.com":
      fetchFigureSetIds("www.habbo.com.tr");
      break;
    case "game-us.habbo.com":
      fetchFigureSetIds("www.habbo.com");
      break;
    default:
      fullFigureSetIdsPacket = undefined;
      break;
  }
});

const saveFigure = (figure) => {
  let data = {
    figure: figure,
  };
  fs.writeFileSync("settings.json", JSON.stringify(data));
};

// credits https://github.com/WiredSpast/FullWardrobe/blob/master/index.js
const fetchFigureSetIds = (hotel) => {
  fetch(`https://${hotel}/gamedata/furnidata_json/0`)
    .then((res) => res.json())
    .then((furniData) => {
      let clothing = furniData.roomitemtypes.furnitype.filter(
        (i) => i.specialtype === 23 && i.customparams != null
      );

      let ids = "";
      let names = "";
      let count = 0;

      for (let item of clothing) {
        for (let param of item.customparams.split(",")) {
          if (param !== "") {
            count++;
            param = param.trim();
            ids += `{i:${param}}`;
            names += `{s:"${item.classname}"}`;
          }
        }
      }

      fullFigureSetIdsPacket = new HPacket(
        `{in:FigureSetIds}{i:${count}}${ids}{i:${count}}${names}`
      );
    });
};

const onUsers = (hMessage) => {
  hMessage.blocked = true;
  let entities = HEntity.parse(hMessage.getPacket());

  for (let entity of entities) {
    if (ownName === entity.name) {
      entity.figureId = currentFigure || settings.figure;
      ownIndex = entity.index;
      stuff = entity.stuff;
    }
  }

  let packet = HEntity.constructPacket(
    entities,
    hMessage.getPacket().headerId()
  );

  ext.sendToClient(packet);
};

const onExtendedProfile = (hMessage) => {
  hMessage.blocked = true;
  let user = new HUserProfile(hMessage.getPacket());
  if (ownName === user.username) {
    user.figure = currentFigure || settings.figure;
  }
  let packet = user.constructPacket(hMessage.getPacket().headerId());
  ext.sendToClient(packet);
};

const onUserObject = (hMessage) => {
  let packet = hMessage.getPacket();
  packet.readInteger();
  ownName = packet.readString();
  packet.replaceString(packet.readIndex, settings.figure);
  packet.fixLength();
};

const onUpdateFigureData = (hMessage) => {
  hMessage.blocked = true;
  let packet = hMessage.getPacket().read("SS");
  let gender = packet[0];
  let figure = packet[1];
  currentFigure = figure;
  ext.sendToClient(
    new HPacket(`{in:FigureUpdate}{s:"${currentFigure}"}{s:"${gender}"}`)
  );

  if (stuff) {
    ext.sendToClient(
      new HPacket(
        `{in:UserChange}{i:${ownIndex}}{s:"${currentFigure}"}{s:"${gender}"}{s:"${stuff[2]}"}{i:${stuff[3]}}`
      )
    );
  }

  saveFigure(currentFigure);
};

ext.interceptByNameOrHash(
  HDirection.TOSERVER,
  "UpdateFigureData",
  onUpdateFigureData
);

ext.interceptByNameOrHash(HDirection.TOCLIENT, "Users", onUsers);

ext.interceptByNameOrHash(
  HDirection.TOCLIENT,
  "ExtendedProfile",
  onExtendedProfile
);

// credits https://github.com/WiredSpast/FullWardrobe/blob/master/index.js
ext.interceptByNameOrHash(HDirection.TOCLIENT, "FigureSetIds", (hMessage) => {
  hMessage.blocked = true;
  ext.sendToClient(fullFigureSetIdsPacket);
});

ext.interceptByNameOrHash(HDirection.TOCLIENT, "UserObject", onUserObject);
