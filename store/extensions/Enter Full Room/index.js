import { Extension, HPacket, HDirection } from "gnode-api";
import { readFile } from "fs/promises";
const extensionInfo = JSON.parse(
  await readFile(new URL("./package.json", import.meta.url))
);

let ext = new Extension(extensionInfo);
ext.run();

let flatId;

ext.on('click', () => {
  console.log("G-Earth button clicked");
});

ext.interceptByNameOrHash(HDirection.TOCLIENT, "OpenConnection", (hMessage) => {
  flatId = hMessage.getPacket().readInteger();
});

ext.interceptByNameOrHash(HDirection.TOCLIENT, "CantConnect", (hMessage) => {
  hMessage.blocked = false;

  setTimeout(() => {
    ext.sendToServer(
      new HPacket(`{out:OpenFlatConnection}{i:${flatId}}{s:""}{i:-1}`)
    );
  }, 2000);
});