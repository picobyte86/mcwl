import { world, BeforeChatEvent, PlayerJoinEvent, ChatEvent, BlockBreakEvent, TickEvent, Location, Player, BeforeItemUseOnEvent, Items, Block, PlayerLeaveEvent, BlockPlaceEvent } from "mojang-minecraft";

import { Command } from "./Command/Command.js";
import { sudoCmd } from "./Command/Commands/sudoCommand.js";
import { PlayerData } from "./Utils/data/PlayerData.js";
import { PlayerTag } from "./Utils/data/PlayerTag.js";
import { PrintStream } from "./Utils/logging/PrintStream.js";
import { PlayerBlockSelection } from "./Utils/data/PlayerBlockSelection.js";
import { BlockStatDB } from "./Utils/stats/BlockStatDB.js";
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
import { blockIntNamespaces, BlocksIntDB } from "./Utils/stats/BlocksIntDB.js";
import { blocksintCmd } from "./Command/Commands/blocksintCommand.js";
import { BaseTagDB } from "./Utils/stats/BaseTagDB.js";
import { SudoEntry } from "./Utils/stats/SudoEntry.js";
import { MCWLNamespaces } from "./Utils/constants/MCWLNamespaces.js";
import { playtimeCmd } from "./Command/Commands/playtimeCommand.js";
import { topCmd } from "./Command/Commands/topCommand.js";
import { helpCmd } from "./Command/Commands/helpCommand.js";
import { playerjoinedCmd } from "./Command/Commands/playerjoinedCommand.js";
import { firstjoinedCmd } from "./Command/Commands/firstjoinedCommand.js";
import { MCWLCommandReturn } from "./Command/MCWLCmdReturn.js";
import { locale, Locale, Locale_EN_US } from "./Utils/constants/LocalisationStrings.js";

export let printStream: PrintStream = new PrintStream(world.getDimension("overworld"));
export let playerBlockSelection: PlayerBlockSelection[] = [];
export let playerBlockStatDB: Map<Player, BlockStatDB> = new Map<Player, BlockStatDB>();
export let playerBlockStatDB1: Map<Player, BlockStatDB> = new Map<Player, BlockStatDB>();
export let playerBlockStatDB2: Map<Player, BlockStatDB> = new Map<Player, BlockStatDB>();
export let playerBlockStatDB3: Map<Player, BlockStatDB> = new Map<Player, BlockStatDB>();
export let playerBlockStatDB4: Map<Player, BlockStatDB> = new Map<Player, BlockStatDB>();
export let playerBlocksIntDB: Map<Player, BlocksIntDB> = new Map<Player, BlocksIntDB>();
export let playerCrouchTimeDB: Map<Player, number> = new Map<Player, number>();
export let playerJoinedDB: Map<Player, number> = new Map<Player, number>();
export let playerDistTravelledDB: Map<Player, number> = new Map<Player, number>();
export let playerPrevLocDB: Map<Player, Location> = new Map<Player, Location>();
export let playerPlaytimeDB: Map<Player, number> = new Map<Player, number>();
export let playerSudoDB: Map<Player, SudoEntry> = new Map<Player, SudoEntry>();
export let playerFirstJoinedDB: Map<Player, string> = new Map<Player, string>();
export let commands: Command[] = [
    ascendCmd,
    blocksintCmd,
    blocksmodifiedCmd,
    crouchtimeCmd,
    descendCmd,
    distancemovedCmd,
    firstjoinedCmd,
    floorCmd,
    gotoCmd,
    helpCmd,
    playtimeCmd,
    playerjoinedCmd,
    topCmd,
    sudoCmd,
    spawnCmd,
    setblockCmd,
];
export const cmdPrefix = ",";
function initializeDB<T>(playerMap: Map<Player, T>, player: Player, tagName: string, defaultValue: T) {
    if (!PlayerTag.hasTag(player, tagName)) {
        playerMap.set(player, defaultValue);
        let data: PlayerData;
        if (typeof defaultValue == 'object') {
            data = new PlayerData((defaultValue as unknown as BaseTagDB).db, "object", tagName);
        } else {
            data = new PlayerData(defaultValue, typeof defaultValue, tagName);
        }
        let tag: PlayerTag = new PlayerTag(data);
        tag.write(player);
    } else {
        if (typeof defaultValue == 'number') {
            playerMap.set(player, parseInt(PlayerTag.read(player, tagName).data) as unknown as T);
        } else if (typeof defaultValue == 'boolean') {
            let b: any = PlayerTag.read(player, tagName).data;
            if (b == "true") {
                playerMap.set(player, true as unknown as T);
            } else {
                playerMap.set(player, false as unknown as T);
            }
        } else if (typeof defaultValue == 'object') {
            playerMap.set(player, (defaultValue as unknown as object).constructor(player, (PlayerTag.read(player, tagName).data)));
        } else if (typeof defaultValue == 'string') {
            playerMap.set(player, PlayerTag.read(player, tagName).data);
        }
    }
}
function saveDBToTag(db: any, player: Player, type: string, tagName: string) {
    let data: PlayerData = new PlayerData(db, type, tagName);
    let tag: PlayerTag = new PlayerTag(data);
    tag.write(player);
}
function getPlayer(name: string): Player {
    for (let i of world.getPlayers()) {
        if (i.name == name) {
            return i;
        }
    }
}

