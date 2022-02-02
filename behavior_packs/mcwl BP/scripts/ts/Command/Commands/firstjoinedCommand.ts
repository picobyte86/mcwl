import { CommandFormat, CommandParameter, ARG_STRING } from "../CommandParameter.js"
import { Command } from "../Command.js"
import { playerDB, printStream } from "../../Main.js"
import { EntityIterator, Player, world } from "mojang-minecraft"
import { MCWLCommandReturn } from "../MCWLCmdReturn.js"
import { locale } from "../../Utils/constants/LocalisationStrings.js"
function firstjoined(
    player: Player,
    args: Map<string, any>,
    subCmd: number): MCWLCommandReturn {
    switch (subCmd) {
        case 0:
            let players: EntityIterator = world.getPlayers()
            let p: Player
            for (let i of players) {
                p = i as Player
                if (p.name == args.get(locale.get("cmd_args_target"))) {
                    let firstJoined: string = playerDB.get(p.name).firstJoined
                    return new MCWLCommandReturn(0, locale.get("cmd_return_firstjoined_0_info"), args.get(locale.get("cmd_args_target")), firstJoined)
                }
            }

        default:
            return new MCWLCommandReturn(1, locale.get("cmd_return_default"), firstjoinedCmd.name)
    }
}
function firstjoinedSucceed(s: string, args: any[]) {
    printStream.success(s, args)
}
function firstjoinedFail(s: string, args: any[]) {
    printStream.failure(s, args)
}
function firstjoinedInfo(s: string, args: any[]) {
    printStream.info(s, args)
}
const firstjoinedCmd = new Command(
    locale.get("cmd_name_firstjoined"),
    locale.get("cmd_description_firstjoined"),
    [
        new CommandFormat(
            [
                new CommandParameter(locale.get("cmd_args_target"), ARG_STRING, false)
            ]
        )
    ],
    firstjoined,
    firstjoinedSucceed,
    firstjoinedFail,
    firstjoinedInfo,
    3
)
export { firstjoinedCmd }