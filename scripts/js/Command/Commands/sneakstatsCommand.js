import * as Minecraft from "mojang-minecraft";
import { CommandFormat, CommandParameter, ARG_STRING } from "../CommandParameter.js";
import { Command } from "../Command.js";
import { PlayerTag } from "../../Utils/data/PlayerTag.js";
import { printStream } from "../../Main.js";
function sneakstats(player, args, subCmd) {
    switch (subCmd) {
        case 0:
            let players = Minecraft.world.getPlayers();
            for (let i of players) {
                if (i.name == args.get("target")) {
                    let sneakTime = PlayerTag.read(i, "dpm:sneakTime").data;
                    return [`${args.get("target")} has crouched a total of ${sneakTime} game ticks`, 0];
                }
            }
        default:
            return [`subCmd index ${subCmd} out of range. subCmd does not exist`, 1];
    }
}
function sneakstatsSucceed(suc) {
    printStream.success(suc);
}
function sneakstatsFail(err) {
    printStream.failure(err);
}
function sneakstatsInfo(inf) {
    printStream.info(inf);
}
const sneakstatsCmd = new Command("sneakstats", "Displays sneak time of player in ticks", [
    new CommandFormat([
        new CommandParameter("target", ARG_STRING, false)
    ])
], sneakstats, sneakstatsSucceed, sneakstatsFail, sneakstatsInfo, 3);
export { sneakstatsCmd };
