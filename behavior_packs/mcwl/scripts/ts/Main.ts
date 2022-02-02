import { world, BeforeChatEvent, PlayerJoinEvent, ChatEvent, BlockBreakEvent, TickEvent, Location, Player, BeforeItemUseOnEvent, Items, Block, PlayerLeaveEvent, BlockPlaceEvent, EntityIterator, BeforeDataDrivenEntityTriggerEvent } from "mojang-minecraft";
import { Command } from "./Command/Command.js";
import { sudoCmd } from "./Command/Commands/sudoCommand.js";
import { PlayerTag } from "./Utils/data/PlayerTag.js";
import { PrintStream } from "./Utils/logging/PrintStream.js";
import { blocksmodifiedCmd } from "./Command/Commands/blocksmodifiedCommand.js";
import { crouchtimeCmd } from "./Command/Commands/crouchtimeCommand.js";
import { Vec3 } from "./Utils/data/vec3.js";
import { distancemovedCmd } from "./Command/Commands/distancemovedCommand.js";
import { spawnCmd } from "./Command/Commands/spawnCommand.js";
import { gotoCmd } from "./Command/Commands/gotoCommand.js";
import { setblockCmd } from "./Command/Commands/setblockCommand.js";
import { ascendCmd } from "./Command/Commands/ascendCommand.js";
import { descendCmd } from "./Command/Commands/descendCommand.js";
import { floorCmd } from "./Command/Commands/floorCommand.js";
import { blockIntNamespaces } from "./Utils/stats/BlocksIntDB.js";
import { blocksintCmd } from "./Command/Commands/blocksintCommand.js";
import { SudoEntry } from "./Utils/stats/SudoEntry.js";
import { MCWLNamespaces } from "./Utils/constants/MCWLNamespaces.js";
import { playtimeCmd } from "./Command/Commands/playtimeCommand.js";
import { topCmd } from "./Command/Commands/topCommand.js";
import { helpCmd } from "./Command/Commands/helpCommand.js";
import { playerjoinedCmd } from "./Command/Commands/playerJoinedCommand.js";
import { firstjoinedCmd } from "./Command/Commands/firstjoinedCommand.js";
import { MCWLCommandReturn } from "./Command/MCWLCmdReturn.js";
import { locale } from "./Utils/constants/LocalisationStrings.js";
import { PlayerDB } from "./Utils/data/PlayerDB.js";
import { savedbCmd } from "./Command/Commands/savedbCommand.js";
import { MolangNamespaces } from "./Utils/constants/MolangNamespaces.js";
import { deathsCmd } from "./Command/Commands/deathsCommand.js";
import { lastdiedCmd } from "./Command/Commands/lastdiedCommand.js";
import { jumpCmd } from "./Command/Commands/jumpCommand.js";
import { raidstriggeredCmd } from "./Command/Commands/raidstriggeredCommand.js";
export let printStream: PrintStream = new PrintStream(world.getDimension("overworld"));
export let playerPrevLocDB: Map<string, Location> = new Map<string, Location>();
export let playerDB: Map<string,PlayerDB> = new Map<string,PlayerDB>()

