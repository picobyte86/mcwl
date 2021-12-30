import { CommandFormat } from "../CommandParameter.js";
import { Command } from "../Command.js";
import { printStream } from "../../Main.js";
import { BlockLocation } from "mojang-minecraft";
import { worldMaxHeight } from "../../Utils/constants/MathConstants.js";
function top(player, args, subCmd) {
    let playerLoc = new BlockLocation(Math.floor(player.location.x), Math.floor(player.location.y) + 1, Math.floor(player.location.z));
    let top = player.location.y;
    switch (subCmd) {
        case 0:
            while (playerLoc.y <= worldMaxHeight) {
                if (!player.dimension.getBlock(playerLoc).isEmpty) {
                    top = playerLoc.y - 2;
                    break;
                }
                playerLoc = playerLoc.above();
            }
            if (playerLoc.y == -worldMaxHeight + 1) {
                return [`Unable to find teleport location`, 1];
            }
            else {
                printStream.run(`tp @s ${playerLoc.x} ${top} ${playerLoc.z}`, player);
                return [`Teleported ${player.name} to ceiling`, 0];
            }
        default:
            return [`subCmd index ${subCmd} out of range. subCmd does not exist`, 1];
    }
}
function topSucceed(suc) {
    printStream.success(suc);
}
function topFail(err) {
    printStream.failure(err);
}
function topInfo(inf) {
    printStream.info(inf);
}
const topCmd = new Command("top", "Teleports player to ceiling", [
    new CommandFormat([])
], top, topSucceed, topFail, topInfo, 3);
export { topCmd };
