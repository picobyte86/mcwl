import { Dimension, Player } from "mojang-minecraft";
import { ColorCodes } from "../constants/ColorCodes.js";
import { CustomCharID } from "../constants/CustomCharID.js";
import { Console } from "./Console.js";
import { getAttributes, getMethods } from "./stringifyObject.js";
export const filter: RegExp = RegExp(/[^\w\d\s]/);
export const notifPrefix: string = `${ColorCodes.grey}[${ColorCodes.darkgreen}${ColorCodes.bold}MCWL${ColorCodes.reset}${ColorCodes.grey}]`
export class PrintStream {
    private hasError: boolean = false;
    private debugEnabled: boolean = true;
    private printable: Dimension | Player;
    private outputStream: string = "";
    constructor(printable: Dimension | Player) {
        this.printable = printable;
    }
    setError() {
        this.hasError = true;
    }
    clearError() {
        this.hasError = false;
    }
    checkError(): boolean {
        return this.hasError;
    }
    setDebugEnabled(b: boolean) {
        this.debugEnabled = b;
    }
    flush(): void {
        if (this.outputStream!="") {
            this.printable.runCommand(Console.tellraw(this.outputStream));
            this.outputStream = "";
        }
    }
    print(s: any): void {
        switch (typeof s) {
            case 'string':
                this.outputStream += this.cleanText(s);
                break;
            case 'number':
                this.outputStream += s + "";
                break;
            case 'boolean':
                this.outputStream += s + "";
                break;
            case 'object':
                this.outputStream += `${ColorCodes.grey}Object${ColorCodes.bold} ${(s as Object).constructor.name}${ColorCodes.reset}\\n`;
                this.outputStream += `  ${ColorCodes.grey}Functions:${ColorCodes.reset}\\n`;
                getMethods(s).forEach((key) => {
                    this.outputStream += `    ${key}()\\n`;
                });
                this.outputStream += `  ${ColorCodes.grey}Attributes:${ColorCodes.reset}\\n`;
                getAttributes(s).forEach((key) => {
                    this.outputStream += `    ${key}\\n`;
                });
                break;
            default:
                this.hasError = true;
                this.outputStream += "Invalid Char";
        }
    }
    success(s: string) {
        this.flush();
        this.printable.runCommand(Console.tellraw(`${notifPrefix} ${ColorCodes.blue}${s}${ColorCodes.reset}`));
    }
    info(s: string) {
        this.flush();
        this.printable.runCommand(Console.tellraw(`${notifPrefix} ${ColorCodes.grey}${s}${ColorCodes.reset}`));
    }
    failure(s: string) {
        this.flush();
        this.printable.runCommand(Console.tellraw(`${notifPrefix} ${ColorCodes.darkred}${s}${ColorCodes.reset}`));
    }
    globalRun(s: string) {
        this.printable.runCommand(Console.globalRunCmd(s));
    }
    run(s: string, player: Player) {
        this.printable.runCommand(Console.runCmd(s,player));
    }
    println(s: any): void {
        this.print(s);
        this.printable.runCommand(Console.tellraw(this.outputStream));
        this.outputStream = "";
    }
    chat(s: string, player: Player,targets:Player[]) {
        this.flush();
        for (let i of targets) {
            this.printable.runCommand(Console.chat(this.replaceWithEmotes(s),player,i.name));
        }
    }
    sudoChat(s:string, name:string,target:string) {
        this.flush();
        this.printable.runCommand(Console.sudoChat(this.replaceWithEmotes(s),name,target));
    }
    cleanText(s: string): string {
        return s.replace(RegExp(/(?<!\\)\"/g),"\\\"")
    }
    debug(s: string) {
        this.flush();
        if (this.debugEnabled) {
            this.printable.runCommand(Console.tellraw(`[${ColorCodes.blue}DEBUG${ColorCodes.reset}] ${this.cleanText(s)}`));
        }
    }
    replaceWithEmotes(s: string) {
        let ret = s;
        for (let i of Object.entries(CustomCharID)) {
            ret = ret.replace(new RegExp(`:${i[0]}:`,'g'),i[1].toString());
        }
        return ret;
    }
}