export let commands: Command[] = [
    ascendCmd,
    blocksintCmd,
    blocksmodifiedCmd,
    crouchtimeCmd,
    deathsCmd,
    descendCmd,
    distancemovedCmd,
    firstjoinedCmd,
    floorCmd,
    gotoCmd,
    helpCmd,
    jumpCmd,
    lastdiedCmd,
    playtimeCmd,
    playerjoinedCmd,
    topCmd,
    raidstriggeredCmd,
    savedbCmd,
    setblockCmd,
    spawnCmd,
    sudoCmd
];
export const cmdPrefix = ",";
world.events.beforeDataDrivenEntityTriggerEvent.subscribe((eventData: BeforeDataDrivenEntityTriggerEvent)=> {
    if (eventData.entity.id=="minecraft:player" && eventData.id.split(':').slice(0,2).join(":")=="mcwl:molangquery") {
        let namespace: string = eventData.id.split(':').slice(0,3).join(":")
        let value: boolean = (eventData.id.split(':')[3])==='true'

        let thisPlayerDB: PlayerDB = playerDB.get((eventData.entity as Player).name)
        if (value!=null) {
            thisPlayerDB.molangQueries.set(namespace,value)
        }
        if (namespace==MolangNamespaces.is_alive && value==false) {
            thisPlayerDB.timeSinceDeath = 0
            thisPlayerDB.deaths++;
        }
        else if (namespace==MolangNamespaces.is_jumping && value==true) {
            thisPlayerDB.jump++;
        } else if (namespace==MolangNamespaces.raid_triggered) {
            thisPlayerDB.raidsTriggered++;
        }
    }
})
world.events.playerLeave.subscribe((eventData: PlayerLeaveEvent) => {
    printStream.println(`Hello! I hope you saved your player statistics, because if you didn't they're gone now.`)
})
world.events.playerJoin.subscribe((eventData: PlayerJoinEvent) => {
    PlayerTag.clearTags(eventData.player);
    if (!PlayerTag.hasTag(eventData.player, MCWLNamespaces.playerFirstJoined)) {
        printStream.info(locale.get('player_welcome'), [eventData.player.name])
        playerDB.set(eventData.player.name,new PlayerDB(eventData.player,true))
    } else {
        playerDB.set(eventData.player.name,new PlayerDB(eventData.player,false))
    }
    playerPrevLocDB.set(eventData.player.name, eventData.player.location);
    playerDB.get(eventData.player.name).joined += 1;
})
world.events.beforeItemUseOn.subscribe((eventData: BeforeItemUseOnEvent) => {
    if (eventData.source.id == "minecraft:player") {
        let block: Block = eventData.source.dimension.getBlock(eventData.blockLocation);
        for (let i of blockIntNamespaces.entries()) {
            let blockEquals = false;
            let itemEquals = false;
            let blockCheckEquals = false;
            let itemCheckEquals = false;
            for (let j of i[1].targetBlock) {
                if (block.type == j.type) {
                    blockEquals = true;
                    break;
                }
            }
            if (eventData.item != null) {
                if (i[1].any == true) {
                    itemEquals = true;
                } else {
                    for (let j of i[1].itemUsed) {
                        if (Items.get(eventData.item.id) == Items.get(j.id)) {
                            itemEquals = true;
                            break;
                        }
                    }
                }
            } else {
                if (i[1].any == true) {
                    itemEquals = true;
                }
            }
            if (blockEquals) {
                blockCheckEquals = i[1].blockDataCheck(block);
            }
            if (itemEquals) {
                itemCheckEquals = i[1].itemDataCheck(eventData.item);
            }
            if (blockCheckEquals && itemCheckEquals) {
                playerDB.get((eventData.source as Player).name).blockInt.add(i[0])
            }
        }
    }
})
world.events.tick.subscribe((eventData: TickEvent) => {
    printStream.broadcast();
    let pList: EntityIterator = world.getPlayers();
    for (let i of pList) {
        let p:Player = i as Player
        
        if (!playerPrevLocDB.get(p.name).equals(p.location)) {
            let l: Location = playerPrevLocDB.get(p.name);
            playerDB.get(p.name).distanceTravelled += new Vec3(l.x, l.y, l.z).distanceTo(new Vec3(p.location.x, p.location.y, p.location.z))
            playerPrevLocDB.set(p.name, p.location);
        }

        if (p.isSneaking == true) {
            playerDB.get(p.name).crouchTime++;
        }

        playerDB.get(p.name).playtime++

        playerDB.get(p.name).timeSinceDeath++;
    }
})

world.events.blockBreak.subscribe((eventData: BlockBreakEvent) => {
    let id: string = eventData.brokenBlockPermutation.type.id;
    for (let i of playerDB.get(eventData.player.name).blockMod) {
        i.add(id, locale.get("cmd_args_blocksBroken") as any);
    }
})

world.events.blockPlace.subscribe((eventData: BlockPlaceEvent) => {
    let id: string = eventData.block.id;
    for (let i of playerDB.get(eventData.player.name).blockMod) {
        i.add(id, locale.get("cmd_args_blocksPlaced") as any);
    }
})
world.events.beforeChat.subscribe((eventData: BeforeChatEvent) => {
    if (eventData.message[0] === cmdPrefix) {
        eventData.message = eventData.message.substring(1);
        cmdHandler(eventData);
    } else {
        let rSudoData: SudoEntry = playerDB.get(eventData.sender.name).sudo;
        if (rSudoData.sudoToggled == true) {
            printStream.sudoChat(eventData.message, rSudoData.sudoName, rSudoData.target);
        } else {
            printStream.chat(eventData.message, eventData.sender, world.getPlayers());
        }
    }
    eventData.cancel = true;
});
function cmdHandler(chatEvent: ChatEvent) {
    const cmdBase = chatEvent.message.split(" ")[0];
    const cmdArgs = chatEvent.message.split(" ").slice(1).join(" ");
    const player = chatEvent.sender;
    let cmdIdx = commands.map(a => a.name).indexOf(cmdBase);
    if (cmdIdx == -1) {
        printStream.failure(locale.get("cmd_not_found") as any);
        return
    }
    let subCmdIdx = commands[cmdIdx].cmdParameters.map(a => a.testRegex(cmdArgs)).indexOf(true);
    if (subCmdIdx != -1) {
        let args = commands[cmdIdx].cmdParameters[subCmdIdx].parseRegex(cmdArgs);
        let parsedArgs: Map<string, any> = new Map()
        commands[cmdIdx].cmdParameters[subCmdIdx].para.map((para, i) => { parsedArgs.set(para.name, para.type.parse(args[i])) })
        const ret: MCWLCommandReturn = commands[cmdIdx].execute(player, parsedArgs, subCmdIdx);
        const retMsg = ret.returnMessage
        const errCode = ret.errorCode;
        const retArgs = ret.messageArgs;
        switch (errCode) {
            case 0:
                commands[cmdIdx].success(retMsg, retArgs);
                break;
            case 1:
                commands[cmdIdx].failure(retMsg, retArgs);
                break;
            case 2:
                commands[cmdIdx].info(retMsg, retArgs);
                break;
        }
    } else {
        printStream.failure(locale.get("cmd_return_default"));
    }
}