import { MinecraftBridge } from ".";

export class User {

    constructor (private bridge: MinecraftBridge, public name: string, public address: string) {

    }

    give (item: string, amount: number) {
        this.bridge.execute(`supergive ${this.name} ${item} ${amount}`);
    }

    tell (text: string) {
        this.bridge.execute(`tell ${this.name} ${text}`);
    }

}