world.events.playerJoin.subscribe((eventData: PlayerJoinEvent) => {
    //PlayerTag.clearTags(eventData.player);
    if (!PlayerTag.hasTag(eventData.player, MCWLNamespaces.playerFirstJoined)) {
        printStream.info(locale.get('player_welcome'), [eventData.player.name])
    }
    initializeDB<string>(playerFirstJoinedDB, eventData.player, MCWLNamespaces.playerFirstJoined, new Date().toString());
    playerPrevLocDB.set(eventData.player, eventData.player.location);
    initializeDB<number>(playerCrouchTimeDB, eventData.player, MCWLNamespaces.sneakDuration, 0);
    initializeDB<number>(playerDistTravelledDB, eventData.player, MCWLNamespaces.distanceTravelled, 0);
    initializeDB<number>(playerPlaytimeDB, eventData.player, MCWLNamespaces.playtime, 0);
    initializeDB<number>(playerJoinedDB, eventData.player, MCWLNamespaces.playerJoined, 0);
    new BlocksIntDB().initialize(playerBlocksIntDB, eventData.player, new BlocksIntDB());
    new SudoEntry(false, "pico", "@a").initialize(playerSudoDB, eventData.player);
    new BlockStatDB(0, 5).initialize(playerBlockStatDB, eventData.player, new BlockStatDB(0, 5), 0);
    new BlockStatDB(1, 5).initialize(playerBlockStatDB1, eventData.player, new BlockStatDB(1, 5), 1);
    new BlockStatDB(2, 5).initialize(playerBlockStatDB2, eventData.player, new BlockStatDB(2, 5), 2);
    new BlockStatDB(3, 5).initialize(playerBlockStatDB3, eventData.player, new BlockStatDB(3, 5), 3);
    new BlockStatDB(4, 5).initialize(playerBlockStatDB4, eventData.player, new BlockStatDB(4, 5), 4);
    playerJoinedDB.set(eventData.player, playerJoinedDB.get(eventData.player) + 1);
    saveDBToTag(playerJoinedDB.get(eventData.player), eventData.player, 'number', MCWLNamespaces.playerJoined);
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
                let bInt: BlocksIntDB = playerBlocksIntDB.get(eventData.source as Player)
                bInt.add(i[0]);
                bInt.saveToTag(eventData.source as Player);
            }
        }
    }
})
world.events.playerLeave.subscribe((eventData: PlayerLeaveEvent) => {
})
world.events.tick.subscribe((eventData: TickEvent) => {
    printStream.broadcast();
    let pList: Player[] = world.getPlayers();
    for (let p of pList) {
        if (!playerPrevLocDB.get(p).equals(p.location)) {
            let l: Location = playerPrevLocDB.get(p);
            playerDistTravelledDB.set(p, playerDistTravelledDB.get(p) + new Vec3(l.x, l.y, l.z).distanceTo(new Vec3(p.location.x, p.location.y, p.location.z)));
            playerPrevLocDB.set(p, p.location);
            saveDBToTag(playerDistTravelledDB.get(p), p, "number", MCWLNamespaces.distanceTravelled);
        }
        if (p.isSneaking == true) {
            playerCrouchTimeDB.set(p, playerCrouchTimeDB.get(p) + 1);
            saveDBToTag(playerCrouchTimeDB.get(p), p, "number", MCWLNamespaces.sneakDuration);
        }
        playerPlaytimeDB.set(p, playerPlaytimeDB.get(p) + 1);
        saveDBToTag(playerPlaytimeDB.get(p), p, "number", MCWLNamespaces.playtime);

        BlockStatDB.getBlockAtPointer(p);
    }
})
world.events.blockBreak.subscribe((eventData: BlockBreakEvent) => {
    let id: string = BlockStatDB.getBlockBroken(eventData.player);
    playerBlockStatDB.get(eventData.player).add(id, locale.get("cmd_args_blocksBroken") as any);
    playerBlockStatDB.get(eventData.player).saveToTag(eventData.player, 0);
    playerBlockStatDB1.get(eventData.player).add(id, locale.get("cmd_args_blocksBroken") as any);
    playerBlockStatDB1.get(eventData.player).saveToTag(eventData.player, 1);
    playerBlockStatDB2.get(eventData.player).add(id, locale.get("cmd_args_blocksBroken") as any);
    playerBlockStatDB2.get(eventData.player).saveToTag(eventData.player, 2);
    playerBlockStatDB3.get(eventData.player).add(id, locale.get("cmd_args_blocksBroken") as any);
    playerBlockStatDB3.get(eventData.player).saveToTag(eventData.player, 3);
    playerBlockStatDB4.get(eventData.player).add(id, locale.get("cmd_args_blocksBroken") as any);
    playerBlockStatDB4.get(eventData.player).saveToTag(eventData.player, 4);
})
world.events.blockPlace.subscribe((eventData: BlockPlaceEvent) => {
    let id: string = eventData.block.id;
    playerBlockStatDB.get(eventData.player).add(id, locale.get("cmd_args_blocksPlaced") as any);
    playerBlockStatDB.get(eventData.player).saveToTag(eventData.player, 0);
    playerBlockStatDB1.get(eventData.player).add(id, locale.get("cmd_args_blocksPlaced") as any);
    playerBlockStatDB1.get(eventData.player).saveToTag(eventData.player, 1);
    playerBlockStatDB2.get(eventData.player).add(id, locale.get("cmd_args_blocksPlaced") as any);
    playerBlockStatDB2.get(eventData.player).saveToTag(eventData.player, 2);
    playerBlockStatDB3.get(eventData.player).add(id, locale.get("cmd_args_blocksPlaced") as any);
    playerBlockStatDB3.get(eventData.player).saveToTag(eventData.player, 3);
    playerBlockStatDB4.get(eventData.player).add(id, locale.get("cmd_args_blocksPlaced") as any);
    playerBlockStatDB4.get(eventData.player).saveToTag(eventData.player, 4);
})
world.events.beforeChat.subscribe((eventData: BeforeChatEvent) => {
    if (eventData.message[0] === cmdPrefix) {
        eventData.message = eventData.message.substring(1);
        cmdHandler(eventData);
    } else {
        let rSudoData: SudoEntry = Object.assign(new SudoEntry(), PlayerTag.read(eventData.sender, MCWLNamespaces.sudo).data);
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
